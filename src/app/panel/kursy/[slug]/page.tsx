import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CalendarClock, CircleDollarSign, Clock, GraduationCap } from "lucide-react";
import PageHero from "@/components/PageHero";
import { Badge, Container } from "@/components/ui";
import { getCurrentUser, getMyOrderForCourse } from "@/lib/auth";
import { getCourse } from "@/data/courses";
import { formatScheduleLabel } from "@/lib/schedule";

export const metadata: Metadata = {
  title: "Twoja rezerwacja",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function MyCoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const user = await getCurrentUser();
  if (!user) redirect(`/logowanie?po-zalogowaniu=/panel/kursy/${slug}`);

  const order = await getMyOrderForCourse(slug);
  if (!order) notFound();

  const details = getCourse(slug);
  const amount = (order.amount_grosze / 100).toFixed(2);

  return (
    <>
      <PageHero
        crumbs={[{ label: "Panel", href: "/panel" }, { label: "Twoja rezerwacja" }]}
        eyebrow="Panel kursanta"
        title={order.course_title}
        description={
          order.status === "paid"
            ? "Kurs jest opłacony — do zobaczenia na zajęciach!"
            : "Termin zarezerwowany. Poniżej szczegóły."
        }
      />

      <section className="bg-white py-16 sm:py-20">
        <Container className="max-w-2xl">
          <Link
            href="/panel"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="size-4" />
            Wróć do panelu
          </Link>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-lg font-bold text-ink">{order.course_title}</h2>
              <Badge tone={order.status === "paid" ? "green" : "accent"}>
                {order.status === "paid" ? "Opłacono" : "Zarezerwowano — czeka na grupę"}
              </Badge>
            </div>

            <dl className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                  <CalendarClock className="size-4" />
                </span>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Wybrany termin
                  </dt>
                  <dd className="mt-0.5 text-sm font-semibold text-ink">
                    {formatScheduleLabel(order.preferred_schedule)}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                  <CircleDollarSign className="size-4" />
                </span>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Cena
                  </dt>
                  <dd className="mt-0.5 text-sm font-semibold text-ink">
                    {amount} {order.currency.toUpperCase()}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                  <Clock className="size-4" />
                </span>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {order.status === "paid" ? "Opłacono" : "Zarezerwowano"}
                  </dt>
                  <dd className="mt-0.5 text-sm font-semibold text-ink">
                    {formatDate(order.paid_at ?? order.created_at)}
                  </dd>
                </div>
              </div>

              {details ? (
                <div className="flex items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                    <GraduationCap className="size-4" />
                  </span>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Kurs
                    </dt>
                    <dd className="mt-0.5 text-sm font-semibold text-ink">
                      {details.format} · poziom {details.level}
                    </dd>
                  </div>
                </div>
              ) : null}
            </dl>

            {order.status !== "paid" ? (
              <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Czekamy, aż skompletuje się grupa na ten termin — wtedy odezwiemy się w sprawie
                płatności i dalszych kroków.
              </p>
            ) : null}
          </div>

          {details ? (
            <p className="mt-6 text-center text-sm text-slate-600">
              <Link
                href={`/kursy/${details.slug}`}
                className="font-semibold text-brand-700 underline"
              >
                Zobacz pełny opis kursu
              </Link>
            </p>
          ) : null}
        </Container>
      </section>
    </>
  );
}
