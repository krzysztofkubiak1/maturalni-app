"use client";

import { useState } from "react";
import { AlertCircle, CalendarCheck, CheckCircle2 } from "lucide-react";
import AuthField from "@/components/AuthField";
import { readApiError } from "@/lib/apiError";
import { formatScheduleLabel } from "@/lib/schedule";
import { cx } from "@/components/ui";

type Props = {
  slug: string;
  priceAmount: number;
  priceUnit: string;
  recurring: boolean;
  defaultName: string;
  defaultLastName: string;
  defaultEmail: string;
};

/** Dostępne terminy zajęć — wartości muszą być zgodne z SCHEDULE_SLOTS w backend/app/schemas.py. */
const scheduleDays = [
  {
    day: "Wtorek",
    slots: [
      { value: "wtorek-17-19", time: "17:00–19:00" },
      { value: "wtorek-19-21", time: "19:00–21:00" },
    ],
  },
  {
    day: "Czwartek",
    slots: [
      { value: "czwartek-17-19", time: "17:00–19:00" },
      { value: "czwartek-19-21", time: "19:00–21:00" },
    ],
  },
];

/** Ulica / nr domu / nr mieszkania / kod pocztowy / miejscowość — dla kursanta i opiekuna. */
function AddressFields({
  prefix,
  required,
}: {
  prefix: "student" | "guardian";
  required: boolean;
}) {
  const id = (field: string) => `${prefix}${field}`;
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr_1fr]">
        <AuthField
          id={id("Street")}
          name={id("Street")}
          type="text"
          label="Ulica"
          required={required}
          autoComplete="address-line1"
          placeholder="Przykładowa"
        />
        <AuthField
          id={id("BuildingNumber")}
          name={id("BuildingNumber")}
          type="text"
          label="Nr domu"
          required={required}
          placeholder="12"
        />
        <AuthField
          id={id("ApartmentNumber")}
          name={id("ApartmentNumber")}
          type="text"
          label="Nr mieszkania"
          placeholder="opcjonalnie"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <AuthField
          id={id("PostalCode")}
          name={id("PostalCode")}
          type="text"
          label="Kod pocztowy"
          required={required}
          autoComplete="postal-code"
          pattern="\d{2}-\d{3}"
          placeholder="00-000"
          hint="Format: 00-000"
        />
        <AuthField
          id={id("City")}
          name={id("City")}
          type="text"
          label="Miejscowość"
          required={required}
          autoComplete="address-level2"
          placeholder="Warszawa"
        />
      </div>
    </>
  );
}

