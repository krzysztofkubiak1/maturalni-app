import {
  CalendarCheck,
  ClipboardList,
  CreditCard,
  FileCheck,
  MessagesSquare,
  Target,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";
import { features } from "@/data/site";
import { Container, SectionHeading } from "@/components/ui";

const icons: Record<string, LucideIcon> = {
  Users,
  CalendarCheck,
  CreditCard,
  Video,
  FileCheck,
  MessagesSquare,
  ClipboardList,
  Target,
};

export default function Features() {
  return (
    <section id="dlaczego-my" className="bg-slate-50 py-20 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow="Dlaczego my"
          title="Kurs, po którym naprawdę widać różnicę na maturze"
          description="Nie sprzedajemy nagrań i nadziei. Prowadzimy Cię przez cały materiał, pilnujemy, żebyś robił zadania, i sprawdzamy, czy to działa."
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = icons[feature.icon] ?? Target;
            return (
              <div
                key={feature.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg hover:shadow-slate-900/5"
              >
                <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-700">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 font-display text-base font-bold text-ink">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {feature.text}
                </p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
