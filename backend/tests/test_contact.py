"""
Testy formularza kontaktowego (/api/contact): zapis do bazy + powiadomienie
admina mailem, bez prawdziwej wysyłki (zamockowana).

Uruchomienie:
    cd backend
    .venv\\Scripts\\python tests/test_contact.py
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient  # noqa: E402
from sqlmodel import Session, SQLModel, create_engine, select  # noqa: E402
from sqlmodel.pool import StaticPool  # noqa: E402

from app import contact, database  # noqa: E402
from app.config import settings  # noqa: E402
from app.main import app  # noqa: E402
from app.models import ContactMessage  # noqa: E402

_sent_emails: list[dict] = []


def _fake_send_email(to, subject: str, text: str) -> None:
    _sent_emails.append({"to": to, "subject": subject, "text": text})


contact.send_email = _fake_send_email  # type: ignore[assignment]


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

    # --- 1. Pełne, poprawne zgłoszenie -> 201, zapisane, admin powiadomiony --
    settings.admin_emails = "admin@example.pl"
    _sent_emails.clear()
    client, db = _make_client()

    r = client.post(
        "/api/contact",
        json={
            "name": "Kasia",
            "phone": "600100200",
            "email": "kasia@example.pl",
            "course_slug": "matematyka-rozszerzona",
            "course_title": "Kurs maturalny z matematyki rozszerzonej",
            "message": "Pytanie o grupę wieczorową.",
            "consent": True,
        },
    )
    check("poprawne zgłoszenie -> 201", r.status_code == 201, r.text)
    body = r.json()
    check("odpowiedź ma id i dane zgłoszenia", body.get("name") == "Kasia" and body.get("id"), str(body))

    row = db.exec(select(ContactMessage).where(ContactMessage.name == "Kasia")).first()
    check("zgłoszenie zapisane w bazie", row is not None and row.phone == "600100200")
    check(
        "zgłoszenie w bazie ma e-mail, kurs i wiadomość",
        row is not None
        and row.email == "kasia@example.pl"
        and row.course_title == "Kurs maturalny z matematyki rozszerzonej"
        and row.message == "Pytanie o grupę wieczorową.",
        str(row),
    )
    check(
        "admin powiadomiony mailem",
        len(_sent_emails) == 1 and _sent_emails[0]["to"] == ["admin@example.pl"],
        str(_sent_emails),
    )
    check(
        "treść maila zawiera dane zgłoszenia",
        "Kasia" in _sent_emails[0]["text"] and "600100200" in _sent_emails[0]["text"],
        _sent_emails[0]["text"] if _sent_emails else "",
    )

    # --- 2. Minimalne zgłoszenie (bez e-maila/kursu/wiadomości) -> nadal OK --
    _sent_emails.clear()
    r = client.post("/api/contact", json={"name": "Tomek", "phone": "600200300", "consent": True})
    check("minimalne zgłoszenie -> 201", r.status_code == 201, r.text)
    row2 = db.exec(select(ContactMessage).where(ContactMessage.name == "Tomek")).first()
    check(
        "minimalne zgłoszenie zapisane z puustymi opcjonalnymi polami",
        row2 is not None and row2.email is None and row2.course_title is None,
        str(row2),
    )

    app.dependency_overrides.clear()

    # --- 3. ADMIN_EMAILS puste -> zapis działa, ale bez maila -------------
    settings.admin_emails = ""
    _sent_emails.clear()
    client2, db2 = _make_client()
    r = client2.post("/api/contact", json={"name": "Zosia", "phone": "600300400", "consent": True})
    check("bez ADMIN_EMAILS -> wciąż 201", r.status_code == 201, r.text)
    check("bez ADMIN_EMAILS -> zapisane w bazie", db2.exec(select(ContactMessage)).first() is not None)
    check("bez ADMIN_EMAILS -> brak wysłanego maila", len(_sent_emails) == 0, str(_sent_emails))
    app.dependency_overrides.clear()

    # --- 4. Pole-pułapka (honeypot) wypełnione -> fałszywy sukces, nic się ---
    #        nie zapisuje i nikt nie jest powiadamiany                       -
    settings.admin_emails = "admin@example.pl"
    _sent_emails.clear()
    client3, db3 = _make_client()
    r = client3.post(
        "/api/contact",
        json={"name": "Bot", "phone": "600400500", "consent": True, "company": "Spam sp. z o.o."},
    )
    check("honeypot -> wciąż 201 (nie zdradzamy wykrycia)", r.status_code == 201, r.text)
    check("honeypot -> NIC nie zapisane w bazie", db3.exec(select(ContactMessage)).first() is None)
    check("honeypot -> brak powiadomienia", len(_sent_emails) == 0, str(_sent_emails))
    app.dependency_overrides.clear()

    # --- 5. Walidacja: za krótki telefon -> polski komunikat ----------------
    client4, _ = _make_client()
    r = client4.post("/api/contact", json={"name": "Jan", "phone": "123", "consent": True})
    check("za krótki telefon -> 422", r.status_code == 422, r.text)
    msg = r.json()["detail"][0]["msg"]
    check("za krótki telefon -> nasz polski komunikat", msg == "Podaj poprawny numer telefonu.", msg)
    app.dependency_overrides.clear()

    # --- 6. Walidacja: brak zgody -> polski komunikat ------------------------
    client5, _ = _make_client()
    r = client5.post("/api/contact", json={"name": "Jan", "phone": "600500600", "consent": False})
    check("brak zgody -> 422", r.status_code == 422, r.text)
    msg = r.json()["detail"][0]["msg"]
    check(
        "brak zgody -> nasz polski komunikat",
        msg == "Bez zgody na kontakt nie możemy do Ciebie oddzwonić.",
        msg,
    )
    app.dependency_overrides.clear()

    print()
    if failures:
        print(f"{len(failures)} NIEPOWODZEŃ: {', '.join(failures)}")
        sys.exit(1)
    print("Wszystkie testy formularza kontaktowego OK")


if __name__ == "__main__":
    run()
