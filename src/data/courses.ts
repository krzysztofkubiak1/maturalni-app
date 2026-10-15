/**
 * ============================================================
 *  KURSY I PROGRAM NAUCZANIA — DO PODMIANY
 * ============================================================
 *  Ceny, terminy i liczby godzin to placeholdery (TODO).
 *  Program merytoryczny jest zbudowany na wymaganiach
 *  egzaminacyjnych CKE — zweryfikuj go pod kątem aktualnego
 *  rocznika przed publikacją.
 */

import { contact } from "@/data/site";

export type Level = "podstawowy" | "rozszerzony";
export type Format = "Online na żywo" | "Stacjonarnie" | "Kurs wideo (VOD)";

export type CurriculumModule = {
  title: string;
  /** Orientacyjna liczba godzin lekcyjnych */
  hours: number;
  topics: string[];
};

export type Course = {
  slug: string;
  title: string;
  /** Krótka nazwa do kart i nawigacji */
  shortTitle: string;
  level: Level;
  format: Format;
  /** Wyróżnik na karcie, np. "Najczęściej wybierany" */
  badge?: string;
  featured?: boolean;
  /** Wszyscy prowadzący ten kurs (zwykle obaj nauczyciele) */
  teacherSlugs: string[];
  summary: string;
  /** Dłuższy opis na stronie kursu */
  intro: string[];
  startDate: string;
  schedule: string;
  /** Adres, pod którym odbywają się zajęcia — tylko dla kursów stacjonarnych */
  location?: string;
  duration: string;
  lessons: number;
  hoursTotal: number;
  groupSize: string;
  price: {
    /** Kwota główna wyświetlana na karcie */
    amount: number;
    /** Jednostka: "/ mies." albo "jednorazowo" */
    unit: string;
    /** Dopisek pod ceną */
    note: string;
  };
  forWhom: string[];
  includes: string[];
  curriculum: CurriculumModule[];
};

/* ------------------------------------------------------------------ */
/*  PROGRAMY NAUCZANIA                                                 */
/* ------------------------------------------------------------------ */

