"""
Testy resetu hasła ("Zapomniałem hasła"): /api/auth/password/forgot
i /api/auth/password/reset. Bez prawdziwej wysyłki e-maili (zamockowana).

Uruchomienie:
    cd backend
    .venv\\Scripts\\python tests/test_password_reset.py
"""

from __future__ import annotations

import sys
from datetime import timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient  # noqa: E402
from sqlmodel import Session, SQLModel, create_engine, select  # noqa: E402
from sqlmodel.pool import StaticPool  # noqa: E402

from app import auth, database  # noqa: E402
from app.config import settings  # noqa: E402
from app.main import app  # noqa: E402
from app.models import AuthSession, LoginChallenge  # noqa: E402
from app.security import utcnow  # noqa: E402

sent_login_emails: list[dict] = []
sent_reset_emails: list[dict] = []


def _fake_send_login_code(to: str, name: str, code: str) -> None:
    sent_login_emails.append({"to": to, "name": name, "code": code})


def _fake_send_password_reset_code(to: str, name: str, code: str) -> None:
    sent_reset_emails.append({"to": to, "name": name, "code": code})


def _make_client() -> tuple[TestClient, Session]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    session = Session(engine)

    def override_get_session():
        yield session

    app.dependency_overrides[database.get_session] = override_get_session
    return TestClient(app), session


def _register(client: TestClient, email: str) -> None:
    """Zakłada i od razu weryfikuje konto, żeby mieć zalogowanego usera."""
    sent_login_emails.clear()
    r = client.post(
        "/api/auth/register",
        json={
            "name": "Ola",
            "last_name": "Testowa",
            "email": email,
            "password": "staryhaslo123",
            "accept_terms": True,
        },
    )
    challenge_id = r.json()["challenge_id"]
    code = sent_login_emails[-1]["code"]
    client.post("/api/auth/login/verify", json={"challenge_id": challenge_id, "code": code})
    client.post("/api/auth/logout")


