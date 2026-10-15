"""
Endpointy logowania oraz zależność `get_current_user`.

Kod e-mail (dwuetapowe potwierdzenie) obowiązuje TYLKO przy rejestracji —
weryfikuje, że konto zakłada właściciel danej skrzynki. Logowanie już
zarejestrowanym kontem jest jednoetapowe: samo hasło od razu zakłada sesję.

Przepływ rejestracji:
  1. POST /api/auth/register
     -> dane i hasło sprawdzone, konto założone, ale sesja JESZCZE się nie
        zaczyna. Backend generuje 6-cyfrowy kod, wysyła go e-mailem i zwraca
        ChallengeOut (challenge_id + zamaskowany adres, na który poszedł kod).
  2. POST /api/auth/login/verify {challenge_id, code}
     -> dopiero tu, po poprawnym kodzie, powstaje sesja i ciasteczko.
  3. POST /api/auth/login/resend {challenge_id}
     -> unieważnia nierozliczone wyzwania danego użytkownika i wysyła nowy kod.

Przepływ logowania:
  POST /api/auth/login {email, password}
     -> hasło sprawdzone, sesja i ciasteczko powstają od razu (200 + UserOut).

Reset hasła (ten sam mechanizm kodu e-mail, osobny "purpose"), trzy kroki:
  1. POST /api/auth/password/forgot {email}
     -> jeśli konto istnieje, wysyła 6-cyfrowy kod i zwraca ChallengeOut.
  2. POST /api/auth/password/verify-code {challenge_id, code}
     -> TYLKO potwierdza kod (zanim pokażemy pole na nowe hasło); kodu
        jeszcze NIE zużywa, hasło się jeszcze nie zmienia.
  3. POST /api/auth/password/reset {challenge_id, code, new_password}
     -> sprawdza kod jeszcze raz, ustawia nowe hasło, kasuje WSZYSTKIE inne
        sesje tego konta i od razu zaczyna nową (200 + UserOut).

Logowanie Google (OAuth 2.0, "Authorization Code"):
  GET /api/auth/google/login    -> przekierowanie do ekranu zgody Google
  GET /api/auth/google/callback -> Google wraca tu z kodem; wymieniamy go na
     profil (e-mail, sub), znajdujemy/tworzymy konto i zaczynamy sesję —
     dokładnie tak jak po kroku 2 rejestracji hasłem. Konto Google NIE
     przechodzi przez kod e-mail (Google już zweryfikował adres).

Trasy:
  POST /api/auth/register       — zakłada konto, wysyła kod potwierdzający
  POST /api/auth/login/verify   — sprawdza kod rejestracyjny, zaczyna sesję
  POST /api/auth/login/resend   — wysyła nowy kod dla tego samego wyzwania
  POST /api/auth/login          — sprawdza hasło, od razu zaczyna sesję
  POST /api/auth/password/forgot      — wysyła kod resetu hasła (jeśli konto istnieje)
  POST /api/auth/password/verify-code — tylko potwierdza kod, bez zmiany hasła
  POST /api/auth/password/reset       — sprawdza kod, ustawia nowe hasło, zaczyna sesję
  GET  /api/auth/google/login   — przekierowanie do logowania Google
  GET  /api/auth/google/callback — powrót z Google, zaczyna sesję
  POST /api/auth/logout         — wylogowanie (kasuje sesję i ciasteczko)
  GET  /api/auth/me             — dane zalogowanego użytkownika (401, jeśli niezalogowany)
"""

from __future__ import annotations

from datetime import timedelta
from urllib.parse import urlencode

import requests
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse
from sqlmodel import Session, select

