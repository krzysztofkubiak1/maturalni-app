# Obraz produkcyjny backendu (FastAPI + uvicorn).
#
# Migracje: ten projekt nie ma Alembica — tabele tworzy sam init_db()
# (SQLModel.metadata.create_all()) przy starcie aplikacji (patrz app/database.py,
# wołane z lifespan w app/main.py). Nic dodatkowego nie trzeba uruchamiać.
#
# psycopg[binary] w requirements.txt ma gotowe koła (wheels) na linux/amd64
# i linux/arm64, więc nie potrzeba tu etapu budowania z kompilatorem C.

FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY docker-entrypoint.sh .
RUN chmod +x docker-entrypoint.sh

# Użytkownik bez uprawnień roota.
RUN useradd --system --create-home --uid 1001 appuser
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=5 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health')" || exit 1

# UVICORN_WORKERS (domyślnie 2) wystarczy na jeden mały VPS; zwiększ, jeśli ruch na to wskaże.
CMD ["./docker-entrypoint.sh"]
