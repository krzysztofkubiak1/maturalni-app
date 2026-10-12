"""
Płatności jednorazowe przez Stripe Checkout + (tymczasowo) same rezerwacje.

Przepływ płatności (Stripe):
  1. Zalogowany użytkownik klika "Kup dostęp" → front woła POST /api/checkout/session
  2. Backend tworzy sesję Stripe Checkout + lokalne zamówienie (status "pending")
     i zwraca adres, na który front przekierowuje użytkownika
  3. Użytkownik płaci na stronie Stripe i wraca na /panel/platnosc/sukces
  4. Zamówienie zostaje oznaczone jako "paid" przez:
       - webhook  POST /api/webhooks/stripe   (źródło prawdy, także na produkcji)
       - ORAZ awaryjnie POST /api/checkout/confirm wołane przez stronę sukcesu
         (żeby flow działał lokalnie nawet bez skonfigurowanego webhooka)
  5. Opłacony kurs pojawia się w GET /api/me/courses (sekcja "Twoje kursy" w panelu)

TYMCZASOWO front nie woła /api/checkout/session, tylko POST /api/enrollments —
zapisuje dane i termin bez przekierowania do płatności (patrz create_enrollment
niżej). Kod płatności Stripe zostaje w całości — wystarczy zmienić, który
endpoint woła EnrollmentForm.tsx, żeby wrócić do pełnego flow z płatnością.

Trasy:
  POST /api/enrollments        — TYMCZASOWE: zapisz dane + termin, bez płatności (auth)
  POST /api/checkout/session   — utwórz płatność (auth)
  POST /api/checkout/confirm   — sprawdź status sesji w Stripe i domknij (auth)
  POST /api/webhooks/stripe    — webhook Stripe (bez auth, podpis weryfikowany)
  GET  /api/me/courses         — kursy, do których użytkownik ma dostęp (auth)
  GET  /api/me/orders          — historia zamówień użytkownika (auth)
  GET  /api/admin/orders       — WSZYSTKIE zamówienia (tylko ADMIN_EMAILS z .env)

Gdy zamówienie zmienia status na "paid" (webhook albo /confirm), e-mail z pełnymi
danymi zapisu leci do wszystkich adresów z ADMIN_EMAILS — patrz _notify_admins_order_paid.
Nowa rezerwacja (/api/enrollments) powiadamia admina od razu, bo bez płatności
zamówienie nigdy samo nie zmieni statusu na "paid" — patrz _notify_admins_new_reservation.
"""

from __future__ import annotations

import logging
from uuid import uuid4

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlmodel import Session, select

from .auth import get_current_user
from .catalog import get_item
from .config import settings
from .database import get_session
from .email import send_email
from .models import Order, User
from .schemas import (
    AdminOrderOut,
    CheckoutIn,
    CheckoutOut,
    ConfirmIn,
    MessageOut,
    OrderOut,
    PurchasedCourseOut,
    SCHEDULE_SLOTS,
)
from .security import utcnow

logger = logging.getLogger("app.payments")

router = APIRouter(tags=["payments"])


# --------------------------------------------------------------------------- #
#  Pomocnicze                                                                  #
# --------------------------------------------------------------------------- #

def require_payments() -> None:
    """Zależność: przerywa z 503, jeśli Stripe nie jest skonfigurowany."""
    if not settings.payments_enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Płatności nie są skonfigurowane. Ustaw STRIPE_SECRET_KEY "
                "w backend/.env (patrz backend/README.md)."
            ),
        )
    stripe.api_key = settings.stripe_secret_key


def _format_address(
    street: str | None,
    building_number: str | None,
    apartment_number: str | None,
    postal_code: str | None,
    city: str | None,
) -> str:
    if not street:
        return "—"
    number = building_number or ""
    if apartment_number:
        number += f"/{apartment_number}"
    return f"{street} {number}, {postal_code} {city}".strip()


