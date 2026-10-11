"use server";

import { courses } from "@/data/courses";
import type { ContactState } from "@/lib/contactState";

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

  const courseTitle =
    courses.find((c) => c.slug === course)?.title ?? "nie wybrano kursu";

  const submission = {
    receivedAt: new Date().toISOString(),
    name,
    phone,
    email: email || "—",
    course: courseTitle,
    message: message || "—",
  };

  try {
    // ------------------------------------------------------------------
    // TODO: podłącz docelową obsługę zgłoszenia. Możliwości:
    //  1. Wysyłka e-maila (np. Resend):
    //       await resend.emails.send({ to: contact.email, subject: ..., text: ... })
    //  2. Zapis do bazy (Supabase / Postgres / Airtable)
    //  3. Webhook do CRM-u albo powiadomienie na Slacka/Discorda
    //
    // Na razie zgłoszenie trafia tylko do logów serwera — pamiętaj, żeby
    // podmienić to przed uruchomieniem strony produkcyjnie.
    // ------------------------------------------------------------------
    console.log("[zgłoszenie z formularza]", submission);

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
