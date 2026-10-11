# Backend — API logowania (FastAPI + SQLite)

Osobny serwis w Pythonie. Obsługuje rejestrację, logowanie i sesje.
Front (Next.js) rozmawia z nim przez proxy: żądania spod `/api/*` na porcie 3000
są przekierowywane tutaj, na port 8000.

## Pierwsze uruchomienie

```bash
cd backend
python -m venv .venv

# Windows:
.venv\Scripts\python -m pip install -r requirements.txt
# macOS / Linux:
.venv/bin/python -m pip install -r requirements.txt
```

Opcjonalnie skopiuj `.env.example` do `.env` i dostosuj ustawienia.
Bez pliku `.env` wszystko działa na wartościach domyślnych.

## Uruchomienie

Zwykle uruchamiasz backend razem z frontem jednym poleceniem **z katalogu głównego projektu**:

```bash
npm run dev:all
```

Samo API:

```bash
npm run dev:api
# albo ręcznie, z katalogu backend/:
.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
```

- API: http://localhost:8000
- Interaktywna dokumentacja (Swagger): http://localhost:8000/docs

## Endpointy

| Metoda | Ścieżka | Opis |
| --- | --- | --- |
| `POST` | `/api/auth/register` | zakłada konto (`name`, `email`, `password`), wysyła kod e-mail — **nie loguje od razu** |
| `POST` | `/api/auth/login` | sprawdza hasło (`email`, `password`), wysyła kod e-mail — **nie loguje od razu** |
| `POST` | `/api/auth/login/verify` | sprawdza kod (`challenge_id`, `code`) — dopiero tu powstaje sesja |
| `POST` | `/api/auth/login/resend` | wysyła nowy kod dla tego samego wyzwania (`challenge_id`) |
| `POST` | `/api/auth/logout` | wylogowanie — kasuje sesję i ciasteczko |
| `GET` | `/api/auth/me` | dane zalogowanego użytkownika (401, jeśli niezalogowany) |
| `POST` | `/api/checkout/session` | tworzy płatność Stripe za kurs (`course_slug`), zwraca adres do przekierowania |
| `POST` | `/api/checkout/confirm` | sprawdza status sesji Checkout po powrocie ze Stripe (`session_id`) |
| `POST` | `/api/webhooks/stripe` | webhook Stripe — oznacza zamówienie jako opłacone |
| `GET` | `/api/me/courses` | kursy, do których użytkownik ma opłacony dostęp |
| `GET` | `/api/me/orders` | historia zamówień użytkownika |
| `GET` | `/api/admin/orders` | WSZYSTKIE zamówienia — tylko konta z `ADMIN_EMAILS` |
| `GET` | `/api/payments/status` | `enabled` / `disabled` |
| `GET` | `/api/health` | test działania |

Po zalogowaniu serwer ustawia ciasteczko `mzm_session` (httpOnly) — przeglądarka
dokłada je do kolejnych żądań automatycznie.

## Struktura kodu

| Plik | Za co odpowiada |
| --- | --- |
| `app/main.py` | tworzenie aplikacji, CORS, podpięcie tras |
| `app/config.py` | ustawienia (czytane z env / `.env`) |
| `app/database.py` | połączenie z SQLite, tworzenie tabel |
| `app/models.py` | tabele: `User`, `AuthSession`, `LoginChallenge`, `Order` |
| `app/schemas.py` | walidacja danych wchodzących/wychodzących |
| `app/security.py` | hashowanie haseł (argon2), tokeny sesji, kody logowania |
| `app/email.py` | wysyłka e-maili (kody logowania) |
| `app/auth.py` | endpointy logowania + zależność `get_current_user` |
| `app/catalog.py` | katalog kursów i **ceny** (źródło prawdy — nie ufamy przeglądarce) |
| `app/payments.py` | płatności Stripe: checkout, webhook, dostęp do kursów |

## Logowanie dwuetapowe (kod e-mail)

