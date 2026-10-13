import "server-only";

import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/user";

const INTERNAL_API_URL = process.env.INTERNAL_API_URL ?? "http://127.0.0.1:8000";

export type ConfirmedOrder = {
  id: number;
  course_slug: string;
  course_title: string;
  amount_grosze: number;
  currency: string;
  status: "pending" | "reserved" | "paid" | "failed" | "expired";
  created_at: string;
  paid_at: string | null;
};

export type ConfirmResult =
  | { ok: true; order: ConfirmedOrder }
  | { ok: false; reason: "no-session" | "not-configured" | "not-found" | "error" };

/**
 * Domyka płatność po powrocie ze Stripe: pyta backend o status sesji Checkout.
 * Webhook i tak zrobi to niezależnie — to jest szybka ścieżka dla strony sukcesu.
 */
export async function confirmCheckout(sessionId: string): Promise<ConfirmResult> {
  if (!sessionId) return { ok: false, reason: "no-session" };

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE);
  if (!token) return { ok: false, reason: "no-session" };

  try {
    const res = await fetch(`${INTERNAL_API_URL}/api/checkout/confirm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: `${token.name}=${token.value}`,
      },
      body: JSON.stringify({ session_id: sessionId }),
      cache: "no-store",
    });

    if (res.status === 503) return { ok: false, reason: "not-configured" };
    if (res.status === 404) return { ok: false, reason: "not-found" };
    if (!res.ok) return { ok: false, reason: "error" };

    return { ok: true, order: (await res.json()) as ConfirmedOrder };
  } catch {
    return { ok: false, reason: "error" };
  }
}

export type AdminOrder = {
  id: number;
  course_slug: string;
  course_title: string;
  amount_grosze: number;
  currency: string;
  status: "pending" | "reserved" | "paid" | "failed" | "expired";
  student_name: string;
  student_last_name: string;
  student_email: string;
  student_phone: string;
  student_street: string;
  student_building_number: string;
  student_apartment_number: string | null;
  student_postal_code: string;
  student_city: string;
  preferred_schedule: string;
  is_minor: boolean;
  guardian_name: string | null;
  guardian_last_name: string | null;
  guardian_phone: string | null;
  guardian_email: string | null;
  guardian_street: string | null;
  guardian_building_number: string | null;
  guardian_apartment_number: string | null;
  guardian_postal_code: string | null;
  guardian_city: string | null;
  created_at: string;
  paid_at: string | null;
  user_id: number;
  account_email: string;
};

export type AdminOrdersResult =
  | { ok: true; orders: AdminOrder[] }
  | { ok: false; reason: "no-session" | "forbidden" | "error" };

/** Wszystkie zamówienia — tylko dla kont z ADMIN_EMAILS w backend/.env. */
export async function getAdminOrders(): Promise<AdminOrdersResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE);
  if (!token) return { ok: false, reason: "no-session" };

  try {
    const res = await fetch(`${INTERNAL_API_URL}/api/admin/orders`, {
      headers: { cookie: `${token.name}=${token.value}` },
      cache: "no-store",
    });

    if (res.status === 403) return { ok: false, reason: "forbidden" };
    if (!res.ok) return { ok: false, reason: "error" };

    return { ok: true, orders: (await res.json()) as AdminOrder[] };
  } catch {
    return { ok: false, reason: "error" };
  }
}
