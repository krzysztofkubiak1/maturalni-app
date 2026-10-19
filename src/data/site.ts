/**
 * ============================================================
 *  DANE FIRMY / MARKI — WSZYSTKO DO PODMIANY W TYM PLIKU
 * ============================================================
 *  Wartości oznaczone jako TODO to placeholdery. Podmień je na
 *  prawdziwe dane przed publikacją strony.
 */

export const site = {
  name: "Maturalia",
  shortName: "Maturalia",
  // TODO: krótki opis (używany w SEO / Open Graph)
  tagline: "Kursy maturalne z matematyki — poziom podstawowy i rozszerzony",
  description:
    "Kursy maturalne z matematyki online. Poziom podstawowy i rozszerzony, zajęcia na żywo w małych grupach. Pełen program CKE, arkusze, zadania domowe ze sprawdzaniem.",
  // TODO: docelowy adres strony (bez ukośnika na końcu)
  url: "https://maturalia-kursy.pl",
  locale: "pl_PL",
} as const;

export const contact = {
  phone: "+48 532 702 555",
  phoneHref: "tel:+48532702555",
  email: "kontakt@maturalia-kursy.pl",
  emailHref: "mailto:kontakt@maturalia-kursy.pl",
  address: "ul. Mozarta 8 02-736 Warszawa",
  // TODO: linki do social mediów (pusty string = link się nie wyświetli)
  socials: {
    facebook: "",
    instagram: "",
    youtube: "",
    tiktok: "",
  },
  // Godziny pracy biura — pokazywane na stronie kontaktu
  officeHours: "pon.–pt. 10:00–21:00",
} as const;

/** Prowadzący — TODO: prawdziwe imiona, nazwiska, opisy i zdjęcia */
export type Teacher = {
  slug: string;
  name: string;
  title: string;
  bio: string;
  /** Inicjały wyświetlane w awatarze, dopóki nie ma zdjęcia */
  initials: string;
  highlights: string[];
};

export const teachers: Teacher[] = [
  {
    slug: "prowadzacy-1",
    name: "mgr inż. Magdalena Komuda-Kubiak",
    title: "Matematyka rozszerzona/podstawowa",
    bio: "Magister inżynier matematyki, ukończyła kierunek matematyka na wydziale Fizyki Technicznej i Matematyki Stosowanej Politechniki Warszawskiej (obecnie wydział Matematyki i Nauk Informacyjnych), od wielu lat przygotowuje uczniów indywidualnie do matury z matematyki.",
    initials: "MK",
    highlights: [
      "Magister inżynier matematyki",
      "Lata doświadczenia w przygotowywaniu uczniów do matury",
      "Średnia jej uczniów na rozszerzeniu: 80%",
    ],
  },
  {
    slug: "prowadzacy-2",
    name: "Wojciech Kubiak",
    title: "Matematyka rozszerzona/podstawowa",
    bio: "Student kierunku Matematyka i Analiza danych na Wydziale Matematyki i Nauk Informacyjnych Politechniki Warszawskiej, prowadzi indywidualne zajęcia z matematyki z wieloma uczniami.",
    initials: "WK",
    highlights: [
      "Specjalizacja: nauka od zera",
      "Osiągnał wynik 94% na maturze rozszerzonej z matematyki",
      "Współczene podejście do nauki i uczniów",
    ],
  },
];

/** Liczby na stronie głównej — TODO: podmień na prawdziwe */
export const stats = [
  { value: "7", label: "lat doświadczenia" },
  { value: "Setki", label: "przygotowanych maturzystów" },
  { value: "80%", label: "średni wynik z rozszerzenia (2025)" },
  { value: "100%", label: "zdawalność poziomu podstawowego" },
] as const;

/** Przewagi / USP — sekcja „Dlaczego my” */
export const features = [
  {
    icon: "Users",
    title: "Małe grupy, realny kontakt",
    text: "Możesz przerwać, dopytać i poprosić o powtórzenie — nikt Cię nie zbędzie.",
  },
  {
    icon: "Video",
    title: "Nagrania z każdej lekcji",
    text: "Zajęcia są nagrywane. Chorowałeś albo coś Ci umknęło? Wracasz do nagrania, kiedy chcesz.",
  },
  {
    icon: "FileCheck",
    title: "Zadania domowe ze sprawdzaniem",
    text: "Po każdej lekcji dostajesz zestaw zadań. Odsyłasz, my sprawdzamy i piszemy, co poprawić.",
  },
  {
    icon: "MessagesSquare",
    title: "Pytania między zajęciami",
    text: "Grupa na czacie działa non stop. Utknąłeś na zadaniu o 22:00? Wrzuć zdjęcie, dostaniesz podpowiedź.",
  },
  {
    icon: "ClipboardList",
    title: "Arkusze i matury próbne",
    text: "Regularnie piszemy pełne arkusze w warunkach egzaminacyjnych i omawiamy każdy błąd.",
  },
  {
    icon: "Target",
    title: "Program 1:1 z wymaganiami CKE",
    text: "Przerabiamy każdy dział z wymagań egzaminacyjnych — nic Cię na maturze nie zaskoczy.",
  },
] as const;

