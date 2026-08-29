import type { EventAccess } from "@/lib/events/access";
import rooftop from "@/assets/event-rooftop.jpg";
import jazz from "@/assets/event-jazz.jpg";
import supper from "@/assets/event-supper.jpg";
import run from "@/assets/event-run.jpg";
import gallery from "@/assets/event-gallery.jpg";
import streetfood from "@/assets/event-streetfood.jpg";
import climb from "@/assets/event-climb.jpg";
import games from "@/assets/event-games.jpg";
import market from "@/assets/event-market.jpg";

export const eventCovers = {
  rooftop,
  jazz,
  supper,
  run,
  gallery,
  streetfood,
  climb,
  games,
  market,
};
export type CoverKey = keyof typeof eventCovers;

export interface Interest {
  id: string;
  label: string;
  emoji: string;
}

export const interests: Interest[] = [
  { id: "music", label: "Live music", emoji: "🎷" },
  { id: "food", label: "Food & drink", emoji: "🍜" },
  { id: "running", label: "Running", emoji: "🏃" },
  { id: "art", label: "Art & galleries", emoji: "🎨" },
  { id: "nightlife", label: "Nightlife", emoji: "🪩" },
  { id: "games", label: "Board games", emoji: "🎲" },
  { id: "climbing", label: "Climbing", emoji: "🧗" },
  { id: "film", label: "Film", emoji: "🎬" },
  { id: "tech", label: "Tech & startups", emoji: "💡" },
  { id: "wellness", label: "Wellness", emoji: "🧘" },
  { id: "comedy", label: "Comedy", emoji: "😂" },
  { id: "photo", label: "Photography", emoji: "📸" },
];

export interface Person {
  id: string;
  name: string;
  avatar: number; // avatar-N gradient
  interests: string[];
  bio: string;
  reason: string;
  mutuals: number;
  goingSolo?: boolean;
}

export const people: Person[] = [
  {
    id: "maya",
    name: "Maya",
    avatar: 0,
    interests: ["music", "food", "photo"],
    bio: "Jazz bars, natural wine and my film camera.",
    reason: "3 shared interests · going to the same event",
    mutuals: 4,
  },
  {
    id: "josh",
    name: "Josh",
    avatar: 1,
    interests: ["running", "wellness", "tech"],
    bio: "Sunrise runs and strong coffee.",
    reason: "You both like Running · 2 mutual connections",
    mutuals: 2,
    goingSolo: true,
  },
  {
    id: "priya",
    name: "Priya",
    avatar: 2,
    interests: ["art", "film", "food"],
    bio: "Gallery lates > everything.",
    reason: "Going to the same event · you both like Art",
    mutuals: 1,
  },
  {
    id: "tomas",
    name: "Tomás",
    avatar: 3,
    interests: ["food", "comedy", "games"],
    bio: "Will travel for dumplings.",
    reason: "3 shared interests",
    mutuals: 3,
  },
  {
    id: "amara",
    name: "Amara",
    avatar: 4,
    interests: ["nightlife", "music", "art"],
    bio: "A&R by day, dancefloor by night.",
    reason: "Going to the same event",
    mutuals: 5,
    goingSolo: true,
  },
  {
    id: "leo",
    name: "Leo",
    avatar: 5,
    interests: ["climbing", "running", "wellness"],
    bio: "Slab enthusiast. Terrible at resting.",
    reason: "You both like Climbing",
    mutuals: 0,
  },
  {
    id: "freya",
    name: "Freya",
    avatar: 6,
    interests: ["games", "film", "comedy"],
    bio: "Undefeated at Catan (ask anyone).",
    reason: "2 shared interests · 1 mutual connection",
    mutuals: 1,
  },
  {
    id: "dev",
    name: "Dev",
    avatar: 7,
    interests: ["tech", "food", "running"],
    bio: "Building things, eating things.",
    reason: "You both like Tech & startups",
    mutuals: 2,
  },
  {
    id: "nina",
    name: "Nina",
    avatar: 1,
    interests: ["photo", "art", "wellness"],
    bio: "Chasing golden hour.",
    reason: "2 shared interests",
    mutuals: 0,
  },
  {
    id: "marcus",
    name: "Marcus",
    avatar: 2,
    interests: ["music", "nightlife", "comedy"],
    bio: "Here for the encore.",
    reason: "Going to the same event",
    mutuals: 6,
  },
];

