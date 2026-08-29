import type { CoverKey, RankableEvent } from "@irlnow/domain";

/**
 * An event as the feed needs it.
 *
 * Extends `RankableEvent` rather than paralleling it, so the same object goes
 * straight into the ranking engine with no adapter and no chance of the two
 * shapes drifting apart.
 *
 * The display strings are computed once, on the way out of Convex, because
 * formatting inside a list row runs on every frame of a swipe.
 */
export interface FeedEvent extends RankableEvent {
  /** Convex document id. What mutations are addressed to. */
  id: string;
  /** Stable, human-readable id used in routes and share links. */
  slug: string;
  title: string;
  description: string;
  category: string;
  coverKey: CoverKey;
  /** "Shoreditch · 1.2 km", or just the area when there is no location fix. */
  areaLabel: string;
  /** "Tonight · 7:30pm", "Sat · 7pm". */
  whenLabel: string;
  /** "Free", "£12". */
  priceLabel: string;
  organiserName: string;
  venueName: string;
}
