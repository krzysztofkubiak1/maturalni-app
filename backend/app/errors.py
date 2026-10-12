"""
Gwarancja, że użytkownik NIGDY nie zobaczy surowego komunikatu Pydantic/Pythona.

Dwa niezależne problemy, które to rozwiązuje:

1. Błędy walidacji (422). FastAPI domyślnie zwraca oryginalne komunikaty
   Pydantic — po angielsku i technicznie, np. "String should have at least
   6 characters" albo "String should match pattern '^\\d{2}-\\d{3}$'".
   Nasze własne @field_validator/@model_validator (raise ValueError(...))
   dostają od Pydantic prefiks "Value error, " przed polskim tekstem — to
   zostaje bez zmian. Wszystko inne (brakujące pole, złe typy, złamane
   ograniczenia długości/wzorca) dostaje polski, ogólny komunikat z mapy
   niżej, zamiast oryginalnego tekstu Pydantic.

2. Zupełnie nieoczekiwane wyjątki (500) — błąd w kodzie, padła baza itp.
   Bez tego handlera FastAPI/Starlette zwraca gołe {"detail": "Internal
   Server Error"} albo (w gorszym razie) wywala surowy traceback. Tu zawsze
   wraca jeden, uprzejmy komunikat, a prawdziwy wyjątek i tak leci do logów
   serwera — do diagnozy, nie do przeglądarki.
"""

from __future__ import annotations

import logging
import re

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

logger = logging.getLogger("app.errors")

_VALUE_ERROR_PREFIX = re.compile(r"^Value error,\s*", re.IGNORECASE)

# Pydantic/pydantic-core "type" -> polski, ogólny komunikat. Używane TYLKO gdy
# nie mamy własnego tekstu z walidatora (patrz _message_for niżej).
_GENERIC_MESSAGES: dict[str, str] = {
    "missing": "To pole jest wymagane.",
    "string_too_short": "Ta wartość jest za krótka.",
    "string_too_long": "Ta wartość jest za długa.",
    "string_pattern_mismatch": "Ta wartość ma nieprawidłowy format.",
    "string_type": "To pole musi być tekstem.",
    "int_type": "To pole musi być liczbą.",
    "int_parsing": "To pole musi być liczbą.",
    "float_parsing": "To pole musi być liczbą.",
    "bool_type": "To pole przyjmuje tylko wartość tak/nie.",
    "bool_parsing": "To pole przyjmuje tylko wartość tak/nie.",
    "json_invalid": "Nieprawidłowy format danych.",
    "extra_forbidden": "Niedozwolone dodatkowe pole.",
}

_FALLBACK_MESSAGE = "Ta wartość jest nieprawidłowa."


def _message_for(error: dict) -> str:
    error_type = str(error.get("type", ""))

    if error_type == "value_error":
        # Albo nasz własny @field_validator/@model_validator (ValueError z polskim
        # tekstem — zostaw), albo wewnętrzny walidator Pydantic (np. EmailStr,
        # zawsze po angielsku — zamień na polski ogólny komunikat o e-mailu).
        loc = error.get("loc") or ()
        field_name = str(loc[-1]) if loc else ""
        if field_name.lower().endswith("email"):
            return "Podaj poprawny adres e-mail."
        msg = str(error.get("msg", ""))
        cleaned = _VALUE_ERROR_PREFIX.sub("", msg).strip()
        return cleaned or _FALLBACK_MESSAGE

    return _GENERIC_MESSAGES.get(error_type, _FALLBACK_MESSAGE)


async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    # Tylko loc/msg/type — bez "input" (nie odsyłamy z powrotem tego, co ktoś
    # wpisał, np. hasła) i bez "ctx" (bywają w nim obiekty nie do zserializowania).
    detail = [
        {"loc": error.get("loc", []), "msg": _message_for(error), "type": error.get("type", "")}
        for error in exc.errors()
    ]
    return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"detail": detail})


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Nieobsłużony błąd: %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Coś poszło nie tak po naszej stronie. Spróbuj za chwilę."},
    )


def install_error_handlers(app: FastAPI) -> None:
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    # HTTPException ma już własny (domyślny) handler FastAPI, bardziej
    # szczegółowy niż ten ogólny — ten łapie tylko to, co NIE jest ani
    # HTTPException, ani RequestValidationError (patrz kolejność lookupu
    # handlerów w Starlette: dopasowanie po konkretnej klasie wygrywa).
    app.add_exception_handler(Exception, unhandled_exception_handler)
