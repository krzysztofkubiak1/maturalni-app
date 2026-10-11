"use client";

import { useState } from "react";
import Accordion from "@/components/Accordion";
import { cx } from "@/components/ui";
import type { CurriculumModule, Level } from "@/data/courses";

const tabs: { id: Level; label: string; hint: string }[] = [
  {
    id: "rozszerzony",
    label: "Poziom rozszerzony",
    hint: "Pełen zakres wymagań na maturę rozszerzoną",
  },
  {
    id: "podstawowy",
    label: "Poziom podstawowy",
    hint: "Wszystko, czego potrzebujesz, żeby zdać i to dobrze",
  },
];

export default function CurriculumTabs({
  rozszerzony,
  podstawowy,
}: {
  rozszerzony: CurriculumModule[];
  podstawowy: CurriculumModule[];
}) {
  const [active, setActive] = useState<Level>("rozszerzony");
  const modules = active === "rozszerzony" ? rozszerzony : podstawowy;
  const totalHours = modules.reduce((sum, m) => sum + m.hours, 0);
  const totalTopics = modules.reduce((sum, m) => sum + m.topics.length, 0);

  return (
    <div>
      <div
        role="tablist"
        aria-label="Poziom nauczania"
        className="mx-auto grid max-w-xl grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`zakladka-${tab.id}`}
            aria-selected={active === tab.id}
            aria-controls={`panel-${tab.id}`}
            onClick={() => setActive(tab.id)}
            className={cx(
              "rounded-xl px-4 py-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
              active === tab.id
                ? "bg-brand-600 text-white shadow-md shadow-brand-600/25"
                : "text-slate-600 hover:bg-white hover:text-brand-700",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`panel-${active}`}
        aria-labelledby={`zakladka-${active}`}
        className="mt-8"
      >
        <p className="text-center text-sm text-slate-600">
          {tabs.find((t) => t.id === active)?.hint} ·{" "}
          <strong className="text-ink">{modules.length} działów</strong> ·{" "}
          <strong className="text-ink">{totalTopics} tematów</strong> · ok.{" "}
          <strong className="text-ink">{totalHours} godzin</strong>
        </p>

        <div className="mt-8">
          <Accordion
            key={active}
            defaultOpen={0}
            items={modules.map((module) => ({
              title: module.title,
              meta: `${module.hours} godz.`,
              content: (
                <ul className="grid gap-2.5 sm:grid-cols-2">
                  {module.topics.map((topic) => (
                    <li
                      key={topic}
                      className="flex items-start gap-2.5 text-sm leading-relaxed"
                    >
                      <span
                        className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-500"
                        aria-hidden="true"
                      />
                      {topic}
                    </li>
                  ))}
                </ul>
              ),
            }))}
          />
        </div>
      </div>
    </div>
  );
}
