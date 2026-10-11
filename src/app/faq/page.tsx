import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import FaqSection from "@/components/FaqSection";
import CtaBand from "@/components/CtaBand";
import { faq } from "@/data/site";
import { jsonLdProps } from "@/lib/jsonLd";

export const metadata: Metadata = {
  title: "Najczęstsze pytania",
  description:
    "Odpowiedzi na pytania o kursy maturalne z matematyki: terminy, płatności, nagrania, materiały i sposób zapisu.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdProps(jsonLd)}
      />

      <PageHero
        crumbs={[{ label: "FAQ" }]}
        eyebrow="Pomoc"
        title="Najczęstsze pytania"
        description="Zebraliśmy pytania, które dostajemy przez telefon niemal codziennie. Jeśli czegoś tu brakuje — po prostu zadzwoń."
      />

      <FaqSection
        eyebrow="Wszystkie pytania"
        title="Zanim zapiszesz się na kurs"
        description="Odpowiadamy konkretnie. Jeśli coś w naszej ofercie nie pasuje do Twojej sytuacji, powiemy Ci to wprost."
      />

      <CtaBand
        title="Nie znalazłeś odpowiedzi?"
        text="Zadzwoń albo zostaw numer — odpowiemy na każde pytanie o kurs, program i zasady płatności. Bez naciskania na zapis."
      />
    </>
  );
}
