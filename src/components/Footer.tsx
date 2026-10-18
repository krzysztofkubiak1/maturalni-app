import Link from "next/link";
import { Mail, MapPin, Phone, Sigma } from "lucide-react";
import { contact, site } from "@/data/site";
import { courses } from "@/data/courses";
import { Container } from "@/components/ui";
import {
  FacebookIcon,
  InstagramIcon,
  TiktokIcon,
  YoutubeIcon,
} from "@/components/SocialIcons";

const socialIcons = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  youtube: YoutubeIcon,
  tiktok: TiktokIcon,
} as const;

const socialLabels = {
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
  tiktok: "TikTok",
} as const;

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ink text-slate-300">
      <Container className="py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <span className="grid size-10 place-items-center rounded-xl bg-brand-600 text-white">
                <Sigma className="size-5" strokeWidth={2.5} />
              </span>
              <span className="font-display text-lg font-bold text-white">
                {site.name}
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              Kursy maturalne z matematyki na poziomie podstawowym i rozszerzonym.
              Zajęcia online na żywo w małych grupach.
            </p>

            <div className="mt-5 flex gap-2">
              {(Object.keys(socialIcons) as (keyof typeof socialIcons)[]).map(
                (key) => {
                  const href = contact.socials[key];
                  if (!href) return null;
                  const Icon = socialIcons[key];
                  return (
                    <a
                      key={key}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={socialLabels[key]}
                      className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-white/30 hover:text-white"
                    >
                      <Icon className="size-4" />
                    </a>
                  );
                },
              )}
            </div>
          </div>

          <div>
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-white">
              Kursy
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {courses.map((course) => (
                <li key={course.slug}>
                  <Link
                    href={`/kursy/${course.slug}`}
                    className="text-slate-400 transition hover:text-white"
                  >
                    {course.shortTitle}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-white">
              Informacje
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/program" className="text-slate-400 transition hover:text-white">
                  Program nauczania
                </Link>
              </li>
              <li>
                <Link href="/o-nas" className="text-slate-400 transition hover:text-white">
                  O nas
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-slate-400 transition hover:text-white">
                  Najczęstsze pytania
                </Link>
              </li>
              <li>
                <Link href="/kontakt" className="text-slate-400 transition hover:text-white">
                  Kontakt i zapisy
                </Link>
              </li>
              <li>
                <Link href="/logowanie" className="text-slate-400 transition hover:text-white">
                  Panel kursanta
                </Link>
              </li>
              <li>
                <Link href="/regulamin" className="text-slate-400 transition hover:text-white">
                  Regulamin
                </Link>
              </li>
              <li>
                <Link
                  href="/polityka-prywatnosci"
                  className="text-slate-400 transition hover:text-white"
                >
                  Polityka prywatności
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-white">
              Kontakt
            </h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <a
                  href={contact.phoneHref}
                  className="flex items-start gap-3 text-slate-400 transition hover:text-white"
                >
                  <Phone className="mt-0.5 size-4 shrink-0 text-brand-400" />
                  {contact.phone}
                </a>
              </li>
              <li>
                <a
                  href={contact.emailHref}
                  className="flex items-start gap-3 text-slate-400 transition hover:text-white"
                >
                  <Mail className="mt-0.5 size-4 shrink-0 text-brand-400" />
                  {contact.email}
                </a>
              </li>
              <li className="flex items-start gap-3 text-slate-400">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand-400" />
                {contact.address}
              </li>
            </ul>
            <p className="mt-4 text-xs text-slate-500">
              Biuro czynne {contact.officeHours}
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {site.name}. Wszelkie prawa zastrzeżone.
          </p>
        </div>
      </Container>
    </footer>
  );
}
