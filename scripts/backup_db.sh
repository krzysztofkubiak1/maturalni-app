#!/usr/bin/env bash
# Zrzut bazy Postgres z kontenera "db" do /root/backups, z datą w nazwie.
# Usuwa kopie starsze niż 14 dni. Przykład wpisu do crona: patrz DEPLOY.md.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="/root/backups"
TIMESTAMP="$(date +%Y-%m-%d_%H-%M-%S)"

cd "$REPO_DIR"

if [ ! -f .env ]; then
    echo "Nie znaleziono .env w $REPO_DIR" >&2
    exit 1
fi

# shellcheck disable=SC1091
set -a
source .env
set +a

mkdir -p "$BACKUP_DIR"

OUT_FILE="${BACKUP_DIR}/${POSTGRES_DB}_${TIMESTAMP}.sql.gz"

docker compose exec -T db pg_dump -U "${POSTGRES_USER}" "${POSTGRES_DB}" | gzip > "$OUT_FILE"

echo "Backup zapisany: $OUT_FILE"

# Usuń kopie starsze niż 14 dni.
find "$BACKUP_DIR" -maxdepth 1 -name "${POSTGRES_DB}_*.sql.gz" -mtime +14 -delete
