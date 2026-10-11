# Strona kursów maturalnych z matematyki

Strona kursów maturalnych z matematyki (poziom podstawowy i rozszerzony).

- **Front** — Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4. Strona
  marketingowa + logowanie do panelu kursanta.
- **Backend** — FastAPI + SQLite w katalogu [`backend/`](backend/). Obsługuje rejestrację,
  logowanie i sesje. Szczegóły: [backend/README.md](backend/README.md).

## Uruchomienie

Pierwsze uruchomienie — instalacja zależności frontu i backendu:

```bash
npm install

cd backend
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt   # Windows
# .venv/bin/python -m pip install -r requirements.txt     # macOS / Linux
cd ..
```

Codzienna praca — front i backend jednym poleceniem:

```bash
npm run dev:all      # front :3000 + API :8000 razem (tryb deweloperski)
```

Albo osobno, w dwóch terminalach:

```bash
npm run dev          # tylko front → http://localhost:3000
npm run dev:api      # tylko API   → http://localhost:8000
```

Pozostałe polecenia:

```bash
npm run build        # build produkcyjny frontu
npm run start        # serwer produkcyjny frontu (wymaga osobno działającego API)
npm run lint         # ESLint
```

> Strona marketingowa działa też bez backendu — nie wstanie tylko logowanie i panel.

## Co gdzie podmienić

Cała treść siedzi w dwóch plikach — nie trzeba grzebać w komponentach:

| Plik | Co zawiera |
| --- | --- |
| `src/data/site.ts` | nazwa marki, adres strony, telefon, e-mail, adres, social media, prowadzący, statystyki, przewagi, opinie, FAQ, nawigacja |
| `src/data/courses.ts` | kursy (nazwy, ceny, terminy, harmonogram, wymiar godzin, opisy) oraz programy nauczania obu poziomów |

Wszystkie miejsca wymagające uzupełnienia oznaczone są komentarzem `// TODO`.
Żeby je wypisać:

```bash
npx --yes grep -rn "TODO" src   # albo zwykłe wyszukiwanie w edytorze
```

### Lista rzeczy do zrobienia przed publikacją

1. **Dane firmy** — `site.url`, nazwa, telefon, e-mail, adres, linki społecznościowe (`src/data/site.ts`).
2. **Prowadzący** — imiona, nazwiska, opisy, ewentualnie zdjęcia zamiast inicjałów.
3. **Ceny i terminy kursów** — `src/data/courses.ts` (wyświetlanie) **oraz**
   `backend/app/catalog.py` (kwota pobierana przez Stripe). Zmień w obu.
4. **Statystyki i opinie** — obecne są przykładowe; wpisz prawdziwe (opinie tylko za zgodą uczniów).
5. **Obsługa formularza** — `src/app/actions.ts`, sekcja `TODO`. Teraz zgłoszenia trafiają
   wyłącznie do logów serwera. Podłącz wysyłkę e-maila (np. Resend), zapis do bazy albo webhook.
6. **Dokumenty prawne** — `/regulamin` i `/polityka-prywatnosci` to szablony poglądowe,
   nie porada prawna. Uzupełnij dane i daj do sprawdzenia prawnikowi, potem usuń komponent
   `LegalNotice` z obu stron.
7. **Stopka** — usuń zdanie o przykładowych danych (`src/components/Footer.tsx`).
8. **Favicon i grafika OG** — podmień `src/app/favicon.ico`, rozważ dodanie `opengraph-image.png`.
9. **Płatności** — klucze produkcyjne Stripe, webhook w panelu Stripe, faktury.
   Szczegóły w [backend/README.md](backend/README.md).

### Kolory

Paleta marki jest zdefiniowana w `src/app/globals.css` w bloku `@theme`
(zmienne `--color-brand-*`, `--color-ink`, `--color-accent-*`). Podmiana tych wartości
przemalowuje całą stronę.

## Struktura stron

| Adres | Plik |
| --- | --- |
| `/` | `src/app/page.tsx` |
| `/kursy` | `src/app/kursy/page.tsx` |
| `/kursy/[slug]` | `src/app/kursy/[slug]/page.tsx` (generowane z `courses.ts`) |
| `/program` | `src/app/program/page.tsx` |
| `/o-nas` | `src/app/o-nas/page.tsx` |
| `/faq` | `src/app/faq/page.tsx` |
| `/kontakt` | `src/app/kontakt/page.tsx` |
| `/regulamin`, `/polityka-prywatnosci` | dokumenty (wyłączone z indeksowania) |
| `/logowanie`, `/rejestracja`, `/panel` | logowanie i panel kursanta (renderowane dynamicznie) |
| `/panel/platnosc/sukces`, `/panel/platnosc/anulowano` | powrót ze Stripe po płatności |

