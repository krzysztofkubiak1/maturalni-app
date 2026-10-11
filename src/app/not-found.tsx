import Link from "next/link";
import { ButtonLink, Container } from "@/components/ui";
import { courses } from "@/data/courses";

export default function NotFound() {
  return (
    <section className="relative overflow-hidden bg-ink">
      <div className="absolute inset-0 grid-paper" aria-hidden="true" />
      <Container className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-xl text-center">
          <p className="font-display text-7xl font-bold text-brand-400">404</p>
          <h1 className="mt-4 font-display text-3xl font-bold text-white sm:text-4xl">
            Tej strony nie ma
          </h1>
          <p className="mt-4 leading-relaxed text-slate-300">
            Link mógł się zdezaktualizować albo w adresie jest literówka. Poniżej
            znajdziesz to, czego prawdopodobnie szukasz.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/" size="lg" variant="accent">
              Strona główna
            </ButtonLink>
            <ButtonLink href="/kontakt" size="lg" variant="ghostLight">
              Kontakt
            </ButtonLink>
          </div>

          <ul className="mt-10 flex flex-wrap justify-center gap-2">
            {courses.map((course) => (
              <li key={course.slug}>
                <Link
                  href={`/kursy/${course.slug}`}
                  className="inline-block rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-white/40 hover:text-white"
                >
                  {course.shortTitle}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
