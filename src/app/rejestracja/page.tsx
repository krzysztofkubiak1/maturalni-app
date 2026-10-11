import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PageHero from "@/components/PageHero";
import RegisterForm from "@/components/RegisterForm";
import { Container } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Rejestracja",
  description: "Załóż konto w panelu kursanta.",
  robots: { index: false, follow: false },
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const googleError = params["blad"] === "google";

  const user = await getCurrentUser();
  if (user) redirect("/panel");

  return (
    <>
      <PageHero
        crumbs={[{ label: "Rejestracja" }]}
        eyebrow="Panel kursanta"
        title="Załóż konto"
        description="Konto pozwoli Ci w przyszłości logować się do materiałów kursowych. Rejestracja zajmuje minutę."
      />

      <section className="bg-white py-16 sm:py-20">
        <Container className="max-w-md">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8">
            <RegisterForm googleError={googleError} />
          </div>
          <p className="mx-auto mt-6 max-w-sm text-center text-xs leading-relaxed text-slate-500">
            Zakładając konto, akceptujesz{" "}
            <a href="/regulamin" className="underline">
              regulamin
            </a>{" "}
            oraz{" "}
            <a href="/polityka-prywatnosci" className="underline">
              politykę prywatności
            </a>
            .
          </p>
        </Container>
      </section>
    </>
  );
}
