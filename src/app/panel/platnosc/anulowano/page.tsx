import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { XCircle } from "lucide-react";
import PageHero from "@/components/PageHero";
import { Container } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Płatność anulowana",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function PaymentCancelledPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/logowanie?po-zalogowaniu=/panel");

  return (
    <>
      <PageHero
        crumbs={[{ label: "Panel", href: "/panel" }, { label: "Płatność" }]}
        eyebrow="Płatność"
        title="Płatność anulowana"
      />

      <section className="bg-white py-16 sm:py-20">
        <Container className="max-w-lg">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-900/5">
            <XCircle className="mx-auto size-12 text-slate-400" />
            <h2 className="mt-4 font-display text-xl font-bold text-ink">
              Nic nie zostało pobrane
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Przerwałeś płatność. Możesz wrócić do kursu i spróbować ponownie w dowolnym
              momencie.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/kursy"
                className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                Wróć do kursów
              </Link>
              <Link
                href="/panel"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                Panel
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