const curriculumRozszerzony: CurriculumModule[] = [
  {
    title: "Funkcje i wartość bezwzględna",
    hours: 2,
    topics: [
      "Wartość bezwzględna — definicja i interpretacja na osi liczbowej",
      "Równania i nierówności z wartością bezwzględną",
      "Funkcje z wartością bezwzględną — wykresy i przekształcenia",
      "Dziedzina, miejsca zerowe i monotoniczność funkcji",
    ],
  },
  {
    title: "Funkcja kwadratowa",
    hours: 2,
    topics: [
      "Postać ogólna, kanoniczna i iloczynowa funkcji kwadratowej",
      "Wierzchołek paraboli, ekstremum, zbiór wartości",
      "Równania i nierówności kwadratowe, wzory Viète'a",
      "Funkcja kwadratowa z parametrem",
      "Zadania optymalizacyjne z funkcją kwadratową",
    ],
  },
  {
    title: "Wielomiany i funkcje wymierne",
    hours: 2,
    topics: [
      "Działania na wielomianach, dzielenie wielomianów",
      "Rozkład wielomianu na czynniki, twierdzenie Bézouta",
      "Równania i nierówności wielomianowe",
      "Funkcja wymierna — dziedzina, asymptoty, wykres",
      "Równania i nierówności wymierne",
    ],
  },
  {
    title: "Trygonometria",
    hours: 2,
    topics: [
      "Funkcje trygonometryczne kąta ostrego i dowolnego, miara łukowa",
      "Tożsamości trygonometryczne i wzory redukcyjne",
      "Wzory na sumę i różnicę kątów, wzór na kąt podwojony",
      "Wykresy funkcji trygonometrycznych i ich przekształcenia",
      "Równania i nierówności trygonometryczne",
    ],
  },
  {
    title: "Ciągi",
    hours: 2,
    topics: [
      "Ciąg arytmetyczny — wzór ogólny i suma",
      "Ciąg geometryczny — wzór ogólny i suma",
      "Zadania łączone: ciąg arytmetyczny i geometryczny jednocześnie",
    ],
  },
  {
    title: "Granice i szeregi",
    hours: 2,
    topics: [
      "Granica ciągu, ciągi zbieżne i rozbieżne",
      "Twierdzenia o granicach ciągów",
      "Szereg geometryczny i jego suma",
      "Procent składany, oprocentowanie, kredyty i lokaty",
    ],
  },
  {
    title: "Zadania na dowodzenie: nierówności i podzielność",
    hours: 2,
    topics: [
      "Jak zapisać dowód, żeby dostać komplet punktów",
      "Dowodzenie nierówności, w tym nierówność między średnimi",
      "Dowody z podzielnością liczb całkowitych",
      "Najczęstsze błędy formalne kosztujące punkty",
    ],
  },
  {
    title: "Logarytmy i funkcja potęgowa",
    hours: 2,
    topics: [
      "Logarytmy — definicja, własności, zmiana podstawy",
      "Równania i nierówności logarytmiczne",
      "Funkcja potęgowa i wykładnicza — własności i wykresy",
    ],
  },
  {
    title: "Planimetria: twierdzenia sinusów i cosinusów",
    hours: 2,
    topics: [
      "Twierdzenie sinusów i twierdzenie cosinusów",
      "Zastosowanie twierdzeń w zadaniach z trójkątami",
      "Pole trójkąta z wykorzystaniem trygonometrii",
    ],
  },
  {
    title: "Planimetria: okręgi",
    hours: 2,
    topics: [
      "Kąt wpisany i środkowy, kąt dopisany",
      "Twierdzenie o odcinkach siecznych i stycznej",
      "Okrąg wpisany i opisany na wielokącie",
    ],
  },
  {
    title: "Planimetria: podobieństwo i przystawanie",
    hours: 2,
    topics: [
      "Cechy przystawania i podobieństwa trójkątów",
      "Twierdzenie Talesa",
      "Stosunki pól figur podobnych",
    ],
  },
  {
    title: "Planimetria: zadania różne",
    hours: 2,
    topics: [
      "Czworokąty i ich własności, czworokąty wpisane i opisane",
      "Punkty szczególne trójkąta, symetralne, dwusieczne",
      "Zadania łączone z całej planimetrii",
    ],
  },
  {
    title: "Rachunek różniczkowy",
    hours: 2,
    topics: [
      "Granica funkcji w punkcie i w nieskończoności, ciągłość",
      "Definicja pochodnej i jej interpretacja geometryczna",
      "Wzory na pochodne, pochodna iloczynu, ilorazu i funkcji złożonej",
      "Równanie stycznej do wykresu funkcji",
      "Monotoniczność, ekstrema lokalne, badanie przebiegu zmienności",
    ],
  },
  {
    title: "Geometria analityczna",
    hours: 2,
    topics: [
      "Równanie prostej, warunki równoległości i prostopadłości",
      "Odległość punktu od prostej, odległość między prostymi",
      "Równanie okręgu, wzajemne położenie prostej i okręgu",
      "Wektory, działania na wektorach, środek odcinka",
      "Symetria względem punktu i prostej",
    ],
  },
  {
    title: "Kombinatoryka 1",
    hours: 2,
    topics: [
      "Reguła mnożenia i dodawania",
      "Permutacje, wariacje i kombinacje",
      "Symbol Newtona i dwumian Newtona",
    ],
  },
  {
    title: "Kombinatoryka 2",
    hours: 2,
    topics: [
      "Prawdopodobieństwo klasyczne, drzewka stochastyczne",
      "Prawdopodobieństwo warunkowe i całkowite",
      "Twierdzenie Bayesa, niezależność zdarzeń, schemat Bernoulliego",
    ],
  },
  {
    title: "Optymalizacja 1",
    hours: 2,
    topics: [
      "Zadania optymalizacyjne z funkcją kwadratową",
      "Zadania optymalizacyjne z planimetrią i stereometrią",
    ],
  },
  {
    title: "Optymalizacja 2",
    hours: 2,
    topics: [
      "Zadania optymalizacyjne z wykorzystaniem pochodnej",
      "Największa i najmniejsza wartość funkcji w zadaniach praktycznych",
    ],
  },
  {
    title: "Stereometria 1",
    hours: 2,
    topics: [
      "Graniastosłupy — pola powierzchni i objętości",
      "Ostrosłupy — pola powierzchni i objętości",
      "Kąt między prostą a płaszczyzną, kąt dwuścienny",
    ],
  },
  {
    title: "Stereometria 2",
    hours: 2,
    topics: [
      "Bryły obrotowe: walec, stożek, kula",
      "Bryły wpisane i opisane na kuli",
      "Zastosowanie trygonometrii w bryłach, przekroje brył płaszczyzną",
    ],
  },
  {
    title: "Powtórka 1 (arkusze 1–6)",
    hours: 2,
    topics: [
      "Pełny arkusz maturalny w warunkach egzaminacyjnych",
      "Omówienie zadań i analiza błędów",
    ],
  },
  {
    title: "Powtórka 2 (arkusze 7–12)",
    hours: 2,
    topics: [
      "Pełny arkusz maturalny w warunkach egzaminacyjnych",
      "Omówienie zadań i analiza błędów",
    ],
  },
  {
    title: "Powtórka 3 (arkusze 13–18)",
    hours: 2,
    topics: [
      "Pełny arkusz maturalny w warunkach egzaminacyjnych",
      "Omówienie zadań i analiza błędów",
    ],
  },
  {
    title: "Powtórka 4 (arkusze 19–24)",
    hours: 2,
    topics: [
      "Pełny arkusz maturalny w warunkach egzaminacyjnych",
      "Omówienie zadań i analiza błędów",
    ],
  },
  {
    title: "Wielka lekcja maturzystów",
    hours: 2,
    topics: [
      "Stacjonarna sesja podsumowująca całość materiału",
      "Powtórka najważniejszych wzorów i strategii przed egzaminem",
      "Sesja pytań i odpowiedzi, konsultacje indywidualne",
    ],
  },
];

