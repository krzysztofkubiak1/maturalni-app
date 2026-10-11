import { AlertTriangle } from "lucide-react";

/**
 * Ostrzeżenie widoczne na stronach z dokumentami prawnymi.
 * USUŃ ten komponent ze stron /regulamin i /polityka-prywatnosci
 * dopiero po wstawieniu dokumentów sprawdzonych przez prawnika.
 */
export default function LegalNotice() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-5">
      <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-700" />
      <p className="text-sm leading-relaxed text-amber-900">
        <strong>Dokument roboczy.</strong> To szablon poglądowy, a nie gotowy
        dokument prawny — nie stanowi porady prawnej. Przed publikacją strony
        uzupełnij dane firmy i zleć weryfikację treści prawnikowi lub specjaliście
        od ochrony danych osobowych.
      </p>
    </div>
  );
}
