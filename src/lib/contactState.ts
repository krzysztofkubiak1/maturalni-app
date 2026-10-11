/**
 * Typ i stan początkowy formularza kontaktowego.
 *
 * Musi żyć POZA `src/app/actions.ts` — plik z dyrektywą "use server" może
 * eksportować wyłącznie funkcje async. Zwykły obiekt (initialContactState)
 * albo typ eksportowany jako wartość runtime powoduje błąd:
 * `A "use server" file can only export async functions, found object.`
 */
export type ContactState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Partial<Record<"name" | "phone" | "email" | "consent" | "form", string>>;
  /** Zachowane wartości pól, żeby użytkownik nie wpisywał wszystkiego od nowa */
  values?: Record<string, string>;
};

export const initialContactState: ContactState = { status: "idle" };
