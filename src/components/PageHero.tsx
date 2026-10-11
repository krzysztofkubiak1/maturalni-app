import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Container } from "@/components/ui";
import type { ReactNode } from "react";

export type Crumb = { label: string; href?: string };

export default function PageHero({
  eyebrow,
  title,
  description,
  crumbs = [],
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  crumbs?: Crumb[];
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-ink">
      <div className="absolute inset-0 grid-paper" aria-hidden="true" />
      <div
        className="absolute -left-32 -top-32 size-[28rem] rounded-full bg-brand-600/25 blur-3xl"
        aria-hidden="true"
      />

      <Container className="relative py-14 sm:py-20">
        {crumbs.length > 0 ? (
          <nav aria-label="Okruszki" className="mb-6">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
              <li>
                <Link href="/" className="transition hover:text-white">
                  Strona główna
                </Link>
              </li>
              {crumbs.map((crumb) => (
                <li key={crumb.label} className="flex items-center gap-1.5">
                  <ChevronRight className="size-3.5" aria-hidden="true" />
                  {crumb.href ? (
                    <Link href={crumb.href} className="transition hover:text-white">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-slate-200">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        ) : null}

        <div className="max-w-3xl">
          {eyebrow ? (
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-300">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-5 text-base leading-relaxed text-slate-300 sm:text-lg">
              {description}
            </p>
          ) : null}
          {children}
        </div>
      </Container>
    </section>
  );
}
