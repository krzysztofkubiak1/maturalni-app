"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import AuthField from "@/components/AuthField";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { useAuth } from "@/components/AuthProvider";
import { readApiError } from "@/lib/apiError";

export default function LoginForm({
  redirectTo = "/panel",
  googleError = false,
}: {
  redirectTo?: string;
  googleError?: boolean;
}) {
  const router = useRouter();
  const { refresh } = useAuth();
  const [error, setError] = useState<string | null>(
    googleError ? "Nie udało się zalogować przez Google. Spróbuj ponownie." : null,
  );
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const payload = {
      email: String(form.get("email") ?? "").trim(),
      password: String(form.get("password") ?? ""),
    };

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        setError(await readApiError(res, "Nie udało się zalogować. Spróbuj ponownie."));
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

        <AuthField
          id="email"
          name="email"
          type="email"
          label="E-mail"
          required
          autoComplete="email"
          placeholder="twoj@email.pl"
        />
        <AuthField
          id="password"
          name="password"
          type="password"
          label="Hasło"
          required
          autoComplete="current-password"
          placeholder="Twoje hasło"
        />

        <button
          type="submit"
          disabled={pending}
          className="mt-1 inline-flex w-full items-center justify-center rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? "Logowanie…" : "Zaloguj się"}
        </button>

        <p className="text-center text-sm text-slate-600">
          Nie masz jeszcze konta?{" "}
          <Link href="/rejestracja" className="font-semibold text-brand-700 underline">
            Załóż konto
          </Link>
        </p>
      </form>
    </div>
  );
}
