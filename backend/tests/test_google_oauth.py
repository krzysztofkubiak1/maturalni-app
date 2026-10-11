"""
Testy logowania Google (OAuth 2.0) — bez prawdziwego Google (zamockowane
wywołania do accounts.google.com/oauth2.googleapis.com/googleapis.com).

Uruchomienie:
    cd backend
    .venv\\Scripts\\python tests/test_google_oauth.py
"""

from __future__ import annotations

import sys
from pathlib import Path
from urllib.parse import parse_qs, urlparse

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient  # noqa: E402
from sqlmodel import Session, SQLModel, create_engine, select  # noqa: E402
from sqlmodel.pool import StaticPool  # noqa: E402

from app import auth, database  # noqa: E402
from app.config import settings  # noqa: E402
from app.main import app  # noqa: E402
from app.models import User  # noqa: E402

# Odpowiedzi Google na wymianę kodu / pobranie profilu — ustawiane przed każdym
# wywołaniem callbacku, żeby nie łączyć się z prawdziwym Google.
_next_userinfo: dict = {}


def _fake_exchange_google_code(code: str) -> dict:
    return {"access_token": f"fake-token-for-{code}"}


def _fake_fetch_google_userinfo(access_token: str) -> dict:
    return _next_userinfo


auth._exchange_google_code = _fake_exchange_google_code  # type: ignore[assignment]
auth._fetch_google_userinfo = _fake_fetch_google_userinfo  # type: ignore[assignment]


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


def _start_login(client: TestClient, redirect_to: str = "/panel") -> tuple[str, str]:
    """Woła /google/login, wraca (state, location Google) z ciasteczka i odpowiedzi."""
    r = client.get(
        "/api/auth/google/login",
        params={"redirect_to": redirect_to},
        follow_redirects=False,
    )
    assert r.status_code in (302, 307), r.text
    location = r.headers["location"]
    # httpx trzyma wartość ciasteczka z dosłownymi znakami cytowania (bo ma w sobie
    # "|") — to tylko kwestia tego akcesora; serwer po stronie Starlette i tak
    # poprawnie je zdejmuje przy odczycie Cookie z żądania.
    cookie_raw = (client.cookies.get("google_oauth_state") or "").strip('"')
    assert cookie_raw, "brak ciasteczka google_oauth_state po /google/login"
    state, _, _ = cookie_raw.partition("|")
    return state, location


