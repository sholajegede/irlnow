import { DEFAULT_CITY } from "@/config/env";
import type { CoverKey } from "@irlnow/domain";
import type { FeedEvent } from "./types";

/* ------------------------------------------------------------------
   Backend truth -> what a person reads.

   The backend stores epoch millis and integer minor units, deliberately:
   a timestamp is correct for every viewer, a string like
   "Tonight · 7:30pm" is correct for exactly one. This is where truth
   becomes copy, at the edge, once per event.
------------------------------------------------------------------- */

/** Shape of `api.events.listUpcoming`, kept local so the UI owns its input. */
export interface PublicEventShape {
  slug: string;
  title: string;
  description: string;
  startsAt: number;
  place: { name: string; area: string; lat: number; lng: number };
  priceMinor: number;
  currency: string;
  capacity?: number;
  category: string;
  interests: string[];
  coverKey: string;
  goingCount: number;
  spotsLeft: number | null;
  organiser: { name: string };
}

const DAY_MS = 86_400_000;

function timeLabel(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const suffix = hours >= 12 ? "pm" : "am";
  const hour12 = ((hours + 11) % 12) + 1;
  return minutes === 0
    ? `${hour12}${suffix}`
    : `${hour12}:${String(minutes).padStart(2, "0")}${suffix}`;
}

/**
 * "Tonight · 7:30pm", "Tomorrow · 9am", "Sat · 7pm", "12 Sep · 8pm".
 *
 * Relative for the next week because that is the window a person is actually
 * deciding within; absolute after that, where a weekday name stops helping.
 */
export function whenLabel(startsAt: number, now = Date.now()): string {
  const start = new Date(startsAt);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const startOfDay = new Date(startsAt);
  startOfDay.setHours(0, 0, 0, 0);

  const days = Math.round((startOfDay.getTime() - today.getTime()) / DAY_MS);
  const time = timeLabel(start);

  if (days <= 0) return `Tonight · ${time}`;
  if (days === 1) return `Tomorrow · ${time}`;
  if (days < 7) {
    return `${start.toLocaleDateString("en-GB", { weekday: "short" })} · ${time}`;
  }
  return `${start.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · ${time}`;
}

/** "Free" or "£12" — trailing ".00" dropped, because nobody writes it. */
export function priceLabel(priceMinor: number, currency: string): string {
  if (priceMinor === 0) return "Free";
  const symbol =
    currency === "GBP" ? "£" : currency === "USD" ? "$" : currency === "EUR" ? "€" : "";
  const amount = (priceMinor / 100).toFixed(2).replace(/\.00$/, "");
  return `${symbol}${amount}`;
}

/**
 * Great-circle distance in kilometres.
 *
 * Computed against the viewer rather than stored on the event: a distance
 * baked into a record is right for one person and wrong for everyone else.
 */
export function distanceKm(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function distanceLabel(km: number): string {
  if (km < 1) return `${Math.round(km * 10) * 100} m`;
  return `${km.toFixed(1)} km`;
}

export interface ViewerLocation {
  lat: number;
  lng: number;
}

/**
 * Trending: busy relative to the rest of what's on.
 *
 * Derived from the catalogue rather than stored, so a quiet week doesn't
 * label everything trending and a busy one doesn't label nothing.
 */
export function trendingThreshold(events: { goingCount: number }[]): number {
  if (events.length === 0) return Infinity;
  const counts = events.map((e) => e.goingCount).sort((a, b) => b - a);
  const topQuartile = counts[Math.floor(counts.length / 4)] ?? counts[0]!;
  return Math.max(40, topQuartile);
}

export function toFeedEvent(
  event: PublicEventShape,
  options: { viewer?: ViewerLocation | null; trendingAt?: number; now?: number } = {},
): FeedEvent {
  const km = options.viewer ? distanceKm(options.viewer, event.place) : null;

  return {
    slug: event.slug,
    title: event.title,
    description: event.description,
    category: event.category,
    interests: event.interests,
    coverKey: event.coverKey as CoverKey,
    areaLabel: km === null ? event.place.area : `${event.place.area} · ${distanceLabel(km)}`,
    whenLabel: whenLabel(event.startsAt, options.now),
    priceLabel: priceLabel(event.priceMinor, event.currency),
    startsAt: event.startsAt,
    goingCount: event.goingCount,
    spotsLeft: event.spotsLeft,
    isTrending: event.goingCount >= (options.trendingAt ?? Infinity),
    organiserName: event.organiser.name,
    venueName: event.place.name,
    distanceKm: km,
  };
}

/** Where the feed centres when location is unavailable. */
export const DEFAULT_LOCATION: ViewerLocation = { lat: 51.5074, lng: -0.1278 };
export const DEFAULT_LOCATION_LABEL = DEFAULT_CITY;
