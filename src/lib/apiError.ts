/**
 * Wyciąga czytelny komunikat błędu z odpowiedzi FastAPI.
 * FastAPI zwraca:
 *  - błąd biznesowy:  { detail: "tekst" }
 *  - błąd walidacji:  { detail: [ { loc: [...], msg: "...", ... } ] }
 */
export async function readApiError(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    const detail = data?.detail;

    if (typeof detail === "string") return detail;

    if (Array.isArray(detail)) {
      const messages = detail
        .map((item: { msg?: string }) => item?.msg)
        .filter((msg): msg is string => Boolean(msg))
        .map((msg) => msg.replace(/^Value error,\s*/i, ""));
      if (messages.length > 0) return messages.join(" ");
    }
  } catch {
    // odpowiedź nie jest J-SON-em — użyjemy tekstu zapasowego
  }
  return fallback;
}
