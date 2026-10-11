/**
 * Bezpieczne osadzenie JSON-LD w <script type="application/ld+json">.
 *
 * JSON.stringify nie ucieka sekwencji "</" — wartość zawierająca dosłowne
 * "</script>" mogłaby przedwcześnie zamknąć tag i wstrzyknąć dowolny HTML.
 * Dziś dane tu wchodzące są w całości statyczne (src/data/site.ts,
 * src/data/courses.ts), więc nie da się tego wykorzystać, ale to tania
 * ochrona na przyszłość, gdyby kiedyś trafiły tu dane pochodzące od
 * użytkownika (np. opinie).
 */
export function jsonLdProps(data: unknown): { __html: string } {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}
