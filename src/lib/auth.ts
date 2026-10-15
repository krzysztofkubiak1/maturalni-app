import "server-only";

import { cookies } from "next/headers";
import { SESSION_COOKIE, type AuthUser } from "@/lib/user";

// Serwer Next.js woła backend bezpośrednio (z pominięciem proxy /api/*).
// Na produkcji ustaw INTERNAL_API_URL na wewnętrzny adres API.
const INTERNAL_API_URL = process.env.INTERNAL_API_URL ?? "http://127.0.0.1:8000";

/**
 * Zwraca zalogowanego użytkownika albo null.
 * Do użycia wyłącznie w komponentach serwerowych (czyta ciasteczko żądania).
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE);
  if (!token) return null;

  try {
    const res = await fetch(`${INTERNAL_API_URL}/api/auth/me`, {
      headers: { cookie: `${token.name}=${token.value}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as AuthUser;
  } catch {
    // Backend nie odpowiada — traktujemy jak brak sesji.
    return null;
  }
}

export type PurchasedCourse = {
  course_slug: string;
  course_title: string;
  purchased_at: string;
  status: "reserved" | "paid";
};

/** Lista kursów zalogowanego użytkownika — zarezerwowanych i opłaconych. */
export async function getMyCourses(): Promise<PurchasedCourse[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE);
  if (!token) return [];

  try {
    const res = await fetch(`${INTERNAL_API_URL}/api/me/courses`, {
      headers: { cookie: `${token.name}=${token.value}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
    return (await res.json()) as PurchasedCourse[];
  } catch {
    return [];
  }
}

export type MyOrder = {
  id: number;
  course_slug: string;
  course_title: string;
  amount_grosze: number;
  currency: string;
  status: "pending" | "reserved" | "paid" | "failed" | "expired";
  preferred_schedule: string;
  created_at: string;
  paid_at: string | null;
};

/**
 * Szczegóły rezerwacji/zamówienia zalogowanego użytkownika dla danego kursu
 * (do strony "Twoja rezerwacja" w panelu) — najnowsze zarezerwowane albo
 * opłacone zamówienie na ten kurs, albo `null`, jeśli takiego nie ma.
 */
export async function getMyOrderForCourse(courseSlug: string): Promise<MyOrder | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE);
  if (!token) return null;

  try {
    const res = await fetch(`${INTERNAL_API_URL}/api/me/orders`, {
      headers: { cookie: `${token.name}=${token.value}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const orders = (await res.json()) as MyOrder[];
    return (
      orders.find(
        (order) =>
          order.course_slug === courseSlug && (order.status === "paid" || order.status === "reserved"),
      ) ?? null
    );
  } catch {
    return null;
  }
}
