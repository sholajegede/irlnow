import type { CoverKey } from "@irlnow/domain";

/**
 * An event as the feed needs it.
 *
 * Derived from the Convex `PublicEvent` by `toFeedEvent`, with the display
 * strings the UI actually renders already computed — the backend stores
 * epoch millis and integer minor units, and formatting them once per event
 * beats doing it inside a list row on every frame.
 */
export interface FeedEvent {
  slug: string;
  title: string;
  description: string;
  category: string;
  interests: string[];
  coverKey: CoverKey;
  /** "Shoreditch · 1.2 km", or just the area when location is unavailable. */
  areaLabel: string;
  /** "Tonight · 7:30pm", "Sat · 7pm". */
  whenLabel: string;
  /** "Free", "£12". */
  priceLabel: string;
  startsAt: number;
  goingCount: number;
  spotsLeft: number | null;
  isTrending: boolean;
  organiserName: string;
  venueName: string;
  distanceKm: number | null;
}
