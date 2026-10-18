import type { Metadata } from "next";
import { Compass, HeartHandshake, ShieldCheck, Sparkles } from "lucide-react";
import PageHero from "@/components/PageHero";
import CtaBand from "@/components/CtaBand";
import { Badge, Container, SectionHeading } from "@/components/ui";
import { site, stats, teachers } from "@/data/site";

export const metadata: Metadata = {
  title: "O nas",
  description:
    "Kim jesteśmy i jak uczymy matematyki. Poznaj prowadzących kursy maturalne, nasze podejście do nauki i wyniki uczniów.",
  alternates: { canonical: "/o-nas" },
};

const values = [
  {
    icon: Compass,
    title: "Uczymy zrozumienia, nie schematów",
    text: "Wkuwanie gotowych rozwiązań działa do pierwszego zadania, które wygląda inaczej. Pokazujemy, skąd bierze się metoda, żebyś umiał ją zastosować także wtedy, gdy CKE zmieni opakowanie.",
  },
  {
    icon: HeartHandshake,
    title: "Nikt tu nikogo nie ocenia",
    text: "Pytanie „a czemu tu jest minus?” nie jest głupie. Większość naszych uczniów przychodzi z brakami sprzed kilku lat — to normalne i da się nadrobić.",
  },
  {
    icon: ShieldCheck,
    title: "Uczciwe zasady",
    text: "Bez płatności z góry, bez umów wiążących na rok, bez opłaty wpisowej. Jeśli stwierdzisz, że to nie dla Ciebie — po prostu rezygnujesz, bez żadnych konsekwencji.",
  },
  {
    icon: Sparkles,
    title: "Mierzymy efekty",
    text: "Piszemy sprawdziany i matury próbne, żeby wiedzieć, gdzie naprawdę jesteś. Bez tego cała nauka opiera się na wrażeniach.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        crumbs={[{ label: "O nas" }]}
        eyebrow="Poznaj nas"
        title={`Dlaczego powstało ${site.name}`}
        description="Bo co roku tysiące uczniów słyszy, że „matematyka nie jest dla nich”, a prawda jest taka, że po prostu nikt nie przeszedł z nimi materiału po kolei."
      />

      {/* Historia */}
      <section className="bg-white py-20 sm:py-24">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <SectionHeading
                align="left"
                eyebrow="Nasza historia"
                title="Zaczęło się od korepetycji przy kuchennym stole"
              />
              <div className="mt-6 space-y-4 leading-relaxed text-slate-600">
                <p>
                  Wszystko zaczęło się od zwykłych korepetycji. Spotykaliśmy się z pojedynczymi uczniami, tłumaczyliśmy zadania, rozwiązywaliśmy arkusze i krok po kroku przygotowywaliśmy ich do matury. Szybko okazało się, że to działa, a zadowoleni uczniowie zaczęli polecać nas znajomym.
                </p>
                <p>
                  Chętnych przybywało z każdym rokiem, więc zaczęliśmy łączyć uczniów w małe, kilkuosobowe grupy. Okazało się, że to był strzał w dziesiątkę. Wspólna nauka nie tylko pozwoliła dotrzeć do większej liczby osób, ale też dała coś, czego nie da się uzyskać na lekcji jeden na jeden: poczucie, że nie jesteś z maturą sam.                 </p>
                <p>
                  Dziś nasze zajęcia to coś więcej niż kurs. To zgrana ekipa, w której jest miejsce na żarty, luźną atmosferę i pytania, których nikt się nie wstydzi. Uczniowie wzajemnie się napędzają, motywują i cieszą z postępów, a my dbamy o to, żeby każdy z nich doszedł do matury przygotowany i pewny siebie.
                </p>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-4 self-start">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-6"
                >
                  <dt className="sr-only">{stat.label}</dt>
                  <dd>
                    <span className="block font-display text-4xl font-bold text-brand-700">
                      {stat.value}
                    </span>
                    <span className="mt-2 block text-sm leading-snug text-slate-600">
                      {stat.label}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </Container>
      </section>

      {/* Wartości */}
      <section className="bg-slate-50 py-20 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="Jak pracujemy"
            title="Cztery zasady, których się trzymamy"
          />
          <div className="mt-14 grid gap-6 md:grid-cols-2">
            {values.map((value) => (
              <div
                key={value.title}
                className="rounded-2xl border border-slate-200 bg-white p-7"
              >
                <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-700">
                  <value.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-ink">
                  {value.title}
                </h3>
                <p className="mt-2 leading-relaxed text-slate-600">{value.text}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Zespół */}
      <section className="bg-white py-20 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="Zespół"
            title="Kto poprowadzi Twoje zajęcia"
            description="Każdy z prowadzących uczy tylko tego, w czym jest naprawdę dobry — i tylko na tym poziomie, na którym ma najlepsze wyniki."
          />

          <div className="mt-14 grid gap-6 md:grid-cols-2">
            {teachers.map((teacher) => (
              <article
                key={teacher.slug}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-7"
              >
                <div className="flex items-center gap-4">
                  <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-brand-600 font-display text-xl font-bold text-white">
                    {teacher.initials}
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-bold text-ink">
                      {teacher.name}
                    </h3>
                    <p className="text-sm text-brand-700">{teacher.title}</p>
                  </div>
                </div>
                <p className="mt-5 leading-relaxed text-slate-600">{teacher.bio}</p>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {teacher.highlights.map((h) => (
                    <li key={h}>
                      <Badge tone="brand">{h}</Badge>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <CtaBand />
    </>
  );
}