from .config import settings
from .database import get_session
from .email import send_login_code, send_password_reset_code
from .legal import CURRENT_TERMS_VERSION
from .models import AuthSession, LoginChallenge, User
from .schemas import (
    ChallengeOut,
    ForgotPasswordIn,
    LoginIn,
    MessageOut,
    RegisterIn,
    ResendCodeIn,
    ResetPasswordIn,
    UserOut,
    VerifyCodeIn,
)
from .security import (
    generate_challenge_id,
    generate_otp_code,
    generate_session_token,
    hash_password,
    hash_token,
    utcnow,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


# --------------------------------------------------------------------------- #
#  Pomocnicze                                                                  #
# --------------------------------------------------------------------------- #

def _start_session(db: Session, user: User, response: Response) -> None:
    """Utwórz sesję w bazie i ustaw ciasteczko w odpowiedzi."""
    token = generate_session_token()
    auth_session = AuthSession(
        token_hash=hash_token(token),
        user_id=user.id,  # type: ignore[arg-type]
        expires_at=utcnow() + timedelta(hours=settings.session_ttl_hours),
    )
    db.add(auth_session)
    db.commit()

    response.set_cookie(
        key=settings.session_cookie_name,
        value=token,
        max_age=settings.session_ttl_hours * 3600,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        path="/",
    )


def _clear_session_cookie(response: Response) -> None:
    response.delete_cookie(key=settings.session_cookie_name, path="/")


def _mask_email(email: str) -> str:
    """np. "jan.kowalski@example.pl" -> "j***i@example.pl" """
    local, _, domain = email.partition("@")
    if len(local) <= 2:
        masked = local[0] + "*" * max(len(local) - 1, 1)
    else:
        masked = local[0] + "*" * (len(local) - 2) + local[-1]
    return f"{masked}@{domain}" if domain else masked


def _create_challenge(db: Session, user: User, purpose: str) -> tuple[LoginChallenge, str]:
    """Utwórz wyzwanie logowania i zwróć je razem z jawnym kodem (do wysyłki mailem)."""
    code = generate_otp_code()
    challenge = LoginChallenge(
        id=generate_challenge_id(),
        user_id=user.id,  # type: ignore[arg-type]
        code_hash=hash_token(code),
        purpose=purpose,
        expires_at=utcnow() + timedelta(minutes=settings.otp_ttl_minutes),
    )
    db.add(challenge)
    db.commit()
    db.refresh(challenge)
    return challenge, code


def _challenge_response(challenge: LoginChallenge, user: User) -> ChallengeOut:
    return ChallengeOut(
        challenge_id=challenge.id,
        destination_hint=_mask_email(user.email),
        expires_in_seconds=settings.otp_ttl_minutes * 60,
    )


def get_current_user(
    request: Request,
    db: Session = Depends(get_session),
) -> User:
    """Zależność: zwraca zalogowanego użytkownika albo podnosi 401."""
    token = request.cookies.get(settings.session_cookie_name)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nie jesteś zalogowany.",
        )

    auth_session = db.exec(
        select(AuthSession).where(AuthSession.token_hash == hash_token(token))
    ).first()

    if auth_session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sesja jest nieprawidłowa. Zaloguj się ponownie.",
        )

    if auth_session.expires_at < utcnow():
        db.delete(auth_session)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sesja wygasła. Zaloguj się ponownie.",
        )

    user = db.get(User, auth_session.user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Konto powiązane z sesją już nie istnieje.",
        )
    return user


# --------------------------------------------------------------------------- #
#  Rejestracja: hasło sprawdzone, ale kod e-mail musi potwierdzić właściciela  #
#  skrzynki, zanim powstanie sesja (patrz "Krok 2" niżej).                    #
# --------------------------------------------------------------------------- #