export default function EnrollmentForm({
  slug,
  priceAmount,
  priceUnit,
  recurring,
  defaultName,
  defaultLastName,
  defaultEmail,
}: Props) {
  const [isMinor, setIsMinor] = useState(false);
  const [schedule, setSchedule] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  // TYMCZASOWE: zamiast przekierowania do płatności, po zapisie pokazujemy tu
  // potwierdzenie rezerwacji (patrz create_enrollment w backend/app/payments.py).
  const [reserved, setReserved] = useState<{ courseTitle: string; scheduleLabel: string } | null>(
    null,
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!schedule) {
      setError("Wybierz termin zajęć.");
      return;
    }

    setPending(true);
    const form = new FormData(event.currentTarget);
    const get = (key: string) => String(form.get(key) ?? "").trim();

    const payload: Record<string, unknown> = {
      course_slug: slug,
      student_name: get("studentName"),
      student_last_name: get("studentLastName"),
      student_email: get("studentEmail"),
      student_phone: get("studentPhone"),
      student_street: get("studentStreet"),
      student_building_number: get("studentBuildingNumber"),
      student_apartment_number: get("studentApartmentNumber") || null,
      student_postal_code: get("studentPostalCode"),
      student_city: get("studentCity"),
      preferred_schedule: schedule,
      is_minor: isMinor,
    };

    if (isMinor) {
      payload.guardian_name = get("guardianName");
      payload.guardian_last_name = get("guardianLastName");
      payload.guardian_phone = get("guardianPhone");
      payload.guardian_email = get("guardianEmail");
      payload.guardian_street = get("guardianStreet");
      payload.guardian_building_number = get("guardianBuildingNumber");
      payload.guardian_apartment_number = get("guardianApartmentNumber") || null;
      payload.guardian_postal_code = get("guardianPostalCode");
      payload.guardian_city = get("guardianCity");
    }

    try {
      // TYMCZASOWE: /api/enrollments tylko zapisuje termin, bez przekierowania
      // do płatności Stripe (to nadal robi /api/checkout/session, patrz backend).
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 409) {
        setError("Ten kurs jest już zarezerwowany albo opłacony na tym koncie — sprawdź panel kursanta.");
        setPending(false);
        return;
      }
      if (!res.ok) {
        setError(await readApiError(res, "Nie udało się zapisać na kurs. Spróbuj ponownie."));
        setPending(false);
        return;
      }

      const data = (await res.json()) as { course_title: string; preferred_schedule: string };
      setReserved({
        courseTitle: data.course_title,
        scheduleLabel: formatScheduleLabel(data.preferred_schedule),
      });
    } catch {
      setError("Brak połączenia z serwerem. Sprawdź, czy backend jest uruchomiony.");
      setPending(false);
    }
  }

  if (reserved) {
    return (
      <div className="grid gap-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <CheckCircle2 className="mx-auto size-12 text-emerald-600" />
        <h2 className="font-display text-xl font-bold text-emerald-900">
          Zarezerwowano termin
        </h2>
        <p className="mx-auto max-w-md text-sm leading-relaxed text-emerald-800">
          Zgłoszenie na kurs <strong>{reserved.courseTitle}</strong> — termin:{" "}
          <strong>{reserved.scheduleLabel}</strong> — dotarło do nas. Odezwiemy się, żeby
          ustalić szczegóły i płatność.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-7 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8"
      noValidate
    >
      {error ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      ) : null}

      <div>
        <h2 className="font-display text-lg font-bold text-ink">Dane kursanta</h2>
        <p className="mt-1 text-sm text-slate-600">
          Osoba, która będzie uczestniczyć w zajęciach.
        </p>

        <div className="mt-4 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <AuthField
              id="studentName"
              name="studentName"
              type="text"
              label="Imię"
              required
              minLength={2}
              autoComplete="given-name"
              defaultValue={defaultName}
            />
            <AuthField
              id="studentLastName"
              name="studentLastName"
              type="text"
              label="Nazwisko"
              required
              minLength={2}
              autoComplete="family-name"
              defaultValue={defaultLastName}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <AuthField
              id="studentEmail"
              name="studentEmail"
              type="email"
              label="E-mail"
              required
              autoComplete="email"
              defaultValue={defaultEmail}
            />
            <AuthField
              id="studentPhone"
              name="studentPhone"
              type="tel"
              label="Telefon"
              required
              inputMode="tel"
              autoComplete="tel"
              placeholder="np. 600 100 200"
            />
          </div>

          <AddressFields prefix="student" required />
        </div>
      </div>

      <fieldset>
        <legend className="font-display text-lg font-bold text-ink">
          Termin zajęć
        </legend>
        <p className="mt-1 text-sm text-slate-600">
          Wybierz dzień i godzinę, które Ci pasują.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {scheduleDays.map(({ day, slots }) => (
            <div key={day} className="rounded-xl border border-slate-200 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {day}
              </p>
              <div className="mt-2 grid gap-2">
                {slots.map((slot) => (
                  <label
                    key={slot.value}
                    className={cx(
                      "flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2 text-sm font-semibold transition",
                      schedule === slot.value
                        ? "border-brand-600 bg-brand-50 text-brand-800"
                        : "border-slate-200 text-slate-600 hover:border-slate-300",
                    )}
                  >
                    <input
                      type="radio"
                      name="preferredSchedule"
                      value={slot.value}
                      checked={schedule === slot.value}
                      onChange={() => setSchedule(slot.value)}
                      className="sr-only"
                    />
                    {slot.time}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </fieldset>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <input
          type="checkbox"
          checked={isMinor}
          onChange={(event) => setIsMinor(event.target.checked)}
          className="mt-0.5 size-4 shrink-0 rounded border-slate-400 accent-brand-600"
        />
        <span>
          <span className="block text-sm font-semibold text-ink">
            Kursant jest niepełnoletni
          </span>
          <span className="mt-0.5 block text-xs text-slate-600">
            Zaznacz, jeśli osoba zapisywana na kurs nie ukończyła 18 lat — poprosimy
            wtedy o dane rodzica lub opiekuna prawnego.
          </span>
        </span>
      </label>

      {isMinor ? (
        <div className="rounded-2xl border border-brand-200 bg-brand-50/60 p-5">
          <h2 className="font-display text-base font-bold text-ink">
            Dane rodzica / opiekuna prawnego
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Będziemy kontaktować się w sprawie kursu i płatności z Państwem, nie
            z kursantem.
          </p>

          <div className="mt-4 grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <AuthField
                id="guardianName"
                name="guardianName"
                type="text"
                label="Imię opiekuna"
                required={isMinor}
                minLength={2}
                autoComplete="given-name"
              />
              <AuthField
                id="guardianLastName"
                name="guardianLastName"
                type="text"
                label="Nazwisko opiekuna"
                required={isMinor}
                minLength={2}
                autoComplete="family-name"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <AuthField
                id="guardianPhone"
                name="guardianPhone"
                type="tel"
                label="Telefon opiekuna"
                required={isMinor}
                inputMode="tel"
                autoComplete="tel"
                placeholder="np. 600 100 200"
              />
              <AuthField
                id="guardianEmail"
                name="guardianEmail"
                type="email"
                label="E-mail opiekuna"
                required={isMinor}
                autoComplete="email"
              />
            </div>

            <p className="mt-1 text-sm font-semibold text-ink">Adres opiekuna</p>
            <AddressFields prefix="guardian" required={isMinor} />
          </div>
        </div>
      ) : null}

      <div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? (
            "Rezerwuję termin…"
          ) : (
            <>
              <CalendarCheck className="size-4" />
              Zarezerwuj termin
            </>
          )}
        </button>

        <p className="mt-2 text-center text-xs text-slate-500">
          {recurring
            ? `Kurs kosztuje ${priceAmount} zł ${priceUnit}.`
            : `Kurs kosztuje ${priceAmount} zł.`}{" "}
          Nie płacisz teraz — po zapisaniu odezwiemy się, żeby ustalić szczegóły i płatność.
        </p>
      </div>
    </form>
  );
}