Strony marketingowe są prerenderowane statycznie; strony konta renderują się dynamicznie
(zależą od ciasteczka sesji). `sitemap.xml` i `robots.txt` generują się automatycznie
z danych — po zmianie `site.url` zaktualizują się same.

## Logowanie (front + backend)

Logowanie i rejestracja są **dwuetapowe**: hasło + kod wysłany e-mailem.

**Wymagania hasła**: min. 8 znaków, co najmniej jedna litera i jedna cyfra
(`RegisterIn.validate_password` w `backend/app/schemas.py`). Formularz rejestracji
pokazuje na bieżąco, które warunki są już spełnione (`RegisterForm.tsx`).

Przepływ:

1. `src/app/actions.ts` **nie** ma z tym nic wspólnego — logowanie obsługuje osobne API
   w Pythonie ([`backend/`](backend/)).
2. Front woła `/api/auth/*`; `next.config.ts` przekierowuje te żądania do FastAPI na `:8000`.
3. `POST /api/auth/login` (albo `/register`) sprawdza dane i wysyła e-mailem 6-cyfrowy
   kod — sesja jeszcze nie powstaje. Front pokazuje wtedy drugi krok
   (`src/components/CodeVerificationForm.tsx`).
4. `POST /api/auth/login/verify` z kodem zakłada sesję i ustawia ciasteczko `mzm_session`.
5. `src/components/AuthProvider.tsx` trzyma stan zalogowania po stronie klienta
   (nagłówek, przyciski). Strona `/panel` sprawdza sesję po stronie serwera
   (`src/lib/auth.ts`), a `src/proxy.ts` robi szybkie przekierowanie na `/logowanie`.

**Bez klucza Resend kody logowania lądują w logach backendu, nie na prawdziwej
poczcie** — szczegóły konfiguracji w [backend/README.md](backend/README.md) →
sekcja „Logowanie dwuetapowe”.

Pliki, które najpewniej będziesz zmieniać:

| Plik | Co robi |
| --- | --- |
| `backend/app/auth.py` | endpointy `/api/auth/*` i logika sesji + kodów |
| `backend/app/email.py` | treść i wysyłka maila z kodem |
| `backend/app/models.py` | tabele `User`, `AuthSession`, `LoginChallenge` |
| `backend/app/schemas.py` | walidacja danych z formularzy |
| `src/components/LoginForm.tsx`, `RegisterForm.tsx` | krok 1: hasło |
| `src/components/CodeVerificationForm.tsx` | krok 2: kod z e-maila |
| `src/app/panel/page.tsx` | zawartość panelu po zalogowaniu |

Nazwa ciasteczka (`mzm_session`) musi być zgodna w trzech miejscach: `backend/app/config.py`
(`SESSION_COOKIE_NAME`), `src/lib/user.ts` (`SESSION_COOKIE`) i pośrednio w `src/proxy.ts`.

Konfiguracja adresów backendu dla frontu: `.env.local` (wzór w `.env.local.example`).

## Płatności (Stripe) i zapisy na kurs

Zamiast od razu przechodzić do płatności, kliknięcie „Zapisz się na kurs” prowadzi
na osobną stronę `/kursy/[slug]/zapisz-sie` z formularzem zapisu. Dopiero po jego
wypełnieniu następuje przekierowanie do Stripe. Opłacony kurs pojawia się w `/panel`
w sekcji „Twoje kursy”.

- Bez klucza Stripe formularz zapisu i tak działa, ale próba płatności pokazuje
  komunikat, że płatności nie są skonfigurowane.
- Konfiguracja klucza i webhooka: **[backend/README.md](backend/README.md) → sekcja Płatności**.
- Przepływ: `src/components/CourseCheckout.tsx` (link na stronie kursu) →
  `/kursy/[slug]/zapisz-sie` (auth + „czy już opłacony” po stronie serwera) →
  `src/components/EnrollmentForm.tsx` (dane kursanta, opcjonalnie opiekuna) →
  `POST /api/checkout/session` → przekierowanie na Stripe → powrót na
  `/panel/platnosc/sukces` → `src/lib/payments.ts` potwierdza płatność, a webhook
  Stripe robi to samo niezależnie.
