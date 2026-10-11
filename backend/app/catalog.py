"""
Katalog kursów po stronie backendu — ŹRÓDŁO PRAWDY O CENACH.

Ceny NIGDY nie przychodzą od przeglądarki. Frontend przekazuje tylko `slug`,
a backend sam odczytuje stąd kwotę do pobrania.

Ten plik musi być zgodny z cenami w `src/data/courses.ts` (pole `price.amount`).
Po zmianie ceny tam — zmień ją też tutaj.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class CatalogItem:
    slug: str
    title: str
    # Cena w groszach (1 zł = 100 gr).
    price_grosze: int
    # True = kurs rozliczany miesięcznie. Płatność jednorazowa traktowana jest
    # wtedy jako opłata za pierwszy miesiąc / dostęp startowy.
    recurring: bool


CATALOG: dict[str, CatalogItem] = {
    "matematyka-rozszerzona": CatalogItem(
        "matematyka-rozszerzona",
        "Kurs maturalny z matematyki rozszerzonej",
        10000,
        recurring=True,
    ),
    "matematyka-podstawowa": CatalogItem(
        "matematyka-podstawowa",
        "Kurs maturalny z matematyki podstawowej",
        9000,
        recurring=True,
    ),
    "matematyka-rozszerzona-stacjonarnie": CatalogItem(
        "matematyka-rozszerzona-stacjonarnie",
        "Stacjonarny kurs maturalny z matematyki rozszerzonej",
        14000,
        recurring=True,
    ),
    "matematyka-podstawowa-stacjonarnie": CatalogItem(
        "matematyka-podstawowa-stacjonarnie",
        "Stacjonarny kurs maturalny z matematyki podstawowej",
        13000,
        recurring=True,
    ),
    # Pozostałe kursy (powtórka, VOD) są na razie zdjęte z oferty — zobacz
    # historię `src/data/courses.ts`, jeśli trzeba je przywrócić.
}


def get_item(slug: str) -> CatalogItem | None:
    return CATALOG.get(slug)
