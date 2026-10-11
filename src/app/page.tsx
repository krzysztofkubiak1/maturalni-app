import Link from "next/link";
import { ArrowRight, BookOpen, GraduationCap, PhoneCall, Sparkles } from "lucide-react";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import FaqSection from "@/components/FaqSection";
import CtaBand from "@/components/CtaBand";
import CourseCard from "@/components/CourseCard";
import { ButtonLink, Container, SectionHeading } from "@/components/ui";
import {
  liveCourses,
  stationaryCourses,
  curriculumPodstawowy,
  curriculumRozszerzony,
} from "@/data/courses";
import { faq, site, stats } from "@/data/site";
import { jsonLdProps } from "@/lib/jsonLd";

const steps = [
  {
    icon: PhoneCall,
    title: "Zostawiasz numer",
    text: "Wypełniasz krótki formularz albo dzwonisz. Oddzwaniamy zwykle tego samego dnia roboczego.",
  },
  {
    icon: Sparkles,
    title: "Rozmawiamy o Twoim poziomie",
    text: "Decydujesz jaki masz cel maturalny oraz na jaki kurs się zapisujesz.",
  },
  {
    icon: BookOpen,
    title: "Przychodzisz na pierwszą lekcję",
    text: "Bierzesz udział w normalnych zajęciach. W razie potrzeby korzystasz z indywidualnych zajęć wyrównawczych w promocyjnej cenie.",
  },
  {
    icon: GraduationCap,
    title: "Uczysz się przez cały rok",
    text: "Zajęcia, nagrania, zadania domowe ze sprawdzaniem i arkusze. My pilnujemy planu, Ty robisz robotę.",
  },
];

/** Dane strukturalne dla Google — pomagają w wynikach wyszukiwania */
function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "EducationalOrganization",
        "@id": `${site.url}/#organizacja`,
        name: site.name,
        url: site.url,
        description: site.description,
        areaServed: "PL",
      },
      {
        "@type": "FAQPage",
        mainEntity: faq.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={jsonLdProps(data)}
    />
  );
}

export default function HomePage() {
  const totalHoursRozszerzenie = curriculumRozszerzony.reduce((sum, m) => sum + m.hours, 0);
  const totalHoursPodstawa = curriculumPodstawowy.reduce((sum, m) => sum + m.hours, 0);

  return (
    <>
      <JsonLd />
      <Hero />

      {/* Kursy na żywo */}
      <section id="kursy" className="bg-white py-20 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="Kursy online na żywo"
            title="Wybierz swój poziom"
            description="Zajęcia prowadzone na żywo w małych grupach. Widzisz tablicę, słyszysz prowadzącego i możesz w każdej chwili przerwać i dopytać."
          />

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {liveCourses.map((course) => (
              <CourseCard key={course.slug} course={course} />
            ))}
          </div>
        </Container>
      </section>

      {/* Kursy stacjonarne */}
      <section className="bg-slate-50 py-20 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="Kursy stacjonarne"
            title="Wolisz uczyć się na miejscu?"
            description="Ten sam program, ale w naszej sali, na żywo — bez ekranu między Tobą a tablicą."
          />

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {stationaryCourses.map((course) => (
              <CourseCard key={course.slug} course={course} />
            ))}
          </div>
        </Container>
      </section>

      <Features />

      {/* Jak to działa */}
      <section className="bg-white py-20 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="Jak zacząć"
            title="Cztery kroki od telefonu do pierwszych zajęć"
            description="Zapisanie się zajmuje kilka minut i nie wiąże Cię z niczym. Decydujesz dopiero po lekcji próbnej."
          />

          <ol className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <li key={step.title} className="relative">
                <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50 p-6">
                  <div className="flex items-center gap-3">
                    <span className="grid size-11 place-items-center rounded-xl bg-brand-600 text-white">
                      <step.icon className="size-5" />
                    </span>
                    <span className="font-display text-4xl font-bold text-slate-200">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-base font-bold text-ink">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {step.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* Program w skrócie */}
      <section className="bg-ink py-20 sm:py-24">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <SectionHeading
                align="left"
                tone="light"
                eyebrow="Program"
                title="Przerabiamy każdy dział z wymagań CKE"
                description="Program jest ułożony tak, żeby każdy temat opierał się na poprzednim. Nie skaczemy po materiale i nie zostawiamy dziur."
              />

              <dl className="mt-10 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <dt className="text-sm font-semibold text-brand-300">
                    Poziom rozszerzony
                  </dt>
                  <dd className="mt-1 font-display text-3xl font-bold text-white">
                    {curriculumRozszerzony.length} działów
                  </dd>
                  <dd className="mt-1 text-sm text-slate-400">
                    ok. {totalHoursRozszerzenie} godzin lekcyjnych
                  </dd>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <dt className="text-sm font-semibold text-emerald-300">
                    Poziom podstawowy
                  </dt>
                  <dd className="mt-1 font-display text-3xl font-bold text-white">
                    {curriculumPodstawowy.length} działów
                  </dd>
                  <dd className="mt-1 text-sm text-slate-400">
                    ok. {totalHoursPodstawa} godzin lekcyjnych
                  </dd>
                </div>
              </dl>

              <div className="mt-8">
                <ButtonLink href="/program" size="lg" variant="accent">
                  Zobacz pełny program
                  <ArrowRight className="size-4" />
                </ButtonLink>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-300">
                Rozszerzenie · wybrane działy
              </p>
              <ul className="mt-5 divide-y divide-white/10">
                {curriculumRozszerzony.slice(0, 8).map((module) => (
                  <li
                    key={module.title}
                    className="flex items-center justify-between gap-4 py-3"
                  >
                    <span className="text-sm text-slate-200">{module.title}</span>
                    <span className="shrink-0 text-xs font-semibold text-slate-400">
                      {module.hours} godz.
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href="/program"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-300 transition hover:text-white"
              >
                …i {curriculumRozszerzony.length - 8} kolejnych działów
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Liczby */}
      <section className="border-y border-slate-200 bg-white py-14">
        <Container>
          <dl className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <span className="block font-display text-4xl font-bold text-brand-700">
                    {stat.value}
                  </span>
                  <span className="mt-2 block text-sm text-slate-600">
                    {stat.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <FaqSection limit={6} />
      <CtaBand />
    </>
  );
}
