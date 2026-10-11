"""Połączenie z bazą danych i tworzenie tabel."""

from __future__ import annotations

from collections.abc import Iterator
from pathlib import Path

from sqlmodel import Session, SQLModel, create_engine

from .config import settings

# Dla SQLite trzeba wyłączyć sprawdzanie wątku — FastAPI obsługuje żądania w puli wątków.
_connect_args = (
    {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
)

engine = create_engine(settings.database_url, echo=False, connect_args=_connect_args)


def _ensure_sqlite_dir() -> None:
    """Utwórz katalog na plik bazy SQLite, jeśli jeszcze nie istnieje."""
    prefix = "sqlite:///"
    if settings.database_url.startswith(prefix):
        db_path = Path(settings.database_url[len(prefix) :])
        db_path.parent.mkdir(parents=True, exist_ok=True)


def _migrate_sqlite_schema() -> None:
    """
    Dopisz brakujące kolumny do istniejących tabel SQLite.

    `create_all` tworzy tylko tabele, których jeszcze nie ma — nie modyfikuje
    tabel już istniejących. Ten projekt nie ma Alembica, więc dla nowych,
    nullable kolumn robimy to ręcznie, żeby stara baza z danymi testowymi nie
    przestała działać po dodaniu pola w models.py.
    """
    if not settings.database_url.startswith("sqlite"):
        return
    with engine.begin() as conn:
        tables = {
            row[0]
            for row in conn.exec_driver_sql(
                "SELECT name FROM sqlite_master WHERE type='table'"
            ).fetchall()
        }
        if "user" not in tables:
            return
        columns = {row[1] for row in conn.exec_driver_sql("PRAGMA table_info(user)").fetchall()}
        if "accepted_terms_version" not in columns:
            conn.exec_driver_sql("ALTER TABLE user ADD COLUMN accepted_terms_version TEXT")
        if "accepted_terms_at" not in columns:
            conn.exec_driver_sql("ALTER TABLE user ADD COLUMN accepted_terms_at TEXT")
        if "google_sub" not in columns:
            # ALTER TABLE ADD COLUMN nie umie dopisać UNIQUE — dokładamy go jako
            # osobny indeks. SQLite nie traktuje wielu NULL-i jako konfliktu
            # unikalności, więc konta bez Google (NULL) nie kolidują ze sobą.
            conn.exec_driver_sql("ALTER TABLE user ADD COLUMN google_sub TEXT")
            conn.exec_driver_sql(
                "CREATE UNIQUE INDEX IF NOT EXISTS ix_user_google_sub ON user (google_sub)"
            )


def init_db() -> None:
    """Utwórz wszystkie tabele zdefiniowane w models.py (jeśli nie istnieją)."""
    _ensure_sqlite_dir()
    # Import modeli musi nastąpić przed create_all, żeby SQLModel je zarejestrował.
    from . import models  # noqa: F401

    SQLModel.metadata.create_all(engine)
    _migrate_sqlite_schema()


def get_session() -> Iterator[Session]:
    """Zależność FastAPI: jedna sesja bazy na żądanie."""
    with Session(engine) as session:
        yield session