@router.post("/register", response_model=ChallengeOut, status_code=status.HTTP_201_CREATED)
def register(data: RegisterIn, db: Session = Depends(get_session)) -> ChallengeOut:
    email = data.email.lower().strip()

    existing = db.exec(select(User).where(User.email == email)).first()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Konto z tym adresem e-mail już istnieje.",
        )

    user = User(
        email=email,
        name=data.name.strip(),
        last_name=data.last_name.strip(),
        password_hash=hash_password(data.password),
        # `data.accept_terms` jest już zwalidowane jako True (patrz schemas.py) —
        # zapisujemy WERSJĘ i moment akceptacji, nie sam fakt "true".
        accepted_terms_version=CURRENT_TERMS_VERSION,
        accepted_terms_at=utcnow(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    challenge, code = _create_challenge(db, user, purpose="register")
    send_login_code(user.email, user.name, code)

    return _challenge_response(challenge, user)


# --------------------------------------------------------------------------- #
#  Krok 2: potwierdzenie kodem rejestracji — dopiero tu zaczyna się sesja     #
# --------------------------------------------------------------------------- #

@router.post("/login/verify", response_model=UserOut)
def verify_login_code(
    data: VerifyCodeIn, response: Response, db: Session = Depends(get_session)
) -> User:
    challenge = db.get(LoginChallenge, data.challenge_id)
    if challenge is None:
        raise HTTPException(status_code=404, detail="Nie znaleziono takiego wyzwania logowania.")

    if challenge.consumed_at is not None:
        raise HTTPException(
            status_code=400,
            detail="Ten kod został już wykorzystany albo unieważniony. Zaloguj się ponownie.",
        )

    if challenge.expires_at < utcnow():
        raise HTTPException(status_code=400, detail="Kod wygasł. Poproś o nowy.")

    if challenge.attempts >= settings.otp_max_attempts:
        raise HTTPException(
            status_code=429,
            detail="Zbyt wiele nieudanych prób. Poproś o nowy kod.",
        )

    if hash_token(data.code) != challenge.code_hash:
        challenge.attempts += 1
        db.add(challenge)
        db.commit()
        remaining = max(settings.otp_max_attempts - challenge.attempts, 0)
        raise HTTPException(
            status_code=401,
            detail=f"Nieprawidłowy kod. Pozostało prób: {remaining}.",
        )

    user = db.get(User, challenge.user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Konto powiązane z kodem już nie istnieje.")

    challenge.consumed_at = utcnow()
    db.add(challenge)
    db.commit()

    _start_session(db, user, response)
    return user


@router.post("/login/resend", response_model=ChallengeOut)
def resend_login_code(data: ResendCodeIn, db: Session = Depends(get_session)) -> ChallengeOut:
    reference = db.get(LoginChallenge, data.challenge_id)
    if reference is None:
        raise HTTPException(status_code=404, detail="Nie znaleziono takiego wyzwania logowania.")

    user = db.get(User, reference.user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Konto powiązane z kodem już nie istnieje.")

    latest = db.exec(
        select(LoginChallenge)
        .where(LoginChallenge.user_id == user.id)
        .order_by(LoginChallenge.created_at.desc())  # type: ignore[union-attr]
    ).first()
    if latest is not None:
        elapsed = (utcnow() - latest.created_at).total_seconds()
        if elapsed < settings.otp_resend_cooldown_seconds:
            wait = int(settings.otp_resend_cooldown_seconds - elapsed)
            raise HTTPException(
                status_code=429,
                detail=f"Poczekaj jeszcze {wait} s przed ponownym wysłaniem kodu.",
            )

    # Unieważnij nierozliczone wyzwania tego użytkownika — ważny ma być tylko najnowszy kod.
    pending = db.exec(
        select(LoginChallenge).where(
            LoginChallenge.user_id == user.id,
            LoginChallenge.consumed_at.is_(None),  # type: ignore[union-attr]
        )
    ).all()
    for old in pending:
        old.consumed_at = utcnow()
        db.add(old)
    db.commit()

    challenge, code = _create_challenge(db, user, purpose=reference.purpose)
    send_login_code(user.email, user.name, code)

    return _challenge_response(challenge, user)


# --------------------------------------------------------------------------- #
#  Logowanie — jednoetapowe: samo hasło od razu zakłada sesję                 #
# --------------------------------------------------------------------------- #

@router.post("/login", response_model=UserOut)
def login(data: LoginIn, response: Response, db: Session = Depends(get_session)) -> User:
    email = data.email.lower().strip()
    user = db.exec(select(User).where(User.email == email)).first()

    # Ten sam komunikat niezależnie od tego, czy nie ma konta, czy złe hasło —
    # żeby nie zdradzać, które adresy są zarejestrowane.
    if user is None or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nieprawidłowy e-mail lub hasło.",
        )

    _start_session(db, user, response)
    return user


# --------------------------------------------------------------------------- #
#  Reset hasła — ten sam mechanizm kodu e-mail co rejestracja (purpose="reset"),#
#  ale osobny od "register"/sesji logowania, żeby jeden kod nie dawał dostępu  #
#  do drugiej operacji.                                                       #
# --------------------------------------------------------------------------- #

@router.post("/password/forgot", response_model=ChallengeOut)
def forgot_password(data: ForgotPasswordIn, db: Session = Depends(get_session)) -> ChallengeOut:
    email = data.email.lower().strip()
    user = db.exec(select(User).where(User.email == email)).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nie znaleziono konta z tym adresem e-mail.",
        )

    latest = db.exec(
        select(LoginChallenge)
        .where(LoginChallenge.user_id == user.id, LoginChallenge.purpose == "reset")
        .order_by(LoginChallenge.created_at.desc())  # type: ignore[union-attr]
    ).first()
    if latest is not None:
        elapsed = (utcnow() - latest.created_at).total_seconds()
        if elapsed < settings.otp_resend_cooldown_seconds:
            wait = int(settings.otp_resend_cooldown_seconds - elapsed)
            raise HTTPException(
                status_code=429,
                detail=f"Poczekaj jeszcze {wait} s przed ponownym wysłaniem kodu.",
            )

    # Unieważnij nierozliczone wyzwania resetu — ważny ma być tylko najnowszy kod.
    pending = db.exec(
        select(LoginChallenge).where(
            LoginChallenge.user_id == user.id,
            LoginChallenge.purpose == "reset",
            LoginChallenge.consumed_at.is_(None),  # type: ignore[union-attr]
        )
    ).all()
    for old in pending:
        old.consumed_at = utcnow()
        db.add(old)
    db.commit()

    challenge, code = _create_challenge(db, user, purpose="reset")
    send_password_reset_code(user.email, user.name, code)

    return _challenge_response(challenge, user)


def _check_reset_code(db: Session, challenge_id: str, code: str) -> LoginChallenge:
    """
    Wspólna walidacja kodu resetu hasła (wyzwanie istnieje i ma "purpose" =
    "reset", nieużyte, nie wygasło, limit prób, kod się zgadza) — używana
    zarówno do samego zatwierdzenia kodu (verify_reset_code), jak i do
    właściwej zmiany hasła (reset_password). NIE oznacza wyzwania jako
    zużyte — to robi dopiero reset_password, gdy hasło faktycznie się zmieni,
    żeby sam podgląd poprawności kodu nie psuł możliwości dokończenia resetu.
    """
    challenge = db.get(LoginChallenge, challenge_id)
    if challenge is None or challenge.purpose != "reset":
        raise HTTPException(status_code=404, detail="Nie znaleziono takiego wyzwania logowania.")

    if challenge.consumed_at is not None:
        raise HTTPException(
            status_code=400,
            detail="Ten kod został już wykorzystany albo unieważniony. Poproś o nowy.",
        )

    if challenge.expires_at < utcnow():
        raise HTTPException(status_code=400, detail="Kod wygasł. Poproś o nowy.")

    if challenge.attempts >= settings.otp_max_attempts:
        raise HTTPException(
            status_code=429,
            detail="Zbyt wiele nieudanych prób. Poproś o nowy kod.",
        )

    if hash_token(code) != challenge.code_hash:
        challenge.attempts += 1
        db.add(challenge)
        db.commit()
        remaining = max(settings.otp_max_attempts - challenge.attempts, 0)
        raise HTTPException(
            status_code=401,
            detail=f"Nieprawidłowy kod. Pozostało prób: {remaining}.",
        )

    return challenge


@router.post("/password/verify-code", response_model=MessageOut)
def verify_reset_code(data: VerifyCodeIn, db: Session = Depends(get_session)) -> MessageOut:
    """Osobny krok przed zmianą hasła: potwierdza kod, zanim pokażemy pole na nowe hasło."""
    _check_reset_code(db, data.challenge_id, data.code)
    return MessageOut(message="Kod poprawny.")


@router.post("/password/reset", response_model=UserOut)
def reset_password(
    data: ResetPasswordIn, response: Response, db: Session = Depends(get_session)
) -> User:
    challenge = _check_reset_code(db, data.challenge_id, data.code)

    user = db.get(User, challenge.user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Konto powiązane z kodem już nie istnieje.")

    challenge.consumed_at = utcnow()
    db.add(challenge)

    user.password_hash = hash_password(data.new_password)
    db.add(user)
    db.commit()

    # Reset hasła unieważnia wszystkie inne sesje — skradzione/stare ciasteczko
    # przestaje działać, gdy właściciel konta ustawi nowe hasło.
    old_sessions = db.exec(select(AuthSession).where(AuthSession.user_id == user.id)).all()
    for old_session in old_sessions:
        db.delete(old_session)
    db.commit()

    _start_session(db, user, response)
    return user


# --------------------------------------------------------------------------- #
#  Logowanie Google (OAuth 2.0)                                               #
# --------------------------------------------------------------------------- #

_GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
_GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
_GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"
_GOOGLE_STATE_COOKIE = "google_oauth_state"


def _safe_redirect_path(value: str | None) -> str:
    """Tylko względne ścieżki zaczynające się od "/" — broni przed open-redirectem."""
    if value and value.startswith("/") and not value.startswith("//"):
        return value
    return "/panel"


def _exchange_google_code(code: str) -> dict:
    """Wymienia kod autoryzacji na access token. Wydzielone, żeby zamockować w testach."""
    response = requests.post(
        _GOOGLE_TOKEN_URL,
        data={
            "code": code,
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "redirect_uri": settings.google_redirect_uri_effective,
            "grant_type": "authorization_code",
        },
        timeout=10,
    )
    response.raise_for_status()
    return response.json()


def _fetch_google_userinfo(access_token: str) -> dict:
    """
    Pobiera profil użytkownika z Google tym samym access tokenem.

    To jest "trust boundary" całego mechanizmu: wołamy Google po HTTPS tokenem,
    który dostaliśmy od Google chwilę wcześniej (serwer-serwer, bez udziału
    przeglądarki) — więc nie musimy sami weryfikować podpisu żadnego tokenu.
    """
    response = requests.get(
        _GOOGLE_USERINFO_URL,
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=10,
    )
    response.raise_for_status()
    return response.json()


@router.get("/google/login", include_in_schema=False)
def google_login(redirect_to: str = "/panel") -> RedirectResponse:
    """Przekierowanie do ekranu zgody Google. Front linkuje tu <a href>, nie fetch."""
    if not settings.google_oauth_enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Logowanie Google nie jest skonfigurowane.",
        )

    state = generate_challenge_id()
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_uri_effective,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "prompt": "select_account",
    }
    redirect = RedirectResponse(f"{_GOOGLE_AUTH_URL}?{urlencode(params)}")
    # Jedno ciasteczko niesie dowód CSRF (state) i dokąd wrócić po zalogowaniu —
    # bezpiecznie złączone "|", bo state to urlsafe token, a redirect_to jest
    # już zwalidowane do postaci "/coś" (patrz _safe_redirect_path).
    redirect.set_cookie(
        key=_GOOGLE_STATE_COOKIE,
        value=f"{state}|{_safe_redirect_path(redirect_to)}",
        max_age=600,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        path="/api/auth/google",
    )
    return redirect


@router.get("/google/callback", include_in_schema=False)
def google_callback(
    request: Request,
    db: Session = Depends(get_session),
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
) -> RedirectResponse:
    """Odbiera Google z powrotem: zamienia kod na profil, znajduje/tworzy konto, zaczyna sesję."""
    login_page = f"{settings.public_base_url}/logowanie"
    cookie_raw = request.cookies.get(_GOOGLE_STATE_COOKIE)
    expected_state, _, redirect_to = (cookie_raw or "").partition("|")

    if error or not code or not state or not cookie_raw or state != expected_state:
        failure = RedirectResponse(f"{login_page}?blad=google")
        failure.delete_cookie(_GOOGLE_STATE_COOKIE, path="/api/auth/google")
        return failure

    try:
        token_data = _exchange_google_code(code)
        userinfo = _fetch_google_userinfo(token_data["access_token"])
    except (requests.RequestException, KeyError, ValueError):
        failure = RedirectResponse(f"{login_page}?blad=google")
        failure.delete_cookie(_GOOGLE_STATE_COOKIE, path="/api/auth/google")
        return failure

    email_verified = userinfo.get("email_verified") in (True, "true")
    email = str(userinfo.get("email") or "").lower().strip()
    google_sub = str(userinfo.get("sub") or "")
    if not email_verified or not email or not google_sub:
        failure = RedirectResponse(f"{login_page}?blad=google")
        failure.delete_cookie(_GOOGLE_STATE_COOKIE, path="/api/auth/google")
        return failure

    user = db.exec(select(User).where(User.google_sub == google_sub)).first()
    if user is None:
        user = db.exec(select(User).where(User.email == email)).first()
        if user is not None:
            # Konto istniało już z hasła — podlinkuj Google (Google już zweryfikował e-mail).
            user.google_sub = google_sub
            db.add(user)
            db.commit()
        else:
            user = User(
                email=email,
                name=(userinfo.get("given_name") or userinfo.get("name") or "Kursant").strip(),
                last_name=(userinfo.get("family_name") or "").strip() or "—",
                # Losowy, nikomu nieznany hash — to konto loguje się wyłącznie przez Google.
                password_hash=hash_password(generate_challenge_id()),
                google_sub=google_sub,
                accepted_terms_version=CURRENT_TERMS_VERSION,
                accepted_terms_at=utcnow(),
            )
            db.add(user)
            db.commit()
            db.refresh(user)

    success = RedirectResponse(f"{settings.public_base_url}{_safe_redirect_path(redirect_to)}")
    success.delete_cookie(_GOOGLE_STATE_COOKIE, path="/api/auth/google")
    _start_session(db, user, success)
    return success


# --------------------------------------------------------------------------- #
#  Sesja                                                                       #
# --------------------------------------------------------------------------- #

@router.post("/logout", response_model=MessageOut)
def logout(request: Request, response: Response, db: Session = Depends(get_session)) -> MessageOut:
    token = request.cookies.get(settings.session_cookie_name)
    if token:
        auth_session = db.exec(
            select(AuthSession).where(AuthSession.token_hash == hash_token(token))
        ).first()
        if auth_session is not None:
            db.delete(auth_session)
            db.commit()

    _clear_session_cookie(response)
    return MessageOut(message="Wylogowano.")


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user