/** FAQ — sekcja na stronie głównej i podstrona /faq */
export const faq = [
  {
    q: "Czym kurs różni się od zwykłych korepetycji?",
    a: "Korepetycje zwykle łatają bieżące dziury — kurs prowadzi Cię przez cały materiał maturalny według zaplanowanego programu. Wiesz z góry, co przerobimy w każdym miesiącu, dostajesz materiały, zadania domowe ze sprawdzaniem i arkusze próbne. I kosztuje to mniej niż cotygodniowe korepetycje indywidualne.",
  },
  {
    q: "Od kiedy zaczynają się zajęcia?",
    a: "Kursy całoroczne startują na początku listopada, ale dołączyć można w dowolnym momencie — dostajesz wtedy nagrania wszystkich lekcji, które już się odbyły, żeby nadrobić materiał. Kursy powtórkowe ruszają w lutym i marcu.",
  },
  {
    q: "Jak wyglądają płatności?",
    a: "Płacisz miesięcznie lub za semestr (ze zniżką). Nie ma opłaty wpisowej, nie ma płatności za cały rok z góry.",
  },
  {
    q: "Jakimi metodami mogę zapłacić?",
    a: "Możesz zapłacić kartą (Visa, Mastercard), BLIK-iem, przelewem przez Przelewy24 albo jednym dotknięciem przez Apple Pay lub Google Pay, jeśli Twoja przeglądarka lub telefon to wspiera.",
  },
  {
    q: "Co, jeśli nie mogę być na zajęciach?",
    a: "Każda lekcja jest nagrywana i trafia na platformę zwykle tego samego dnia. Oglądasz nagranie, robisz zadanie domowe i wysyłasz do sprawdzenia — nic nie tracisz. Pytania możesz zadać na grupowym czacie.",
  },
  {
    q: "Jak duże są grupy?",
    a: "Maksymalnie 8 osób stacjonarnie. To na tyle mało, że każdy zdąży zadać pytanie i że widzimy, kto ma z czym problem.",
  },
  {
    q: "Zaczynam z bardzo niskiego poziomu. Czy to ma sens?",
    a: "Tak — i to jest najczęstsza sytuacja wśród naszych uczniów. Kurs podstawowy startuje od naprawdę podstawowych rzeczy: działań na ułamkach, potęg, przekształcania wzorów. Jeśli wybierasz rozszerzenie i masz braki, dostaniesz materiały wyrównawcze na start lub możesz zapisać się na indywidualne zajęcia wyrównawcze z prowadzącym w promocyjnej cenie.",
  },
  {
    q: "Czy dostanę materiały do nauki?",
    a: "Tak. Do każdej lekcji dostajesz zestaw zadań oraz zestaw zadań domowych z rozwiązaniami, a także dostęp do bazy arkuszy maturalnych.",
  },
  {
    q: "Jak długo mam dostęp do nagrań?",
    a: "Do końca sesji maturalnej w roku, w którym zdajesz. Jeśłi zgłosisz potrzebę również w trakcie wakacyjnej powtórki przed poprawką.",
  },
  {
    q: "Czy kurs wystarczy, czy muszę jeszcze chodzić na korepetycje?",
    a: "Dla zdecydowanej większości uczniów kurs w zupełności wystarcza — pod warunkiem, że robisz zadania domowe. To one robią różnicę. Jeśli mimo to coś nie wchodzi, oferujemy dodatkowe konsultacje indywidualne.",
  },
  {
    q: "Jak zapisać się na kurs?",
    a: "Wypełnij formularz na stronie albo zadzwoń. Oddzwaniamy zwykle tego samego dnia, dopytujemy o Twój poziom i cel, i proponujemy grupę z pasującym terminem.",
  },
  {
    q: "Czy prowadzicie zajęcia stacjonarnie?",
    a: "Kursy prowadzimy stacjonarnie, jak i online.", 
  },
] as const;

/** Nawigacja główna */
export const navLinks = [
  { href: "/kursy", label: "Kursy" },
  { href: "/program", label: "Program" },
  { href: "/o-nas", label: "O nas" },
  { href: "/faq", label: "FAQ" },
  { href: "/kontakt", label: "Kontakt" },
] as const;
