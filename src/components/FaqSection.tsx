import { faq } from "@/data/site";
import Accordion from "@/components/Accordion";
import { Container, SectionHeading } from "@/components/ui";

export default function FaqSection({
  limit,
  eyebrow = "FAQ",
  title = "Pytania, które dostajemy najczęściej",
  description = "Jeśli czegoś tu brakuje — zadzwoń albo napisz. Odpowiadamy konkretnie, bez sprzedażowego owijania.",
}: {
  limit?: number;
  eyebrow?: string;
  title?: string;
  description?: string;
}) {
  const items = (limit ? faq.slice(0, limit) : faq).map((item) => ({
    title: item.q,
    content: <p className="text-sm leading-relaxed">{item.a}</p>,
  }));

  return (
    <section id="faq" className="bg-slate-50 py-20 sm:py-24">
      <Container>
        <SectionHeading eyebrow={eyebrow} title={title} description={description} />
        <div className="mx-auto mt-12 max-w-3xl">
          <Accordion items={items} defaultOpen={0} />
        </div>
      </Container>
    </section>
  );
}
