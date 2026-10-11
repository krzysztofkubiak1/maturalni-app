import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import CourseCard from "@/components/CourseCard";
import CtaBand from "@/components/CtaBand";
import FaqSection from "@/components/FaqSection";
import { Container, SectionHeading } from "@/components/ui";
import { liveCourses, stationaryCourses } from "@/data/courses";

export const metadata: Metadata = {
  title: "Kursy maturalne z matematyki",
  description:
    "Kursy maturalne z matematyki online na żywo i stacjonarnie: poziom podstawowy i rozszerzony. Porównaj terminy, wymiar godzin i ceny.",
  alternates: { canonical: "/kursy" },
};

export default function CoursesPage() {
  return (
    <>
      <PageHero
        crumbs={[{ label: "Kursy" }]}
        eyebrow="Oferta"
        title="Kursy maturalne z matematyki"
        description="Poziom podstawowy i rozszerzony — zajęcia online na żywo albo stacjonarnie, w małych grupach, z prowadzącym."
      />

      <section className="bg-white py-20 sm:py-24">
        <Container>
          <SectionHeading
            align="left"
            eyebrow="Online na żywo"
            title="Kursy z prowadzącym"
            description="Stałe terminy, stała grupa i ktoś, kto pilnuje, żebyś nie odpuścił w listopadzie."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {liveCourses.map((course) => (
              <CourseCard key={course.slug} course={course} />
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-slate-50 py-20 sm:py-24">
        <Container>
          <SectionHeading
            align="left"
            eyebrow="Stacjonarnie"
            title="Kursy na miejscu"
            description="Ten sam program, ale na żywo w naszej sali — dla osób, które wolą uczyć się bez ekranu."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {stationaryCourses.map((course) => (
              <CourseCard key={course.slug} course={course} />
            ))}
          </div>

          <p className="mx-auto mt-12 max-w-2xl text-center text-sm text-slate-600">
            Nie wiesz, który poziom albo format wybrać?{" "}
            <Link href="/kontakt" className="font-semibold text-brand-700 underline">
              Napisz do nas
            </Link>{" "}
            — dobierzemy kurs do Twojej sytuacji.
          </p>
        </Container>
      </section>

      <FaqSection limit={6} />
      <CtaBand />
    </>
  );
}
