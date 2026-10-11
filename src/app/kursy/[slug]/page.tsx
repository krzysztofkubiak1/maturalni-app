import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  GraduationCap,
  ListChecks,
  MapPin,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";
import PageHero from "@/components/PageHero";
import Accordion from "@/components/Accordion";
import ContactForm from "@/components/ContactForm";
import CourseCheckout from "@/components/CourseCheckout";
import CtaBand from "@/components/CtaBand";
import CourseCard from "@/components/CourseCard";
import { Badge, Container, SectionHeading } from "@/components/ui";
import { courses, getCourse, type Format } from "@/data/courses";
import { site, teachers, type Teacher } from "@/data/site";
import { jsonLdProps } from "@/lib/jsonLd";

const formatIcon: Record<Format, LucideIcon> = {
  "Online na żywo": Users,
  Stacjonarnie: MapPin,
  "Kurs wideo (VOD)": Video,
};

export function generateStaticParams() {
  return courses.map((course) => ({ slug: course.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = getCourse(slug);

  if (!course) return { title: "Nie znaleziono kursu" };

  return {
    title: course.title,
    description: course.summary,
    alternates: { canonical: `/kursy/${course.slug}` },
    openGraph: {
      title: `${course.title} | ${site.name}`,
      description: course.summary,
      url: `${site.url}/kursy/${course.slug}`,
    },
  };
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = getCourse(slug);

  if (!course) notFound();

  const courseTeachers = course.teacherSlugs
    .map((slug) => teachers.find((t) => t.slug === slug))
    .filter((t): t is Teacher => Boolean(t));
  const related = courses.filter((c) => c.slug !== course.slug).slice(0, 3);

  const facts = [
    { icon: CalendarDays, label: "Start", value: course.startDate },
    { icon: Clock, label: "Terminy", value: course.schedule },
    { icon: ListChecks, label: "Liczba lekcji", value: `${course.lessons}` },
    { icon: GraduationCap, label: "Wymiar", value: `${course.hoursTotal} godz.` },
    { icon: formatIcon[course.format], label: "Format", value: course.format },
    { icon: Users, label: "Wielkość grupy", value: course.groupSize },
    ...(course.location
      ? [{ icon: MapPin, label: "Lokalizacja", value: course.location }]
      : []),
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.summary,
    provider: {
      "@type": "EducationalOrganization",
      name: site.name,
      sameAs: site.url,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdProps(jsonLd)}
      />

      <PageHero
        crumbs={[{ label: "Kursy", href: "/kursy" }, { label: course.shortTitle }]}
        eyebrow={`${course.format} · poziom ${course.level}`}
        title={course.title}
        description={course.summary}
      >
        {course.badge ? (
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <span className="rounded-full bg-accent-400 px-3 py-1 text-xs font-bold text-ink">
              {course.badge}
            </span>
          </div>
        ) : null}
      </PageHero>

      <section className="bg-white py-16 sm:py-20">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1fr_22rem] lg:gap-14">
            {/* Treść */}
            <div className="min-w-0">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {facts.map((fact) => (
                  <div
                    key={fact.label}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <fact.icon className="size-5 text-brand-600" />
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {fact.label}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-ink">{fact.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-12">
                <h2 className="font-display text-2xl font-bold text-ink">
                  O kursie
                </h2>
                <div className="mt-4 space-y-4">
                  {course.intro.map((paragraph, i) => (
                    <p key={i} className="leading-relaxed text-slate-600">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>

              <div className="mt-12 grid gap-6 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-6">
                  <h2 className="font-display text-lg font-bold text-ink">
                    Dla kogo jest ten kurs
                  </h2>
                  <ul className="mt-4 space-y-3">
                    {course.forWhom.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-slate-600">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-600" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-brand-200 bg-brand-50/60 p-6">
                  <h2 className="font-display text-lg font-bold text-ink">
                    Co dostajesz w cenie
                  </h2>
                  <ul className="mt-4 space-y-3">
                    {course.includes.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Program */}
              <div className="mt-12">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <h2 className="font-display text-2xl font-bold text-ink">
                    Program kursu
                  </h2>
                  <Badge tone="neutral">
                    {course.curriculum.length} działów ·{" "}
                    {course.curriculum.reduce((sum, m) => sum + m.hours, 0)} godz.
                  </Badge>
                </div>
                <p className="mt-3 text-sm text-slate-600">
                  Kliknij dział, żeby zobaczyć listę tematów. Kolejność jest tak
                  ułożona, że każdy dział korzysta z poprzednich.
                </p>

                <div className="mt-6">
                  <Accordion
                    defaultOpen={0}
                    items={course.curriculum.map((module) => ({
                      title: module.title,
                      meta: `${module.hours} godz.`,
                      content: (
                        <ul className="grid gap-2.5">
                          {module.topics.map((topic) => (
                            <li
                              key={topic}
                              className="flex items-start gap-2.5 text-sm leading-relaxed"
                            >
                              <span
                                className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-500"
                                aria-hidden="true"
                              />
                              {topic}
                            </li>
                          ))}
                        </ul>
                      ),
                    }))}
                  />
                </div>
              </div>

              {/* Prowadzący */}
              {courseTeachers.length > 0 ? (
                <div className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
                  <h2 className="font-display text-lg font-bold text-ink">
                    Prowadzący
                  </h2>
                  <div className="mt-5 grid gap-8">
                    {courseTeachers.map((teacher) => (
                      <div key={teacher.slug} className="flex flex-col gap-5 sm:flex-row">
                        <span className="grid size-20 shrink-0 place-items-center rounded-2xl bg-brand-600 font-display text-2xl font-bold text-white">
                          {teacher.initials}
                        </span>
                        <div>
                          <p className="font-display text-lg font-bold text-ink">
                            {teacher.name}
                          </p>
                          <p className="text-sm text-brand-700">{teacher.title}</p>
                          <p className="mt-3 text-sm leading-relaxed text-slate-600">
                            {teacher.bio}
                          </p>
                          <ul className="mt-4 flex flex-wrap gap-2">
                            {teacher.highlights.map((h) => (
                              <li key={h}>
                                <Badge tone="brand">{h}</Badge>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Panel boczny */}
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5">
                <p className="text-sm text-slate-500">Cena kursu</p>
                <p className="mt-1 font-display text-4xl font-bold text-ink">
                  {course.price.amount} zł
                  <span className="ml-1.5 text-base font-medium text-slate-500">
                    {course.price.unit}
                  </span>
                </p>
                <p className="mt-1.5 text-sm text-slate-500">{course.price.note}</p>

                <ul className="mt-5 space-y-2.5 border-y border-slate-200 py-5 text-sm">
                  <li className="flex items-start gap-2.5 text-slate-700">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    Nagrania z poprzednich lekcji
                  </li>
                  <li className="flex items-start gap-2.5 text-slate-700">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    Dostęp od razu po opłaceniu
                  </li>
                  <li className="flex items-start gap-2.5 text-slate-700">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    Rezygnacja w dowolnym momencie
                  </li>
                </ul>

                <div className="mt-5">
                  <CourseCheckout
                    slug={course.slug}
                    priceAmount={course.price.amount}
                    priceUnit={course.price.unit}
                    recurring={course.price.unit.includes("mies")}
                  />
                </div>

                <div className="mt-6 border-t border-slate-200 pt-6">
                  <h2 className="font-display text-base font-bold text-ink">
                    Wolisz najpierw porozmawiać?
                  </h2>
                  <p className="mt-1.5 text-sm text-slate-600">
                    Zostaw numer — oddzwonimy, dopytamy o Twój poziom i pomożemy wybrać.
                  </p>
                  <div className="mt-4">
                    <ContactForm compact defaultCourse={course.slug} />
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </Container>
      </section>

      {/* Inne kursy */}
      <section className="bg-slate-50 py-20 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="Zobacz też"
            title="Inne kursy w ofercie"
            description="Nie jesteś pewien, który poziom wybrać? Sprawdź też pozostałe kursy."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {related.map((c) => (
              <CourseCard key={c.slug} course={c} />
            ))}
          </div>
        </Container>
      </section>

      <CtaBand />
    </>
  );
}
