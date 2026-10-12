"""
Wysyłka e-maili (kody logowania).

Bez klucza RESEND_API_KEY e-maile NIE są faktycznie wysyłane — treść (razem
z kodem) ląduje w logach serwera i w konsoli. Dzięki temu cały przepływ
logowania dwuetapowego da się przetestować lokalnie bez zakładania konta
u żadnego dostawcy poczty. Realną wysyłkę włącza się, ustawiając
RESEND_API_KEY w backend/.env (patrz backend/README.md).

Celowo bez zależności od pakietu `resend` — wywołanie API robimy przez
`urllib` z biblioteki standardowej, żeby tryb deweloperski działał od razu,
bez instalowania czegokolwiek dodatkowego.
"""

from __future__ import annotations

import json
import logging
import urllib.error
import urllib.request

from .config import settings

logger = logging.getLogger("app.email")


def send_email(to: str | list[str], subject: str, text: str) -> None:
    recipients = [to] if isinstance(to, str) else list(to)
    if not recipients:
        return

    if not settings.email_enabled:
        logger.info("E-mail (tryb deweloperski, NIE wysłano) -> %s | %s", recipients, subject)
        print(
            f"\n--- E-MAIL (tryb deweloperski, nie wysłano) ---\n"
            f"Do: {', '.join(recipients)}\nTemat: {subject}\n\n{text}\n"
            f"------------------------------------------------\n"
        )
        return

    payload = json.dumps(
        {
            "from": settings.resend_from_email,
            "to": recipients,
            "subject": subject,
            "text": text,
        }
    ).encode("utf-8")

    request = urllib.request.Request(
        "https://api.resend.com/emails",
        data=payload,
        method="POST",
        headers={
            "Authorization": f"Bearer {settings.resend_api_key}",
            "Content-Type": "application/json",
            # Bez tego: domyślny User-Agent urllib ("Python-urllib/3.x") trafia
            # na Cloudflare przed API Resend i dostaje 403 (error code: 1010 —
            # "banned based on your browser's signature"), zanim żądanie
            # w ogóle dotrze do Resend. Wygląda jak błąd Resend, a to Cloudflare.
            "User-Agent": "maturalia-backend/1.0 (+https://resend.com)",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            response.read()
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        logger.error("Resend zwrócił błąd %s: %s", exc.code, body)
        raise RuntimeError(f"Wysyłka e-maila nie powiodła się ({exc.code}).") from exc
    except urllib.error.URLError as exc:
        logger.error("Nie udało się połączyć z Resend: %s", exc)
        raise RuntimeError("Wysyłka e-maila nie powiodła się (brak połączenia).") from exc


def send_login_code(to: str, name: str, code: str) -> None:
    """Kod potwierdzający rejestrację — jedyny przypadek, w którym go wysyłamy."""
    subject = f"Potwierdź adres e-mail — {settings.site_name}"
    intro = f"Cześć {name}, dziękujemy za rejestrację!"

    text = (
        f"{intro}\n\n"
        f"Twój kod: {code}\n\n"
        f"Kod jest ważny przez {settings.otp_ttl_minutes} minut.\n"
        "Jeśli to nie Ty próbowałeś/aś się zalogować, po prostu zignoruj tę wiadomość."
    )
    send_email(to, subject, text)
