import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PageHero from "@/components/PageHero";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";
import { Container } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Zapomniałem hasła",
  description: "Ustaw nowe hasło do swojego konta.",
  robots: { index: false, follow: false },
};

export default async function ForgotPasswordPage() {
  const user = await getCurrentUser();
  if (user) redirect("/panel");

  return (
    <>
      <PageHero
        crumbs={[{ label: "Zapomniałem hasła" }]}
        eyebrow="Panel kursanta"
        title="Zapomniałeś hasła?"
        description="Wyślemy Ci kod na e-mail, żeby ustawić nowe hasło."
      />

      <section className="bg-white py-16 sm:py-20">
        <Container className="max-w-md">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8">
            <ForgotPasswordForm />
          </div>
        </Container>
      </section>
    </>
  );
}
