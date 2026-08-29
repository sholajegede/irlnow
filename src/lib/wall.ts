import { getEvent, people, type CoverKey, type Person } from "./data";

export interface WallPhoto {
  id: string;
  cover: CoverKey;
  by: string;
  minsAgo: number;
  /** person ids visible in this shot */
  faces: string[];
  /** does the current user appear in it */
  youIn: boolean;
  likes: number;
}

const COVERS: CoverKey[] = [
  "supper",
  "games",
  "jazz",
  "rooftop",
  "streetfood",
  "gallery",
  "climb",
  "run",
];

function seedOf(s: string) {
  return s.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
}

/** Deterministic pseudo-random media set for an event's wall. */
export function wallPhotos(eventId: string, count = 24): WallPhoto[] {
  const seed = seedOf(eventId);
  const event = getEvent(eventId);
  const pool = (event?.going.length ? event.going : people.slice(0, 6).map((p) => p.id)).concat(
    people.slice(0, 8).map((p) => p.id),
  );
  const uniquePool = Array.from(new Set(pool));

  return Array.from({ length: count }, (_, i) => {
    const n = seed + i * 37;
    const faceCount = 1 + (n % 3);
    const faces = Array.from(
      new Set(Array.from({ length: faceCount }, (_, k) => uniquePool[(n + k * 5) % uniquePool.length]!)),
    );
    return {
      id: `${eventId}-p${i}`,
      cover: COVERS[(n + i) % COVERS.length]!,
      by: uniquePool[(n + 3) % uniquePool.length]!,
      minsAgo: 40 + ((n * 7) % 400),
      faces,
      youIn: n % 5 !== 0 && n % 3 !== 0 ? true : i % 7 === 0,
      likes: 1 + (n % 22),
    };
  });
}

export function photosWithYou(eventId: string): WallPhoto[] {
  return wallPhotos(eventId).filter((p) => p.youIn);
}

/** People who appear in the same photos as you — the "who was I with?" graph. */
export function peopleWithYou(eventId: string): { person: Person; shots: number }[] {
  const counts = new Map<string, number>();
  for (const photo of photosWithYou(eventId)) {
    for (const id of photo.faces) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([id, shots]) => ({ person: people.find((p) => p.id === id), shots }))
    .filter((r): r is { person: Person; shots: number } => Boolean(r.person))
    .sort((a, b) => b.shots - a.shots)
    .slice(0, 6);
}

export function wallStats(eventId: string) {
  const all = wallPhotos(eventId);
  const mine = all.filter((p) => p.youIn);
  const contributors = new Set(all.map((p) => p.by)).size;
  return {
    total: all.length,
    yours: mine.length,
    contributors,
    connections: peopleWithYou(eventId).length,
  };
}

export function relativeTime(minsAgo: number) {
  if (minsAgo < 60) return `${minsAgo}m ago`;
  const h = Math.round(minsAgo / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}