def _notify_admins_order_paid(order: Order) -> None:
    """Wyślij e-mail do ADMIN_EMAILS z pełnymi danymi opłaconego zapisu."""
    if not settings.admin_email_list:
        return

    schedule_label = SCHEDULE_SLOTS.get(order.preferred_schedule, order.preferred_schedule)
    amount_pln = order.amount_grosze / 100

    lines = [
        f"Nowy opłacony zapis: {order.course_title}",
        "",
        f"Kwota: {amount_pln:.2f} {order.currency.upper()}",
        f"Termin zajęć: {schedule_label}",
        "",
        "Dane kursanta:",
        f"  Imię i nazwisko: {order.student_name} {order.student_last_name}",
        f"  E-mail: {order.student_email}",
        f"  Telefon: {order.student_phone}",
        "  Adres: "
        + _format_address(
            order.student_street,
            order.student_building_number,
            order.student_apartment_number,
            order.student_postal_code,
            order.student_city,
        ),
    ]

    if order.is_minor:
        lines += [
            "",
            "Kursant jest niepełnoletni — dane rodzica / opiekuna prawnego:",
            f"  Imię i nazwisko: {order.guardian_name} {order.guardian_last_name}",
            f"  E-mail: {order.guardian_email}",
            f"  Telefon: {order.guardian_phone}",
            "  Adres: "
            + _format_address(
                order.guardian_street,
                order.guardian_building_number,
                order.guardian_apartment_number,
                order.guardian_postal_code,
                order.guardian_city,
            ),
        ]

    lines += ["", f"Numer zamówienia: {order.id}"]

    try:
        send_email(
            settings.admin_email_list,
            f"Nowy zapis: {order.course_title} ({schedule_label})",
            "\n".join(lines),
        )
    except RuntimeError:
        # Wysyłka do admina nie może wywrócić potwierdzenia płatności klientowi —
        # błąd trafia do logów (send_email już go loguje), tu tylko go połykamy.
        pass


def _mark_order_paid(db: Session, order: Order, payment_intent_id: str | None) -> None:
    """Oznacz zamówienie jako opłacone. Bezpieczne do wielokrotnego wywołania."""
    if order.status == "paid":
        return
    order.status = "paid"
    order.paid_at = utcnow()
    order.updated_at = utcnow()
    if payment_intent_id:
        order.stripe_payment_intent_id = payment_intent_id
    db.add(order)
    db.commit()
    _notify_admins_order_paid(order)