- **Adres** (kursanta i — jeśli dotyczy — opiekuna) jest rozbity na osobne pola:
  ulica, numer domu, numer mieszkania (opcjonalny), kod pocztowy, miasto
  (`AddressFields` w `EnrollmentForm.tsx`, wspólny dla obu).
- **Termin zajęć**: kursant wybiera jeden z 6 slotów (wtorek/środa/czwartek ×
  17:00–19:00/19:00–21:00). Lista dozwolonych wartości: `SCHEDULE_SLOTS`
  w `backend/app/schemas.py` — front i backend muszą się zgadzać.
- **Niepełnoletni kursanci**: zaznaczenie „Kursant jest niepełnoletni” w formularzu
  zapisu odsłania identyczny komplet pól (dane + pełny adres) rodzica/opiekuna
  prawnego — wymagane przez backend (`CheckoutIn.require_guardian_when_minor`
  w `backend/app/schemas.py`), zapisywane na zamówieniu (`Order.guardian_*`).
- **Ceny są w dwóch miejscach**: `src/data/courses.ts` (wyświetlanie) i
  `backend/app/catalog.py` (kwota realnie pobierana). Po zmianie ceny zmień w obu.

## Panel administracyjny i powiadomienia o zapisach

Jak wiesz, że ktoś się zapisał i opłacił kurs:

1. **E-mail** — gdy zamówienie zmienia status na „opłacone” (webhook Stripe albo
   strona sukcesu), na adresy z `ADMIN_EMAILS` (`backend/.env`) leci e-mail z pełnymi
   danymi zapisu: kursant, kontakt, adres, wybrany termin, a przy niepełnoletnich —
   też dane opiekuna. Bez klucza Resend ląduje w logach serwera, jak kody logowania.
2. **Panel** — `/panel/admin` pokazuje listę WSZYSTKICH zgłoszeń (pending/paid/failed),
   najnowsze na górze, z tymi samymi danymi co w e-mailu.

**Dostęp**: tylko konta, których e-mail jest na liście `ADMIN_EMAILS` w `backend/.env`
(oddziel przecinkami, jeśli więcej niż jedna osoba). Pusta lista = panel wyłączony dla
wszystkich, nikt nie dostaje e-maili. **Wpisz tam e-mail, którym się logujesz**, żeby
zacząć z tego korzystać.

Pliki, które będziesz zmieniać:

| Plik | Co robi |
| --- | --- |
| `backend/app/catalog.py` | ceny kursów (źródło prawdy) |
| `backend/app/payments.py` | checkout, webhook, dostęp do kursów, powiadomienia i panel admina |
| `backend/app/schemas.py` | pola formularza zapisu i walidacja (`CheckoutIn`) |
| `src/components/CourseCheckout.tsx` | link „Zapisz się na kurs” na stronie kursu |
| `src/app/kursy/[slug]/zapisz-sie/page.tsx` | strona zapisów (auth + stan zamówienia) |
| `src/components/EnrollmentForm.tsx` | formularz: kursant + opiekun dla niepełnoletnich |
| `src/app/panel/page.tsx` | sekcja „Twoje kursy” |
| `src/app/panel/admin/page.tsx` | panel administracyjny — lista wszystkich zapisów |

## SEO

- Metadane (`title`, `description`, Open Graph) ustawiane per strona.
- Dane strukturalne schema.org: `EducationalOrganization` i `FAQPage` na stronie głównej,
  `Course` z oceną na stronach kursów.
- Semantyczny HTML, hierarchia nagłówków, `lang="pl"`, link „przejdź do treści”.

## Dostępność

Menu i akordeony obsługiwane z klawiatury (`aria-expanded`, `aria-controls`, Escape zamyka menu),
widoczne obramowanie fokusa, etykiety przy polach formularza, komunikaty błędów powiązane przez
`aria-describedby`, respektowanie `prefers-reduced-motion`.

## Wdrożenie

Front i backend to dwa osobne serwisy:

- **Front** — np. Vercel (import repozytorium). Ustaw zmienne `API_PROXY_TARGET`
  i `INTERNAL_API_URL` na publiczny adres wdrożonego API.
- **Backend** — dowolny hosting Pythona (Railway, Render, Fly.io, VPS).
  Na produkcji: `COOKIE_SECURE=true`, PostgreSQL zamiast SQLite, uzupełnij `CORS_ORIGINS`.
  Szczegóły w [backend/README.md](backend/README.md).

Po podłączeniu wysyłki zgłoszeń z formularza kontaktowego (`src/app/actions.ts`) pamiętaj
o dodaniu potrzebnych zmiennych środowiskowych w panelu hostingu frontu.