Logowanie i rejestracja NIE zakładają sesji od razu. Zamiast tego:

1. `POST /api/auth/register` albo `/api/auth/login` sprawdza dane i wysyła e-mailem
   6-cyfrowy kod. Zwraca `challenge_id` — sesja jeszcze nie istnieje.
2. `POST /api/auth/login/verify` z tym `challenge_id` i kodem — dopiero to zakłada
   sesję i ustawia ciasteczko.

**Bez skonfigurowanego dostawcy poczty kody NIE są wysyłane naprawdę** — lądują
w logach/konsoli serwera (`--- E-MAIL (tryb deweloperski, nie wysłano) ---`), więc
cały przepływ da się przetestować lokalnie bez zakładania konta u dostawcy poczty.

Żeby wysyłać prawdziwe e-maile:

1. Załóż konto na [resend.com](https://resend.com) (ma darmowy plan).
2. Wygeneruj klucz API na [resend.com/api-keys](https://resend.com/api-keys) i wpisz
   go w `backend/.env`:
   ```
   RESEND_API_KEY=re_...
   ```
3. Domyślny nadawca (`onboarding@resend.dev`) działa od razu, ale wysyła tylko na
   adres, którym założyłeś konto w Resend — żeby wysyłać do dowolnych adresów,
   zweryfikuj własną domenę w panelu Resend i ustaw `RESEND_FROM_EMAIL`.

Inne ustawienia (`backend/.env`): `OTP_TTL_MINUTES` (ważność kodu, domyślnie 10 minut),
`OTP_MAX_ATTEMPTS` (ile złych prób, zanim trzeba poprosić o nowy kod, domyślnie 5),
`OTP_RESEND_COOLDOWN_SECONDS` (jak często można klikać „wyślij kod ponownie”).

## Logowanie Google

Przycisk „Kontynuuj z Google” na `/logowanie` i `/rejestracja`. Bez konfiguracji
kliknięcie go kończy się błędem (backend odpowiada 503) — reszta strony działa normalnie.

1. Wejdź na [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)
   (załóż projekt, jeśli nie masz). Jeśli to pierwszy raz, skonfiguruj najpierw
   **OAuth consent screen** (typ „External” wystarczy do testów; dane aplikacji
   mogą być prowizoryczne na etapie testów — Google pozwala dodać siebie jako
   „test user” bez przechodzenia weryfikacji).
2. **Create credentials → OAuth client ID → Application type: Web application.**
3. W **Authorized redirect URIs** wpisz dokładnie:
   ```
   http://localhost:3000/api/auth/google/callback
   ```
   (lokalnie; na produkcji dodaj drugi wpis z Twoją prawdziwą domeną). To MUSI być
   adres **frontu** (nie backendu) — Next.js przekazuje `/api/*` do Pythona przez
   `rewrites()`, więc z punktu widzenia Google i przeglądarki to jeden adres.
4. Google pokaże **Client ID** i **Client secret** — wklej je do `backend/.env`:
   ```
   GOOGLE_CLIENT_ID=....apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=...
   ```
5. Zrestartuj backend. `GOOGLE_REDIRECT_URI` zostaw puste — budujemy go automatycznie
   z `PUBLIC_BASE_URL` (musi być zgodny z krokiem 3).

**Jak to działa**: `GET /api/auth/google/login` przekierowuje do ekranu zgody Google.
Po zgodzie Google wraca na `/api/auth/google/callback` z kodem — backend wymienia go
na token, pyta Google o profil (e-mail, imię, `sub`) i:
- jeśli e-mail już ma konto założone hasłem — podlinkowuje do niego Google (Google
  już zweryfikował ten e-mail, więc to bezpieczne),
- inaczej zakłada nowe konto (z losowym, nieznaną nikomu hasłem — takie konto loguje
  się tylko przez Google) i zapisuje akceptację regulaminu/polityki prywatności tak
  jak przy rejestracji hasłem (patrz `backend/app/legal.py`).

Konto Google NIE przechodzi przez kod e-mail z rejestracji — Google już poświadczył,
że e-mail jest prawdziwy. Kod: `backend/app/auth.py` (`google_login`, `google_callback`).

### Testy

```bash
.venv\Scripts\python tests/test_login_otp.py
```

## Płatności (Stripe)

Bez klucza Stripe endpointy płatności zwracają `503` z komunikatem — reszta aplikacji
działa normalnie. Żeby włączyć płatności:

1. Załóż konto na [stripe.com](https://stripe.com) i zostań w **trybie testowym**.
2. Skopiuj `backend/.env.example` do `backend/.env` i wpisz klucz tajny
   (`sk_test_...`) z [dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys):
   ```
   STRIPE_SECRET_KEY=sk_test_...
   ```
3. Zainstaluj [Stripe CLI](https://stripe.com/docs/stripe-cli) i w osobnym terminalu:
   ```
   stripe listen --forward-to localhost:8000/api/webhooks/stripe
   ```
   Komenda wypisze sekret webhooka (`whsec_...`) — wklej go do `.env`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
4. Zrestartuj backend. Testowa karta: `4242 4242 4242 4242`, dowolna przyszła data i CVC.

### Metody płatności (karta, BLIK, Przelewy24, Apple Pay, Google Pay...)

`STRIPE_PAYMENT_METHODS` w `.env` domyślnie jest **puste** — wtedy backend w ogóle
nie mówi Stripe'owi, jakich metod użyć, więc Stripe samo pokazuje na stronie płatności
wszystko, co masz włączone w panelu: **Dashboard → Settings → Payment methods**.

- **Apple Pay i Google Pay** nie są osobną metodą ani osobnym kluczem — jadą "na"
  karcie. Wystarczy włączyć je w panelu (sekcja Wallets) i włączyć/zostawić kartę
  włączoną. Na hostowanej stronie Stripe Checkout (tej, na którą przekierowujemy)
  Stripe samo weryfikuje domenę pod Apple Pay — nie trzeba wgrywać żadnego pliku
  ani niczego dopisywać w kodzie.
- **BLIK, Przelewy24** i inne lokalne metody: włącz w tym samym miejscu w panelu.
  Pojawią się na checkoucie automatycznie, bez zmiany w `.env` czy w kodzie.
- Wpisz coś w `STRIPE_PAYMENT_METHODS` (np. `card,blik,p24`) tylko wtedy, gdy chcesz
  **zawęzić** listę do konkretnych metod zamiast pokazywać wszystko, co masz włączone.
  Każda metoda wypisana tu wprost musi być też włączona w panelu — inaczej Stripe
  odrzuci tworzenie sesji płatności błędem.

**Ceny**: `app/catalog.py` musi być zgodny z `src/data/courses.ts` (pole `price.amount`).
Kwotę do pobrania backend bierze wyłącznie stąd — front przekazuje tylko `course_slug`.

Zamówienie oznacza się jako opłacone dwiema drogami: webhook Stripe (główna, działa też
na produkcji) oraz awaryjnie `POST /api/checkout/confirm` wołane przez stronę sukcesu —
dzięki temu przepływ działa lokalnie nawet bez uruchomionego `stripe listen`.

### Testy

```bash
.venv\Scripts\python -m pip install -r requirements-dev.txt
.venv\Scripts\python tests/test_payments.py
```

Testy nie łączą się z prawdziwym Stripe — biblioteka jest zamockowana.

## Panel administracyjny i powiadomienia o zapisach

Skąd wiesz, że ktoś się zapisał:

1. **E-mail do admina** — gdy zamówienie zmienia status na `paid`, na adresy
   z `ADMIN_EMAILS` leci e-mail z pełnymi danymi zapisu (kursant, kontakt, adres,
   wybrany termin, dane opiekuna przy niepełnoletnich). Wysyła to `_notify_admins_order_paid`
   w `app/payments.py`, wołane z `_mark_order_paid` — czyli niezależnie od tego, czy
   zadziałał webhook, czy ścieżka `/api/checkout/confirm`. Bez klucza Resend ląduje
   w logach serwera (tak jak kody logowania).
2. **`GET /api/admin/orders`** (front: `/panel/admin`) — lista wszystkich zamówień,
   niezależnie od statusu, najnowsze na górze.

Konfiguracja w `backend/.env`:

```
ADMIN_EMAILS=twoj@email.pl
```

Kilka adresów oddziel przecinkami. Puste (domyślnie) = panel zwraca 403 każdemu,
e-maile się nie wysyłają. **Wpisz tu e-mail konta, którym się logujesz** — dostęp
sprawdzany jest po e-mailu zalogowanego użytkownika (`require_admin` w `app/payments.py`),
nie ma osobnej flagi „administrator” w bazie.

## Baza danych

Plik `backend/data/app.db` (SQLite). Tworzy się sam przy pierwszym starcie.
Możesz go podejrzeć np. w [DB Browser for SQLite](https://sqlitebrowser.org/)
albo `sqlite3 data/app.db`.

Reset bazy: zatrzymaj serwer i usuń katalog `backend/data/`.

## Co dopracować przed wdrożeniem produkcyjnym

- `COOKIE_SECURE=true` (wymusza HTTPS dla ciasteczka).
- Zamień SQLite na PostgreSQL (`DATABASE_URL=postgresql://...`) — SQLite nie nadaje się
  pod większy ruch i wiele procesów.
- Dodaj limit prób logowania (rate limiting), np. `slowapi`.
- Rozważ e-mail weryfikacyjny i procedurę resetu hasła.
- Migracje schematu (Alembic) — teraz tabele tworzy `create_all`, co nie ogarnia zmian
  w istniejących tabelach.
- Faktury/rachunki (obowiązek podatkowy) — Stripe może je generować albo integracja
  z systemem księgowym.
- Kursy miesięczne: teraz jednorazowa opłata = pierwszy miesiąc. Docelowo subskrypcje
  Stripe (`mode="subscription"`) z odnawianiem i anulowaniem.

### Checklista: żeby płatności w pełni działały na produkcji

1. Konto Stripe zweryfikowane i przełączone z trybu testowego na **Live** (przełącznik
   w panelu Stripe).
2. `STRIPE_SECRET_KEY` — klucz **live** (`sk_live_...`) z
   [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys) (bez `/test/`).
3. `STRIPE_WEBHOOK_SECRET` — w panelu Stripe: Developers → Webhooks → Add endpoint,
   adres `https://twoja-domena.pl/api/webhooks/stripe`, zdarzenia:
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
   `checkout.session.async_payment_failed`, `checkout.session.expired`. Panel pokaże
   sekret podpisu (`whsec_...`) do wklejenia w `.env`.
4. `PUBLIC_BASE_URL` — publiczny adres frontu produkcyjnego (np. `https://matura-z-matmy.pl`);
   stąd budowane są `success_url`/`cancel_url`, na które Stripe odsyła po płatności.
5. `STRIPE_PAYMENT_METHODS` — zostaw puste. W panelu Stripe (Settings → Payment methods)
   włącz kartę + Wallets (Apple Pay, Google Pay) oraz BLIK / Przelewy24, jeśli mają być
   dostępne — pojawią się na checkoucie same, bez żadnej zmiany w kodzie czy `.env`.
6. `COOKIE_SECURE=true` (patrz wyżej) — Stripe wymaga HTTPS na produkcyjnym froncie,
   więc ciasteczko sesji i tak musi być `secure`.
7. Test end-to-end na produkcji: prawdziwa (mała) płatność kartą + BLIK-em, sprawdzić czy
   zamówienie dostaje status `paid` i przychodzi e-mail powiadomienia (`ADMIN_EMAILS`).
