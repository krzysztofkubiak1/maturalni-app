"""
Testy przepływu płatności - bez prawdziwego Stripe (zamockowany).

Uruchomienie:
    cd backend
    .venv\\Scripts\\python -m pytest -q            # jeśli masz pytest
albo po prostu:
    .venv\\Scripts\\python tests/test_payments.py   # samodzielny runner na dole pliku
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import stripe  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlmodel import Session, SQLModel, create_engine  # noqa: E402
from sqlmodel.pool import StaticPool  # noqa: E402

from app import auth, database, payments  # noqa: E402
from app.config import settings  # noqa: E402
from app.main import app  # noqa: E402

# Rejestracja jest dwuetapowa (kod e-mail) — przechwytujemy "wysłane" kody
# zamiast łączyć się z prawdziwą pocztą.
_sent_codes: list[dict] = []


def _capture_login_code(to: str, name: str, code: str) -> None:
    _sent_codes.append({"to": to, "code": code})


auth.send_login_code = _capture_login_code  # type: ignore[assignment]

# Powiadomienia admina o opłaconych zapisach — też przechwytujemy zamiast wysyłać.
_admin_emails_sent: list[dict] = []


def _capture_admin_email(to, subject: str, text: str) -> None:
    _admin_emails_sent.append({"to": to, "subject": subject, "text": text})


payments.send_email = _capture_admin_email  # type: ignore[assignment]


def _make_client() -> TestClient:
    # Świeża baza w pamięci na każdy test.
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
    client = TestClient(app)
    client._engine = engine  # type: ignore[attr-defined]
    return client


def _register(client: TestClient, email: str = "kup@test.pl") -> None:
    """Rejestruje konto i od razu dokańcza logowanie dwuetapowe (kod e-mail)."""
    _sent_codes.clear()
    res = client.post(
        "/api/auth/register",
        json={
            "name": "Kupujący",
            "last_name": "Testowy",
            "email": email,
            "password": "haslo1234567",
            "accept_terms": True,
        },
    )
    assert res.status_code == 201, res.text
    challenge_id = res.json()["challenge_id"]
    code = _sent_codes[-1]["code"]

    verify = client.post(
        "/api/auth/login/verify",
        json={"challenge_id": challenge_id, "code": code},
    )
    assert verify.status_code == 200, verify.text


# Dane kursanta wymagane teraz przy tworzeniu sesji checkout (formularz zapisu).
STUDENT = {
    "student_name": "Jan",
    "student_last_name": "Kowalski",
    "student_email": "jan.kowalski@example.pl",
    "student_phone": "600100200",
    "student_street": "Przykładowa",
    "student_building_number": "1",
    "student_apartment_number": "3",
    "student_postal_code": "00-001",
    "student_city": "Warszawa",
    "preferred_schedule": "wtorek-17-19",
}

MINOR_STUDENT = {
    **STUDENT,
    "is_minor": True,
    "guardian_name": "Anna",
    "guardian_last_name": "Kowalska",
    "guardian_phone": "600200300",
    "guardian_email": "anna.kowalska@example.pl",
    "guardian_street": "Kwiatowa",
    "guardian_building_number": "5",
    "guardian_postal_code": "00-002",
    "guardian_city": "Warszawa",
}


class _FakeCheckoutSession(dict):
    """Udaje obiekt sesji Stripe (dostęp .id / .url oraz ["klucz"])."""

    def __getattr__(self, name):
        try:
            return self[name]
        except KeyError as exc:
            raise AttributeError(name) from exc


def _install_stripe_stub(*, session_id="cs_test_123"):
    created = _FakeCheckoutSession(
        id=session_id,
        url=f"https://checkout.stripe.test/{session_id}",
        client_reference_id=None,
        payment_status="unpaid",
        status="open",
        payment_intent=None,
    )

    def fake_create(**kwargs):
        created["client_reference_id"] = kwargs.get("client_reference_id")
        created["_metadata"] = kwargs.get("metadata")
        created["_line_items"] = kwargs.get("line_items")
        return created

    def fake_retrieve(sid, **kwargs):
        return created

    stripe.checkout.Session.create = staticmethod(fake_create)  # type: ignore[assignment]
    stripe.checkout.Session.retrieve = staticmethod(fake_retrieve)  # type: ignore[assignment]
    return created


def run() -> None:
    failures: list[str] = []

    def check(name: str, cond: bool, extra: str = "") -> None:
        status = "PASS" if cond else "FAIL"
        if not cond:
            failures.append(name)
        print(f"{status}  {name}{(' - ' + extra) if extra and not cond else ''}")

    # --- 1. Płatności wyłączone -> 503 -------------------------------------
    settings.stripe_secret_key = ""
    client = _make_client()
    _register(client, "off@test.pl")
    r = client.post("/api/checkout/session", json={"course_slug": "matematyka-rozszerzona", **STUDENT})
    check("checkout gdy Stripe wyłączony -> 503", r.status_code == 503, r.text)
    check("me/courses puste dla nowego konta", client.get("/api/me/courses").json() == [])
    app.dependency_overrides.clear()

    # --- 2. Pełny happy-path z zamockowanym Stripe -----------------------
    settings.stripe_secret_key = "sk_test_dummy"
    settings.stripe_webhook_secret = "whsec_dummy"
    client = _make_client()
    _register(client, "buy@test.pl")
    fake = _install_stripe_stub()

    r = client.post("/api/checkout/session", json={"course_slug": "matematyka-rozszerzona", **STUDENT})
    check("utworzenie sesji checkout -> 200", r.status_code == 200, r.text)
    body = r.json()
    check("zwrócony checkout_url", body.get("checkout_url", "").startswith("https://checkout.stripe.test/"))
    check("client_reference_id ustawiony na id użytkownika", fake["client_reference_id"] == "1")
    unit_amount = fake["_line_items"][0]["price_data"]["unit_amount"]
    check("kwota z katalogu backendu (10000 gr)", unit_amount == 10000, f"było {unit_amount}")

    check("kurs jeszcze nieopłacony - brak w me/courses", client.get("/api/me/courses").json() == [])
    orders = client.get("/api/me/orders").json()
    check("zamówienie w historii ma status pending", len(orders) == 1 and orders[0]["status"] == "pending")
    check(
        "zamówienie zapisuje dane kursanta (w tym rozbity adres i termin)",
        orders[0]["student_name"] == "Jan"
        and orders[0]["student_city"] == "Warszawa"
        and orders[0]["student_building_number"] == "1"
        and orders[0]["student_apartment_number"] == "3"
        and orders[0]["preferred_schedule"] == "wtorek-17-19",
        str(orders[0]),
    )

    r_missing = client.post("/api/checkout/session", json={"course_slug": "matematyka-podstawowa"})
    check("brak danych kursanta -> 422", r_missing.status_code == 422, r_missing.text)

    r_bad_postal = client.post(
        "/api/checkout/session",
        json={"course_slug": "matematyka-podstawowa", **STUDENT, "student_postal_code": "00000"},
    )
    check("zły format kodu pocztowego -> 422", r_bad_postal.status_code == 422, r_bad_postal.text)

    r_bad_schedule = client.post(
        "/api/checkout/session",
        json={"course_slug": "matematyka-podstawowa", **STUDENT, "preferred_schedule": "piatek-12-14"},
    )
    check("nieznany termin zajęć -> 422", r_bad_schedule.status_code == 422, r_bad_schedule.text)

    r_minor_no_guardian = client.post(
        "/api/checkout/session",
        json={"course_slug": "matematyka-podstawowa", **STUDENT, "is_minor": True},
    )
    check(
        "niepełnoletni bez danych opiekuna -> 422",
        r_minor_no_guardian.status_code == 422,
        r_minor_no_guardian.text,
    )

    r_minor_no_guardian_address = client.post(
        "/api/checkout/session",
        json={
            "course_slug": "matematyka-podstawowa",
            **STUDENT,
            "is_minor": True,
            "guardian_name": "Anna",
            "guardian_last_name": "Kowalska",
            "guardian_phone": "600200300",
            "guardian_email": "anna.kowalska@example.pl",
            # brak adresu opiekuna — powinno zostać odrzucone
        },
    )
    check(
        "niepełnoletni bez adresu opiekuna -> 422",
        r_minor_no_guardian_address.status_code == 422,
        r_minor_no_guardian_address.text,
    )

    _install_stripe_stub(session_id="cs_test_minor")  # świeży id sesji Stripe
    r_minor_ok = client.post(
        "/api/checkout/session",
        json={"course_slug": "matematyka-podstawowa", **MINOR_STUDENT},
    )
    check("niepełnoletni z danymi opiekuna -> 200", r_minor_ok.status_code == 200, r_minor_ok.text)
    minor_order = client.get("/api/me/orders").json()[0]
    check(
        "zamówienie niepełnoletniego zapisuje dane opiekuna wraz z adresem",
        minor_order["is_minor"] is True
        and minor_order["guardian_name"] == "Anna"
        and minor_order["guardian_street"] == "Kwiatowa"
        and minor_order["guardian_city"] == "Warszawa",
        str(minor_order),
    )

    # --- 3. Webhook oznacza jako opłacone -------------------------------
    fake["payment_status"] = "paid"
    fake["payment_intent"] = "pi_test_1"
    captured = {"payload": None, "sig": None}

    def fake_construct_event(payload, sig, secret):
        captured["payload"] = payload
        captured["sig"] = sig
        return {
            "type": "checkout.session.completed",
            "data": {"object": {
                "id": fake["id"],
                "payment_status": "paid",
                "payment_intent": "pi_test_1",
            }},
        }

    settings.admin_emails = "admin@example.pl, drugi-admin@example.pl"
    _admin_emails_sent.clear()

    stripe.Webhook.construct_event = staticmethod(fake_construct_event)  # type: ignore[assignment]
    r = client.post("/api/webhooks/stripe", content=b"{}", headers={"stripe-signature": "t=1,v1=x"})
    check("webhook -> 200", r.status_code == 200, r.text)

    courses_after = client.get("/api/me/courses").json()
    check("po webhooku kurs jest w me/courses", len(courses_after) == 1 and courses_after[0]["course_slug"] == "matematyka-rozszerzona")

    check(
        "webhook: powiadomienie do adminów wysłane do obu adresów",
        len(_admin_emails_sent) == 1
        and _admin_emails_sent[0]["to"] == ["admin@example.pl", "drugi-admin@example.pl"],
        str(_admin_emails_sent),
    )
    check(
        "powiadomienie zawiera dane kursanta i wybrany termin",
        _admin_emails_sent
        and "Jan Kowalski" in _admin_emails_sent[0]["text"]
        and "Wtorek, 17:00" in _admin_emails_sent[0]["text"],
        str(_admin_emails_sent),
    )

    # --- 4. Idempotencja + brak podwójnego zakupu ----------------------
    r = client.post("/api/webhooks/stripe", content=b"{}", headers={"stripe-signature": "t=1,v1=x"})
    check("webhook powtórzony -> nadal 200, bez duplikatu", r.status_code == 200 and len(client.get("/api/me/courses").json()) == 1)
    check(
        "webhook powtórzony NIE wysyła drugiego powiadomienia",
        len(_admin_emails_sent) == 1,
        str(_admin_emails_sent),
    )

    fake["client_reference_id"] = "1"
    r = client.post("/api/checkout/session", json={"course_slug": "matematyka-rozszerzona", **STUDENT})
    check("ponowny zakup posiadanego kursu -> 409", r.status_code == 409, r.text)

    # --- 5. Nieznany kurs ---------------------------------------------
    r = client.post("/api/checkout/session", json={"course_slug": "nie-ma-takiego", **STUDENT})
    check("nieznany slug kursu -> 404", r.status_code == 404)

    # --- 5b. Panel administracyjny -------------------------------------
    # (na tym samym `client`/silniku bazy, żeby admin widział zamówienia buy@test.pl)
    r_forbidden = client.get("/api/admin/orders")
    check("nie-admin -> 403 na /api/admin/orders", r_forbidden.status_code == 403, r_forbidden.text)

    _register(client, "admin@example.pl")  # przelogowanie tego samego klienta na konto admina
    r_admin = client.get("/api/admin/orders")
    check("admin -> 200 na /api/admin/orders", r_admin.status_code == 200, r_admin.text)
    admin_orders = r_admin.json() if r_admin.status_code == 200 else []
    check(
        "admin widzi zamówienia innego konta (buy@test.pl)",
        any(o["account_email"] == "buy@test.pl" for o in admin_orders),
        str([o.get("account_email") for o in admin_orders]),
    )
    check(
        "admin widzi pełne dane kursanta i termin w zamówieniu",
        any(
            o["student_name"] == "Jan" and o["preferred_schedule"] == "wtorek-17-19"
            for o in admin_orders
        ),
        str(admin_orders),
    )

    # --- 6. confirm (ścieżka strony sukcesu) --------------------------
    _install_stripe_stub(session_id="cs_test_confirm")
    fresh = _make_client()
    _register(fresh, "confirm@test.pl")
    _install_stripe_stub(session_id="cs_test_confirm")
    r = fresh.post("/api/checkout/session", json={"course_slug": "matematyka-podstawowa", **STUDENT})
    check("confirm: utworzenie sesji", r.status_code == 200, r.text)
    # symulujemy powrót ze Stripe z opłaconą sesją
    stripe.checkout.Session.retrieve = staticmethod(  # type: ignore[assignment]
        lambda sid, **kw: _FakeCheckoutSession(
            id="cs_test_confirm", client_reference_id="1",
            payment_status="paid", status="complete", payment_intent="pi_c",
        )
    )
    r = fresh.post("/api/checkout/confirm", json={"session_id": "cs_test_confirm"})
    check("confirm -> status paid", r.status_code == 200 and r.json()["status"] == "paid", r.text)
    check("confirm: kurs trafia do me/courses", len(fresh.get("/api/me/courses").json()) == 1)

    # --- 7. TYMCZASOWE: rezerwacja terminu bez płatności (/api/enrollments) -
    settings.stripe_secret_key = ""  # działa nawet bez skonfigurowanego Stripe
    _admin_emails_sent.clear()
    client7 = _make_client()
    _register(client7, "rezerwacja@test.pl")

    r = client7.post(
        "/api/enrollments",
        json={"course_slug": "matematyka-rozszerzona", **STUDENT, "preferred_schedule": "sroda-17-19"},
    )
    check("środa nie jest już dostępnym terminem -> 422", r.status_code == 422, r.text)

    r = client7.post("/api/enrollments", json={"course_slug": "matematyka-rozszerzona", **STUDENT})
    check("rezerwacja bez Stripe -> 201", r.status_code == 201, r.text)
    body = r.json()
    check(
        "rezerwacja: status pending, bez checkout_url",
        body.get("status") == "pending" and "checkout_url" not in body,
        str(body),
    )
    check("rezerwacja: nie pojawia się w me/courses (nieopłacona)", client7.get("/api/me/courses").json() == [])
    orders7 = client7.get("/api/me/orders").json()
    check(
        "rezerwacja: widoczna w me/orders",
        len(orders7) == 1 and orders7[0]["preferred_schedule"] == "wtorek-17-19",
        str(orders7),
    )
    check(
        "rezerwacja: powiadomienie do adminów wysłane od razu (bez webhooka)",
        len(_admin_emails_sent) == 1 and "Nowa rezerwacja" in _admin_emails_sent[0]["subject"],
        str(_admin_emails_sent),
    )

    r_dup = client7.post("/api/enrollments", json={"course_slug": "matematyka-rozszerzona", **STUDENT})
    check("ponowna rezerwacja tego samego kursu -> 409", r_dup.status_code == 409, r_dup.text)

    app.dependency_overrides.clear()

    print()
    if failures:
        print(f"{len(failures)} NIEPOWODZEŃ: {', '.join(failures)}")
        sys.exit(1)
    print("Wszystkie testy płatności OK")


if __name__ == "__main__":
    run()
