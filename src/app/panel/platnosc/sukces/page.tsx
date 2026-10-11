import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Clock3, TriangleAlert } from "lucide-react";
import PageHero from "@/components/PageHero";
import { Container } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { confirmCheckout } from "@/lib/payments";

export const metadata: Metadata = {
  title: "Płatność przyjęta",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/logowanie?po-zalogowaniu=/panel");

  const params = await searchParams;
  const sessionId = typeof params.session_id === "string" ? params.session_id : "";
  const result = await confirmCheckout(sessionId);

  const paid = result.ok && result.order.status === "paid";
  const pending = result.ok && result.order.status === "pending";
  const courseTitle = result.ok ? result.order.course_title : null;

  return (
    <>
      <PageHero
        crumbs={[{ label: "Panel", href: "/panel" }, { label: "Płatność" }]}
        eyebrow="Płatność"
        title={paid ? "Dziękujemy za zakup!" : "Płatność przyjęta"}
      />

      <section className="bg-white py-16 sm:py-20">
        <Container className="max-w-lg">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-900/5">
            {paid ? (
              <>
                <CheckCircle2 className="mx-auto size-12 text-emerald-600" />
                <h2 className="mt-4 font-display text-xl font-bold text-ink">
                  Masz już dostęp{courseTitle ? ` do kursu „${courseTitle}”` : ""}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Kurs jest już w Twoim panelu. Potwierdzenie płatności wysłaliśmy na
                  Twój adres e-mail.
                </p>
              </>
            ) : pending ? (
              <>
                <Clock3 className="mx-auto size-12 text-brand-600" />
                <h2 className="mt-4 font-display text-xl font-bold text-ink">
                  Czekamy na potwierdzenie płatności
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Przy płatności BLIK lub Przelewy24 potwierdzenie może zająć chwilę.
                  Kurs pojawi się w panelu automatycznie — odśwież stronę za minutę.
                </p>
              </>
            ) : (
              <>
                <TriangleAlert className="mx-auto size-12 text-amber-500" />
                <h2 className="mt-4 font-display text-xl font-bold text-ink">
                  Nie udało się potwierdzić płatności
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {result.ok === false && result.reason === "not-configured"
                    ? "Płatności nie są jeszcze skonfigurowane na serwerze."
                    : "Jeśli pieniądze zostały pobrane, kurs pojawi się w panelu po chwili. W razie wątpliwości napisz do nas."}
                </p>
              </>
            )}

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/panel"
                className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                Przejdź do panelu
              </Link>
              <Link
                href="/kontakt"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                Kontakt
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
