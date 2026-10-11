"""Tabele bazy danych."""

from __future__ import annotations

from datetime import datetime

from sqlmodel import Field, SQLModel

from .security import utcnow


class User(SQLModel, table=True):
    """Konto użytkownika."""

    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    name: str
    last_name: str
    # Hash hasła (argon2). Konta założone przez Google mają tu losowy,
    # nieznany nikomu hash (nigdy nie logują się hasłem — patrz auth.py).
    password_hash: str
    created_at: datetime = Field(default_factory=utcnow)

    # Ślad zgody na regulamin/politykę prywatności przy rejestracji.
    # `None` u kont założonych przed wprowadzeniem tego pola (patrz legal.py).
    accepted_terms_version: str | None = None
    accepted_terms_at: datetime | None = None

    # Stabilny identyfikator konta Google ("sub" z tokenu) — ustawiony tylko
    # u kont, które kiedykolwiek zalogowały się przez Google. `None` u kont
    # założonych samym hasłem, które nigdy tego nie zrobiły.
    google_sub: str | None = Field(default=None, unique=True, index=True)


class AuthSession(SQLModel, table=True):
    """
    Aktywna sesja logowania.

    W ciasteczku u użytkownika ląduje losowy token. W bazie trzymamy tylko jego
    hash (SHA-256), więc wyciek bazy nie pozwala odtworzyć działających ciasteczek.
    """

    id: int | None = Field(default=None, primary_key=True)
    token_hash: str = Field(unique=True, index=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    created_at: datetime = Field(default_factory=utcnow)
    expires_at: datetime


class LoginChallenge(SQLModel, table=True):
    """
    Wyzwanie logowania dwuetapowego (kod wysłany e-mailem).

    Powstaje po poprawnym haśle (login) albo od razu po rejestracji (register).
    Dopiero podanie poprawnego kodu w /api/auth/login/verify zakłada sesję —
    do tego momentu użytkownik NIE jest zalogowany (brak ciasteczka).
    """

    # Opaque token widoczny dla frontu — nie jest tajemnicą samą w sobie
    # (bez poprawnego kodu i tak nic nie da się nim zrobić).
    id: str = Field(primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    # Hash kodu (SHA-256) — sam kod nigdy nie trafia do bazy.
    code_hash: str
    # "login" albo "register" — tylko do doboru treści maila.
    purpose: str
    attempts: int = Field(default=0)
    created_at: datetime = Field(default_factory=utcnow)
    expires_at: datetime
    consumed_at: datetime | None = None


# Statusy zamówienia:
#   pending  — utworzone, czekamy na płatność
#   paid     — opłacone (użytkownik ma dostęp do kursu)
#   failed   — płatność odrzucona
#   expired  — sesja płatności wygasła bez zapłaty
ORDER_STATUSES = ("pending", "paid", "failed", "expired")


class Order(SQLModel, table=True):
    """Zamówienie kursu opłacane jednorazowo przez Stripe Checkout."""

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    course_slug: str = Field(index=True)
    course_title: str
    amount_grosze: int
    currency: str = "pln"
    status: str = Field(default="pending", index=True)

    # Dane kursanta — zbierane na formularzu zapisu przed przekierowaniem do
    # płatności. Mogą różnić się od danych konta (np. rodzic zakłada konto
    # i zapisuje dziecko).
    student_name: str
    student_last_name: str
    student_email: str
    student_phone: str
    student_street: str
    student_building_number: str
    student_apartment_number: str | None = None
    student_postal_code: str
    student_city: str

    # Wybrany termin zajęć, np. "wtorek-17-19" — patrz SCHEDULE_SLOTS w schemas.py.
    preferred_schedule: str

    # Jeśli kursant jest niepełnoletni, wymagane są też pełne dane opiekuna,
    # łącznie z adresem (bo to on jest stroną umowy).
    is_minor: bool = False
    guardian_name: str | None = None
    guardian_last_name: str | None = None
    guardian_phone: str | None = None
    guardian_email: str | None = None
    guardian_street: str | None = None
    guardian_building_number: str | None = None
    guardian_apartment_number: str | None = None
    guardian_postal_code: str | None = None
    guardian_city: str | None = None

    stripe_checkout_session_id: str = Field(unique=True, index=True)
    stripe_payment_intent_id: str | None = None

    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)
    paid_at: datetime | None = None
