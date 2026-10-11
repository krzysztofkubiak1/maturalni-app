"""
Konfiguracja backendu.

Wartości można nadpisać zmiennymi środowiskowymi albo plikiem `backend/.env`
(patrz `.env.example`). Nazwy zmiennych = nazwy pól poniżej, wielkość liter bez znaczenia,
np. DATABASE_URL, SESSION_TTL_HOURS.
"""

from __future__ import annotations

from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Gdzie trzymać bazę. Domyślnie plik SQLite w backend/data/app.db
    database_url: str = "sqlite:///./data/app.db"

    # Nazwa ciasteczka z sesją. MUSI być taka sama jak w middleware frontendu
    # (src/middleware.ts) oraz w helperze src/lib/auth.ts.
    session_cookie_name: str = "mzm_session"

    # Jak długo ważna jest sesja (w godzinach). 336 = 14 dni.
    session_ttl_hours: int = 24 * 14

    # Ciasteczko tylko po HTTPS. Na localhost zostaw False, na produkcji ustaw True.
    cookie_secure: bool = False

    # Polityka SameSite ciasteczka. "lax" wystarcza, gdy front i API są na tej samej domenie
    # (u nas: Next.js proxuje /api/* do Pythona, więc z punktu widzenia przeglądarki to jedna domena).
    cookie_samesite: Literal["lax", "strict", "none"] = "lax"

    # Adresy, z których przeglądarka może wołać API bezpośrednio (CORS).
    # Rozdzielone przecinkami. Przy wariancie z proxy nie jest to potrzebne,
    # ale ułatwia testy uderzające prosto w http://localhost:8000.
    cors_origins: str = "http://localhost:3000"

    # --- Płatności (Stripe) --------------------------------------------------
    # Klucze z panelu Stripe (https://dashboard.stripe.com/test/apikeys).
    # Puste = płatności wyłączone (endpointy zwracają 503 z komunikatem).
    stripe_secret_key: str = ""
    # Sekret podpisu webhooka. Lokalnie bierze się go z `stripe listen`.
    stripe_webhook_secret: str = ""
    # Metody płatności w Stripe Checkout, po przecinku (np. "card,blik,p24").
    # PUSTE (domyślnie) = Stripe samo pokaże wszystko, co masz włączone w panelu
    # (Dashboard -> Settings -> Payment methods) — w tym kartę, BLIK, Przelewy24
    # oraz portfele Apple Pay / Google Pay (te dwa jadą automatycznie na kartach,
    # nie mają własnego klucza ani wpisu tutaj — wystarczy włączyć je w panelu).
    # Wpisz tu coś tylko, jeśli chcesz ZAWĘZIĆ listę do konkretnych metod.
    stripe_payment_methods: str = ""
    # Waluta (kod ISO, małe litery).
    currency: str = "pln"
    # Adres frontu — dokąd Stripe odsyła użytkownika po płatności.
    public_base_url: str = "http://localhost:3000"

    # --- Logowanie dwuetapowe (kod e-mail) ------------------------------------
    # Jak długo ważny jest kod wysłany e-mailem.
    otp_ttl_minutes: int = 10
    # Po ilu błędnych próbach kod przestaje działać (trzeba poprosić o nowy).
    otp_max_attempts: int = 5
    # Minimalny odstęp między kolejnymi "wyślij kod ponownie".
    otp_resend_cooldown_seconds: int = 30

    # --- Wysyłka e-maili (Resend) ----------------------------------------------
    # Bez klucza kody logowania NIE są wysyłane — lądują w logach serwera,
    # co pozwala przetestować cały przepływ lokalnie bez konta u dostawcy poczty.
    resend_api_key: str = ""
    resend_from_email: str = "Maturalia <onboarding@resend.dev>"
    site_name: str = "Maturalia"

    # --- Logowanie Google (OAuth 2.0) -------------------------------------------
    # Klucze z https://console.cloud.google.com/apis/credentials (typ: OAuth client ID,
    # "Web application"). Puste = przycisk logowania Google wyłączony (503).
    google_client_id: str = ""
    google_client_secret: str = ""
    # Adres, na który Google odsyła po zgodzie — MUSI być wpisany 1:1 w konsoli Google
    # (Authorized redirect URIs). Puste = budujemy go z public_base_url (adres frontu,
    # bo to on jest publiczny; Next.js przekazuje /api/* do backendu przez rewrites).
    google_redirect_uri: str = ""

    # --- Panel administracyjny --------------------------------------------------
    # Adresy e-mail (po przecinku) dopuszczone do /api/admin/* — czyli do panelu
    # z listą wszystkich zapisów — oraz odbierające powiadomienie, gdy ktoś opłaci
    # zapis. Puste = panel wyłączony, nikt nie ma dostępu, powiadomienia nie idą.
    # Wpisz tu e-mail konta, którym się logujesz.
    admin_emails: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def stripe_payment_method_list(self) -> list[str]:
        return [m.strip() for m in self.stripe_payment_methods.split(",") if m.strip()]

    @property
    def payments_enabled(self) -> bool:
        return bool(self.stripe_secret_key)

    @property
    def email_enabled(self) -> bool:
        return bool(self.resend_api_key)

    @property
    def admin_email_list(self) -> list[str]:
        return [e.strip().lower() for e in self.admin_emails.split(",") if e.strip()]

    @property
    def google_oauth_enabled(self) -> bool:
        return bool(self.google_client_id and self.google_client_secret)

    @property
    def google_redirect_uri_effective(self) -> str:
        return self.google_redirect_uri or f"{self.public_base_url}/api/auth/google/callback"


settings = Settings()
