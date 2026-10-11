import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import PageHero from "@/components/PageHero";
import ContactForm from "@/components/ContactForm";
import FaqSection from "@/components/FaqSection";
import { Container, SectionHeading } from "@/components/ui";
import { contact } from "@/data/site";

export const metadata: Metadata = {
  title: "Kontakt i zapisy",
  description:
    "Zapisz się na kurs maturalny z matematyki. Zostaw numer telefonu — oddzwonimy w ciągu jednego dnia roboczego i dobierzemy kurs do Twojego poziomu.",
  alternates: { canonical: "/kontakt" },
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        crumbs={[{ label: "Kontakt" }]}
        eyebrow="Kontakt i zapisy"
        title="Porozmawiajmy o Twojej maturze"
        description="Zostaw numer albo zadzwoń. Zapytamy o Twój poziom, cel i ile masz czasu — a potem powiemy szczerze, co ma sens w Twojej sytuacji."
      />

      <section className="bg-white py-16 sm:py-20">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
            {/* Dane kontaktowe */}
            <div>
              <SectionHeading
                align="left"
                eyebrow="Dane kontaktowe"
                title="Najszybciej — telefonicznie"
                description="Jeśli chcesz wszystko ustalić od ręki, po prostu zadzwoń. Odbieramy w godzinach pracy biura."
              />

              <ul className="mt-8 grid gap-4">
                <li>
                  <a
                    href={contact.phoneHref}
                    className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-brand-300 hover:bg-brand-50"
                  >
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-600 text-white">
                      <Phone className="size-5" />
                    </span>
                    <span>
                      <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Telefon
                      </span>
                      <span className="mt-0.5 block font-display text-lg font-bold text-ink">
                        {contact.phone}
                      </span>
                    </span>
                  </a>
                </li>

                <li>
                  <a
                    href={contact.emailHref}
                    className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-brand-300 hover:bg-brand-50"
                  >
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-600 text-white">
                      <Mail className="size-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        E-mail
                      </span>
                      <span className="mt-0.5 block break-words font-display text-lg font-bold text-ink">
                        {contact.email}
                      </span>
                    </span>
                  </a>
                </li>

                <li className="flex items-start gap-4 rounded-2xl border border-slate-200 p-5">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                    <MapPin className="size-5" />
                  </span>
                  <span>
                    <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Adres
                    </span>
                    <span className="mt-0.5 block text-sm text-slate-700">
                      {contact.address}
                    </span>
                  </span>
                </li>

                <li className="flex items-start gap-4 rounded-2xl border border-slate-200 p-5">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                    <Clock className="size-5" />
                  </span>
                  <span>
                    <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Godziny pracy biura
                    </span>
                    <span className="mt-0.5 block text-sm text-slate-700">
                      {contact.officeHours}
                    </span>
                  </span>
                </li>
              </ul>

              <div className="mt-8 flex items-start gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-5">
                <MessageCircle className="mt-0.5 size-5 shrink-0 text-brand-700" />
                <p className="text-sm leading-relaxed text-brand-900">
                  Jesteś rodzicem i dzwonisz w sprawie dziecka? Świetnie — chętnie
                  wytłumaczymy, jak wygląda kurs, jak kontrolujemy postępy i co
                  dokładnie dostaje uczeń.
                </p>
              </div>
            </div>

            {/* Formularz */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8">
              <h2 className="font-display text-2xl font-bold text-ink">
                Zamów rozmowę
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Wypełnij formularz — oddzwonimy w ciągu jednego dnia roboczego.
              </p>
              <div className="mt-7">
                <ContactForm />
              </div>
            </div>
          </div>
        </Container>
      </section>

      <FaqSection
        limit={6}
        eyebrow="Zanim zadzwonisz"
        title="Może odpowiedź jest tutaj"
        description="Najczęstsze pytania, które słyszymy podczas pierwszej rozmowy."
      />
    </>
  );
}
