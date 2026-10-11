"use client";

import { useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { cx } from "@/components/ui";

export type AccordionItem = {
  title: ReactNode;
  /** Dodatkowy tekst obok tytułu, np. liczba godzin */
  meta?: string;
  content: ReactNode;
};

export default function Accordion({
  items,
  /** Indeks pozycji otwartej na starcie; -1 = wszystkie zamknięte */
  defaultOpen = -1,
}: {
  items: AccordionItem[];
  defaultOpen?: number;
}) {
  const [open, setOpen] = useState<number>(defaultOpen);

  return (
    <div className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={i}>
            <h3>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? -1 : i)}
                aria-expanded={isOpen}
                aria-controls={`akordeon-panel-${i}`}
                id={`akordeon-przycisk-${i}`}
                className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-600 sm:px-6"
              >
                <span className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                  <span className="font-display text-base font-semibold text-ink">
                    {item.title}
                  </span>
                  {item.meta ? (
                    <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
                      {item.meta}
                    </span>
                  ) : null}
                </span>
                <span
                  className={cx(
                    "grid size-8 shrink-0 place-items-center rounded-full border transition",
                    isOpen
                      ? "rotate-45 border-brand-600 bg-brand-600 text-white"
                      : "border-slate-300 text-slate-500",
                  )}
                  aria-hidden="true"
                >
                  <Plus className="size-4" />
                </span>
              </button>
            </h3>
            {isOpen ? (
              <div
                id={`akordeon-panel-${i}`}
                role="region"
                aria-labelledby={`akordeon-przycisk-${i}`}
                className="px-5 pb-6 text-slate-600 sm:px-6"
              >
                {item.content}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