export interface IrlEvent {
  id: string;
  title: string;
  category: string;
  cover: CoverKey;
  host: string;
  dateLabel: string;
  when: "tonight" | "weekend";
  location: string;
  area: string;
  distance: string;
  price: string;
  going: string[]; // person ids shown
  goingCount: number;
  interests: string[];
  description: string;
  vibes: string[];
  trending?: boolean;
  spotsLeft?: number; // 0 = sold out
  capacity?: number;
  seriesId?: string;
  /** Access details, only ever as declared by the host. Absent = not answered. */
  access?: EventAccess;
}

export const events: IrlEvent[] = [
  {
    id: "rooftop-golden-hour",
    title: "Golden Hour Rooftop Social",
    category: "Nightlife",
    cover: "rooftop",
    host: "Amara",
    dateLabel: "Tonight · 7:30pm",
    when: "tonight",
    location: "The Parallax, Shoreditch",
    area: "Shoreditch",
    distance: "1.2 km",
    price: "£12",
    going: ["maya", "marcus", "nina"],
    goingCount: 84,
    interests: ["nightlife", "music", "photo"],
    description:
      "Sunset DJ set, skyline views and a crowd that's actually up for talking. First drink included before 8pm.",
    vibes: ["Sunset", "DJ set", "Open air"],
    trending: true,
    spotsLeft: 11,
    capacity: 100,
  },
  {
    id: "jazz-late",
    title: "Velvet Room Jazz Late",
    category: "Live music",
    cover: "jazz",
    host: "Marcus",
    dateLabel: "Tonight · 9pm",
    when: "tonight",
    location: "The Velvet Room, Soho",
    area: "Soho",
    distance: "2.4 km",
    price: "£8",
    going: ["maya", "priya", "amara"],
    goingCount: 46,
    interests: ["music", "food"],
    description:
      "A candlelit basement quartet, two sets, no phones during the second. The best-kept secret in Soho.",
    vibes: ["Candlelit", "Quartet", "Late"],
    trending: true,
  },
  {
    id: "supper-club",
    title: "Long Table Supper Club",
    category: "Food & drink",
    cover: "supper",
    host: "Tomás",
    dateLabel: "Sat · 7pm",
    when: "weekend",
    location: "Studio Kitchen, Hackney",
    area: "Hackney",
    distance: "3.8 km",
    price: "£35",
    going: ["tomas", "dev", "freya"],
    goingCount: 18,
    interests: ["food"],
    description:
      "One long table, five sharing courses, twenty strangers who won't be strangers by dessert. BYOB welcome.",
    vibes: ["Sharing plates", "One table", "BYOB"],
    spotsLeft: 0,
    capacity: 20,
    seriesId: "long-table",
  },
  {
    id: "sunrise-run",
    title: "Bridge at Dawn Run Club",
    category: "Running",
    cover: "run",
    host: "Josh",
    dateLabel: "Sun · 6:45am",
    when: "weekend",
    location: "Tower Bridge (south side)",
    area: "London Bridge",
    distance: "2.9 km",
    price: "Free",
    going: ["josh", "leo", "dev"],
    goingCount: 57,
    interests: ["running", "wellness"],
    description:
      "5k or 10k, all paces, coffee and pastries after. Beat the city waking up — it's worth the alarm.",
    vibes: ["All paces", "Coffee after", "5k / 10k"],
    seriesId: "dawn-run",
  },
  {
    id: "gallery-late",
    title: "After Dark Gallery Opening",
    category: "Art",
    cover: "gallery",
    host: "Priya",
    dateLabel: "Fri · 8pm",
    when: "weekend",
    location: "Unit 9 Gallery, Peckham",
    area: "Peckham",
    distance: "5.1 km",
    price: "Free",
    going: ["priya", "nina", "maya"],
    goingCount: 63,
    interests: ["art", "photo"],
    description:
      "New show from three emerging painters, wine in hand, artist Q&A at 9. Warehouse space, big colour.",
    vibes: ["Opening night", "Artist Q&A", "Wine"],
    trending: true,
    seriesId: "after-dark",
  },
  {
    id: "street-food-crawl",
    title: "Neon Market Food Crawl",
    category: "Food & drink",
    cover: "streetfood",
    host: "Tomás",
    dateLabel: "Tonight · 6:30pm",
    when: "tonight",
    location: "Arcade Lane, Soho",
    area: "Soho",
    distance: "2.2 km",
    price: "Pay as you eat",
    going: ["tomas", "marcus", "freya"],
    goingCount: 39,
    interests: ["food", "comedy"],
    description:
      "Six stalls, one mission: find the best dish on the lane. Group vote at the end, loser buys churros.",
    vibes: ["Crawl", "Group vote", "Street food"],
  },
  {
    id: "boulder-social",
    title: "Boulder & Banter Night",
    category: "Climbing",
    cover: "climb",
    host: "Leo",
    dateLabel: "Thu · 7pm",
    when: "weekend",
    location: "Substation, Brixton",
    area: "Brixton",
    distance: "4.6 km",
    price: "£14",
    going: ["leo", "josh", "amara"],
    goingCount: 28,
    interests: ["climbing", "wellness"],
    description:
      "Beginner-friendly social session. Comp shoe hire included, plus pizza downstairs after. No grades chat.",
    vibes: ["Beginner friendly", "Pizza after", "Social"],
  },
  {
    id: "board-game-night",
    title: "Board Game Café Takeover",
    category: "Games",
    cover: "games",
    host: "Freya",
    dateLabel: "Wed · 6:30pm",
    when: "weekend",
    location: "Dice & Beans, Camden",
    area: "Camden",
    distance: "3.3 km",
    price: "£5",
    going: ["freya", "tomas", "priya"],
    goingCount: 22,
    interests: ["games", "comedy"],
    description:
      "Whole back room reserved. Party games first, strategy table for the brave. Hot chocolate on tap.",
    vibes: ["Party games", "Strategy table", "Cozy"],
  },
  {
    id: "market-morning",
    title: "Broadway Market Morning Loop",
    category: "Food & drink",
    cover: "market",
    host: "Nina",
    dateLabel: "Sat · 10am",
    when: "weekend",
    location: "Broadway Market, Hackney",
    area: "Hackney",
    distance: "4.1 km",
    price: "Free",
    going: ["nina", "freya", "maya"],
    goingCount: 34,
    interests: ["food", "photo"],
    description:
      "Coffee first, then a slow loop of the stalls — produce, pastries, flowers. We split up and regroup to compare finds.",
    vibes: ["Daytime", "Coffee first", "Slow loop"],
  },
  {
    id: "pottery-sunday",
    title: "Sunday Clay & Coffee",
    category: "Art",
    cover: "gallery",
    host: "Priya",
    dateLabel: "Sun · 11am",
    when: "weekend",
    location: "Turning Earth, Hoxton",
    area: "Shoreditch",
    distance: "3.8 km",
    price: "£22",
    going: ["priya", "amara", "leo"],
    goingCount: 18,
    interests: ["art", "wellness"],
    description:
      "Two hours on the wheel, no experience needed. Aprons provided, coffee on the house, your wonky first bowl shipped to you after firing.",
    vibes: ["Beginner friendly", "Daytime", "Take your bowl home"],
  },
];

