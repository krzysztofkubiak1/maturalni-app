"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, KeyRound, MailCheck } from "lucide-react";
import AuthField from "@/components/AuthField";
import PasswordRulesList, { passwordRules } from "@/components/PasswordRulesList";
import { useAuth } from "@/components/AuthProvider";
import { readApiError } from "@/lib/apiError";

type Challenge = { id: string; destinationHint: string };
type Step = "email" | "code" | "password";

/**
 * "Zapomniałem hasła", trzy osobne kroki:
 *  1. e-mail -> wysyłamy kod,
 *  2. kod -> zatwierdzamy go OSOBNO (POST /password/verify-code), zanim
 *     pokażemy pole na nowe hasło — żeby nie kazać wymyślać hasła komuś,
 *     kto jeszcze nie wie, czy w ogóle ma dobry kod,
 *  3. nowe hasło -> dopiero teraz POST /password/reset (ten sam kod i tak
 *     jest sprawdzany jeszcze raz po stronie backendu).
 */
export default function ForgotPasswordForm() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [step, setStep] = useState<Step>("email");
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleRequestCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const value = String(form.get("email") ?? "").trim();
    setEmail(value);

    try {
      const res = await fetch("/api/auth/password/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });

      if (!res.ok) {
        setError(await readApiError(res, "Nie udało się wysłać kodu. Spróbuj ponownie."));
        setPending(false);
        return;
      }

      const data = (await res.json()) as { challenge_id: string; destination_hint: string };
      setChallenge({ id: data.challenge_id, destinationHint: data.destination_hint });
      setStep("code");
    } catch {
      setError("Brak połączenia z serwerem. Sprawdź, czy backend jest uruchomiony.");
    } finally {
      setPending(false);
    }
  }

  async function handleVerifyCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      const res = await fetch("/api/auth/password/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challenge_id: challenge!.id, code }),
      });

      if (!res.ok) {
        setError(await readApiError(res, "Nieprawidłowy kod. Spróbuj ponownie."));
        setPending(false);
        return;
      }

      setStep("password");
    } catch {
      setError("Brak połączenia z serwerem. Sprawdź, czy backend jest uruchomiony.");
    } finally {
      setPending(false);
    }
  }

  async function handleResetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get("newPassword") ?? "");
    const newPasswordRepeat = String(form.get("newPasswordRepeat") ?? "");

    if (newPassword !== newPasswordRepeat) {
      setError("Hasła nie są takie same.");
      return;
    }
    const failedRule = passwordRules.find((rule) => !rule.test(newPassword));
    if (failedRule) {
      setError(`Hasło musi mieć: ${failedRule.label}.`);
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/auth/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challenge_id: challenge!.id,
          code,
          new_password: newPassword,
        }),
      });

      if (!res.ok) {
        setError(await readApiError(res, "Nie udało się zmienić hasła. Spróbuj ponownie."));
        setPending(false);
        return;
      }

      await refresh();
      router.push("/panel");
      router.refresh();
    } catch {
      setError("Brak połączenia z serwerem. Sprawdź, czy backend jest uruchomiony.");
      setPending(false);
    }
  }

  const errorBanner = error ? (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      {error}
    </p>
  ) : null;

  if (step === "password") {
    return (
      <div className="grid gap-4">
        <button
          type="button"
          onClick={() => {
            setStep("code");
            setError(null);
            setPending(false);
          }}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="size-4" />
          Wróć
        </button>

        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <MailCheck className="mt-0.5 size-4 shrink-0" />
          <span>Kod potwierdzony. Ustaw teraz nowe hasło.</span>
        </div>

        {errorBanner}

        <form onSubmit={handleResetPassword} className="grid gap-4" noValidate>
          <div>
            <AuthField
              id="newPassword"
              name="newPassword"
              type="password"
              label="Nowe hasło"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Minimum 8 znaków"
              autoFocus
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <PasswordRulesList password={password} />
          </div>
          <AuthField
            id="newPasswordRepeat"
            name="newPasswordRepeat"
            type="password"
            label="Powtórz nowe hasło"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Wpisz hasło jeszcze raz"
          />

          <button
            type="submit"
            disabled={pending}
            className="mt-1 inline-flex w-full items-center justify-center rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {pending ? "Zmienianie hasła…" : "Ustaw nowe hasło"}
          </button>
        </form>
      </div>
    );
  }

  if (step === "code") {
    return (
      <div className="grid gap-4">
        <button
          type="button"
          onClick={() => {
            setStep("email");
            setChallenge(null);
            setCode("");
            setError(null);
            setPending(false);
          }}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="size-4" />
          Wróć
        </button>

        <div className="flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900">
          <MailCheck className="mt-0.5 size-4 shrink-0" />
          <span>
            Wysłaliśmy 6-cyfrowy kod na adres <strong>{challenge?.destinationHint}</strong>. Wpisz
            go niżej, żeby przejść dalej.
          </span>
        </div>

        {errorBanner}

        <form onSubmit={handleVerifyCode} className="grid gap-4" noValidate>
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
            {pending ? "Sprawdzanie…" : "Potwierdź kod"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <form onSubmit={handleRequestCode} className="grid gap-4" noValidate>
      <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <KeyRound className="mt-0.5 size-4 shrink-0 text-slate-400" />
        <span>Podaj e-mail, na który wyślemy 6-cyfrowy kod do ustawienia nowego hasła.</span>
      </div>

      {errorBanner}

      <AuthField
        id="email"
        name="email"
        type="email"
        label="E-mail"
        required
        autoComplete="email"
        placeholder="twoj@email.pl"
        defaultValue={email}
      />

      <button
        type="submit"
        disabled={pending}
        className="mt-1 inline-flex w-full items-center justify-center rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Wysyłanie…" : "Wyślij kod"}
      </button>

      <p className="text-center text-sm text-slate-600">
        <Link href="/logowanie" className="font-semibold text-brand-700 underline">
          Wróć do logowania
        </Link>
      </p>
    </form>
  );
}
