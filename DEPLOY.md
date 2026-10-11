# Wdrożenie produkcyjne (Docker, VPS)

Architektura: **Caddy** (TLS + reverse proxy, jedyna usługa z portami na zewnątrz)
→ **frontend** (Next.js, kontener Node) i **backend** (FastAPI, kontener Python)
→ **db** (Postgres, niewidoczny z zewnątrz). Szczegóły w `docker-compose.yml`
i `Caddyfile`.

Ten projekt nie ma Alembica — backend sam tworzy tabele w bazie przy starcie
(`init_db()`), nie trzeba nic dodatkowo migrować przy wdrożeniu.

## Pierwsze wdrożenie (świeży Ubuntu)

1. Zainstaluj Dockera (wersja z wtyczką `docker compose`, nie starym `docker-compose`):
   ```bash
   curl -fsSL https://get.docker.com | sh
   ```

2. Jeśli projekt jest w repozytorium Git (GitHub/GitLab) — sklonuj go:
   ```bash
   git clone <adres-twojego-repo> maturalia
   cd maturalia
   ```
   Jeśli jeszcze NIE masz tego projektu w Git, przenieś pliki na serwer inaczej
   (np. `rsync`/`scp`) — ważne, żeby `.env` nigdy nie trafił do żadnego repo.

3. Skopiuj szablon zmiennych środowiskowych i uzupełnij go:
   ```bash
   cp .env.example .env
   nano .env
   ```
   Koniecznie uzupełnij: `DOMAIN` (Twoja prawdziwa domena, bez `https://`),
   `POSTGRES_PASSWORD` (coś długiego i losowego). Resztę (Stripe, Resend, Google,
   `ADMIN_EMAILS`) możesz dodać później — bez nich odpowiadające funkcje są
   po prostu wyłączone, reszta strony działa.

4. Upewnij się, że DNS domeny (rekordy A/AAAA dla `DOMAIN` i `www.DOMAIN`)
   wskazuje na IP tego serwera — Caddy potrzebuje tego, żeby wystawić certyfikat.

5. Zbuduj i wystartuj:
   ```bash
   docker compose up -d --build
   ```
   Pierwsze uruchomienie zajmie chwilę (budowanie obrazów). Caddy automatycznie
   pobierze certyfikat HTTPS przy pierwszym żądaniu do domeny.

6. Sprawdź, czy wszystko stoi:
   ```bash
   docker compose ps
   ```
   Wszystkie usługi powinny być `running`/`healthy`.

## Aktualizacja aplikacji

```bash
cd maturalia
git pull
docker compose up -d --build
```

Odbuduje tylko to, co się zmieniło (obrazy frontendu/backendu), bez przerywania
działania bazy (jej wolumen zostaje nietknięty).

## Codzienne operacje

**Logi** (na żywo, konkretnej usługi albo wszystkich):
```bash
docker compose logs -f backend
docker compose logs -f           # wszystkie usługi
```

**Restart** jednej usługi:
```bash
docker compose restart backend
```

**Wejście do bazy** (psql):
```bash
docker compose exec db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
```
(zmienne `POSTGRES_USER`/`POSTGRES_DB` są w Twoim `.env` — możesz też wpisać
wartości na sztywno).

**Pełny restart wszystkiego**:
```bash
docker compose down
docker compose up -d
```
(`down` NIE usuwa wolumenów, więc dane bazy i certyfikaty Caddy zostają).

## Backup i przywracanie bazy

### Backup

```bash
./scripts/backup_db.sh
```
Zapisuje `*.sql.gz` do `/root/backups/`, z datą w nazwie, i usuwa kopie starsze
niż 14 dni.

**Automatyczny backup co noc** — dodaj do crona (`crontab -e`):
```
0 3 * * * cd /opt/maturalia && ./scripts/backup_db.sh >> /root/backups/backup.log 2>&1
```
(podmień `/opt/maturalia` na rzeczywistą ścieżkę do repo na serwerze).

### Przywracanie z backupu

```bash
gunzip -c /root/backups/NAZWA_PLIKU.sql.gz | docker compose exec -T db \
    psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
```

Przywracanie nadpisuje dane w bazie — jeśli baza nie jest pusta, najpierw
rozważ `docker compose down` i usunięcie wolumenu `postgres_data`, albo
przywróć do pustej, nowej bazy.

## Test lokalny przed wdrożeniem

Na swoim komputerze (bez prawdziwej domeny, bez HTTPS):
```bash
cp .env.example .env
# w .env: DOMAIN=localhost, ustaw POSTGRES_PASSWORD na cokolwiek
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```
Otwórz `http://localhost`.
