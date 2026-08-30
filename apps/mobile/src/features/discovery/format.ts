import {
  distanceBetween,
  distanceLabel,
  priceLabel,
  whenLabel,
  type CoverKey,
} from "@irlnow/domain";
import type { FeedEvent } from "./types";

/* ------------------------------------------------------------------
   The feed's view model.

   Converts one Convex event into the object a feed row renders, using
   the shared formatters in @irlnow/domain. Done once per event on the
   way out of the query, because formatting inside a list row runs on
   every frame of a swipe.
------------------------------------------------------------------- */

/** Shape of `api.events.listUpcoming`, kept local so the UI owns its input. */
export interface PublicEventShape {
  id: string;
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
  const km = options.viewer ? distanceBetween(options.viewer, event.place) : null;

  return {
    // RankableEvent — stored truth, straight through to the ranking engine.
    id: event.id,
    interests: event.interests,
    goingCount: event.goingCount,
    startsAt: event.startsAt,
    distanceKm: km,
    priceMinor: event.priceMinor,
    spotsLeft: event.spotsLeft,
    trending: event.goingCount >= (options.trendingAt ?? Infinity),

    // Presentation — computed once, not per frame.
    slug: event.slug,
    title: event.title,
    description: event.description,
    category: event.category,
    coverKey: event.coverKey as CoverKey,
    areaLabel: km === null ? event.place.area : `${event.place.area} · ${distanceLabel(km)}`,
    whenLabel: whenLabel(event.startsAt, options.now),
    priceLabel: priceLabel(event.priceMinor, event.currency),
    organiserName: event.organiser.name,
    venueName: event.place.name,
  };
}

/** Where the feed centres when location is unavailable. */
export const DEFAULT_LOCATION: ViewerLocation = { lat: 51.5074, lng: -0.1278 };
