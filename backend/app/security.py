"""Hashowanie haseł i generowanie tokenów sesji."""

from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timezone

from pwdlib import PasswordHash

# PasswordHash.recommended() używa argon2 — nowoczesnego algorytmu do haseł.
_password_hash = PasswordHash.recommended()


def utcnow() -> datetime:
    """Bieżący czas UTC bez informacji o strefie (spójnie z tym, co zwraca SQLite)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def hash_password(plain_password: str) -> str:
    return _password_hash.hash(plain_password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    return _password_hash.verify(plain_password, password_hash)


def generate_session_token() -> str:
    """Losowy, trudny do odgadnięcia token — trafia do ciasteczka użytkownika."""
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    """Hash tokenu / kodu — to trafia do bazy (a nie wartość jawna)."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def generate_challenge_id() -> str:
    """Opaque identyfikator wyzwania logowania — trafia do frontu (nie jest tajny)."""
    return secrets.token_urlsafe(24)


def generate_otp_code() -> str:
    """6-cyfrowy kod jednorazowy wysyłany e-mailem."""
    return f"{secrets.randbelow(1_000_000):06d}"
