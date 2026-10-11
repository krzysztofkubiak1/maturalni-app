#!/bin/sh
# Z wieloma workerami uvicorn każdy z nich odpalałby init_db() (create_all())
# niezależnie przy starcie — na całkiem pustej bazie Postgres to wyścig, który
# kończy się błędem ("duplicate key ... pg_class_relname_nsp_index") kiedy dwa
# procesy próbują utworzyć tę samą tabelę w tym samym momencie. Dlatego robimy
# to raz, tutaj, zanim w ogóle odpalą się workery.
set -e

python -c "from app.database import init_db; init_db()"

exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers "${UVICORN_WORKERS:-2}"
