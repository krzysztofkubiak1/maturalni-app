import type { Metadata } from "next";
import { CalendarRange, FileText, Repeat, Trophy } from "lucide-react";
import PageHero from "@/components/PageHero";
import CurriculumTabs from "@/components/CurriculumTabs";
import CtaBand from "@/components/CtaBand";
import { Container, SectionHeading } from "@/components/ui";
import { curriculumPodstawowy, curriculumRozszerzony } from "@/data/courses";

export const metadata: Metadata = {
  title: "Program kursu maturalnego z matematyki",
  description:
    "Pełen program kursów maturalnych z matematyki — poziom podstawowy i rozszerzony. Wszystkie działy zgodne z wymaganiami egzaminacyjnymi CKE, z liczbą godzin i listą tematów.",
  alternates: { canonical: "/program" },
};

const phases = [
  {
    icon: CalendarRange,
    period: "listopad – grudzień",
    title: "Fundamenty",
    text: "Domykamy podstawy: działania na potęgach i logarytmach, przekształcanie wyrażeń, równania i nierówności. Bez tego reszta się nie klei.",
  },
  {
    icon: FileText,
    period: "styczeń – luty",
    title: "Trzon materiału",
    text: "Funkcje, ciągi, trygonometria, geometria. Każdy dział kończy się zestawem zadań maturalnych i sprawdzianem.",
  },
  {
    icon: Repeat,
    period: "marzec – kwiecień",
    title: "Tryb maturalny",
    text: "Rachunek różniczkowy, prawdopodobieństwo, dowody. Równolegle zaczynamy pisać pełne arkusze na czas.",
  },
  {
    icon: Trophy,
    period: "kwiecień",
    title: "Powtórka i szlifowanie",
    text: "Arkusze, analiza błędów, zapisywanie rozwiązań pod klucz punktowy i konsultacje przed egzaminem.",
  },
];

export default function ProgramPage() {
  return (
    <>
      <PageHero
        crumbs={[{ label: "Program" }]}
        eyebrow="Program nauczania"
        title="Co dokładnie przerabiamy na kursie"
        description="Program obu poziomów pokrywa wymagania egzaminacyjne CKE. Poniżej znajdziesz listę wszystkich działów wraz z tematami i orientacyjną liczbą godzin."
      />

      {/* Harmonogram roku */}
      <section className="bg-white py-20 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="Jak wygląda rok"
            title="Cztery etapy przygotowań"
            description="Rok szkolny dzielimy na etapy, żeby w maju nie okazało się, że połowa materiału została na ostatni tydzień."
          />

          <ol className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {phases.map((phase) => (
              <li
                key={phase.title}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-6"
              >
                <span className="grid size-11 place-items-center rounded-xl bg-brand-600 text-white">
                  <phase.icon className="size-5" />
                </span>
                <p className="mt-4 text-xs font-bold uppercase tracking-wider text-brand-700">
                  {phase.period}
                </p>
                <h3 className="mt-1 font-display text-base font-bold text-ink">
                  {phase.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {phase.text}
                </p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* Pełny program */}
      <section className="bg-slate-50 py-20 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="Pełna lista działów"
            title="Program krok po kroku"
            description="Wybierz poziom i rozwiń dział, żeby zobaczyć wszystkie tematy, które na nim przerabiamy."
          />

          <div className="mt-12">
            <CurriculumTabs
              rozszerzony={curriculumRozszerzony}
              podstawowy={curriculumPodstawowy}
            />
          </div>

          <p className="mx-auto mt-10 max-w-2xl text-center text-xs leading-relaxed text-slate-500">
            Liczba godzin jest orientacyjna i może się nieznacznie różnić w
            zależności od tempa grupy. Program aktualizujemy po każdym komunikacie
            CKE dotyczącym wymagań egzaminacyjnych.
          </p>
        </Container>
      </section>

      <CtaBand
        title="Chcesz wiedzieć, od czego zacząć w Twoim przypadku?"
        text="Zostaw numer, a przejdziemy z Tobą przez program i powiemy, które działy w Twojej sytuacji dadzą najwięcej punktów najszybciej."
      />
    </>
  );
}
