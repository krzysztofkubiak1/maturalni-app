"""Kształt danych wchodzących i wychodzących przez API (walidacja Pydantic)."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator


def _validate_phone(value: str) -> str:
    digits = "".join(ch for ch in value if ch.isdigit())
    if not (9 <= len(digits) <= 15):
        raise ValueError("Podaj poprawny numer telefonu.")
    return value.strip()


class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    last_name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    # Bez domyślnej wartości: brak pola w żądaniu -> 422 "missing" zamiast
    # cichego przejścia walidatora (field_validator nie sprawdza defaultów).
    accept_terms: bool

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if not any(ch.isalpha() for ch in value):
            raise ValueError("Hasło musi zawierać co najmniej jedną literę.")
        if not any(ch.isdigit() for ch in value):
            raise ValueError("Hasło musi zawierać co najmniej jedną cyfrę.")
        return value

    @field_validator("accept_terms")
    @classmethod
    def validate_accept_terms(cls, value: bool) -> bool:
        if not value:
            raise ValueError(
                "Musisz zaakceptować regulamin i politykę prywatności, żeby założyć konto."
            )
        return value


class ContactIn(BaseModel):
    """Zgłoszenie z ogólnego formularza kontaktowego (gość, bez logowania)."""

    name: str = Field(min_length=2, max_length=80)
    phone: str
    email: EmailStr | None = None
    course_slug: str | None = Field(default=None, max_length=120)
    course_title: str | None = Field(default=None, max_length=200)
    message: str | None = Field(default=None, max_length=2000)
    consent: bool
    # Pole-pułapka na boty — u nas zawsze powinno być puste. Walidacja zgody
    # i reszty i tak dzieje się tu niezależnie od tego, co sprawdził już front
    # (Server Action) — ten endpoint jest dostępny bezpośrednio pod /api/contact.
    company: str | None = None

    @field_validator("phone")
    @classmethod
    def validate_phone_field(cls, value: str) -> str:
        return _validate_phone(value)

    @field_validator("consent")
    @classmethod
    def validate_consent(cls, value: bool) -> bool:
        if not value:
            raise ValueError("Bez zgody na kontakt nie możemy do Ciebie oddzwonić.")
        return value


class ContactOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    phone: str
    email: str | None
    course_slug: str | None
    course_title: str | None
    message: str | None
    created_at: datetime


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserOut(BaseModel):
    id: int
    name: str
    last_name: str
    email: EmailStr
    created_at: datetime
    accepted_terms_version: str | None = None
    accepted_terms_at: datetime | None = None


class MessageOut(BaseModel):
    message: str


# --- Logowanie dwuetapowe ----------------------------------------------------

class ChallengeOut(BaseModel):
    """Zwracane zamiast konta po register/login — trzeba jeszcze podać kod z e-maila."""

    challenge_id: str
    # Zamaskowany adres, np. "j***@example.pl" — żeby użytkownik wiedział, gdzie szukać kodu.
    destination_hint: str
    expires_in_seconds: int


class VerifyCodeIn(BaseModel):
    challenge_id: str = Field(min_length=1, max_length=64)
    code: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")


class ResendCodeIn(BaseModel):
    challenge_id: str = Field(min_length=1, max_length=64)


# --- Płatności --------------------------------------------------------------

# Dostępne terminy zajęć. Klucz jedzie w API, wartość to etykieta (np. do maili/panelu admina).
SCHEDULE_SLOTS: dict[str, str] = {
    "wtorek-17-19": "Wtorek, 17:00–19:00",
    "wtorek-19-21": "Wtorek, 19:00–21:00",
    "czwartek-17-19": "Czwartek, 17:00–19:00",
    "czwartek-19-21": "Czwartek, 19:00–21:00",
}


class CheckoutIn(BaseModel):
    course_slug: str = Field(min_length=1, max_length=120)

    # Formularz zapisu — dane kursanta. Mogą różnić się od danych konta
    # (np. rodzic ma konto i zapisuje dziecko).
    student_name: str = Field(min_length=2, max_length=80)
    student_last_name: str = Field(min_length=2, max_length=80)
    student_email: EmailStr
    # Bez min/max_length: długość sprawdza _validate_phone (po cyfrach, nie po
    # surowym stringu) — Field-owy limit sprawdzałby się PRZED field_validatorem
    # i rzucałby angielski komunikat Pydantic zamiast naszego polskiego.
    student_phone: str
    student_street: str = Field(min_length=2, max_length=160)
    student_building_number: str = Field(min_length=1, max_length=20)
    student_apartment_number: str | None = Field(default=None, max_length=20)
    student_postal_code: str = Field(pattern=r"^\d{2}-\d{3}$")
    student_city: str = Field(min_length=2, max_length=80)

    preferred_schedule: str

    # Jeśli kursant jest niepełnoletni, poniższe pola są wymagane (patrz walidator niżej),
    # łącznie z pełnym adresem opiekuna.
    is_minor: bool = False
    guardian_name: str | None = Field(default=None, max_length=80)
    guardian_last_name: str | None = Field(default=None, max_length=80)
    guardian_phone: str | None = None
    guardian_email: EmailStr | None = None
    guardian_street: str | None = Field(default=None, max_length=160)
    guardian_building_number: str | None = Field(default=None, max_length=20)
    guardian_apartment_number: str | None = Field(default=None, max_length=20)
    guardian_postal_code: str | None = Field(default=None, pattern=r"^\d{2}-\d{3}$")
    guardian_city: str | None = Field(default=None, max_length=80)

    @field_validator("preferred_schedule")
    @classmethod
    def validate_schedule(cls, value: str) -> str:
        if value not in SCHEDULE_SLOTS:
            raise ValueError("Wybierz jeden z dostępnych terminów zajęć.")
        return value

    @field_validator("student_phone")
    @classmethod
    def validate_student_phone(cls, value: str) -> str:
        return _validate_phone(value)

    @field_validator("guardian_phone")
    @classmethod
    def validate_guardian_phone(cls, value: str | None) -> str | None:
        return _validate_phone(value) if value else value

    @model_validator(mode="after")
    def require_guardian_when_minor(self) -> "CheckoutIn":
        if self.is_minor:
            # Pola tekstowe (imię, nazwisko, ulica, miasto) — sensowne minimum to 2 znaki.
            name_like = (
                ("guardian_name", self.guardian_name),
                ("guardian_last_name", self.guardian_last_name),
                ("guardian_street", self.guardian_street),
                ("guardian_city", self.guardian_city),
            )
            # Pola, które mogą być krótkie (np. numer domu "5", kod pocztowy) — liczy się sama obecność.
            presence_only = (
                ("guardian_phone", self.guardian_phone),
                ("guardian_email", self.guardian_email),
                ("guardian_building_number", self.guardian_building_number),
                ("guardian_postal_code", self.guardian_postal_code),
            )
            missing = [field for field, value in name_like if not value or len(value.strip()) < 2]
            missing += [
                field for field, value in presence_only if not value or not str(value).strip()
            ]
            if missing:
                raise ValueError(
                    "Kursant jest niepełnoletni — podaj pełne dane rodzica lub opiekuna "
                    "prawnego, łącznie z adresem."
                )
        return self


class CheckoutOut(BaseModel):
    checkout_url: str
    order_id: int


class ConfirmIn(BaseModel):
    session_id: str = Field(min_length=1, max_length=200)


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    course_slug: str
    course_title: str
    amount_grosze: int
    currency: str
    status: str
    student_name: str
    student_last_name: str
    student_email: str
    student_phone: str
    student_street: str
    student_building_number: str
    student_apartment_number: str | None
    student_postal_code: str
    student_city: str
    preferred_schedule: str
    is_minor: bool
    guardian_name: str | None
    guardian_last_name: str | None
    guardian_phone: str | None
    guardian_email: str | None
    guardian_street: str | None
    guardian_building_number: str | None
    guardian_apartment_number: str | None
    guardian_postal_code: str | None
    guardian_city: str | None
    created_at: datetime
    paid_at: datetime | None


class AdminOrderOut(OrderOut):
    """To samo co OrderOut, plus informacja, które konto złożyło zamówienie."""

    user_id: int
    account_email: str


class PurchasedCourseOut(BaseModel):
    course_slug: str
    course_title: str
    purchased_at: datetime
