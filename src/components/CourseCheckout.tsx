import Link from "next/link";
import { CalendarCheck } from "lucide-react";

type Props = {
  slug: string;
  priceAmount: number;
  priceUnit: string;
  recurring: boolean;
};

/**
 * Przycisk na stronie kursu. Zawsze prowadzi na dedykowaną stronę zapisów
 * (`/kursy/[slug]/zapisz-sie`) — to ona sprawdza zalogowanie i to, czy kurs
 * nie jest już opłacony, więc ten komponent może zostać prosty i statyczny.
 */
export default function CourseCheckout({ slug, priceAmount, priceUnit, recurring }: Props) {
  return (
    <div>
      <Link
        href={`/kursy/${slug}/zapisz-sie`}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        <CalendarCheck className="size-4" />
        Zarezerwuj termin — {priceAmount} zł
      </Link>

      <p className="mt-2 text-center text-xs text-slate-500">
        {recurring
          ? `Kurs kosztuje ${priceAmount} zł ${priceUnit}. Krótki formularz zapisu, bez płatności teraz — odezwiemy się w sprawie szczegółów.`
          : `Kurs kosztuje ${priceAmount} zł. Krótki formularz zapisu, bez płatności teraz — odezwiemy się w sprawie szczegółów.`}
      </p>
    </div>
  );
}
