import { Phone } from "lucide-react";
import { contact } from "@/data/site";
import { ButtonLink, Container } from "@/components/ui";

export default function CtaBand({
  title = "Nie wiesz, który kurs wybrać?",
  text = "Zadzwoń albo zostaw numer. Dopytamy o Twój poziom, cele i plan dnia, a potem powiemy szczerze, który kurs ma dla Ciebie sens — również wtedy, gdy naszym zdaniem żaden.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-brand-700">
      <div className="absolute inset-0 grid-paper" aria-hidden="true" />
      <div
        className="absolute -right-24 -top-24 size-96 rounded-full bg-white/10 blur-3xl"
        aria-hidden="true"
      />
      <Container className="relative py-16 sm:py-20">
        <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-bold leading-tight text-white sm:text-4xl">
              {title}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-brand-100">{text}</p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:shrink-0">
            <ButtonLink href="/kontakt" size="lg" variant="accent">
              Zamów rozmowę
            </ButtonLink>
            <a
              href={contact.phoneHref}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/5 px-7 py-4 text-base font-semibold text-white backdrop-blur transition hover:border-white/60 hover:bg-white/10"
            >
              <Phone className="size-4" />
              {contact.phone}
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
