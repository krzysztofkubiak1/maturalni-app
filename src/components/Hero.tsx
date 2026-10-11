import { CheckCircle2 } from "lucide-react";
import { stats } from "@/data/site";
import ContactForm from "@/components/ContactForm";
import { ButtonLink, Container } from "@/components/ui";

const promises = [
  "Prace domowe z feedbackiem",
  "Nagranie z każdej lekcji",
  "Grupy do 12 osób",
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-ink">
      <div className="absolute inset-0 grid-paper" aria-hidden="true" />
      <div
        className="absolute -left-40 -top-40 size-[32rem] rounded-full bg-brand-600/25 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-52 right-0 size-[34rem] rounded-full bg-brand-500/15 blur-3xl"
        aria-hidden="true"
      />

      <Container className="relative py-16 lg:py-24">
        <div className="grid items-start gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div className="animate-rise">
            <h1 className="font-display text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Kursy maturalne
              <span className="block text-brand-300">z matematyki</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
              Poziom podstawowy i rozszerzony. Zajęcia online na żywo w małych
              grupach, pełen program CKE, zadania domowe ze sprawdzaniem i arkusze
              maturalne. Od pierwszej lekcji wiesz, co masz robić i po co.
            </p>

            <ul className="mt-8 grid gap-3">
              {promises.map((item) => (
                <li key={item} className="flex items-start gap-3 text-slate-200">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-accent-400" />
                  <span className="text-sm sm:text-base">{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href="/kursy" size="lg" variant="accent">
                Zobacz kursy
              </ButtonLink>
              <ButtonLink href="/program" size="lg" variant="ghostLight">
                Sprawdź program
              </ButtonLink>
            </div>

            <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-white/10 pt-8 sm:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <dt className="sr-only">{stat.label}</dt>
                  <dd>
                    <span className="block font-display text-3xl font-bold text-white">
                      {stat.value}
                    </span>
                    <span className="mt-1 block text-xs leading-snug text-slate-400">
                      {stat.label}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="animate-rise rounded-3xl border border-white/10 bg-white p-6 shadow-2xl shadow-black/30 sm:p-8">
            <h2 className="font-display text-xl font-bold text-ink">
              Zapisz się na lekcję próbną
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Zostaw numer — oddzwonimy, dopytamy o Twój poziom i zaproponujemy
              grupę z pasującym terminem. Pierwsze zajęcia bez opłat.
            </p>
            <div className="mt-6">
              <ContactForm compact />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
