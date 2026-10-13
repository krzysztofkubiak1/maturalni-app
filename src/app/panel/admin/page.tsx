import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Baby,
  CalendarClock,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldAlert,
} from "lucide-react";
import PageHero from "@/components/PageHero";
import { Badge, Container, cx } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getAdminOrders, type AdminOrder } from "@/lib/payments";
import { formatScheduleLabel } from "@/lib/schedule";

export const metadata: Metadata = {
  title: "Panel administracyjny",
  robots: { index: false, follow: false },
};

// Lista zamówień — zawsze świeża, nigdy z cache'u.
export const dynamic = "force-dynamic";

const statusLabels: Record<AdminOrder["status"], { label: string; tone: "green" | "accent" | "neutral" }> = {
  paid: { label: "Opłacone", tone: "green" },
  reserved: { label: "Zarezerwowano — czeka na grupę", tone: "accent" },
  pending: { label: "Checkout rozpoczęty, nieopłacone", tone: "neutral" },
  failed: { label: "Płatność nieudana", tone: "neutral" },
  expired: { label: "Sesja wygasła", tone: "neutral" },
};

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAddress(order: {
  street: string | null;
  buildingNumber: string | null;
  apartmentNumber: string | null;
  postalCode: string | null;
  city: string | null;
}): string {
  if (!order.street) return "—";
  const number = order.buildingNumber
    ? order.apartmentNumber
      ? `${order.buildingNumber}/${order.apartmentNumber}`
      : order.buildingNumber
    : "";
  return `${order.street} ${number}, ${order.postalCode} ${order.city}`.trim();
}

function OrderCard({ order }: { order: AdminOrder }) {
  const status = statusLabels[order.status];
  const amount = (order.amount_grosze / 100).toFixed(2);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Badge tone={status.tone}>{status.label}</Badge>
        <span className="flex items-center gap-1.5 text-xs text-slate-500">
          <CalendarClock className="size-3.5" />
          Złożono: {formatDateTime(order.created_at)}
          {order.paid_at ? ` · Opłacono: ${formatDateTime(order.paid_at)}` : ""}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-base font-bold text-ink">{order.course_title}</h2>
        <p className="text-sm font-semibold text-ink">
          {amount} {order.currency.toUpperCase()}
        </p>
      </div>
      <p className="mt-1 text-sm text-brand-700">
        Termin: {formatScheduleLabel(order.preferred_schedule)}
      </p>

      <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Kursant
          </p>
          <p className="mt-1 text-sm font-semibold text-ink">
            {order.student_name} {order.student_last_name}
          </p>
          <ul className="mt-1.5 space-y-1 text-xs text-slate-600">
            <li className="flex items-center gap-1.5">
              <Mail className="size-3.5 shrink-0" />
              {order.student_email}
            </li>
            <li className="flex items-center gap-1.5">
              <Phone className="size-3.5 shrink-0" />
              {order.student_phone}
            </li>
            <li className="flex items-start gap-1.5">
              <MapPin className="mt-0.5 size-3.5 shrink-0" />
              {formatAddress({
                street: order.student_street,
                buildingNumber: order.student_building_number,
                apartmentNumber: order.student_apartment_number,
                postalCode: order.student_postal_code,
                city: order.student_city,
              })}
            </li>
          </ul>
        </div>

        {order.is_minor ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-800">
              <Baby className="size-3.5" />
              Niepełnoletni — opiekun
            </p>
            <p className="mt-1 text-sm font-semibold text-ink">
              {order.guardian_name} {order.guardian_last_name}
            </p>
            <ul className="mt-1.5 space-y-1 text-xs text-slate-600">
              <li className="flex items-center gap-1.5">
                <Mail className="size-3.5 shrink-0" />
                {order.guardian_email}
              </li>
              <li className="flex items-center gap-1.5">
                <Phone className="size-3.5 shrink-0" />
                {order.guardian_phone}
              </li>
              <li className="flex items-start gap-1.5">
                <MapPin className="mt-0.5 size-3.5 shrink-0" />
                {formatAddress({
                  street: order.guardian_street,
                  buildingNumber: order.guardian_building_number,
                  apartmentNumber: order.guardian_apartment_number,
                  postalCode: order.guardian_postal_code,
                  city: order.guardian_city,
                })}
              </li>
            </ul>
          </div>
        ) : (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Konto zapisujące
            </p>
            <p className="mt-1 text-sm text-slate-600">{order.account_email}</p>
          </div>
        )}
      </div>

      {order.is_minor ? (
        <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
          Konto zapisujące: {order.account_email}
        </p>
      ) : null}
    </article>
  );
}

export default async function AdminOrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/logowanie?po-zalogowaniu=/panel/admin");

  const result = await getAdminOrders();

  return (
    <>
      <PageHero
        crumbs={[{ label: "Panel", href: "/panel" }, { label: "Administracja" }]}
        eyebrow="Panel administracyjny"
        title="Wszystkie zapisy"
        description="Lista zgłoszeń ze wszystkich kursów — najnowsze na górze."
      />

      <section className="bg-slate-50 py-16 sm:py-20">
        <Container className="max-w-3xl">
          {!result.ok ? (
            <div
              className={cx(
                "rounded-2xl border p-8 text-center",
                result.reason === "forbidden"
                  ? "border-amber-200 bg-amber-50"
                  : "border-red-200 bg-red-50",
              )}
            >
              {result.reason === "forbidden" ? (
                <>
                  <Lock className="mx-auto size-10 text-amber-600" />
                  <h1 className="mt-3 font-display text-lg font-bold text-amber-900">
                    Brak dostępu
                  </h1>
                  <p className="mt-2 text-sm text-amber-800">
                    To konto ({user.email}) nie jest na liście administratorów. Dodaj ten
                    adres do <code className="rounded bg-amber-100 px-1 py-0.5">ADMIN_EMAILS</code>{" "}
                    w <code className="rounded bg-amber-100 px-1 py-0.5">backend/.env</code> i
                    zaloguj się ponownie.
                  </p>
                </>
              ) : (
                <>
                  <ShieldAlert className="mx-auto size-10 text-red-600" />
                  <h1 className="mt-3 font-display text-lg font-bold text-red-900">
                    Nie udało się wczytać zamówień
                  </h1>
                  <p className="mt-2 text-sm text-red-800">
                    Sprawdź, czy backend jest uruchomiony, i odśwież stronę.
                  </p>
                </>
              )}
              <Link
                href="/panel"
                className="mt-4 inline-flex text-sm font-semibold text-brand-700 underline"
              >
                Wróć do panelu
              </Link>
            </div>
          ) : result.orders.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
              Nie ma jeszcze żadnych zgłoszeń.
            </div>
          ) : (
            <div className="grid gap-5">
              {result.orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
