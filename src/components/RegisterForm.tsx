"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, Check, X } from "lucide-react";
import AuthField from "@/components/AuthField";
import CodeVerificationForm from "@/components/CodeVerificationForm";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { readApiError } from "@/lib/apiError";
import { cx } from "@/components/ui";

type Challenge = { id: string; destinationHint: string };

const passwordRules = [
  { label: "co najmniej 8 znaków", test: (v: string) => v.length >= 8 },
  { label: "co najmniej jedna litera", test: (v: string) => /[a-zA-Z]/.test(v) },
  { label: "co najmniej jedna cyfra", test: (v: string) => /\d/.test(v) },
];

function PasswordRulesList({ password }: { password: string }) {
  return (
    <ul className="mt-1.5 grid gap-1">
      {passwordRules.map((rule) => {
        const ok = rule.test(password);
        return (
          <li
            key={rule.label}
            className={cx(
              "flex items-center gap-1.5 text-xs",
              ok ? "text-emerald-700" : "text-slate-500",
            )}
          >
            {ok ? (
              <Check className="size-3.5 shrink-0" />
            ) : (
              <X className="size-3.5 shrink-0 text-slate-300" />
            )}
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}

export default function RegisterForm({
  redirectTo = "/panel",
  googleError = false,
}: {
  redirectTo?: string;
  googleError?: boolean;
}) {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [error, setError] = useState<string | null>(
    googleError ? "Nie udało się zalogować przez Google. Spróbuj ponownie." : null,
  );
  const [pending, setPending] = useState(false);
  const [password, setPassword] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const lastName = String(form.get("lastName") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const passwordValue = String(form.get("password") ?? "");
    const passwordRepeat = String(form.get("passwordRepeat") ?? "");
    const acceptTerms = form.get("acceptTerms") === "on";

    if (passwordValue !== passwordRepeat) {
      setError("Hasła nie są takie same.");
      return;
    }
    const failedRule = passwordRules.find((rule) => !rule.test(passwordValue));
    if (failedRule) {
      setError(`Hasło musi mieć: ${failedRule.label}.`);
      return;
    }
    if (!acceptTerms) {
      setError("Musisz zaakceptować regulamin i politykę prywatności, żeby założyć konto.");
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          last_name: lastName,
          email,
          password: passwordValue,
          accept_terms: acceptTerms,
        }),
      });

      if (!res.ok) {
        setError(await readApiError(res, "Nie udało się założyć konta. Spróbuj ponownie."));
        setPending(false);
        return;
      }

      const data = (await res.json()) as { challenge_id: string; destination_hint: string };
      setChallenge({ id: data.challenge_id, destinationHint: data.destination_hint });
    } catch {
      setError("Brak połączenia z serwerem. Sprawdź, czy backend jest uruchomiony.");
      setPending(false);
    }
  }

  if (challenge) {
    return (
      <CodeVerificationForm
        challengeId={challenge.id}
        destinationHint={challenge.destinationHint}
        redirectTo={redirectTo}
        onBack={() => {
          setChallenge(null);
          setPending(false);
        }}
      />
    );
  }

  return (
    <div className="grid gap-5">
      <GoogleSignInButton redirectTo={redirectTo} />

      <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        albo e-mailem
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
      {error ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <AuthField
          id="name"
          name="name"
          type="text"
          label="Imię"
          required
          minLength={2}
          autoComplete="given-name"
          placeholder="Imię"
        />
        <AuthField
          id="lastName"
          name="lastName"
          type="text"
          label="Nazwisko"
          required
          minLength={2}
          autoComplete="family-name"
          placeholder="Nazwisko"
        />
      </div>
      <AuthField
        id="email"
        name="email"
        type="email"
        label="E-mail"
        required
        autoComplete="email"
        placeholder="twoj@email.pl"
      />
      <div>
        <AuthField
          id="password"
          name="password"
          type="password"
          label="Hasło"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Minimum 8 znaków"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <PasswordRulesList password={password} />
      </div>
      <AuthField
        id="passwordRepeat"
        name="passwordRepeat"
        type="password"
        label="Powtórz hasło"
        required
        minLength={8}
        autoComplete="new-password"
        placeholder="Wpisz hasło jeszcze raz"
      />

      <label className="flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-slate-600">
        <input
          type="checkbox"
          name="acceptTerms"
          required
          className="mt-0.5 size-4 shrink-0 rounded border-slate-400 accent-brand-600"
        />
        <span>
          Rejestruję się i akceptuję{" "}
          <Link href="/regulamin" className="font-semibold text-brand-700 underline">
            regulamin
          </Link>{" "}
          oraz{" "}
          <Link href="/polityka-prywatnosci" className="font-semibold text-brand-700 underline">
            politykę prywatności
          </Link>
          . <span className="text-red-600">*</span>
        </span>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="mt-1 inline-flex w-full items-center justify-center rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Wysyłanie kodu…" : "Załóż konto"}
      </button>

      <p className="text-center text-xs text-slate-500">
        Po rejestracji wyślemy Ci na e-mail 6-cyfrowy kod, żeby potwierdzić, że to
        naprawdę Twoja skrzynka.
      </p>

      <p className="text-center text-sm text-slate-600">
        Masz już konto?{" "}
        <Link href="/logowanie" className="font-semibold text-brand-700 underline">
          Zaloguj się
        </Link>
      </p>
      </form>
    </div>
  );
}
