"""
Ogólny formularz kontaktowy ("Zamów rozmowę" / "Zapytaj o kurs").

Inaczej niż /api/enrollments — to formularz dla GOŚCI, bez logowania. Front
(Server Action w src/app/actions.ts) woła to po własnej walidacji, ale ten
endpoint jest i tak dostępny bezpośrednio pod /api/contact (przez rewrites
Next.js), więc waliduje w pełni sam — nie ufa frontowi.

Trasy:
  POST /api/contact — zapisz zgłoszenie, wyślij e-mail do ADMIN_EMAILS
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends
from sqlmodel import Session

from .config import settings
from .database import get_session
from .email import send_email
from .models import ContactMessage
from .schemas import ContactIn, ContactOut

logger = logging.getLogger("app.contact")

router = APIRouter(tags=["contact"])


def _notify_admins_new_contact(entry: ContactMessage) -> None:
    if not settings.admin_email_list:
        return

    lines = [
        "Nowe zgłoszenie z formularza kontaktowego.",
        "",
        f"Imię: {entry.name}",
        f"Telefon: {entry.phone}",
        f"E-mail: {entry.email or '—'}",
        f"Kurs: {entry.course_title or '—'}",
        "",
        "Wiadomość:",
        entry.message or "—",
        "",
        f"Numer zgłoszenia: {entry.id}",
    ]

    try:
        send_email(
            settings.admin_email_list,
            f"Nowe zgłoszenie kontaktowe — {entry.name}",
            "\n".join(lines),
        )
    except RuntimeError:
        # Jak w _notify_admins_new_reservation: błąd wysyłki do admina nie może
        # wywrócić potwierdzenia dla osoby, która wypełniła formularz.
        logger.warning("Nie udało się wysłać powiadomienia o zgłoszeniu kontaktowym.")


@router.post("/api/contact", response_model=ContactOut, status_code=201)
def create_contact(data: ContactIn, db: Session = Depends(get_session)) -> ContactMessage:
    # Pole-pułapka: jeśli wypełnione, to bot — udajemy sukces (zwracamy ten sam
    # kształt odpowiedzi), ale nic nie zapisujemy i nie wysyłamy.
    if data.company:
        return ContactMessage(
            id=0,
            name=data.name,
            phone=data.phone,
            email=data.email,
            course_slug=data.course_slug,
            course_title=data.course_title,
            message=data.message,
        )

    entry = ContactMessage(
        name=data.name.strip(),
        phone=data.phone.strip(),
        email=str(data.email).strip() if data.email else None,
        course_slug=data.course_slug or None,
        course_title=data.course_title or None,
        message=data.message.strip() if data.message else None,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    _notify_admins_new_contact(entry)

    return entry
