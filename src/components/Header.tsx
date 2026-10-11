"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, LayoutDashboard, LogOut, Menu, Phone, Sigma, X } from "lucide-react";
import { contact, navLinks, site } from "@/data/site";
import { courses } from "@/data/courses";
import { ButtonLink, Container, cx } from "@/components/ui";
import { useAuth } from "@/components/AuthProvider";

export default function Header() {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [coursesOpen, setCoursesOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);

  // Zamknij menu po zmianie strony (korekta stanu w trakcie renderu —
  // zalecany wzorzec zamiast useEffect, patrz react.dev/learn/you-might-not-need-an-effect)
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMobileOpen(false);
    setCoursesOpen(false);
  }

  // Zablokuj scroll tła, gdy otwarte jest menu mobilne
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setCoursesOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const handleLogout = async () => {
    setMobileOpen(false);
    await logout();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <Container>
        <div className="flex h-18 items-center justify-between gap-4 py-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-600/25">
              <Sigma className="size-5" strokeWidth={2.5} />
            </span>
            <span className="font-display text-lg font-bold leading-none tracking-tight text-ink">
              {site.name}
            </span>
          </Link>

          {/* Nawigacja — desktop */}
          <nav
            aria-label="Nawigacja główna"
            className="hidden items-center gap-1 lg:flex"
          >
            <div
              className="relative"
              onMouseEnter={() => setCoursesOpen(true)}
              onMouseLeave={() => setCoursesOpen(false)}
            >
              <button
                type="button"
                aria-expanded={coursesOpen}
                aria-haspopup="true"
                onClick={() => setCoursesOpen((v) => !v)}
                className={cx(
                  "flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold transition",
                  isActive("/kursy")
                    ? "text-brand-700"
                    : "text-slate-700 hover:text-brand-700",
                )}
              >
                Kursy
                <ChevronDown
                  className={cx(
                    "size-4 transition-transform",
                    coursesOpen && "rotate-180",
                  )}
                />
              </button>

              {coursesOpen ? (
                <div className="absolute left-0 top-full w-80 pt-2">
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10">
                    {courses.map((course) => (
                      <Link
                        key={course.slug}
                        href={`/kursy/${course.slug}`}
                        className="block rounded-xl px-3 py-2.5 transition hover:bg-brand-50"
                      >
                        <span className="block text-sm font-semibold text-ink">
                          {course.shortTitle}
                        </span>
                        <span className="mt-0.5 block text-xs text-slate-500">
                          {course.format} · poziom {course.level}
                        </span>
                      </Link>
                    ))}
                    <Link
                      href="/kursy"
                      className="mt-1 block rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
                    >
                      Zobacz wszystkie kursy →
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>

            {navLinks
              .filter((l) => l.href !== "/kursy")
              .map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cx(
                    "rounded-lg px-3 py-2 text-sm font-semibold transition",
                    isActive(link.href)
                      ? "text-brand-700"
                      : "text-slate-700 hover:text-brand-700",
                  )}
                >
                  {link.label}
                </Link>
              ))}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href={contact.phoneHref}
              className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:text-brand-700 xl:flex"
            >
              <Phone className="size-4" />
              {contact.phone}
            </a>

            {!loading && user ? (
              <div className="hidden items-center gap-2 sm:flex">
                <Link
                  href="/panel"
                  className={cx(
                    "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition",
                    isActive("/panel")
                      ? "text-brand-700"
                      : "text-slate-700 hover:text-brand-700",
                  )}
                >
                  <LayoutDashboard className="size-4" />
                  Panel
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <LogOut className="size-4" />
                  Wyloguj
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/logowanie"
                  className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:text-brand-700 sm:inline-flex"
                >
                  Zaloguj się
                </Link>
                <ButtonLink href="/kontakt" size="sm" className="hidden sm:inline-flex">
                  Zapisz się
                </ButtonLink>
              </>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-expanded={mobileOpen}
              aria-controls="menu-mobilne"
              aria-label={mobileOpen ? "Zamknij menu" : "Otwórz menu"}
              className="grid size-10 place-items-center rounded-xl border border-slate-300 text-slate-700 transition hover:bg-slate-50 lg:hidden"
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </Container>

      {/* Nawigacja — mobile */}
      {mobileOpen ? (
        <div
          id="menu-mobilne"
          className="border-t border-slate-200 bg-white lg:hidden"
        >
          <Container>
            <nav aria-label="Nawigacja mobilna" className="max-h-[75vh] overflow-y-auto py-4">
              <p className="px-1 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                Kursy
              </p>
              <div className="grid gap-1">
                {courses.map((course) => (
                  <Link
                    key={course.slug}
                    href={`/kursy/${course.slug}`}
                    className="rounded-xl px-3 py-2.5 transition hover:bg-brand-50"
                  >
                    <span className="block text-sm font-semibold text-ink">
                      {course.shortTitle}
                    </span>
                    <span className="text-xs text-slate-500">{course.format}</span>
                  </Link>
                ))}
              </div>

              <div className="mt-4 grid gap-1 border-t border-slate-200 pt-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-brand-50"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="mt-4 grid gap-1 border-t border-slate-200 pt-4">
                {!loading && user ? (
                  <>
                    <Link
                      href="/panel"
                      className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-brand-50"
                    >
                      <LayoutDashboard className="size-4" />
                      Panel
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-800 transition hover:bg-brand-50"
                    >
                      <LogOut className="size-4" />
                      Wyloguj się
                    </button>
                  </>
                ) : (
                  <Link
                    href="/logowanie"
                    className="rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-brand-50"
                  >
                    Zaloguj się
                  </Link>
                )}
              </div>

              <div className="mt-4 grid gap-2 border-t border-slate-200 pt-4">
                <ButtonLink href="/kontakt" size="md">
                  Zapisz się na kurs
                </ButtonLink>
                <a
                  href={contact.phoneHref}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800"
                >
                  <Phone className="size-4" />
                  {contact.phone}
                </a>
              </div>
            </nav>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
