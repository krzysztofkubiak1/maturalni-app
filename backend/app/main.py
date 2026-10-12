"""
Punkt wejścia aplikacji FastAPI.

Uruchomienie (z katalogu backend/, z aktywnym venv):
    python -m uvicorn app.main:app --reload --port 8000

Dokumentacja API po starcie: http://localhost:8000/docs
"""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import auth, contact, payments
from .config import settings
from .database import init_db
from .errors import install_error_handlers


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Przy starcie: utwórz tabele, jeśli ich nie ma.
    init_db()
    yield


app = FastAPI(title="Maturalia — API", version="0.1.0", lifespan=lifespan)
install_error_handlers(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(payments.router)
app.include_router(contact.router)


@app.get("/api/health", tags=["meta"])
def health() -> dict[str, str]:
    return {"status": "ok"}
