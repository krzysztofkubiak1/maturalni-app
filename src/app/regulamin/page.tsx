import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import LegalNotice from "@/components/LegalNotice";
import { Container } from "@/components/ui";
import { contact, site } from "@/data/site";

export const metadata: Metadata = {
  title: "Regulamin",
  description: `Regulamin świadczenia usług edukacyjnych — ${site.name}.`,
  alternates: { canonical: "/regulamin" },
  robots: { index: false, follow: true },
};

const sections = [
  {
    title: "§1. Postanowienia ogólne",
    items: [
      `Regulamin określa zasady korzystania z kursów przygotowujących do egzaminu maturalnego z matematyki, organizowanych przez ${site.name} (dalej: Organizator).`,
      `Organizatorem jest Krzysztof Kubiak, prowadzący działalność nierejestrowaną w rozumieniu art. 5 ustawy z dnia 6 marca 2018 r. – Prawo przedsiębiorców, działający pod marką ${site.name}. Adres do korespondencji: ${contact.address}.`,
      "Działalność prowadzona jest w ramach ustawowego limitu przychodu dla działalności nierejestrowanej. Po jego przekroczeniu lub rejestracji działalności gospodarczej Organizator niezwłocznie uzupełni regulamin o dane rejestrowe (NIP, REGON).",
      `Kontakt z Organizatorem: ${contact.phone}, ${contact.email}.`,
      "Uczestnikiem kursu może być osoba pełnoletnia lub osoba niepełnoletnia za zgodą rodzica albo opiekuna prawnego.",
    ],
  },
  {
    title: "§2. Zapisy na kurs",
    items: [
      "Zapis następuje przez formularz na stronie internetowej, telefonicznie lub mailowo.",
      "Po zgłoszeniu Organizator kontaktuje się z Uczestnikiem w celu ustalenia poziomu kursu oraz terminu zajęć.",
      "Liczba miejsc w grupie jest ograniczona; o przyjęciu decyduje kolejność zgłoszeń.",
    ],
  },
  {
    title: "§3. Przebieg zajęć",
    items: [
      "Zajęcia prowadzone są online, w formie transmisji na żywo, zgodnie z harmonogramem ustalonym dla danej grupy.",
      "Każde zajęcia są nagrywane, a nagranie udostępniane Uczestnikom danej grupy do końca sesji maturalnej w danym roku szkolnym.",
      "Organizator zastrzega sobie prawo do zmiany terminu pojedynczych zajęć z ważnych przyczyn, informując o tym Uczestników z wyprzedzeniem.",
      "W przypadku odwołania zajęć przez Organizatora zajęcia są odrabiane w innym terminie lub odpłatność za nie nie jest naliczana.",
    ],
  },
  {
    title: "§4. Płatności",
    items: [
      "Opłata za kursy prowadzone na żywo naliczana jest miesięcznie, z dołu, wyłącznie za zajęcia, które się odbyły.",
      "Kursy wideo (VOD) opłacane są jednorazowo przed uzyskaniem dostępu do materiałów.",
      "Organizator nie pobiera opłaty wpisowej ani opłat z góry za cały okres trwania kursu.",
      "Zapis przez formularz na stronie jest rezerwacją terminu, nie płatnością online. Sposób i termin zapłaty (w tym numer rachunku bankowego) Organizator przekazuje Uczestnikowi indywidualnie po kontakcie zwrotnym.",
      "Organizator nie jest płatnikiem VAT. Na życzenie Uczestnika wystawia rachunek potwierdzający dokonanie płatności.",
    ],
  },
  {
    title: "§5. Rezygnacja i odstąpienie od umowy",
    items: [
      "Uczestnik może zrezygnować z kursu w dowolnym momencie, informując o tym Organizatora telefonicznie lub mailowo.",
      "Rezygnacja jest skuteczna od końca miesiąca, w którym została zgłoszona; Uczestnik opłaca zajęcia, które odbyły się do tego dnia.",
      "Konsumentowi przysługuje prawo odstąpienia od umowy zawartej na odległość w terminie 14 dni, na zasadach wynikających z ustawy o prawach konsumenta.",
      "W przypadku kursów wideo (dostęp cyfrowy) prawo odstąpienia wygasa, jeśli Uczestnik wyraźnie zgodził się na rozpoczęcie dostępu do materiałów przed upływem terminu odstąpienia i został poinformowany, że tym samym traci to prawo — zgodnie z art. 38 pkt 13 ustawy o prawach konsumenta.",
    ],
  },
  {
    title: "§6. Materiały i prawa autorskie",
    items: [
      "Materiały udostępniane w ramach kursu (skrypty, nagrania, zestawy zadań) są chronione prawem autorskim i przeznaczone wyłącznie do użytku własnego Uczestnika.",
      "Zabronione jest kopiowanie, publiczne udostępnianie, odsprzedaż oraz przekazywanie materiałów osobom trzecim.",
      "Naruszenie powyższych zasad może skutkować zablokowaniem dostępu do materiałów bez zwrotu wniesionej opłaty.",
    ],
  },
  {
    title: "§7. Reklamacje",
    items: [
      `Reklamacje dotyczące realizacji kursu można składać mailowo na adres ${contact.email}.`,
      "Reklamacja powinna zawierać dane Uczestnika, opis zastrzeżeń oraz oczekiwany sposób rozpatrzenia sprawy.",
      "Organizator rozpatruje reklamacje w terminie 14 dni od dnia otrzymania zgłoszenia.",
    ],
  },
  {
    title: "§8. Postanowienia końcowe",
    items: [
      "W sprawach nieuregulowanych regulaminem zastosowanie mają przepisy prawa polskiego.",
      "Organizator zastrzega sobie prawo do zmiany regulaminu; o zmianach Uczestnicy informowani są z wyprzedzeniem, a zmiany nie wpływają na warunki już rozpoczętych kursów.",
      "Niniejszy Regulamin obowiązuje od dnia jego opublikowania na stronie internetowej.",
    ],
  },
];

export default function TermsPage() {
  return (
    <>
      <PageHero
        crumbs={[{ label: "Regulamin" }]}
        eyebrow="Dokumenty"
        title="Regulamin świadczenia usług"
        description="Zasady zapisów, przebiegu zajęć, płatności i rezygnacji z kursów."
      />

      <section className="bg-white py-16 sm:py-20">
        <Container className="max-w-3xl">
          <LegalNotice />

          <div className="mt-10 space-y-10">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="font-display text-xl font-bold text-ink">
                  {section.title}
                </h2>
                <ol className="mt-4 space-y-3">
                  {section.items.map((item, i) => (
                    <li
                      key={i}
                      className="flex gap-3 text-sm leading-relaxed text-slate-600"
                    >
                      <span className="shrink-0 font-semibold text-brand-600">
                        {i + 1}.
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
