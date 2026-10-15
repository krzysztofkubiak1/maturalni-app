import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PageHero from "@/components/PageHero";
import LoginForm from "@/components/LoginForm";
import { Container } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Logowanie",
  description: "Zaloguj się do panelu kursanta.",
  robots: { index: false, follow: false },
};

function safeRedirect(value: string | string[] | undefined): string {
  if (typeof value === "string" && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return "/panel";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const redirectTo = safeRedirect(params["po-zalogowaniu"]);
  const googleError = params["blad"] === "google";
  const loggedOut = params["wylogowano"] === "1";

  const user = await getCurrentUser();
  if (user) redirect(redirectTo);

  return (
    <>
      <PageHero
        crumbs={[{ label: "Logowanie" }]}
        eyebrow="Panel kursanta"
        title="Zaloguj się"
        description="Wejdź na swoje konto, żeby zobaczyć swoje kursy i materiały."
      />

      <section className="bg-white py-16 sm:py-20">
        <Container className="max-w-md">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8">
            <LoginForm redirectTo={redirectTo} googleError={googleError} loggedOut={loggedOut} />
          </div>
        </Container>
      </section>
    </>
  );
}
