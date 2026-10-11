import Link from "next/link";
import { ArrowRight, CalendarDays, Clock, MapPin, Users, Video, type LucideIcon } from "lucide-react";
import type { Course, Format } from "@/data/courses";
import { teachers, type Teacher } from "@/data/site";
import { Badge, cx } from "@/components/ui";

const levelTone = {
  rozszerzony: "from-brand-700 to-brand-900",
  podstawowy: "from-emerald-600 to-emerald-800",
} as const;

const formatIcon: Record<Format, LucideIcon> = {
  "Online na żywo": Users,
  Stacjonarnie: MapPin,
  "Kurs wideo (VOD)": Video,
};

export default function CourseCard({ course }: { course: Course }) {
  const courseTeachers = course.teacherSlugs
    .map((slug) => teachers.find((t) => t.slug === slug))
    .filter((t): t is Teacher => Boolean(t));
  const FormatIcon = formatIcon[course.format];

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl hover:shadow-slate-900/5">
      <div
        className={cx(
          "relative flex h-32 items-end bg-gradient-to-br p-5 grid-paper",
          levelTone[course.level],
        )}
      >
        <span className="absolute right-4 top-4 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur">
          {course.level === "rozszerzony" ? "Rozszerzenie" : "Podstawa"}
        </span>
        <div className="relative">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-white/80">
            <FormatIcon className="size-3.5" />
            {course.format}
          </p>
          <h3 className="mt-1 font-display text-lg font-bold leading-snug text-white">
            {course.shortTitle}
          </h3>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        {course.badge ? (
          <div className="mb-3">
            <Badge tone={course.featured ? "accent" : "neutral"}>{course.badge}</Badge>
          </div>
        ) : null}

        <p className="text-sm leading-relaxed text-slate-600">{course.summary}</p>

        {courseTeachers.length > 0 ? (
          <div className="mt-4 flex items-center gap-3">
            <div className="flex -space-x-2">
              {courseTeachers.map((teacher) => (
                <span
                  key={teacher.slug}
                  className="grid size-9 shrink-0 place-items-center rounded-full border-2 border-white bg-brand-100 text-xs font-bold text-brand-800"
                >
                  {teacher.initials}
                </span>
              ))}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">
                {courseTeachers.map((t) => t.name).join(" i ")}
              </p>
              <p className="truncate text-xs text-slate-500">Prowadzący</p>
            </div>
          </div>
        ) : null}

        <dl className="mt-4 grid grid-cols-2 gap-3 border-y border-slate-100 py-4 text-xs">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 shrink-0 text-brand-600" />
            <div>
              <dt className="text-slate-500">Start</dt>
              <dd className="font-semibold text-ink">{course.startDate}</dd>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="size-4 shrink-0 text-brand-600" />
            <div>
              <dt className="text-slate-500">Wymiar</dt>
              <dd className="font-semibold text-ink">{course.hoursTotal} godz.</dd>
            </div>
          </div>
        </dl>

        <div className="mt-auto pt-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="font-display text-2xl font-bold text-ink">
                {course.price.amount} zł
                <span className="ml-1 text-sm font-medium text-slate-500">
                  {course.price.unit}
                </span>
              </p>
              <p className="mt-0.5 text-xs text-slate-500">{course.price.note}</p>
            </div>
          </div>

          <Link
            href={`/kursy/${course.slug}`}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            Dowiedz się więcej
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
