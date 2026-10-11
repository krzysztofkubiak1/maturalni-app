"""
Testy logowania: rejestracja jest dwuetapowa (kod e-mail), logowanie jest
jednoetapowe (samo hasło). Bez prawdziwej wysyłki e-maili (zamockowana).

Uruchomienie:
    cd backend
    .venv\\Scripts\\python tests/test_login_otp.py
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
from app.models import LoginChallenge  # noqa: E402
from app.security import utcnow  # noqa: E402

sent_emails: list[dict] = []


def _fake_send_login_code(to: str, name: str, code: str) -> None:
    sent_emails.append({"to": to, "name": name, "code": code})


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


def run() -> None:
    failures: list[str] = []

    def check(name: str, cond: bool, extra: str = "") -> None:
        status = "PASS" if cond else "FAIL"
        if not cond:
            failures.append(name)
        print(f"{status}  {name}{(' - ' + extra) if extra and not cond else ''}")

    auth.send_login_code = _fake_send_login_code  # type: ignore[assignment]
    settings.otp_max_attempts = 3
    settings.otp_resend_cooldown_seconds = 30

    # --- 1. Rejestracja wysyła kod, NIE loguje od razu ---------------------
    sent_emails.clear()
    client, db = _make_client()
    r = client.post(
        "/api/auth/register",
        json={
            "name": "Jan",
            "last_name": "Testowy",
            "email": "jan@test.pl",
            "password": "haslo1234567",
            "accept_terms": True,
        },
    )
    check("register -> 201", r.status_code == 201, r.text)
    body = r.json()
    check("register zwraca challenge_id, nie konto", "challenge_id" in body and "id" not in body)
    hint = body.get("destination_hint", "")
    check(
        "destination_hint jest zamaskowany",
        hint.startswith("j") and "*" in hint and "jan@test.pl" != hint and hint.endswith("@test.pl"),
        hint,
    )
    check("e-mail z kodem 'wysłany' (przechwycony)", len(sent_emails) == 1)
    check("brak ciasteczka sesji przed podaniem kodu", "mzm_session" not in client.cookies)

    me = client.get("/api/auth/me")
    check("me() przed weryfikacją -> 401", me.status_code == 401, me.text)

    challenge_id = body["challenge_id"]
    real_code = sent_emails[0]["code"]

    # --- 2. Zły kod -> 401, licznik prób rośnie -----------------------------
    r = client.post("/api/auth/login/verify", json={"challenge_id": challenge_id, "code": "000000"})
    check("zły kod -> 401", r.status_code == 401, r.text)
    check("zły kod: komunikat mówi o pozostałych próbach", "Pozostało prób" in r.json().get("detail", ""))
    me = client.get("/api/auth/me")
    check("me() po złym kodzie nadal 401", me.status_code == 401)

    # --- 3. Dobry kod -> zaczyna sesję --------------------------------------
    r = client.post("/api/auth/login/verify", json={"challenge_id": challenge_id, "code": real_code})
    check("dobry kod -> 200", r.status_code == 200, r.text)
    check("dobry kod: zwraca dane konta", r.json().get("email") == "jan@test.pl")
    check("dobry kod: zwraca imię i nazwisko", r.json().get("name") == "Jan" and r.json().get("last_name") == "Testowy")
    check("ciasteczko sesji ustawione", "mzm_session" in client.cookies)
    me = client.get("/api/auth/me")
    check("me() po weryfikacji -> 200", me.status_code == 200 and me.json()["email"] == "jan@test.pl")

    # --- 4. Ten sam (skonsumowany) kod nie działa drugi raz -----------------
    r = client.post("/api/auth/login/verify", json={"challenge_id": challenge_id, "code": real_code})
    check("powtórne użycie kodu -> 400", r.status_code == 400, r.text)

    client.post("/api/auth/logout")

    # --- 5. Logowanie: jednoetapowe, samo hasło od razu zakłada sesję -------
    r = client.post("/api/auth/login", json={"email": "jan@test.pl", "password": "haslo1234567"})
    check("login poprawnym hasłem -> 200 od razu (bez wyzwania)", r.status_code == 200, r.text)
    check("login: zwraca dane konta, nie challenge_id", "challenge_id" not in r.json())
    check("login: zwraca konto Jana", r.json().get("email") == "jan@test.pl")
    check("login: ciasteczko sesji ustawione od razu", "mzm_session" in client.cookies)
    me = client.get("/api/auth/me")
    check("me() od razu po login() -> 200", me.status_code == 200 and me.json()["email"] == "jan@test.pl")

    client.post("/api/auth/logout")

    r = client.post("/api/auth/login", json={"email": "jan@test.pl", "password": "zlehaslo"})
    check("login złym hasłem -> 401", r.status_code == 401, r.text)
    me = client.get("/api/auth/me")
    check("me() po nieudanym login() -> 401", me.status_code == 401)

    r = client.post("/api/auth/login", json={"email": "nieznany@test.pl", "password": "cokolwiek1"})
    check("login na nieistniejące konto -> 401 (ten sam komunikat)", r.status_code == 401, r.text)

    app.dependency_overrides.clear()

    # --- 6. Mechanika kodu (resend/limit prób/wygaśnięcie) — testowana na    -
    #        wyzwaniu rejestracyjnym, bo tylko rejestracja go teraz tworzy.  -
    sent_emails.clear()
    client, db = _make_client()
    r = client.post(
        "/api/auth/register",
        json={
            "name": "Ala",
            "last_name": "Nowak",
            "email": "ala@test.pl",
            "password": "haslo1234567",
            "accept_terms": True,
        },
    )
    challenge_id = r.json()["challenge_id"]
    first_code = sent_emails[-1]["code"]

    # --- 6a. Resend: stary kod przestaje działać, nowy działa ---------------
    settings.otp_resend_cooldown_seconds = 0
    sent_emails.clear()
    r = client.post("/api/auth/login/resend", json={"challenge_id": challenge_id})
    check("resend -> 200", r.status_code == 200, r.text)
    new_challenge_id = r.json()["challenge_id"]
    check("resend: nowy challenge_id różny od starego", new_challenge_id != challenge_id)
    check("resend: wysłano nowy e-mail", len(sent_emails) == 1)
    new_code = sent_emails[0]["code"]

    r = client.post("/api/auth/login/verify", json={"challenge_id": challenge_id, "code": first_code})
    check("stary kod po resendzie -> 400 (unieważniony)", r.status_code == 400, r.text)

    r = client.post("/api/auth/login/verify", json={"challenge_id": new_challenge_id, "code": new_code})
    check("nowy kod po resendzie -> 200", r.status_code == 200, r.text)
    client.post("/api/auth/logout")

    # --- 6b. Zbyt wiele złych prób blokuje kod -------------------------------
    sent_emails.clear()
    r = client.post(
        "/api/auth/register",
        json={
            "name": "Zofia",
            "last_name": "Wisniewska",
            "email": "zofia@test.pl",
            "password": "haslo1234567",
            "accept_terms": True,
        },
    )
    ch_id = r.json()["challenge_id"]
    for _ in range(settings.otp_max_attempts):
        client.post("/api/auth/login/verify", json={"challenge_id": ch_id, "code": "111111"})
    real_code2 = sent_emails[-1]["code"]
    r = client.post("/api/auth/login/verify", json={"challenge_id": ch_id, "code": real_code2})
    check(f"po {settings.otp_max_attempts} złych próbach nawet dobry kod -> 429", r.status_code == 429, r.text)

    # --- 6c. Wygasły kod ------------------------------------------------------
    sent_emails.clear()
    r = client.post(
        "/api/auth/register",
        json={
            "name": "Piotr",
            "last_name": "Zajac",
            "email": "piotr@test.pl",
            "password": "haslo1234567",
            "accept_terms": True,
        },
    )
    ch_id = r.json()["challenge_id"]
    expired_code = sent_emails[-1]["code"]
    # cofamy czas ważności wyzwania bezpośrednio w bazie, zamiast czekać 10 minut
    row = db.exec(select(LoginChallenge).where(LoginChallenge.id == ch_id)).first()
    row.expires_at = utcnow() - timedelta(seconds=1)
    db.add(row)
    db.commit()
    r = client.post("/api/auth/login/verify", json={"challenge_id": ch_id, "code": expired_code})
    check("wygasły kod -> 400", r.status_code == 400 and "wygasł" in r.json().get("detail", ""), r.text)

    # --- 6d. Resend zbyt szybko -> 429 ----------------------------------------
    settings.otp_resend_cooldown_seconds = 30
    sent_emails.clear()
    r = client.post(
        "/api/auth/register",
        json={
            "name": "Tomasz",
            "last_name": "Krol",
            "email": "tomasz@test.pl",
            "password": "haslo1234567",
            "accept_terms": True,
        },
    )
    ch_id = r.json()["challenge_id"]
    r = client.post("/api/auth/login/resend", json={"challenge_id": ch_id})
    check("natychmiastowy resend -> 429 (cooldown)", r.status_code == 429, r.text)

    app.dependency_overrides.clear()

    print()
    if failures:
        print(f"{len(failures)} NIEPOWODZEN: {', '.join(failures)}")
        sys.exit(1)
    print("Wszystkie testy logowania OK")


if __name__ == "__main__":
    run()
