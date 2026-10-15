import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import PageHero from "@/components/PageHero";
import LogoutButton from "@/components/LogoutButton";
import { Container } from "@/components/ui";
import { getCurrentUser, getMyCourses } from "@/lib/auth";
import { getCourse } from "@/data/courses";

export const metadata: Metadata = {
  title: "Panel kursanta",
  robots: { index: false, follow: false },
};

// Strona zależna od ciasteczka sesji — nie może być prerenderowana statycznie.
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

export default async function PanelPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/logowanie?po-zalogowaniu=/panel");

  const myCourses = await getMyCourses();

  const accountRows = [
    { icon: UserRound, label: "Imię i nazwisko", value: `${user.name} ${user.last_name}` },
    { icon: Mail, label: "E-mail", value: user.email },
    { icon: CalendarClock, label: "Konto założone", value: formatDate(user.created_at) },
  ];

  return (
    <>
      <PageHero
        crumbs={[{ label: "Panel" }]}
        eyebrow="Panel kursanta"
        title={`Cześć, ${user.name}`}
        description="To Twoje konto i Twoje kursy. Materiały do kursów pojawią się tutaj, gdy będą gotowe."
      />

      <section className="bg-white py-16 sm:py-20">
        <Container className="max-w-4xl">
          {/* Twoje kursy */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-brand-600 text-white">
                <BookOpen className="size-5" />
              </span>
              <h2 className="font-display text-lg font-bold text-ink">Twoje kursy</h2>
            </div>

            {myCourses.length === 0 ? (
              <div className="mt-5 rounded-xl bg-slate-50 p-5 text-sm text-slate-600">
                <p>Nie masz jeszcze żadnego kursu.</p>
                <Link
                  href="/kursy"
                  className="mt-3 inline-flex items-center gap-1.5 font-semibold text-brand-700 underline"
                >
                  Przeglądaj kursy
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            ) : (
              <ul className="mt-5 divide-y divide-slate-100">
                {myCourses.map((course) => {
                  const details = getCourse(course.course_slug);
                  return (
                    <li
                      key={course.course_slug}
                      className="flex flex-wrap items-center justify-between gap-3 py-4"
                    >
                      <div>
                        <p className="text-sm font-semibold text-ink">
                          {course.course_title}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {course.status === "paid"
                            ? `Kupiony ${formatDate(course.purchased_at)}`
                            : `Zarezerwowano ${formatDate(course.purchased_at)}`}
                          {details ? ` · ${details.format}` : ""}
                        </p>
                        {course.status === "reserved" ? (
                          <p className="mt-1 text-xs text-amber-700">
                            Czekamy, aż skompletuje się grupa na ten termin — wtedy
                            odezwiemy się w sprawie płatności.
                          </p>
                        ) : null}
                      </div>
                      <Link
                        href={`/panel/kursy/${course.course_slug}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Otwórz
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-7">
              <h2 className="font-display text-lg font-bold text-ink">Twoje dane</h2>
              <dl className="mt-5 space-y-4">
                {accountRows.map((row) => (
                  <div key={row.label} className="flex items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-brand-700 ring-1 ring-slate-200">
                      <row.icon className="size-4" />
                    </span>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {row.label}
                      </dt>
                      <dd className="mt-0.5 text-sm font-semibold text-ink">{row.value}</dd>
                    </div>
                  </div>
                ))}
              </dl>

              <div className="mt-6 border-t border-slate-200 pt-5">
                <LogoutButton />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-6 sm:p-7">
              <h2 className="font-display text-lg font-bold text-ink">Potrzebujesz pomocy?</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Masz pytanie o kurs, płatność albo fakturę? Napisz albo zadzwoń —
                odpowiadamy w ciągu jednego dnia roboczego.
              </p>
              <Link
                href="/kontakt"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 underline"
              >
                Przejdź do kontaktu
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-slate-200 p-5 text-sm text-slate-600">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-600" />
            <p>
              Jesteś bezpiecznie zalogowany. Aby zakończyć sesję na
              tym urządzeniu, użyj przycisku „Wyloguj się”.
            </p>
          </div>
        </Container>
      </section>
    </>
  );
}
