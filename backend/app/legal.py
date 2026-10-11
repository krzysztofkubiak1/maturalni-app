"""Wersja dokumentów prawnych (regulamin + polityka prywatności).

Przy KAŻDEJ zmianie treści `/regulamin` lub `/polityka-prywatnosci` podnieś tę
wartość (np. na datę zmiany). Dzięki temu w bazie zostaje ślad, którą dokładnie
wersję dokumentów zaakceptował dany użytkownik przy rejestracji
(`User.accepted_terms_version` / `User.accepted_terms_at`).
"""

CURRENT_TERMS_VERSION = "2026-09-17"