/* ---------- Event series ---------- */

export interface SeriesEdition {
  id: string;
  label: string;
  eventId?: string; // live event in the feed
  status: "upcoming" | "past";
  goingCount: number;
}

export interface EventSeries {
  id: string;
  name: string;
  host: string;
  cadence: string;
  cover: CoverKey;
  blurb: string;
  followers: number;
  editions: SeriesEdition[];
}

export const eventSeries: EventSeries[] = [
  {
    id: "long-table",
    name: "Long Table Supper Club",
    host: "Tomás",
    cadence: "Monthly · Saturdays",
    cover: "supper",
    blurb: "One long table, five courses, twenty strangers. Running for 14 months and counting.",
    followers: 412,
    editions: [
      {
        id: "lt-15",
        label: "Vol. 15 · Sat 7pm",
        eventId: "supper-club",
        status: "upcoming",
        goingCount: 20,
      },
      { id: "lt-16", label: "Vol. 16 · Sat 27 Sep", status: "upcoming", goingCount: 9 },
      { id: "lt-14", label: "Vol. 14 · Aug", status: "past", goingCount: 20 },
      { id: "lt-13", label: "Vol. 13 · Jul", status: "past", goingCount: 18 },
    ],
  },
  {
    id: "dawn-run",
    name: "Bridge at Dawn Run Club",
    host: "Josh",
    cadence: "Every Sunday · 6:45am",
    cover: "run",
    blurb: "All paces, all weather, coffee after. The friendliest alarm clock in London.",
    followers: 689,
    editions: [
      {
        id: "dr-88",
        label: "Run #88 · Sun 6:45am",
        eventId: "sunrise-run",
        status: "upcoming",
        goingCount: 57,
      },
      { id: "dr-89", label: "Run #89 · Sun 6 Sep", status: "upcoming", goingCount: 31 },
      { id: "dr-87", label: "Run #87 · last Sun", status: "past", goingCount: 63 },
    ],
  },
  {
    id: "after-dark",
    name: "After Dark Gallery Lates",
    host: "Priya",
    cadence: "Monthly · Fridays",
    cover: "gallery",
    blurb: "Emerging artists, warehouse spaces, wine in hand. Peckham's best night out.",
    followers: 234,
    editions: [
      {
        id: "ad-6",
        label: "No. 6 · Fri 8pm",
        eventId: "gallery-late",
        status: "upcoming",
        goingCount: 63,
      },
      { id: "ad-5", label: "No. 5 · Jul", status: "past", goingCount: 71 },
    ],
  },
];

