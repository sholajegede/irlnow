import { getEvent, getOrganiser, organisers, type Organiser } from "./data";

export interface EventRating {
  eventId: string;
  stars: number;
  tags: string[];
  wouldReturn: boolean;
  note?: string | undefined;
}

export const RATING_TAGS = [
  "Easy to talk to people",
  "Ran on time",
  "Great space",
  "Good value",
  "Felt safe",
  "Music was right",
  "Too crowded",
  "Slow at the door",
];

const NEGATIVE_TAGS = new Set(["Too crowded", "Slow at the door"]);

export function isPositiveTag(tag: string) {
  return !NEGATIVE_TAGS.has(tag);
}

export interface QualityScore {
  /** 0–100 composite used for ranking */
  score: number;
  stars: number;
  reviews: number;
  returnRate: number;
  band: "Exceptional" | "Strong" | "Solid" | "Mixed";
  highlights: string[];
}

function bandOf(score: number): QualityScore["band"] {
  if (score >= 92) return "Exceptional";
  if (score >= 82) return "Strong";
  if (score >= 70) return "Solid";
  return "Mixed";
}

function baseReviews(id: string) {
  const n = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return 24 + (n % 180);
}

/**
 * Blends the organiser's historical rating with ratings this user has left.
 * One fresh review moves the needle a little, not a lot — same as the real thing.
 */
export function organiserQuality(organiserId: string, myRatings: EventRating[]): QualityScore {
  const organiser: Organiser | undefined = getOrganiser(organiserId);
  const historical = organiser?.rating ?? 4.6;
  const reviews = baseReviews(organiserId);

  const mine = myRatings.filter((r) => {
    const event = getEvent(r.eventId);
    return event ? event.host.toLowerCase() === organiserId.toLowerCase() : false;
  });

  const totalReviews = reviews + mine.length;
  const stars =
    (historical * reviews + mine.reduce((a, r) => a + r.stars, 0)) / Math.max(1, totalReviews);

  const returnBase = 0.68 + (reviews % 20) / 100;
  const returnRate = mine.length
    ? (returnBase * reviews + mine.filter((r) => r.wouldReturn).length) / totalReviews
    : returnBase;

  const score = Math.round(
    Math.min(100, stars * 17 + returnRate * 15 + Math.min(8, totalReviews / 30)),
  );

  const tagCounts = new Map<string, number>();
  for (const r of mine)
    for (const t of r.tags.filter(isPositiveTag)) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  const seeded = organiser ? [organiser.blurb.split(".")[0]!] : [];
  const highlights = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([t]) => t)
    .slice(0, 3);

  return {
    score,
    stars: Math.round(stars * 10) / 10,
    reviews: totalReviews,
    returnRate: Math.round(returnRate * 100) / 100,
    band: bandOf(score),
    highlights: highlights.length ? highlights : seeded,
  };
}

/** Ranking boost applied to events in discovery — quality wins over recency. */
export function rankingBoost(organiserId: string, myRatings: EventRating[]): number {
  const q = organiserQuality(organiserId, myRatings);
  return Math.round((q.score - 70) / 3);
}

export function topRatedOrganisers(myRatings: EventRating[]) {
  return organisers
    .map((o) => ({ organiser: o, quality: organiserQuality(o.id, myRatings) }))
    .sort((a, b) => b.quality.score - a.quality.score)
    .slice(0, 5);
}
