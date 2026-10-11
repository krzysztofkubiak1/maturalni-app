import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import PageHero from "@/components/PageHero";
import EnrollmentForm from "@/components/EnrollmentForm";
import { Container } from "@/components/ui";
import { getCurrentUser, getMyCourses } from "@/lib/auth";
import { getCourse } from "@/data/courses";

// Zależna od ciasteczka sesji i stanu zamówień — nie może być statyczna.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = getCourse(slug);
  return {
    title: course ? `Zapisz się — ${course.shortTitle}` : "Zapisz się na kurs",
    robots: { index: false, follow: false },
  };
}

export default async function EnrollPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = getCourse(slug);
  if (!course) notFound();

  const enrollUrl = `/kursy/${slug}/zapisz-sie`;
  const user = await getCurrentUser();
  if (!user) redirect(`/logowanie?po-zalogowaniu=${encodeURIComponent(enrollUrl)}`);

  const myCourses = await getMyCourses();
  const alreadyOwned = myCourses.some((c) => c.course_slug === course.slug);

  return (
    <>
      <PageHero
        crumbs={[
          { label: "Kursy", href: "/kursy" },
          { label: course.shortTitle, href: `/kursy/${course.slug}` },
          { label: "Zapisy" },
        ]}
        eyebrow="Zapisy"
        title={`Zapisz się na kurs: ${course.shortTitle}`}
        description="Podaj dane kursanta i wybierz termin zajęć. Odezwiemy się, żeby ustalić szczegóły i płatność."
      />

      <section className="bg-slate-50 py-16 sm:py-20">
        <Container className="max-w-2xl">
          {alreadyOwned ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
              <CheckCircle2 className="mx-auto size-10 text-emerald-600" />
              <h1 className="mt-3 font-display text-lg font-bold text-emerald-900">
                Masz już dostęp do tego kursu
              </h1>
              <p className="mt-2 text-sm text-emerald-800">
                Nie trzeba zapisywać się drugi raz — materiały czekają w panelu.
              </p>
              <Link
                href="/panel"
                className="mt-4 inline-flex text-sm font-semibold text-emerald-800 underline"
              >
                Otwórz panel kursanta
              </Link>
            </div>
          ) : (
            <EnrollmentForm
              slug={course.slug}
              priceAmount={course.price.amount}
              priceUnit={course.price.unit}
              recurring={course.price.unit.includes("mies")}
              defaultName={user.name}
              defaultLastName={user.last_name}
              defaultEmail={user.email}
            />
          )}
        </Container>
      </section>
    </>
  );
}