export function getSeries(id: string): EventSeries | undefined {
  return eventSeries.find((s) => s.id === id);
}

export function seriesForEvent(eventId: string): EventSeries | undefined {
  const ev = getEvent(eventId);
  return ev?.seriesId ? getSeries(ev.seriesId) : undefined;
}

export const pastEvent: IrlEvent = events[2]!; // supper club — "last Saturday"

export function peopleByIds(ids: string[]): Person[] {
  return ids.map((id) => people.find((p) => p.id === id)!).filter(Boolean);
}

export function getEvent(id: string): IrlEvent | undefined {
  return events.find((e) => e.id === id);
}

export function getPerson(id: string): Person | undefined {
  return people.find((p) => p.id === id);
}

export const memoryMedia: CoverKey[] = [
  "supper",
  "games",
  "jazz",
  "rooftop",
  "streetfood",
  "gallery",
  "supper",
  "climb",
  "supper",
];

/* ---------- Organiser workspace ---------- */

export const hostedEventIds = ["rooftop-golden-hour", "supper-club"];

export type GuestStatus = "checked-in" | "going" | "waitlist" | "declined";

export interface Guest {
  id: string;
  name: string;
  avatar: number;
  status: GuestStatus;
  source: "Discover" | "Shared link" | "Invited" | "QR at door";
  plusOnes: number;
  note?: string;
}

const firstNames = [
  "Maya",
  "Marcus",
  "Nina",
  "Josh",
  "Priya",
  "Tomás",
  "Amara",
  "Leo",
  "Freya",
  "Dev",
  "Ola",
  "Sasha",
  "Bea",
  "Kofi",
  "Ines",
  "Rory",
  "Tara",
  "Zayn",
  "Ellie",
  "Noor",
  "Hugo",
  "Mimi",
  "Kai",
  "Ada",
];
const sources: Guest["source"][] = ["Discover", "Shared link", "Invited", "QR at door"];

export function guestList(eventId: string, count: number): Guest[] {
  const seed = eventId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return Array.from({ length: count }).map((_, i) => {
    const n = seed + i * 17;
    const statusRoll = n % 10;
    const status: GuestStatus =
      statusRoll < 5
        ? "checked-in"
        : statusRoll < 8
          ? "going"
          : statusRoll === 8
            ? "waitlist"
            : "declined";
    return {
      id: `${eventId}-g${i}`,
      name: `${firstNames[n % firstNames.length]} ${String.fromCharCode(65 + (n % 26))}.`,
      avatar: n % 8,
      status,
      source: sources[n % sources.length]!,
      plusOnes: n % 7 === 0 ? 1 : 0,
    };
  });
}

export interface HostNote {
  id: string;
  from: string;
  avatar: number;
  text: string;
  time: string;
}

export const hostNotes: HostNote[] = [
  {
    id: "n1",
    from: "Maya",
    avatar: 0,
    text: "Best rooftop I've been to this year. The sunset set was unreal.",
    time: "22:14",
  },
  {
    id: "n2",
    from: "Dev",
    avatar: 7,
    text: "Came alone, left with four new numbers. Thank you for this.",
    time: "21:48",
  },
  {
    id: "n3",
    from: "Nina",
    avatar: 1,
    text: "Lighting was perfect for photos — I'll send you the good ones.",
    time: "20:31",
  },
];

export interface TrafficRow {
  label: string;
  views: number;
  going: number;
}

export function trafficFor(eventId: string): TrafficRow[] {
  const s = eventId.length;
  return [
    { label: "Discover feed", views: 1840 + s * 31, going: 52 },
    { label: "Shared link", views: 610 + s * 12, going: 21 },
    { label: "Interest match", views: 430 + s * 9, going: 14 },
    { label: "QR at the door", views: 96 + s, going: 9 },
  ];
}

/* ---------- Geography (stylised map positions, % of viewport) ---------- */

