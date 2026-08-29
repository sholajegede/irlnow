import {
  events,
  getEvent,
  getOrganiser,
  people,
  type CoverKey,
  type IrlEvent,
  type Person,
} from "./data";
import { peopleWithYou, wallPhotos, wallStats } from "./wall";

/* ---------------- Auto-generated recap ---------------- */

export interface RecapStat {
  value: string;
  label: string;
}

export interface Recap {
  eventId: string;
  title: string;
  host: string;
  location: string;
  dateLabel: string;
  /** big line printed across the card */
  headline: string;
  subline: string;
  covers: CoverKey[];
  heroCover: CoverKey;
  stats: RecapStat[];
  metPeople: { person: Person; shots: number }[];
  /** playful superlative, the bit people screenshot */
  badge: string;
  arrived: string;
  left: string;
  hours: number;
  photos: number;
  songs?: string;
}

const BADGES = [
  "Last one on the dancefloor",
  "Chief introducer",
  "Certified early arriver",
  "Most photographed",
  "The one who knew everybody",
  "Stayed for the encore",
  "Closed the place down",
];

const HEADLINES = [
  "You showed up.",
  "That actually happened.",
  "Worth leaving the house for.",
  "One for the archive.",
];

function seed(s: string) {
  return s.split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 11);
}

function clock(h: number, m: number) {
  const suffix = h >= 12 ? "pm" : "am";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, "0")}${suffix}`;
}

export function buildRecap(eventId: string): Recap | undefined {
  const event = getEvent(eventId);
  if (!event) return undefined;
  const n = seed(eventId);
  const stats = wallStats(eventId);
  const met = peopleWithYou(eventId);
  const photos = wallPhotos(eventId);
  const covers = Array.from(new Set(photos.filter((p) => p.youIn).map((p) => p.cover))).slice(0, 6);
  const startH = 18 + (n % 3);
  const hours = 3 + (n % 4);
  const endH = (startH + hours) % 24;

  return {
    eventId,
    title: event.title,
    host: event.host,
    location: event.location,
    dateLabel: event.dateLabel,
    headline: HEADLINES[n % HEADLINES.length]!,
    subline: `${event.location} · hosted by ${event.host}`,
    covers: covers.length ? covers : [event.cover],
    heroCover: event.cover,
    badge: BADGES[n % BADGES.length]!,
    arrived: clock(startH, (n % 6) * 10),
    left: clock(endH, ((n + 3) % 6) * 10),
    hours,
    photos: stats.yours,
    metPeople: met,
    stats: [
      { value: String(hours) + "h", label: "you were there" },
      { value: String(stats.yours), label: "photos of you" },
      { value: String(met.length), label: "people met" },
      { value: String(event.goingCount), label: "in the room" },
    ],
  };
}

/* ---------------- "You met N people" prompt ---------------- */

/** Requests made from a recap expire — meeting someone is a moment, not a backlog. */
export const MET_REQUEST_WINDOW_HOURS = 48;

export function hoursLeft(expiresAt: number, now = Date.now()): number {
  return Math.max(0, Math.ceil((expiresAt - now) / 3_600_000));
}

export function expiryLabel(expiresAt: number, now = Date.now()): string {
  const h = hoursLeft(expiresAt, now);
  if (h <= 0) return "Expired";
  if (h < 24) return `${h}h left`;
  return `${Math.ceil(h / 24)}d left`;
}

/* ---------------- Memory archive ---------------- */

export interface ArchiveEntry {
  event: IrlEvent;
  monthLabel: string;
  photos: number;
  met: number;
  cover: CoverKey;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** A deterministic month bucket per event so the timeline reads like a real year. */
function monthFor(eventId: string) {
  const n = seed(eventId);
  return MONTHS[n % 12]!;
}

export function memoryArchive(eventIds: string[]): ArchiveEntry[] {
  return eventIds
    .map((id) => getEvent(id))
    .filter((e): e is IrlEvent => Boolean(e))
    .map((event) => {
      const s = wallStats(event.id);
      return {
        event,
        monthLabel: monthFor(event.id),
        photos: s.yours,
        met: peopleWithYou(event.id).length,
        cover: event.cover,
      };
    })
    .sort((a, b) => MONTHS.indexOf(b.monthLabel) - MONTHS.indexOf(a.monthLabel));
}

export interface YearInReview {
  nightsOut: number;
  photos: number;
  peopleMet: number;
  hours: number;
  topCategory: string;
  topArea: string;
  topOrganiser: string;
  firstEvent?: IrlEvent | undefined;
}

export function yearInReview(eventIds: string[]): YearInReview {
  const list = eventIds.map((id) => getEvent(id)).filter((e): e is IrlEvent => Boolean(e));
  const pool = list.length ? list : events.slice(0, 3);
  const count = (arr: string[]) => {
    const m = new Map<string, number>();
    for (const v of arr) m.set(v, (m.get(v) ?? 0) + 1);
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  };
  let photos = 0;
  let peopleMet = 0;
  let hours = 0;
  for (const e of pool) {
    photos += wallStats(e.id).yours;
    peopleMet += peopleWithYou(e.id).length;
    hours += buildRecap(e.id)?.hours ?? 3;
  }
  return {
    nightsOut: pool.length,
    photos,
    peopleMet,
    hours,
    topCategory: count(pool.map((e) => e.category)),
    topArea: count(pool.map((e) => e.area)),
    topOrganiser: getOrganiser(count(pool.map((e) => e.host.toLowerCase())))?.name ?? pool[0]!.host,
    firstEvent: pool[pool.length - 1],
  };
}

/* ---------------- Face tagging suggestions ---------------- */

export interface TagSuggestion {
  photoId: string;
  cover: CoverKey;
  person: Person;
  confidence: number;
}

/** Suggests "is this X?" for unconfirmed faces in photos you're in. */
export function tagSuggestions(
  eventId: string,
  confirmed: string[],
  skipped: string[],
): TagSuggestion[] {
  const out: TagSuggestion[] = [];
  for (const photo of wallPhotos(eventId)) {
    if (!photo.youIn) continue;
    for (const faceId of photo.faces) {
      const key = `${photo.id}:${faceId}`;
      if (confirmed.includes(key) || skipped.includes(key)) continue;
      const person = people.find((p) => p.id === faceId);
      if (!person) continue;
      out.push({
        photoId: photo.id,
        cover: photo.cover,
        person,
        confidence: 72 + (seed(key) % 27),
      });
      break;
    }
    if (out.length >= 6) break;
  }
  return out;
}

/* ---------------- Download packs ---------------- */

export interface DownloadPack {
  id: string;
  label: string;
  description: string;
  count: number;
  sizeMb: number;
}

export function downloadPacks(eventId: string): DownloadPack[] {
  const photos = wallPhotos(eventId);
  const yours = photos.filter((p) => p.youIn);
  const groups = photos.filter((p) => p.faces.length > 2);
  return [
    {
      id: "you",
      label: "Just you",
      description: "Every shot you appear in, full resolution.",
      count: yours.length,
      sizeMb: Math.round(yours.length * 3.4),
    },
    {
      id: "group",
      label: "Group shots",
      description: "Three or more people — the ones worth printing.",
      count: groups.length,
      sizeMb: Math.round(groups.length * 3.9),
    },
    {
      id: "all",
      label: "The whole night",
      description: "Everything everyone posted to the wall.",
      count: photos.length,
      sizeMb: Math.round(photos.length * 3.1),
    },
  ];
}