def run() -> None:
    failures: list[str] = []

    def check(name: str, cond: bool, extra: str = "") -> None:
        status = "PASS" if cond else "FAIL"
        if not cond:
            failures.append(name)
        print(f"{status}  {name}{(' - ' + extra) if extra and not cond else ''}")

    auth.send_login_code = _fake_send_login_code  # type: ignore[assignment]
    auth.send_password_reset_code = _fake_send_password_reset_code  # type: ignore[assignment]
    settings.otp_max_attempts = 3
    settings.otp_resend_cooldown_seconds = 30

    # --- 1. forgot dla nieistniejącego konta -> 404, bez wysyłki ------------
    sent_reset_emails.clear()
    client, db = _make_client()
    r = client.post("/api/auth/password/forgot", json={"email": "nikt-taki@test.pl"})
    check("forgot: nieznane konto -> 404", r.status_code == 404, r.text)
    check("forgot: nieznane konto -> brak wysłanego maila", len(sent_reset_emails) == 0)
    app.dependency_overrides.clear()

    # --- 2. forgot dla istniejącego konta -> 200, wysyła kod -----------------
    client, db = _make_client()
    _register(client, "reset@test.pl")
    sent_reset_emails.clear()

    r = client.post("/api/auth/password/forgot", json={"email": "reset@test.pl"})
    check("forgot: istniejące konto -> 200", r.status_code == 200, r.text)
    body = r.json()
    check("forgot: zwraca challenge_id i destination_hint", "challenge_id" in body and "*" in body.get("destination_hint", ""))
    check("forgot: wysłano dokładnie jeden e-mail", len(sent_reset_emails) == 1, str(sent_reset_emails))

    challenge_id = body["challenge_id"]
    real_code = sent_reset_emails[0]["code"]

    # --- 3. zły kod -> 401, licznik prób rośnie -------------------------------
    r = client.post(
        "/api/auth/password/reset",
        json={"challenge_id": challenge_id, "code": "000000", "new_password": "nowehaslo123"},
    )
    check("reset: zły kod -> 401", r.status_code == 401, r.text)
    check("reset: zły kod -> komunikat o pozostałych próbach", "Pozostało prób" in r.json().get("detail", ""))

    # --- 4. zbyt słabe nowe hasło -> 422 --------------------------------------
    r = client.post(
        "/api/auth/password/reset",
        json={"challenge_id": challenge_id, "code": real_code, "new_password": "zaslabe"},
    )
    check("reset: hasło bez cyfry -> 422", r.status_code == 422, r.text)

    # --- 4b. krok pośredni: verify-code, osobno od ustawienia hasła -----------
    r = client.post("/api/auth/password/verify-code", json={"challenge_id": challenge_id, "code": "999999"})
    check("verify-code: zły kod -> 401", r.status_code == 401, r.text)

    r = client.post("/api/auth/password/verify-code", json={"challenge_id": challenge_id, "code": real_code})
    check("verify-code: dobry kod -> 200", r.status_code == 200, r.text)
    check("verify-code: NIE loguje (brak ciasteczka sesji)", "mzm_session" not in client.cookies)

    r = client.post("/api/auth/password/reset", json={"challenge_id": "nie-ma-takiego", "code": real_code, "new_password": "nowehaslo123"})
    check("reset: nieznany challenge_id -> 404", r.status_code == 404, r.text)

    # --- 5. verify-code NIE zużywa kodu — ten sam kod wciąż działa w reset ---
    r = client.post(
        "/api/auth/password/reset",
        json={"challenge_id": challenge_id, "code": real_code, "new_password": "nowehaslo123"},
    )
    check("reset: poprawny kod (po wcześniejszym verify-code) -> 200", r.status_code == 200, r.text)
    check("reset: zwraca konto", r.json().get("email") == "reset@test.pl")
    check("reset: ciasteczko sesji ustawione od razu", "mzm_session" in client.cookies)
    me = client.get("/api/auth/me")
    check("reset: me() po resecie -> 200", me.status_code == 200)

    # --- 6. ten sam (skonsumowany) kod nie działa drugi raz -------------------
    r = client.post(
        "/api/auth/password/reset",
        json={"challenge_id": challenge_id, "code": real_code, "new_password": "jeszczeinne123"},
    )
    check("reset: powtórne użycie kodu -> 400", r.status_code == 400, r.text)

    r = client.post("/api/auth/password/verify-code", json={"challenge_id": challenge_id, "code": real_code})
    check("verify-code: na już skonsumowanym wyzwaniu -> 400", r.status_code == 400, r.text)

    # --- 7. stare hasło już nie działa, nowe działa ---------------------------
    client.post("/api/auth/logout")
    r = client.post("/api/auth/login", json={"email": "reset@test.pl", "password": "staryhaslo123"})
    check("stare hasło po resecie -> 401", r.status_code == 401, r.text)
    r = client.post("/api/auth/login", json={"email": "reset@test.pl", "password": "nowehaslo123"})
    check("nowe hasło -> 200", r.status_code == 200, r.text)
    client.post("/api/auth/logout")

    app.dependency_overrides.clear()

    # --- 8. reset unieważnia WSZYSTKIE inne sesje tego konta ------------------
    client, db = _make_client()
    _register(client, "sesje@test.pl")

    # Sesja A: logujemy się zwykłym hasłem, zapisujemy token ciasteczka.
    client.post("/api/auth/login", json={"email": "sesje@test.pl", "password": "staryhaslo123"})
    session_token_a = client.cookies.get("mzm_session")
    check("sesja A: cookie ustawione", bool(session_token_a))

    # Reset hasła na tym samym silniku bazy, ale "z innego urządzenia"
    # (świeży klient, bez ciasteczka sesji A).
    other_client = TestClient(app)
    r = other_client.post("/api/auth/password/forgot", json={"email": "sesje@test.pl"})
    reset_challenge_id = r.json()["challenge_id"]
    reset_code = sent_reset_emails[-1]["code"]
    r = other_client.post(
        "/api/auth/password/reset",
        json={"challenge_id": reset_challenge_id, "code": reset_code, "new_password": "zupelnienowe123"},
    )
    check("reset z innego urządzenia -> 200", r.status_code == 200, r.text)

    # Sesja A powinna już nie działać.
    me_a = client.get("/api/auth/me")
    check("sesja A po resecie z innego urządzenia -> 401 (unieważniona)", me_a.status_code == 401, me_a.text)

    app.dependency_overrides.clear()

    # --- 9. challenge_id z rejestracji nie działa w /password/reset ----------
    sent_login_emails.clear()
    client, db = _make_client()
    r = client.post(
        "/api/auth/register",
        json={
            "name": "Beata",
            "last_name": "Nowak",
            "email": "beata@test.pl",
            "password": "haslo1234567",
            "accept_terms": True,
        },
    )
    register_challenge_id = r.json()["challenge_id"]
    r = client.post(
        "/api/auth/password/reset",
        json={"challenge_id": register_challenge_id, "code": "000000", "new_password": "inne12345"},
    )
    check(
        "reset: challenge_id z rejestracji -> 404 (zły 'purpose')",
        r.status_code == 404,
        r.text,
    )
    r = client.post(
        "/api/auth/password/verify-code",
        json={"challenge_id": register_challenge_id, "code": "000000"},
    )
    check(
        "verify-code: challenge_id z rejestracji -> 404 (zły 'purpose')",
        r.status_code == 404,
        r.text,
    )
    app.dependency_overrides.clear()

    # --- 10. cooldown przy ponownym forgot ------------------------------------
    client, db = _make_client()
    _register(client, "cooldown@test.pl")
    sent_reset_emails.clear()
    r = client.post("/api/auth/password/forgot", json={"email": "cooldown@test.pl"})
    check("forgot: pierwsze żądanie -> 200", r.status_code == 200, r.text)
    first_challenge_id = r.json()["challenge_id"]
    first_code = sent_reset_emails[-1]["code"]

    r = client.post("/api/auth/password/forgot", json={"email": "cooldown@test.pl"})
    check("forgot: natychmiastowe powtórzenie -> 429 (cooldown)", r.status_code == 429, r.text)

    # --- 11. nowe forgot (po wygaśnięciu cooldownu) unieważnia poprzedni kod -
    settings.otp_resend_cooldown_seconds = 0
    r = client.post("/api/auth/password/forgot", json={"email": "cooldown@test.pl"})
    check("forgot: kolejne żądanie po cooldownie -> 200", r.status_code == 200, r.text)

    r = client.post(
        "/api/auth/password/reset",
        json={"challenge_id": first_challenge_id, "code": first_code, "new_password": "cokolwiek123"},
    )
    check("reset: kod sprzed kolejnego forgot -> 400 (unieważniony)", r.status_code == 400, r.text)
    app.dependency_overrides.clear()

    # --- 12. zbyt wiele złych prób blokuje kod --------------------------------
    settings.otp_resend_cooldown_seconds = 30
    client, db = _make_client()
    _register(client, "proby@test.pl")
    sent_reset_emails.clear()
    r = client.post("/api/auth/password/forgot", json={"email": "proby@test.pl"})
    ch_id = r.json()["challenge_id"]
    for _ in range(settings.otp_max_attempts):
        client.post(
            "/api/auth/password/reset",
            json={"challenge_id": ch_id, "code": "111111", "new_password": "cokolwiek123"},
        )
    real_code2 = sent_reset_emails[-1]["code"]
    r = client.post(
        "/api/auth/password/reset",
        json={"challenge_id": ch_id, "code": real_code2, "new_password": "cokolwiek123"},
    )
    check(f"reset: po {settings.otp_max_attempts} złych próbach nawet dobry kod -> 429", r.status_code == 429, r.text)
    app.dependency_overrides.clear()

    # --- 13. wygasły kod --------------------------------------------------------
    client, db = _make_client()
    _register(client, "wygasle@test.pl")
    sent_reset_emails.clear()
    r = client.post("/api/auth/password/forgot", json={"email": "wygasle@test.pl"})
    ch_id = r.json()["challenge_id"]
    expired_code = sent_reset_emails[-1]["code"]
    row = db.exec(select(LoginChallenge).where(LoginChallenge.id == ch_id)).first()
    row.expires_at = utcnow() - timedelta(seconds=1)
    db.add(row)
    db.commit()
    r = client.post(
        "/api/auth/password/reset",
        json={"challenge_id": ch_id, "code": expired_code, "new_password": "cokolwiek123"},
    )
    check("reset: wygasły kod -> 400", r.status_code == 400 and "wygasł" in r.json().get("detail", ""), r.text)
    app.dependency_overrides.clear()

    print()
    if failures:
        print(f"{len(failures)} NIEPOWODZEN: {', '.join(failures)}")
        sys.exit(1)
    print("Wszystkie testy resetu hasła OK")


if __name__ == "__main__":
    run()