def run() -> None:
    failures: list[str] = []

    def check(name: str, cond: bool, extra: str = "") -> None:
        status = "PASS" if cond else "FAIL"
        if not cond:
            failures.append(name)
        print(f"{status}  {name}{(' - ' + extra) if extra and not cond else ''}")

    # --- 1. Google niekonfigurowany -> 503 ----------------------------------
    settings.google_client_id = ""
    settings.google_client_secret = ""
    client, _ = _make_client()
    r = client.get("/api/auth/google/login", follow_redirects=False)
    check("login bez kluczy Google -> 503", r.status_code == 503, r.text)
    app.dependency_overrides.clear()

    # --- 2. /google/login przekierowuje do accounts.google.com -------------
    settings.google_client_id = "test-client-id.apps.googleusercontent.com"
    settings.google_client_secret = "test-secret"
    client, db = _make_client()

    state, location = _start_login(client, redirect_to="/panel/admin")
    parsed = urlparse(location)
    query = parse_qs(parsed.query)
    check("przekierowanie na accounts.google.com", parsed.netloc == "accounts.google.com")
    check("state w URL zgadza się z ciasteczkiem", query.get("state") == [state])
    check("client_id w URL", query.get("client_id") == [settings.google_client_id])

    # --- 3. Callback z niezgodnym state -> błąd, bez sesji ------------------
    # Własny _start_login (osobna rezerwacja ciasteczka) — żeby nie "zjeść"
    # ciasteczka potrzebnego w kroku 4 (callback usuwa je nawet przy błędzie).
    _, _ = _start_login(client, redirect_to="/panel")
    r = client.get(
        "/api/auth/google/callback",
        params={"code": "abc", "state": "cos-innego"},
        follow_redirects=False,
    )
    check("złe state -> przekierowanie z błędem", "blad=google" in r.headers.get("location", ""), r.text)
    check("złe state -> brak ciasteczka sesji", "mzm_session" not in client.cookies)

    # --- 4. Nowe konto przez Google (e-mail zweryfikowany) ------------------
    state, _ = _start_login(client, redirect_to="/panel/admin")
    _next_userinfo.clear()
    _next_userinfo.update(
        {
            "sub": "google-sub-1",
            "email": "nowy@gmail.com",
            "email_verified": True,
            "given_name": "Nowy",
            "family_name": "Kursant",
        }
    )
    r = client.get(
        "/api/auth/google/callback",
        params={"code": "abc", "state": state},
        follow_redirects=False,
    )
    check("nowe konto Google -> przekierowanie na redirect_to", r.headers.get("location", "").endswith("/panel/admin"), r.text)
    check("nowe konto Google -> ciasteczko sesji ustawione", "mzm_session" in client.cookies)

    me = client.get("/api/auth/me")
    check("me() po Google -> 200, dane z profilu Google", me.status_code == 200 and me.json()["email"] == "nowy@gmail.com")
    check("me() -> imię/nazwisko z Google", me.json()["name"] == "Nowy" and me.json()["last_name"] == "Kursant")

    user_row = db.exec(select(User).where(User.email == "nowy@gmail.com")).first()
    check("konto w bazie ma google_sub", user_row is not None and user_row.google_sub == "google-sub-1")
    check(
        "konto Google ma też zapisaną akceptację regulaminu",
        user_row is not None and user_row.accepted_terms_version is not None,
    )

    client.post("/api/auth/logout")

    # --- 5. Ponowne logowanie tym samym Google -> to samo konto, nie duplikat -
    state2, _ = _start_login(client, redirect_to="/panel")
    r = client.get(
        "/api/auth/google/callback",
        params={"code": "xyz", "state": state2},
        follow_redirects=False,
    )
    check("drugie logowanie Google -> sesja -> 200", "mzm_session" in client.cookies)
    all_users = db.exec(select(User).where(User.email == "nowy@gmail.com")).all()
    check("brak duplikatu konta przy drugim logowaniu", len(all_users) == 1, str(len(all_users)))
    client.post("/api/auth/logout")

    # --- 6. Istniejące konto hasłowe + Google z tym samym e-mailem -> link --
    existing = User(
        email="haslowe@test.pl",
        name="Hasłowy",
        last_name="Testowy",
        password_hash="nieważne-w-tym-teście",
    )
    db.add(existing)
    db.commit()
    db.refresh(existing)
    existing_id = existing.id

    state3, _ = _start_login(client, redirect_to="/panel")
    _next_userinfo.clear()
    _next_userinfo.update(
        {
            "sub": "google-sub-2",
            "email": "haslowe@test.pl",
            "email_verified": True,
            "given_name": "Hasłowy",
            "family_name": "Testowy",
        }
    )
    r = client.get(
        "/api/auth/google/callback",
        params={"code": "abc", "state": state3},
        follow_redirects=False,
    )
    check("logowanie Google na istniejący e-mail -> sesja", "mzm_session" in client.cookies)
    linked = db.get(User, existing_id)
    check("istniejące konto podlinkowane do Google (ten sam id)", linked is not None and linked.google_sub == "google-sub-2")
    all_with_email = db.exec(select(User).where(User.email == "haslowe@test.pl")).all()
    check("wciąż jedno konto z tym e-mailem (nie duplikat)", len(all_with_email) == 1, str(len(all_with_email)))
    client.post("/api/auth/logout")

    # --- 7. Google zwraca niezweryfikowany e-mail -> odrzucone ---------------
    state4, _ = _start_login(client, redirect_to="/panel")
    _next_userinfo.clear()
    _next_userinfo.update(
        {
            "sub": "google-sub-3",
            "email": "niezweryfikowany@gmail.com",
            "email_verified": False,
        }
    )
    r = client.get(
        "/api/auth/google/callback",
        params={"code": "abc", "state": state4},
        follow_redirects=False,
    )
    check("niezweryfikowany e-mail -> przekierowanie z błędem", "blad=google" in r.headers.get("location", ""), r.text)
    check("niezweryfikowany e-mail -> brak sesji", "mzm_session" not in client.cookies)
    not_created = db.exec(select(User).where(User.email == "niezweryfikowany@gmail.com")).first()
    check("niezweryfikowany e-mail -> konto NIE powstało", not_created is None)

    app.dependency_overrides.clear()
    settings.google_client_id = ""
    settings.google_client_secret = ""

    print()
    if failures:
        print(f"{len(failures)} NIEPOWODZEŃ: {', '.join(failures)}")
        sys.exit(1)
    print("Wszystkie testy logowania Google OK")


if __name__ == "__main__":
    run()
