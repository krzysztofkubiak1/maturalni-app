import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import LegalNotice from "@/components/LegalNotice";
import { Container } from "@/components/ui";
import { contact, site } from "@/data/site";

export const metadata: Metadata = {
  title: "Polityka prywatności",
  description: `Informacja o przetwarzaniu danych osobowych — ${site.name}.`,
  alternates: { canonical: "/polityka-prywatnosci" },
  robots: { index: false, follow: true },
};

const sections = [
  {
    title: "1. Administrator danych",
    items: [
      `Administratorem danych osobowych jest ${site.name}.`,
      "TODO: uzupełnij pełne dane administratora — nazwa, adres siedziby, NIP oraz dane kontaktowe do spraw ochrony danych (ewentualnie dane inspektora ochrony danych, jeśli został wyznaczony).",
      `Kontakt w sprawach danych osobowych: ${contact.email}, ${contact.phone}.`,
    ],
  },
  {
    title: "2. Jakie dane zbieramy",
    items: [
      "Dane podane w formularzu kontaktowym: imię, numer telefonu, opcjonalnie adres e-mail oraz treść wiadomości.",
      "Dane niezbędne do realizacji umowy o świadczenie usług edukacyjnych, w tym dane do wystawienia faktury.",
      "Dane techniczne gromadzone automatycznie przez serwer (adres IP, informacje o przeglądarce) w celach bezpieczeństwa i statystycznych.",
    ],
  },
  {
    title: "3. Cel i podstawa prawna przetwarzania",
    items: [
      "Kontakt zwrotny w sprawie oferty kursów — na podstawie zgody osoby, której dane dotyczą (art. 6 ust. 1 lit. a RODO).",
      "Zawarcie i wykonanie umowy o udział w kursie — art. 6 ust. 1 lit. b RODO.",
      "Wypełnienie obowiązków podatkowych i rachunkowych — art. 6 ust. 1 lit. c RODO.",
      "Dochodzenie ewentualnych roszczeń oraz zapewnienie bezpieczeństwa strony — prawnie uzasadniony interes administratora, art. 6 ust. 1 lit. f RODO.",
    ],
  },
  {
    title: "4. Okres przechowywania danych",
    items: [
      "Dane przetwarzane na podstawie zgody — do czasu jej wycofania, nie dłużej niż przez 24 miesiące od ostatniego kontaktu.",
      "Dane związane z umową — przez czas trwania umowy oraz przez okres wynikający z przepisów podatkowych (co do zasady 5 lat).",
      "TODO: zweryfikuj powyższe okresy z osobą odpowiedzialną za ochronę danych w Twojej organizacji.",
    ],
  },
  {
    title: "5. Odbiorcy danych",
    items: [
      "Dane mogą być przekazywane podmiotom wspierającym działanie strony i firmy: dostawcy hostingu, systemu poczty elektronicznej, biuru rachunkowemu oraz dostawcy platformy do zajęć online.",
      "TODO: wypisz konkretnych dostawców, z których faktycznie korzystasz, i zawrzyj z nimi umowy powierzenia przetwarzania danych.",
      "Dane nie są sprzedawane ani udostępniane w celach marketingowych podmiotom trzecim.",
    ],
  },
  {
    title: "6. Twoje prawa",
    items: [
      "Masz prawo dostępu do swoich danych, ich sprostowania, usunięcia oraz ograniczenia przetwarzania.",
      "Masz prawo do przenoszenia danych oraz do wniesienia sprzeciwu wobec przetwarzania opartego na prawnie uzasadnionym interesie.",
      "Zgodę możesz wycofać w dowolnym momencie — nie wpływa to na zgodność z prawem przetwarzania dokonanego przed jej wycofaniem.",
      "Przysługuje Ci prawo wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych.",
    ],
  },
  {
    title: "7. Pliki cookies",
    items: [
      "Strona w podstawowej wersji korzysta wyłącznie z plików niezbędnych do jej prawidłowego działania.",
      "TODO: jeśli dodasz narzędzia analityczne lub marketingowe (Google Analytics, Meta Pixel), musisz wdrożyć baner zgody na cookies i uzupełnić tę sekcję o listę stosowanych narzędzi.",
      "Ustawienia dotyczące plików cookies możesz zmienić w swojej przeglądarce.",
    ],
  },
  {
    title: "8. Dobrowolność podania danych",
    items: [
      "Podanie danych jest dobrowolne, ale niezbędne do udzielenia odpowiedzi na zapytanie oraz do zawarcia umowy o udział w kursie.",
      "Brak podania danych uniemożliwia kontakt zwrotny i realizację usługi.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        crumbs={[{ label: "Polityka prywatności" }]}
        eyebrow="Dokumenty"
        title="Polityka prywatności"
        description="Informacja o tym, jakie dane zbieramy, w jakim celu i jakie masz w związku z tym prawa."
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
                <ul className="mt-4 space-y-3">
                  {section.items.map((item, i) => (
                    <li
                      key={i}
                      className="flex gap-3 text-sm leading-relaxed text-slate-600"
                    >
                      <span
                        className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-500"
                        aria-hidden="true"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