export const areaCoords: Record<string, { x: number; y: number }> = {
  Shoreditch: { x: 62, y: 34 },
  Soho: { x: 42, y: 44 },
  Hackney: { x: 72, y: 22 },
  "London Bridge": { x: 58, y: 56 },
  Peckham: { x: 64, y: 78 },
  Brixton: { x: 44, y: 80 },
  Camden: { x: 36, y: 22 },
};

export function eventCoords(e: IrlEvent) {
  return areaCoords[e.area] ?? { x: 50, y: 50 };
}

export const areas = Object.keys(areaCoords);

/* ---------- Organisers (public profiles behind events & series) ---------- */

export interface Organiser {
  id: string;
  name: string;
  avatar: number;
  blurb: string;
  eventsHosted: number;
  rating: number;
  verified: boolean;
  seriesId?: string;
}

export const organisers: Organiser[] = [
  {
    id: "amara",
    name: "Amara",
    avatar: 4,
    blurb: "Rooftop socials & sunset sets across east London.",
    eventsHosted: 24,
    rating: 4.9,
    verified: true,
  },
  {
    id: "tomas",
    name: "Tomás",
    avatar: 3,
    blurb: "Long Table Supper Club — five courses, twenty strangers.",
    eventsHosted: 15,
    rating: 4.9,
    verified: true,
    seriesId: "long-table",
  },
  {
    id: "josh",
    name: "Josh",
    avatar: 1,
    blurb: "Bridge at Dawn Run Club. All paces, coffee after.",
    eventsHosted: 88,
    rating: 4.8,
    verified: true,
    seriesId: "dawn-run",
  },
  {
    id: "priya",
    name: "Priya",
    avatar: 2,
    blurb: "After Dark Gallery Lates in Peckham warehouses.",
    eventsHosted: 6,
    rating: 4.7,
    verified: false,
    seriesId: "after-dark",
  },
  {
    id: "marcus",
    name: "Marcus",
    avatar: 2,
    blurb: "Velvet Room jazz nights, Soho basements only.",
    eventsHosted: 31,
    rating: 4.8,
    verified: true,
  },
  {
    id: "leo",
    name: "Leo",
    avatar: 5,
    blurb: "Beginner-friendly bouldering socials.",
    eventsHosted: 9,
    rating: 4.6,
    verified: false,
  },
  {
    id: "freya",
    name: "Freya",
    avatar: 6,
    blurb: "Board game takeovers in Camden.",
    eventsHosted: 12,
    rating: 4.7,
    verified: false,
  },
];

export function getOrganiser(id: string) {
  return organisers.find((o) => o.id === id);
}

/* ---------- Search & filters ---------- */

export interface FeedFilters {
  when?: "any" | "tonight" | "weekend";
  categories?: string[];
  maxDistanceKm?: number | undefined;
  freeOnly?: boolean;
  hasSpots?: boolean;
}

export const categories = Array.from(new Set(events.map((e) => e.category))).sort();

export function distanceKm(e: IrlEvent) {
  return parseFloat(e.distance) || 0;
}

export function isFree(e: IrlEvent) {
  return /free|pay as you eat/i.test(e.price);
}

export function filterEvents(list: IrlEvent[], f: FeedFilters): IrlEvent[] {
  return list.filter((e) => {
    if (f.when && f.when !== "any" && e.when !== f.when) return false;
    if (f.categories?.length && !f.categories.includes(e.category)) return false;
    if (f.maxDistanceKm != null && distanceKm(e) > f.maxDistanceKm) return false;
    if (f.freeOnly && !isFree(e)) return false;
    if (f.hasSpots && e.spotsLeft === 0) return false;
    return true;
  });
}

export function searchEvents(q: string): IrlEvent[] {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  return events.filter((e) =>
    [e.title, e.category, e.area, e.location, e.host, e.description, ...e.vibes]
      .join(" ")
      .toLowerCase()
      .includes(s),
  );
}

export function searchPeople(q: string): Person[] {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  return people.filter((p) => [p.name, p.bio, ...p.interests].join(" ").toLowerCase().includes(s));
}

export function searchOrganisers(q: string): Organiser[] {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  return organisers.filter((o) => [o.name, o.blurb].join(" ").toLowerCase().includes(s));
}

export function searchPlaces(q: string): { area: string; count: number }[] {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  return areas
    .filter((a) => a.toLowerCase().includes(s))
    .map((a) => ({ area: a, count: events.filter((e) => e.area === a).length }));
}

export const trendingEvents = events.filter((e) => e.trending);

/** The feed is deliberately finite — see "That's tonight. Go outside." */
export const FEED_CAP = 10;
