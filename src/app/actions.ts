"use server";

import { courses } from "@/data/courses";
import type { ContactState } from "@/lib/contactState";

// Server Action działa na serwerze Next.js, nie w przeglądarce — bezpiecznie
// woła backend wewnętrznym adresem (ten sam wzorzec co src/lib/auth.ts).
const INTERNAL_API_URL = process.env.INTERNAL_API_URL ?? "http://127.0.0.1:8000";

const digitsOnly = (value: string) => value.replace(/\D/g, "");

export async function submitContact(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const get = (key: string) => String(formData.get(key) ?? "").trim();

  const name = get("name");
  const phone = get("phone");
  const email = get("email");
  const course = get("course");
  const message = get("message");
  const consent = formData.get("consent") === "on";
  // Pole-pułapka na boty — człowiek go nie widzi i nie wypełni
  const honeypot = get("company");

  const values = { name, phone, email, course, message };

  if (honeypot) {
    // Udajemy sukces, żeby bot nie próbował ponownie
    return { status: "success", message: "Dziękujemy, odezwiemy się wkrótce." };
  }

  const errors: ContactState["errors"] = {};

  if (name.length < 2) {
    errors.name = "Podaj imię (minimum 2 znaki).";
  }

  const phoneDigits = digitsOnly(phone);
  if (phoneDigits.length < 9 || phoneDigits.length > 15) {
    errors.phone = "Podaj poprawny numer telefonu (9 cyfr dla numerów polskich).";
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    errors.email = "Ten adres e-mail wygląda na niepoprawny.";
  }

  if (!consent) {
    errors.consent = "Bez zgody na kontakt nie możemy do Ciebie oddzwonić.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      status: "error",
      message: "Popraw zaznaczone pola i spróbuj ponownie.",
      errors,
      values,
    };
  }

  const courseTitle = course ? courses.find((c) => c.slug === course)?.title ?? null : null;

  try {
    const res = await fetch(`${INTERNAL_API_URL}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        phone,
        email: email || null,
        course_slug: course || null,
        course_title: courseTitle,
        message: message || null,
        consent,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return {
        status: "error",
        message: "Popraw zaznaczone pola i spróbuj ponownie.",
        errors: mapBackendErrors(body?.detail),
        values,
      };
    }

    return {
      status: "success",
      message:
        "Dziękujemy! Zgłoszenie do nas dotarło — oddzwonimy w ciągu jednego dnia roboczego.",
    };
  } catch (error) {
    console.error("[błąd wysyłki zgłoszenia]", error);
    return {
      status: "error",
      message:
        "Coś poszło nie tak przy wysyłce. Zadzwoń do nas albo spróbuj ponownie za chwilę.",
      errors: { form: "Błąd serwera." },
      values,
    };
  }
}

/** Mapuje {detail: [{loc, msg}]} z FastAPI na pola formularza (patrz ContactState). */
function mapBackendErrors(detail: unknown): NonNullable<ContactState["errors"]> {
  const knownFields = new Set(["name", "phone", "email", "consent"]);
  const errors: NonNullable<ContactState["errors"]> = {};

  if (!Array.isArray(detail) || detail.length === 0) {
    errors.form = "Nie udało się wysłać zgłoszenia. Spróbuj ponownie.";
    return errors;
  }

  for (const item of detail) {
    const loc = Array.isArray(item?.loc) ? item.loc : [];
    const field = String(loc[loc.length - 1] ?? "");
    const msg = typeof item?.msg === "string" ? item.msg : "Nieprawidłowa wartość.";
    if (knownFields.has(field)) {
      errors[field as "name" | "phone" | "email" | "consent"] = msg;
    } else {
      errors.form = msg;
    }
  }

  return errors;
}