const curriculumPodstawowy: CurriculumModule[] = [
  {
    title: "Liczby rzeczywiste 1",
    hours: 2,
    topics: [
      "Ułamki, kolejność działań, oś liczbowa i przedziały",
      "Potęgi i pierwiastki — działania i usuwanie niewymierności",
    ],
  },
  {
    title: "Liczby rzeczywiste 2",
    hours: 2,
    topics: [
      "Procenty: obniżki, podwyżki, VAT, punkty procentowe",
      "Notacja wykładnicza, zaokrąglenia i szacowanie",
      "Logarytmy — definicja i podstawowe własności",
    ],
  },
  {
    title: "Wyrażenia algebraiczne",
    hours: 2,
    topics: [
      "Wzory skróconego mnożenia i ich zastosowania",
      "Przekształcanie wzorów (wyznaczanie zmiennej)",
      "Wyrażenia wymierne — dziedzina i skracanie",
    ],
  },
  {
    title: "Równania i nierówności liniowe",
    hours: 2,
    topics: [
      "Równania i nierówności liniowe",
      "Układy równań i ich interpretacja geometryczna",
    ],
  },
  {
    title: "Równania i nierówności kwadratowe",
    hours: 2,
    topics: [
      "Równania kwadratowe — delta, wzory Viète'a",
      "Nierówności kwadratowe i odczyt z paraboli",
      "Proste równania wymierne",
    ],
  },
  {
    title: "Funkcje — własności",
    hours: 2,
    topics: [
      "Odczytywanie własności funkcji z wykresu",
      "Dziedzina, miejsca zerowe, monotoniczność, wartości ekstremalne",
    ],
  },
  {
    title: "Funkcje — rodzaje i wykresy",
    hours: 2,
    topics: [
      "Funkcja liniowa i jej wykres",
      "Funkcja kwadratowa — postać ogólna, kanoniczna, iloczynowa",
      "Przesunięcia wykresów funkcji",
      "Proporcjonalność odwrotna i funkcja wykładnicza",
    ],
  },
  {
    title: "Ciągi",
    hours: 2,
    topics: [
      "Ciąg arytmetyczny — wzór ogólny i suma",
      "Ciąg geometryczny — wzór ogólny i suma",
      "Procent składany, lokaty i kredyty",
    ],
  },
  {
    title: "Trygonometria",
    hours: 2,
    topics: [
      "Sinus, cosinus i tangens kąta ostrego",
      "Wartości funkcji dla kątów 30°, 45°, 60°",
      "Zastosowanie w trójkącie prostokątnym i zadaniach praktycznych",
    ],
  },
  {
    title: "Planimetria: trójkąty i twierdzenie Talesa",
    hours: 2,
    topics: [
      "Twierdzenie Pitagorasa",
      "Twierdzenie Talesa",
      "Trójkąty — rodzaje, wysokości, pola",
    ],
  },
  {
    title: "Planimetria: czworokąty i okrąg",
    hours: 2,
    topics: [
      "Czworokąty i ich własności",
      "Koło i okrąg, kąt wpisany i środkowy",
    ],
  },
  {
    title: "Planimetria: podobieństwo i pola figur",
    hours: 2,
    topics: [
      "Podobieństwo figur i skala",
      "Pola i obwody figur złożonych",
    ],
  },
  {
    title: "Geometria analityczna",
    hours: 2,
    topics: [
      "Odległość punktów i środek odcinka",
      "Równanie prostej przechodzącej przez dwa punkty",
      "Proste równoległe i prostopadłe",
    ],
  },
  {
    title: "Stereometria: graniastosłupy i ostrosłupy",
    hours: 2,
    topics: [
      "Graniastosłupy — pola powierzchni i objętości",
      "Ostrosłupy — wysokość, krawędź boczna, apotema",
    ],
  },
  {
    title: "Stereometria: bryły obrotowe",
    hours: 2,
    topics: [
      "Bryły obrotowe: walec, stożek, kula",
      "Kąt między krawędzią a podstawą, przekroje brył",
    ],
  },
  {
    title: "Kombinatoryka",
    hours: 2,
    topics: [
      "Reguła mnożenia i zliczanie możliwości",
      "Podstawowe schematy zliczania w zadaniach maturalnych",
    ],
  },
  {
    title: "Prawdopodobieństwo",
    hours: 2,
    topics: [
      "Drzewka stochastyczne",
      "Prawdopodobieństwo klasyczne",
      "Zdarzenia przeciwne i zadania z kostką, monetą, urną",
    ],
  },
  {
    title: "Statystyka",
    hours: 2,
    topics: [
      "Średnia arytmetyczna i średnia ważona",
      "Mediana i dominanta",
      "Odczyt danych z tabel, diagramów i wykresów",
    ],
  },
  {
    title: "Powtórka 1 (arkusze 1–5)",
    hours: 2,
    topics: [
      "Pełny arkusz maturalny w warunkach egzaminacyjnych",
      "Omówienie zadań i analiza błędów",
    ],
  },
  {
    title: "Powtórka 2 (arkusze 6–10)",
    hours: 2,
    topics: [
      "Pełny arkusz maturalny w warunkach egzaminacyjnych",
      "Omówienie zadań i analiza błędów",
    ],
  },
  {
    title: "Powtórka 3 (arkusze 11–15)",
    hours: 2,
    topics: [
      "Pełny arkusz maturalny w warunkach egzaminacyjnych",
      "Omówienie zadań i analiza błędów",
    ],
  },
  {
    title: "Powtórka 4 (arkusze 16–20)",
    hours: 2,
    topics: [
      "Pełny arkusz maturalny w warunkach egzaminacyjnych",
      "Omówienie zadań i analiza błędów",
    ],
  },
  {
    title: "Powtórka 5 (arkusze 21–25)",
    hours: 2,
    topics: [
      "Pełny arkusz maturalny w warunkach egzaminacyjnych",
      "Omówienie zadań i analiza błędów",
    ],
  },
  {
    title: "Powtórka 6 (arkusze 26–30)",
    hours: 2,
    topics: [
      "Pełny arkusz maturalny w warunkach egzaminacyjnych",
      "Omówienie zadań i analiza błędów",
    ],
  },
  {
    title: "Wielka lekcja maturzystów",
    hours: 2,
    topics: [
      "Stacjonarna sesja podsumowująca całość materiału",
      "Powtórka najważniejszych wzorów i strategii przed egzaminem",
      "Sesja pytań i odpowiedzi, konsultacje indywidualne",
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  KURSY                                                              */
/* ------------------------------------------------------------------ */

export const courses: Course[] = [
  {
    slug: "matematyka-rozszerzona",
    title: "Kurs maturalny z matematyki rozszerzonej",
    shortTitle: "Matematyka rozszerzona",
    level: "rozszerzony",
    format: "Online na żywo",
    badge: "Najczęściej wybierany",
    featured: true,
    teacherSlugs: ["prowadzacy-1", "prowadzacy-2"],
    summary:
      "Całoroczny kurs obejmujący pełen zakres rozszerzenia — od logarytmów po pochodne i dowody. Zajęcia na żywo, nagrania, zadania domowe ze sprawdzaniem.",
    intro: [
      "To kurs dla osób, które zdają rozszerzoną matematykę na poważnie — bo potrzebują jej na studia, a nie dlatego, że „trzeba coś wybrać”. Przez cały rok szkolny przechodzimy przez każdy dział wymagań egzaminacyjnych CKE, w kolejności, która ma sens: najpierw narzędzia, potem zadania, które ich wymagają.",
      "Nie zakładamy, że umiesz już wszystko z klas wcześniejszych. Pierwsze tygodnie to solidne domknięcie podstaw — bo większość problemów z rozszerzeniem bierze się z dziur w rzeczach pozornie prostych. Później tempo rośnie.",
      "Od lutego przechodzimy w tryb arkuszowy: piszemy pełne arkusze na czas, omawiamy każde zadanie i pracujemy nad zapisem rozwiązań, bo tam co roku giną punkty.",
    ],
    startDate: "1 listopada", // TODO
    schedule: "wtorki, czwartki", // TODO
    duration: "listopad – kwiecień",
    lessons: 25,
    hoursTotal: 50,
    groupSize: "do 50 osób",
    price: { amount: 100, unit: "/ lekcje.", note: "płatne z góry" }, // TODO
    forWhom: [
      "Zdajesz rozszerzenie i potrzebujesz konkretnego wyniku na studia",
      "Masz braki z wcześniejszych klas i chcesz je uzupełnić bez wstydu",
      "W szkole materiał leci za szybko albo za wolno",
      "Uczysz się sam i gubisz się w tym, co jeszcze zostało do przerobienia",
    ],
    includes: [
      "jedna lekcja po 100 minut tygodniowo, na żywo",
      "Nagranie z każdej lekcji dostępne tego samego dnia",
      "Skrypt z teorią i przykładami do każdego działu",
      "Cotygodniowe zadania domowe sprawdzane indywidualnie",
      "Baza arkuszy maturalnych z omówieniami",
    ],
    curriculum: curriculumRozszerzony,
  },
  {
    slug: "matematyka-podstawowa",
    title: "Kurs maturalny z matematyki podstawowej",
    shortTitle: "Matematyka podstawowa",
    level: "podstawowy",
    format: "Online na żywo",
    badge: "Od zera do zdanej matury",
    featured: true,
    teacherSlugs: ["prowadzacy-1", "prowadzacy-2"],
    summary:
      "Kurs dla wszystkich, którzy chcą po prostu zdać — i zdać dobrze. Zaczynamy od naprawdę podstawowych rzeczy, bez pośpiechu i bez oceniania.",
    intro: [
      "Ten kurs powstał dla osób, które od lat słyszą, że „matematyka nie jest dla nich”. W praktyce prawie zawsze okazuje się, że gdzieś po drodze — w podstawówce albo w pierwszej klasie liceum — zabrakło jednego wyjaśnienia, a wszystko po nim przestało się kleić.",
      "Zaczynamy od ułamków, potęg i przekształcania wzorów. Dopiero na tym budujemy funkcje, ciągi i geometrię. Tempo jest spokojne, a każdy temat kończy się zestawem zadań od najprostszych do maturalnych.",
      "Celem nie jest 30% na zaliczenie. Naszym uczniom wychodzi średnio znacznie więcej — bo materiał podstawowy jest naprawdę do ogarnięcia, jeśli ktoś przejdzie z Tobą przez niego po kolei.",
    ],
    startDate: "1 listopada", // TODO
    schedule: "wtorki, czwartki", // TODO
    duration: "listopad – kwiecień",
    lessons: 25,
    hoursTotal: 50,
    groupSize: "do 50 osób",
    price: { amount: 90, unit: "/ lekcje", note: "płatne z góry" }, // TODO
    forWhom: [
      "Chcesz mieć pewność, że zdasz maturę podstawową",
      "Masz duże braki i nie wiesz, od czego zacząć",
      "Boisz się pytać na lekcji, żeby nie wyjść na tego, kto nie ogarnia",
      "Potrzebujesz kogoś, kto poukłada Ci naukę tydzień po tygodniu",
    ],
    includes: [
      "Jedna lekcja po 100 minut tygodniowo, na żywo",
      "Nagranie z każdej lekcji",
      "Skrypty i zestawy zadań od poziomu podstawowego",
      "Zadania domowe sprawdzane z komentarzem",
      "Arkusze maturalne z omówieniem krok po kroku",    ],
    curriculum: curriculumPodstawowy,
  },
  {
    slug: "matematyka-rozszerzona-stacjonarnie",
    title: "Stacjonarny kurs maturalny z matematyki rozszerzonej",
    shortTitle: "Rozszerzenie stacjonarnie",
    level: "rozszerzony",
    format: "Stacjonarnie",
    badge: "Zajęcia na miejscu",
    teacherSlugs: ["prowadzacy-1", "prowadzacy-2"],
    summary:
      "Ten sam pełny program rozszerzenia co online, ale na żywo w naszej sali — bez ekranu między Tobą a tablicą.",
    intro: [
      "Dla osób, które uczą się najlepiej w realnym kontakcie z prowadzącym i grupą — bez przeglądarki, bez „czy mnie słychać”. Program merytoryczny jest identyczny jak w kursie online: pełny zakres wymagań na maturę rozszerzoną, w tej samej kolejności.",
      "Zajęcia prowadzi na zmianę dwoje nauczycieli, więc poznajesz dwa różne sposoby tłumaczenia tego samego zagadnienia — to często pomaga, gdy jedno wytłumaczenie „nie kliknęło”.",
      "Od lutego przechodzimy w tryb arkuszowy: piszemy pełne arkusze na czas, w warunkach zbliżonych do egzaminu, i szczegółowo omawiamy każdy błąd.",
    ],
    startDate: "1 listopada", // TODO
    schedule: "wtorki, czwartki", // TODO
    location: contact.address, // TODO: adres realnej sali zajęć, jeśli inny niż siedziba
    duration: "listopad – kwiecień",
    lessons: 25,
    hoursTotal: 50,
    groupSize: "do 10 osób",
    price: { amount: 140, unit: "/ lekcje", note: "płatne z góry" }, // TODO
    forWhom: [
      "Wolisz uczyć się w realnym kontakcie, nie przez ekran",
      "Zdajesz rozszerzenie i potrzebujesz konkretnego wyniku na studia",
      "Lepiej pracuje Ci się w grupie na miejscu niż online",
      "Masz braki z wcześniejszych klas i chcesz je uzupełnić bez wstydu",
    ],
    includes: [
      "2 lekcje po 100 minut tygodniowo, stacjonarnie",
      "Kameralna grupa i bezpośredni kontakt z prowadzącym",
      "Skrypt z teorią i przykładami do każdego działu",
      "Cotygodniowe zadania domowe sprawdzane indywidualnie",
      "Baza arkuszy maturalnych z omówieniami",
      "6 matur próbnych w warunkach egzaminacyjnych",
      "Czat grupowy z prowadzącymi między zajęciami",
    ],
    curriculum: curriculumRozszerzony,
  },
  {
    slug: "matematyka-podstawowa-stacjonarnie",
    title: "Stacjonarny kurs maturalny z matematyki podstawowej",
    shortTitle: "Podstawa stacjonarnie",
    level: "podstawowy",
    format: "Stacjonarnie",
    badge: "Zajęcia na miejscu",
    teacherSlugs: ["prowadzacy-1", "prowadzacy-2"],
    summary:
      "Ten sam program co kurs podstawowy online, ale na żywo w naszej sali — dla osób, które wolą uczyć się bez ekranu.",
    intro: [
      "Ten kurs powstał z myślą o osobach, które od lat słyszą, że „matematyka nie jest dla nich”, i które najlepiej uczą się, mając kogoś naprzeciwko przy tablicy, a nie na ekranie.",
      "Zaczynamy od ułamków, potęg i przekształcania wzorów. Dopiero na tym budujemy funkcje, ciągi i geometrię. Tempo jest spokojne, a każdy temat kończy się zestawem zadań od najprostszych do maturalnych.",
      "Zajęcia prowadzi na zmianę dwoje nauczycieli — łatwiej wtedy trafić na sposób tłumaczenia, który akurat do Ciebie przemawia.",
    ],
    startDate: "1 listopada", // TODO
    schedule: "wtorki, czwartki", // TODO
    location: contact.address, // TODO: adres realnej sali zajęć, jeśli inny niż siedziba
    duration: "listopad – kwiecień",
    lessons: 25,
    hoursTotal: 50,
    groupSize: "do 10 osób",
    price: { amount: 130, unit: "/ lekcje", note: "płatne z góry" }, // TODO
    forWhom: [
      "Wolisz uczyć się w realnym kontakcie, nie przez ekran",
      "Chcesz mieć pewność, że zdasz maturę podstawową",
      "Masz duże braki i nie wiesz, od czego zacząć",
      "Potrzebujesz kogoś, kto poukłada Ci naukę tydzień po tygodniu",
    ],
    includes: [
      "2 lekcje po 100 minut tygodniowo, stacjonarnie",
      "Kameralna grupa i bezpośredni kontakt z prowadzącym",
      "Skrypty i zestawy zadań od poziomu podstawowego",
      "Zadania domowe sprawdzane z komentarzem",
      "Arkusze maturalne z omówieniem krok po kroku",
      "5 matur próbnych na czas",
      "Czat grupowy z prowadzącymi między zajęciami",
    ],
    curriculum: curriculumPodstawowy,
  },
  // Kursy powtórkowe i wideo są na razie zdjęte z oferty. Pełne definicje tych
  // kursów (powtorka-rozszerzona, matematyka-rozszerzona-vod,
  // matematyka-podstawowa-vod) można odtworzyć z historii konwersacji,
  // gdy wrócą do oferty.
];

export const getCourse = (slug: string) => courses.find((c) => c.slug === slug);

export const liveCourses = courses.filter((c) => c.format === "Online na żywo");
export const stationaryCourses = courses.filter((c) => c.format === "Stacjonarnie");
export const vodCourses = courses.filter((c) => c.format === "Kurs wideo (VOD)");

export { curriculumPodstawowy, curriculumRozszerzony };
