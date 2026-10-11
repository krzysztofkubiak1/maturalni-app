"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, MailCheck } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { readApiError } from "@/lib/apiError";

/**
 * Drugi krok rejestracji: wpisanie 6-cyfrowego kodu wysłanego e-mailem, żeby
 * potwierdzić, że konto zakłada właściciel danej skrzynki. Logowanie już
 * istniejącym kontem jest jednoetapowe (patrz LoginForm) i tego komponentu
 * nie używa.
 */
export default function CodeVerificationForm({
  challengeId: initialChallengeId,
  destinationHint,
  redirectTo,
  onBack,
}: {
  challengeId: string;
  destinationHint: string;
  redirectTo: string;
  onBack: () => void;
}) {
  const router = useRouter();
  const { refresh } = useAuth();
  const [challengeId, setChallengeId] = useState(initialChallengeId);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [resending, setResending] = useState(false);
  const [justResent, setJustResent] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      const res = await fetch("/api/auth/login/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challenge_id: challengeId, code }),
      });

      if (!res.ok) {
        setError(await readApiError(res, "Nieprawidłowy kod. Spróbuj ponownie."));
        setPending(false);
        return;
      }

      await refresh();
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("Brak połączenia z serwerem. Sprawdź, czy backend jest uruchomiony.");
      setPending(false);
    }
  }

  async function handleResend() {
    setError(null);
    setJustResent(false);
    setResending(true);

    try {
      const res = await fetch("/api/auth/login/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challenge_id: challengeId }),
      });

      if (!res.ok) {
        setError(await readApiError(res, "Nie udało się wysłać kodu ponownie."));
        setResending(false);
        return;
      }

      const data = (await res.json()) as { challenge_id: string };
      // Poprzedni kod przestaje działać — od teraz liczy się tylko nowe wyzwanie.
      setChallengeId(data.challenge_id);
      setCode("");
      setJustResent(true);
    } catch {
      setError("Brak połączenia z serwerem.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="grid gap-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="size-4" />
        Wróć
      </button>

      <div className="flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900">
        <MailCheck className="mt-0.5 size-4 shrink-0" />
        <span>
          Wysłaliśmy 6-cyfrowy kod na adres <strong>{destinationHint}</strong>. Wpisz go
          poniżej, żeby potwierdzić e-mail i dokończyć zakładanie konta.
        </span>
      </div>

      {error ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
        <div>
          <label htmlFor="code" className="mb-1.5 block text-sm font-semibold text-ink">
            Kod z e-maila
          </label>
          <input
            id="code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            required
            autoFocus
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-center font-display text-2xl font-bold tracking-[0.5em] text-ink placeholder:text-slate-300 transition focus:outline-2 focus:-outline-offset-1 focus:outline-brand-600"
          />
        </div>

        <button
          type="submit"
          disabled={pending || code.length !== 6}
          className="inline-flex w-full items-center justify-center rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? "Sprawdzanie…" : "Potwierdź i załóż konto"}
        </button>
      </form>

      <button
        type="button"
        onClick={handleResend}
        disabled={resending}
        className="text-center text-sm font-semibold text-brand-700 underline disabled:cursor-not-allowed disabled:opacity-60"
      >
        {resending ? "Wysyłanie…" : justResent ? "Wysłano nowy kod" : "Wyślij kod ponownie"}
      </button>
    </div>
  );
}
