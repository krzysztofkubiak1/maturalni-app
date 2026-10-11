"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2, Send } from "lucide-react";
import { submitContact } from "@/app/actions";
import { initialContactState } from "@/lib/contactState";
import { courses } from "@/data/courses";
import { cx } from "@/components/ui";

const fieldBase =
  "w-full rounded-xl border bg-white px-4 py-3 text-sm text-ink placeholder:text-slate-400 transition focus:outline-2 focus:-outline-offset-1 focus:outline-brand-600";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? (
        "Wysyłanie…"
      ) : (
        <>
          <Send className="size-4" />
          Proszę o kontakt
        </>
      )}
    </button>
  );
}

export default function ContactForm({
  defaultCourse,
  compact = false,
}: {
  defaultCourse?: string;
  compact?: boolean;
}) {
  const [state, formAction] = useActionState(submitContact, initialContactState);

  if (state.status === "success") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <CheckCircle2 className="mx-auto size-12 text-emerald-600" />
        <h3 className="mt-4 font-display text-xl font-bold text-emerald-900">
          Zgłoszenie wysłane
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-emerald-800">
          {state.message}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      {state.status === "error" && state.message ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {state.message}
        </p>
      ) : null}

      <div className={cx("grid gap-4", !compact && "sm:grid-cols-2")}>
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-semibold text-ink">
            Imię <span className="text-red-600">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="given-name"
            defaultValue={state.values?.name}
            aria-invalid={Boolean(state.errors?.name)}
            aria-describedby={state.errors?.name ? "blad-name" : undefined}
            placeholder="Jak masz na imię?"
            className={cx(
              fieldBase,
              state.errors?.name ? "border-red-400" : "border-slate-300",
            )}
          />
          {state.errors?.name ? (
            <p id="blad-name" className="mt-1.5 text-xs font-medium text-red-700">
              {state.errors.name}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm font-semibold text-ink">
            Telefon <span className="text-red-600">*</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            inputMode="tel"
            autoComplete="tel"
            defaultValue={state.values?.phone}
            aria-invalid={Boolean(state.errors?.phone)}
            aria-describedby={state.errors?.phone ? "blad-phone" : undefined}
            placeholder="np. 600 100 200"
            className={cx(
              fieldBase,
              state.errors?.phone ? "border-red-400" : "border-slate-300",
            )}
          />
          {state.errors?.phone ? (
            <p id="blad-phone" className="mt-1.5 text-xs font-medium text-red-700">
              {state.errors.phone}
            </p>
          ) : null}
        </div>
      </div>

      <div className={cx("grid gap-4", !compact && "sm:grid-cols-2")}>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-ink">
            E-mail <span className="font-normal text-slate-500">(opcjonalnie)</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={state.values?.email}
            aria-invalid={Boolean(state.errors?.email)}
            aria-describedby={state.errors?.email ? "blad-email" : undefined}
            placeholder="twoj@email.pl"
            className={cx(
              fieldBase,
              state.errors?.email ? "border-red-400" : "border-slate-300",
            )}
          />
          {state.errors?.email ? (
            <p id="blad-email" className="mt-1.5 text-xs font-medium text-red-700">
              {state.errors.email}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="course" className="mb-1.5 block text-sm font-semibold text-ink">
            Interesujący Cię kurs
          </label>
          <select
            id="course"
            name="course"
            defaultValue={state.values?.course ?? defaultCourse ?? ""}
            className={cx(fieldBase, "border-slate-300")}
          >
            <option value="">Jeszcze nie wiem / poproszę o doradztwo</option>
            {courses.map((course) => (
              <option key={course.slug} value={course.slug}>
                {course.shortTitle} — {course.format}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="message" className="mb-1.5 block text-sm font-semibold text-ink">
          Wiadomość <span className="font-normal text-slate-500">(opcjonalnie)</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={compact ? 3 : 4}
          defaultValue={state.values?.message}
          placeholder="Napisz, na jakim jesteś poziomie i jaki wynik chcesz osiągnąć — łatwiej nam będzie dobrać grupę."
          className={cx(fieldBase, "resize-y border-slate-300")}
        />
      </div>

      {/* Pole-pułapka na boty (ukryte przed użytkownikami) */}
      <div className="absolute left-[-9999px]" aria-hidden="true">
        <label htmlFor="company">Nie wypełniaj tego pola</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label className="flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-slate-600">
          <input
            type="checkbox"
            name="consent"
            className="mt-0.5 size-4 shrink-0 rounded border-slate-400 accent-brand-600"
            aria-invalid={Boolean(state.errors?.consent)}
          />
          <span>
            Wyrażam zgodę na kontakt telefoniczny lub mailowy w sprawie oferty kursów
            oraz na przetwarzanie moich danych osobowych w tym celu.{" "}
            <a href="/polityka-prywatnosci" className="font-semibold text-brand-700 underline">
              Polityka prywatności
            </a>
            . <span className="text-red-600">*</span>
          </span>
        </label>
        {state.errors?.consent ? (
          <p className="mt-1.5 text-xs font-medium text-red-700">{state.errors.consent}</p>
        ) : null}
      </div>

      <SubmitButton />

      <p className="text-center text-xs text-slate-500">
        Oddzwaniamy zwykle w ciągu jednego dnia roboczego.
      </p>
    </form>
  );
}
