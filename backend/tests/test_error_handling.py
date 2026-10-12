"""
Testy: żaden komunikat błędu pokazywany użytkownikowi nie powinien być surowym
tekstem Pydantic/Pythona (po angielsku, technicznym) — zawsze nasz własny,
polski tekst. Patrz app/errors.py.

Uruchomienie:
    cd backend
    .venv\\Scripts\\python tests/test_error_handling.py
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient  # noqa: E402
from sqlmodel import Session, SQLModel, create_engine  # noqa: E402
from sqlmodel.pool import StaticPool  # noqa: E402

from app import auth, database, payments  # noqa: E402
from app.main import app  # noqa: E402

_sent_codes: list[dict] = []


def _fake_send_login_code(to: str, name: str, code: str) -> None:
    _sent_codes.append({"to": to, "code": code})


auth.send_login_code = _fake_send_login_code  # type: ignore[assignment]


def _make_client() -> TestClient:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)

    def override_get_session():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[database.get_session] = override_get_session
    # raise_server_exceptions=False: chcemy sprawdzić, co TestClient dostaje jako
    # odpowiedź HTTP po nieobsłużonym wyjątku (patrz test 6), nie zobaczyć traceback
    # w samym teście — to i tak idzie do logów serwera (app.errors.logger.exception).
    return TestClient(app, raise_server_exceptions=False)


def _register_and_login(client: TestClient, email: str = "test@test.pl") -> None:
    _sent_codes.clear()
    r = client.post(
        "/api/auth/register",
        json={
            "name": "Jan",
            "last_name": "Testowy",
            "email": email,
            "password": "haslo1234567",
            "accept_terms": True,
        },
    )
    assert r.status_code == 201, r.text
    challenge_id = r.json()["challenge_id"]
    code = _sent_codes[-1]["code"]
    v = client.post("/api/auth/login/verify", json={"challenge_id": challenge_id, "code": code})
    assert v.status_code == 200, v.text


STUDENT = {
    "student_name": "Jan",
    "student_last_name": "Kowalski",
    "student_email": "jan.kowalski@example.pl",
    "student_phone": "600100200",
    "student_street": "Przykładowa",
    "student_building_number": "1",
    "student_postal_code": "00-001",
    "student_city": "Warszawa",
    "preferred_schedule": "wtorek-17-19",
}


def _first_msg(response_json: dict) -> str:
    detail = response_json["detail"]
    assert isinstance(detail, list) and detail, detail
    return detail[0]["msg"]


def run() -> None:
    failures: list[str] = []

    def check(name: str, cond: bool, extra: str = "") -> None:
        status = "PASS" if cond else "FAIL"
        if not cond:
            failures.append(name)
        print(f"{status}  {name}{(' - ' + extra) if extra and not cond else ''}")

    client = _make_client()
    _register_and_login(client)

    # --- 1. Telefon za krótki: dawniej Field(min_length=6) wygrywał z naszym   -
    #        walidatorem i pokazywał "String should have at least 6 characters" -
    r = client.post(
        "/api/enrollments",
        json={"course_slug": "matematyka-rozszerzona", **STUDENT, "student_phone": "123"},
    )
    check("telefon za krótki -> 422", r.status_code == 422, r.text)
    msg = _first_msg(r.json())
    check(
        "telefon za krótki -> nasz polski komunikat, nie angielski Pydantic",
        msg == "Podaj poprawny numer telefonu.",
        msg,
    )
    check("telefon za krótki -> bez angielskich słów 'String should'", "String should" not in msg, msg)

    # --- 2. Zły format kodu pocztowego -> ogólny polski komunikat ------------
    r = client.post(
        "/api/enrollments",
        json={"course_slug": "matematyka-rozszerzona", **STUDENT, "student_postal_code": "00000"},
    )
    check("zły kod pocztowy -> 422", r.status_code == 422, r.text)
    msg = _first_msg(r.json())
    check("zły kod pocztowy -> polski komunikat", msg == "Ta wartość ma nieprawidłowy format.", msg)
    check("zły kod pocztowy -> bez angielskiego 'pattern'", "pattern" not in msg.lower(), msg)

    # --- 3. Zły format e-maila (EmailStr) -> polski komunikat o e-mailu -----
    r = client.post(
        "/api/enrollments",
        json={"course_slug": "matematyka-rozszerzona", **STUDENT, "student_email": "nie-email"},
    )
    check("zły e-mail -> 422", r.status_code == 422, r.text)
    msg = _first_msg(r.json())
    check("zły e-mail -> polski komunikat", msg == "Podaj poprawny adres e-mail.", msg)
    check("zły e-mail -> bez angielskiego '@-sign'", "@-sign" not in msg, msg)

    # --- 4. Brakujące pole -> polski komunikat -------------------------------
    r = client.post("/api/enrollments", json={"course_slug": "matematyka-rozszerzona"})
    check("brakujące pola -> 422", r.status_code == 422, r.text)
    msg = _first_msg(r.json())
    check("brakujące pole -> polski komunikat, nie 'Field required'", msg == "To pole jest wymagane.", msg)

    # --- 5. Nasz własny walidator (ValueError) nadal przechodzi nienaruszony -
    r = client.post(
        "/api/auth/register",
        json={
            "name": "Ala",
            "last_name": "Nowak",
            "email": "ala2@test.pl",
            "password": "haslo1234567",
            "accept_terms": False,
        },
    )
    check("accept_terms=false -> 422", r.status_code == 422, r.text)
    msg = _first_msg(r.json())
    check(
        "accept_terms=false -> własny polski komunikat zostaje nietknięty",
        msg == "Musisz zaakceptować regulamin i politykę prywatności, żeby założyć konto.",
        msg,
    )

    # --- 6. Zupełnie nieoczekiwany wyjątek -> 500 z uprzejmym komunikatem ----
    def _boom(slug: str):
        raise RuntimeError("to się nie powinno pokazać użytkownikowi")

    original_get_item = payments.get_item
    payments.get_item = _boom  # type: ignore[assignment]
    try:
        r = client.post("/api/enrollments", json={"course_slug": "matematyka-rozszerzona", **STUDENT})
    finally:
        payments.get_item = original_get_item  # type: ignore[assignment]

    check("nieoczekiwany wyjątek -> 500", r.status_code == 500, r.text)
    detail = r.json().get("detail", "")
    check(
        "nieoczekiwany wyjątek -> uprzejmy polski komunikat, nie 'Internal Server Error'",
        detail == "Coś poszło nie tak po naszej stronie. Spróbuj za chwilę.",
        detail,
    )
    check("nieoczekiwany wyjątek -> treść wyjątku NIE wycieka do klienta", "to się nie powinno" not in detail)

    app.dependency_overrides.clear()

    print()
    if failures:
        print(f"{len(failures)} NIEPOWODZEŃ: {', '.join(failures)}")
        sys.exit(1)
    print("Wszystkie testy komunikatów błędów OK")


if __name__ == "__main__":
    run()