def _set_order_status(db: Session, order: Order, new_status: str) -> None:
    if order.status == "paid":
        return  # opłaconego już nie cofamy
    order.status = new_status
    order.updated_at = utcnow()
    db.add(order)
    db.commit()


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Zależność: przerywa z 403, jeśli zalogowany e-mail nie jest na liście ADMIN_EMAILS."""
    if current_user.email.lower() not in settings.admin_email_list:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nie masz dostępu do panelu administracyjnego.",
        )
    return current_user


def _user_has_course(db: Session, user_id: int, course_slug: str) -> bool:
    existing = db.exec(
        select(Order).where(
            Order.user_id == user_id,
            Order.course_slug == course_slug,
            Order.status == "paid",
        )
    ).first()
    return existing is not None


def _user_has_active_order(db: Session, user_id: int, course_slug: str) -> bool:
    """True, jeśli użytkownik ma już zamówienie na ten kurs w toku (pending) albo opłacone."""
    existing = db.exec(
        select(Order).where(
            Order.user_id == user_id,
            Order.course_slug == course_slug,
            Order.status.in_(("pending", "paid")),  # type: ignore[union-attr]
        )
    ).first()
    return existing is not None


def _notify_admins_new_reservation(order: Order) -> None:
    """
    Wyślij e-mail do ADMIN_EMAILS o nowej rezerwacji terminu (bez płatności).

    TYMCZASOWE: odpowiednik _notify_admins_order_paid dla /api/enrollments.
    Bez tego admin nie dowiedziałby się o zapisie — zamówienie zostaje
    w statusie "pending" i nic (żaden webhook) nie zmieni go na "paid" samo z siebie.
    """
    if not settings.admin_email_list:
        return

    schedule_label = SCHEDULE_SLOTS.get(order.preferred_schedule, order.preferred_schedule)
    amount_pln = order.amount_grosze / 100

    lines = [
        f"Nowa rezerwacja terminu (BEZ płatności): {order.course_title}",
        "",
        f"Cena kursu: {amount_pln:.2f} {order.currency.upper()}",
        f"Termin zajęć: {schedule_label}",
        "",
        "Dane kursanta:",
        f"  Imię i nazwisko: {order.student_name} {order.student_last_name}",
        f"  E-mail: {order.student_email}",
        f"  Telefon: {order.student_phone}",
        "  Adres: "
        + _format_address(
            order.student_street,
            order.student_building_number,
            order.student_apartment_number,
            order.student_postal_code,
            order.student_city,
        ),
    ]

    if order.is_minor:
        lines += [
            "",
            "Kursant jest niepełnoletni — dane rodzica / opiekuna prawnego:",
            f"  Imię i nazwisko: {order.guardian_name} {order.guardian_last_name}",
            f"  E-mail: {order.guardian_email}",
            f"  Telefon: {order.guardian_phone}",
            "  Adres: "
            + _format_address(
                order.guardian_street,
                order.guardian_building_number,
                order.guardian_apartment_number,
                order.guardian_postal_code,
                order.guardian_city,
            ),
        ]

    lines += [
        "",
        f"Numer zamówienia: {order.id}",
        "Skontaktuj się z kursantem/opiekunem w sprawie płatności — rezerwacja jeszcze nie jest opłacona.",
    ]

    try:
        send_email(
            settings.admin_email_list,
            f"Nowa rezerwacja: {order.course_title} ({schedule_label})",
            "\n".join(lines),
        )
    except RuntimeError:
        pass


# --------------------------------------------------------------------------- #
#  TYMCZASOWE: rezerwacja terminu bez płatności                               #
# --------------------------------------------------------------------------- #

@router.post(
    "/api/enrollments",
    response_model=OrderOut,
    status_code=status.HTTP_201_CREATED,
)
def create_enrollment(
    data: CheckoutIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
) -> Order:
    """
    TYMCZASOWE zastępstwo dla create_checkout_session: zapisuje zgłoszenie
    i wybrany termin, BEZ przekierowania do Stripe. Nie wymaga skonfigurowanego
    Stripe (brak Depends(require_payments)) — działa nawet bez STRIPE_SECRET_KEY.
    """
    item = get_item(data.course_slug)
    if item is None:
        raise HTTPException(status_code=404, detail="Nie znaleziono takiego kursu.")

    if _user_has_active_order(db, current_user.id, item.slug):  # type: ignore[arg-type]
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ten kurs jest już zarezerwowany albo opłacony na tym koncie.",
        )

    order = Order(
        user_id=current_user.id,  # type: ignore[arg-type]
        course_slug=item.slug,
        course_title=item.title,
        amount_grosze=item.price_grosze,
        currency=settings.currency,
        status="pending",
        student_name=data.student_name.strip(),
        student_last_name=data.student_last_name.strip(),
        student_email=data.student_email.strip(),
        student_phone=data.student_phone.strip(),
        student_street=data.student_street.strip(),
        student_building_number=data.student_building_number.strip(),
        student_apartment_number=(
            data.student_apartment_number.strip() if data.student_apartment_number else None
        ),
        student_postal_code=data.student_postal_code.strip(),
        student_city=data.student_city.strip(),
        preferred_schedule=data.preferred_schedule,
        is_minor=data.is_minor,
        guardian_name=data.guardian_name.strip() if data.guardian_name else None,
        guardian_last_name=data.guardian_last_name.strip() if data.guardian_last_name else None,
        guardian_phone=data.guardian_phone.strip() if data.guardian_phone else None,
        guardian_email=data.guardian_email.strip() if data.guardian_email else None,
        guardian_street=data.guardian_street.strip() if data.guardian_street else None,
        guardian_building_number=(
            data.guardian_building_number.strip() if data.guardian_building_number else None
        ),
        guardian_apartment_number=(
            data.guardian_apartment_number.strip() if data.guardian_apartment_number else None
        ),
        guardian_postal_code=data.guardian_postal_code.strip() if data.guardian_postal_code else None,
        guardian_city=data.guardian_city.strip() if data.guardian_city else None,
        # Nie ma sesji Stripe do powiązania — unikalny placeholder spełnia
        # ograniczenie unique na tej kolumnie (patrz models.py).
        stripe_checkout_session_id=f"reservation-{uuid4().hex}",
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    _notify_admins_new_reservation(order)

    return order


# --------------------------------------------------------------------------- #
#  Tworzenie płatności                                                         #
# --------------------------------------------------------------------------- #

@router.post(
    "/api/checkout/session",
    response_model=CheckoutOut,
    dependencies=[Depends(require_payments)],
)
def create_checkout_session(
    data: CheckoutIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
) -> CheckoutOut:
    item = get_item(data.course_slug)
    if item is None:
        raise HTTPException(status_code=404, detail="Nie znaleziono takiego kursu.")

    if _user_has_course(db, current_user.id, item.slug):  # type: ignore[arg-type]
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Masz już dostęp do tego kursu.",
        )

    success_url = (
        f"{settings.public_base_url}/panel/platnosc/sukces"
        "?session_id={CHECKOUT_SESSION_ID}"
    )
    cancel_url = f"{settings.public_base_url}/panel/platnosc/anulowano"

    session_kwargs: dict = {
        "mode": "payment",
        "success_url": success_url,
        "cancel_url": cancel_url,
        "customer_email": current_user.email,
        "client_reference_id": str(current_user.id),
        "metadata": {
            "user_id": str(current_user.id),
            "course_slug": item.slug,
            "student_name": data.student_name,
            "student_last_name": data.student_last_name,
            "is_minor": str(data.is_minor),
            "preferred_schedule": data.preferred_schedule,
        },
        "line_items": [
            {
                "quantity": 1,
                "price_data": {
                    "currency": settings.currency,
                    "unit_amount": item.price_grosze,
                    "product_data": {
                        "name": item.title
                        + (" — pierwszy miesiąc" if item.recurring else ""),
                    },
                },
            }
        ],
    }
    if settings.stripe_payment_method_list:
        # Wpisano konkretną listę w STRIPE_PAYMENT_METHODS — zawężamy do niej.
        session_kwargs["payment_method_types"] = settings.stripe_payment_method_list
    # Gdy pusto: NIE ustawiamy payment_method_types w ogóle, więc Stripe samo
    # pokazuje wszystko, co masz włączone w panelu (karta + Apple Pay/Google Pay
    # na kartach automatycznie, plus BLIK/Przelewy24/inne, jeśli je włączysz).

    try:
        checkout_session = stripe.checkout.Session.create(**session_kwargs)
    except stripe.StripeError as exc:  # pragma: no cover - zależne od API Stripe
        # exc.user_message to tekst, który Stripe samo pisze z myślą o pokazaniu
        # klientowi (np. "Twoja karta została odrzucona") — bezpieczny do wyświetlenia.
        # str(exc) bywa surowym, technicznym komunikatem (ID żądania, szczegóły API) —
        # tego nigdy nie pokazujemy, tylko logujemy.
        logger.warning("Stripe odrzucił utworzenie sesji checkout: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=exc.user_message or "Płatność się nie powiodła. Spróbuj ponownie za chwilę.",
        ) from exc

    order = Order(
        user_id=current_user.id,  # type: ignore[arg-type]
        course_slug=item.slug,
        course_title=item.title,
        amount_grosze=item.price_grosze,
        currency=settings.currency,
        status="pending",
        student_name=data.student_name.strip(),
        student_last_name=data.student_last_name.strip(),
        student_email=data.student_email.strip(),
        student_phone=data.student_phone.strip(),
        student_street=data.student_street.strip(),
        student_building_number=data.student_building_number.strip(),
        student_apartment_number=(
            data.student_apartment_number.strip() if data.student_apartment_number else None
        ),
        student_postal_code=data.student_postal_code.strip(),
        student_city=data.student_city.strip(),
        preferred_schedule=data.preferred_schedule,
        is_minor=data.is_minor,
        guardian_name=data.guardian_name.strip() if data.guardian_name else None,
        guardian_last_name=data.guardian_last_name.strip() if data.guardian_last_name else None,
        guardian_phone=data.guardian_phone.strip() if data.guardian_phone else None,
        guardian_email=data.guardian_email.strip() if data.guardian_email else None,
        guardian_street=data.guardian_street.strip() if data.guardian_street else None,
        guardian_building_number=(
            data.guardian_building_number.strip() if data.guardian_building_number else None
        ),
        guardian_apartment_number=(
            data.guardian_apartment_number.strip() if data.guardian_apartment_number else None
        ),
        guardian_postal_code=data.guardian_postal_code.strip() if data.guardian_postal_code else None,
        guardian_city=data.guardian_city.strip() if data.guardian_city else None,
        stripe_checkout_session_id=checkout_session.id,
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    return CheckoutOut(checkout_url=checkout_session.url, order_id=order.id)  # type: ignore[arg-type]


# --------------------------------------------------------------------------- #
#  Domknięcie po powrocie ze Stripe (awaryjnie, gdy brak webhooka)             #
# --------------------------------------------------------------------------- #

@router.post(
    "/api/checkout/confirm",
    response_model=OrderOut,
    dependencies=[Depends(require_payments)],
)
def confirm_checkout(
    data: ConfirmIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
) -> Order:
    order = db.exec(
        select(Order).where(Order.stripe_checkout_session_id == data.session_id)
    ).first()
    if order is None or order.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Nie znaleziono zamówienia.")

    try:
        checkout_session = stripe.checkout.Session.retrieve(data.session_id)
    except stripe.StripeError as exc:  # pragma: no cover
        logger.warning("Stripe odrzucił sprawdzenie sesji checkout: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=exc.user_message or "Nie udało się sprawdzić płatności. Spróbuj ponownie za chwilę.",
        ) from exc

    if str(checkout_session.get("client_reference_id")) != str(current_user.id):
        raise HTTPException(status_code=403, detail="To nie jest Twoja płatność.")

    payment_status = checkout_session.get("payment_status")
    payment_intent = checkout_session.get("payment_intent")

    if payment_status == "paid":
        _mark_order_paid(db, order, payment_intent if isinstance(payment_intent, str) else None)
    elif payment_status == "unpaid" and checkout_session.get("status") == "expired":
        _set_order_status(db, order, "expired")
    # payment_status == "no_payment_required" nie występuje w mode="payment"

    db.refresh(order)
    return order


# --------------------------------------------------------------------------- #
#  Webhook Stripe                                                              #
# --------------------------------------------------------------------------- #

@router.post("/api/webhooks/stripe", include_in_schema=False)
async def stripe_webhook(request: Request, db: Session = Depends(get_session)) -> dict:
    if not settings.payments_enabled:
        raise HTTPException(status_code=503, detail="Płatności wyłączone.")

    payload = await request.body()
    signature = request.headers.get("stripe-signature", "")

    if not settings.stripe_webhook_secret:
        raise HTTPException(
            status_code=400,
            detail="Brak STRIPE_WEBHOOK_SECRET — nie mogę zweryfikować webhooka.",
        )

    try:
        event = stripe.Webhook.construct_event(
            payload, signature, settings.stripe_webhook_secret
        )
    except (ValueError, stripe.SignatureVerificationError) as exc:
        raise HTTPException(status_code=400, detail="Nieprawidłowy podpis webhooka.") from exc

    event_type = event["type"]
    obj = event["data"]["object"]

    if event_type in ("checkout.session.completed", "checkout.session.async_payment_succeeded"):
        _handle_checkout_event(db, obj, paid=obj.get("payment_status") == "paid")
    elif event_type == "checkout.session.async_payment_failed":
        _handle_checkout_event(db, obj, failed=True)
    elif event_type == "checkout.session.expired":
        _handle_checkout_event(db, obj, expired=True)

    return {"received": True}


def _handle_checkout_event(
    db: Session,
    checkout_session: dict,
    *,
    paid: bool = False,
    failed: bool = False,
    expired: bool = False,
) -> None:
    session_id = checkout_session.get("id")
    if not session_id:
        return
    order = db.exec(
        select(Order).where(Order.stripe_checkout_session_id == session_id)
    ).first()
    if order is None:
        return

    if paid:
        payment_intent = checkout_session.get("payment_intent")
        _mark_order_paid(
            db, order, payment_intent if isinstance(payment_intent, str) else None
        )
    elif failed:
        _set_order_status(db, order, "failed")
    elif expired:
        _set_order_status(db, order, "expired")


# --------------------------------------------------------------------------- #
#  Dostęp do kursów i historia zamówień                                        #
# --------------------------------------------------------------------------- #

@router.get("/api/me/courses", response_model=list[PurchasedCourseOut])
def my_courses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
) -> list[PurchasedCourseOut]:
    orders = db.exec(
        select(Order)
        .where(Order.user_id == current_user.id, Order.status == "paid")
        .order_by(Order.paid_at.desc())  # type: ignore[union-attr]
    ).all()

    seen: set[str] = set()
    result: list[PurchasedCourseOut] = []
    for order in orders:
        if order.course_slug in seen:
            continue
        seen.add(order.course_slug)
        result.append(
            PurchasedCourseOut(
                course_slug=order.course_slug,
                course_title=order.course_title,
                purchased_at=order.paid_at or order.created_at,
            )
        )
    return result


@router.get("/api/me/orders", response_model=list[OrderOut])
def my_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
) -> list[Order]:
    return list(
        db.exec(
            select(Order)
            .where(Order.user_id == current_user.id)
            .order_by(Order.created_at.desc())  # type: ignore[union-attr]
        ).all()
    )


@router.get("/api/payments/status", response_model=MessageOut)
def payments_status() -> MessageOut:
    return MessageOut(
        message="enabled" if settings.payments_enabled else "disabled"
    )


# --------------------------------------------------------------------------- #
#  Panel administracyjny — wszystkie zamówienia                                #
# --------------------------------------------------------------------------- #

@router.get(
    "/api/admin/orders",
    response_model=list[AdminOrderOut],
    dependencies=[Depends(require_admin)],
)
def admin_list_orders(db: Session = Depends(get_session)) -> list[AdminOrderOut]:
    orders = db.exec(select(Order).order_by(Order.created_at.desc())).all()  # type: ignore[union-attr]

    result: list[AdminOrderOut] = []
    for order in orders:
        account = db.get(User, order.user_id)
        base = OrderOut.model_validate(order)
        result.append(
            AdminOrderOut(
                **base.model_dump(),
                user_id=order.user_id,
                account_email=account.email if account else "—",
            )
        )
    return result
