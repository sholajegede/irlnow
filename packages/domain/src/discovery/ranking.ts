import { FEED_CAP, distanceKm, isFree, type IrlEvent } from "../data";

/* ------------------------------------------------------------------
   What ranking needs from an event.

   Deliberately narrower than a full event, and expressed in stored
   truth rather than display strings: epoch millis, integer minor units,
   and a distance computed against the viewer. The web app's fixtures
   and the Convex catalogue both adapt into this shape, so there is one
   ranking implementation rather than one per data source.
------------------------------------------------------------------- */

/* ------------------------------------------------------------------
   Discovery ranking.

   Deliberately deterministic and explainable: every score decomposes
   into named reasons, so the feed can be reasoned about, tested, and
   explained to a user without a model in the loop. Signals and weights
   live here and nowhere else — ranking must never drift back into a
   component.
------------------------------------------------------------------- */

/** What the feed knows about the person looking at it. */
export interface ViewerSignals {
  /**
   * Whether the viewer has told us who they are.
   *
   * This gates personalisation entirely. An anonymous visitor must never be
   * shown a claim that implies we know them — see `PERSONALISABLE_REASONS`.
   */
  identified: boolean;
  /** Interest ids the viewer selected during onboarding. */
  interests: readonly string[];
  /** People the viewer is connected to. */
  connectionIds: readonly string[];
  /** Events the viewer already said they're going to. */
  goingIds: readonly string[];
  /** Events the viewer saved for later. */
  savedIds: readonly string[];
}

export const ANONYMOUS_VIEWER: ViewerSignals = {
  identified: false,
  interests: [],
  connectionIds: [],
  goingIds: [],
  savedIds: [],
};

export interface RankableEvent {
  /** Stable identity, used for tie-breaking and viewer state lookups. */
  id: string;
  /** Interest ids this event matches on. */
  interests: readonly string[];
  /** Confirmed attendees. */
  goingCount: number;
  /** Epoch millis. "Tonight" is derived from this, never stored. */
  startsAt: number;
  /** Kilometres from the viewer, or null when location is unknown. */
  distanceKm: number | null;
  /** Integer minor units. Zero is free. */
  priceMinor: number;
  /** Remaining capacity, or null when uncapped. */
  spotsLeft: number | null;
  /** Ids of people going, for the connections signal. */
  attendeeIds?: readonly string[];
  /** Set when the caller has its own notion of trending. */
  trending?: boolean;
}

export type ReasonKind =
  | "shared-interests"
  | "connections-going"
  | "saved"
  | "already-going"
  | "happening-tonight"
  | "nearby"
  | "popular"
  | "trending"
  | "nearly-full"
  | "free";

/** A single contribution to an event's score, and the evidence behind it. */
export interface RankingReason {
  kind: ReasonKind;
  /** Points this reason contributed. Negative values demote. */
  points: number;
  /** The count the reason is based on, where one applies. */
  count?: number;
}

export interface ScoredEvent<T extends RankableEvent = RankableEvent> {
  event: T;
  score: number;
  /** Ordered by contribution, strongest first. */
  reasons: RankingReason[];
}

/**
 * Scoring weights.
 *
 * Ordered by product intent: who is going outweighs what it is, which
 * outweighs how popular it is. Popularity is capped so a big event cannot
 * bury a well-matched small one — that is what makes the feed feel personal
 * rather than like a chart.
 */
export const WEIGHTS = {
  /** Per interest the viewer shares with the event. */
  sharedInterest: 12,
  /** Per connection of the viewer already going. */
  connectionGoing: 15,
  /** The viewer saved it — clear intent, but they have seen it already. */
  saved: 8,
  /** Already going. Kept in the feed, but it is no longer a discovery. */
  alreadyGoing: -25,
  /** Happening tonight: the product exists to get people out *today*. */
  tonight: 10,
  /** Full marks within 1km, decaying to nothing at MAX_NEARBY_KM. */
  nearbyMax: 10,
  /** Scaled by headcount, capped at popularityMax. */
  popularityMax: 8,
  trending: 6,
  /** Scarcity, only when genuinely scarce. */
  nearlyFull: 5,
  /** No ticket price is one less reason to stay home. */
  free: 3,
} as const;

/** Beyond this, distance stops discriminating between events. */
const MAX_NEARBY_KM = 8;

/** Headcount at which an event earns full popularity points. */
const POPULARITY_SATURATION = 80;

/** At or below this many spots, scarcity is real rather than a nudge. */
const NEARLY_FULL_THRESHOLD = 12;

/**
 * Reasons that reveal something about the viewer.
 *
 * These are the reasons an anonymous visitor must never see, because showing
 * them asserts knowledge we do not have. Enforced in `scoreEvent`, and
 * exported so tests can assert the rule rather than restate it.
 */
export const PERSONALISABLE_REASONS: ReadonlySet<ReasonKind> = new Set([
  "shared-interests",
  "connections-going",
  "saved",
  "already-going",
]);

export function sharedInterests(event: RankableEvent, interests: readonly string[]): string[] {
  return event.interests.filter((id) => interests.includes(id));
}

function connectionsGoing(
  event: RankableEvent,
  connectionIds: readonly string[],
): readonly string[] {
  return (event.attendeeIds ?? []).filter((id) => connectionIds.includes(id));
}

/**
 * Linear decay from full points at <=1km to zero at MAX_NEARBY_KM.
 *
 * An unknown distance scores zero rather than being penalised: not knowing
 * where someone is should not push nearby events down the feed.
 */
function proximityPoints(event: RankableEvent): number {
  const km = event.distanceKm;
  if (km === null) return 0;
  if (km <= 1) return WEIGHTS.nearbyMax;
  if (km >= MAX_NEARBY_KM) return 0;
  const closeness = (MAX_NEARBY_KM - km) / (MAX_NEARBY_KM - 1);
  return Math.round(WEIGHTS.nearbyMax * closeness);
}

function popularityPoints(event: RankableEvent): number {
  const ratio = Math.min(1, event.goingCount / POPULARITY_SATURATION);
  return Math.round(WEIGHTS.popularityMax * ratio);
}

/** Local midnight tonight, so "tonight" means the same to every viewer. */
function isTonight(startsAt: number, now: number): boolean {
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return startsAt >= now && startsAt <= end.getTime();
}

function isThisWeekend(startsAt: number, now: number): boolean {
  const start = new Date(startsAt);
  const day = start.getDay();
  const withinAWeek = startsAt >= now && startsAt - now <= 7 * 86_400_000;
  // Friday evening through Sunday.
  return withinAWeek && (day === 0 || day === 6 || (day === 5 && start.getHours() >= 17));
}

/** Score one event for one viewer, keeping the reasons that produced it. */
export function scoreEvent<T extends RankableEvent>(
  event: T,
  viewer: ViewerSignals,
  now: number = Date.now(),
): ScoredEvent<T> {
  const reasons: RankingReason[] = [];

  const add = (kind: ReasonKind, points: number, count?: number) => {
    if (points === 0) return;
    if (!viewer.identified && PERSONALISABLE_REASONS.has(kind)) return;
    reasons.push({ kind, points, ...(count !== undefined && { count }) });
  };

  const shared = sharedInterests(event, viewer.interests);
  add("shared-interests", shared.length * WEIGHTS.sharedInterest, shared.length);

  const connections = connectionsGoing(event, viewer.connectionIds);
  add("connections-going", connections.length * WEIGHTS.connectionGoing, connections.length);

  if (viewer.savedIds.includes(event.id)) add("saved", WEIGHTS.saved);
  if (viewer.goingIds.includes(event.id)) add("already-going", WEIGHTS.alreadyGoing);

  if (isTonight(event.startsAt, now)) add("happening-tonight", WEIGHTS.tonight);
  add("nearby", proximityPoints(event));
  add("popular", popularityPoints(event), event.goingCount);
  if (event.trending) add("trending", WEIGHTS.trending);

  const spots = event.spotsLeft;
  if (spots !== null && spots > 0 && spots <= NEARLY_FULL_THRESHOLD) {
    add("nearly-full", WEIGHTS.nearlyFull, spots);
  }
  if (event.priceMinor === 0) add("free", WEIGHTS.free);

  reasons.sort((a, b) => b.points - a.points);
  const score = reasons.reduce((total, reason) => total + reason.points, 0);

  return { event, score, reasons };
}

/**
 * Rank events for a viewer, strongest first.
 *
 * Ties break on headcount and then on id, so the order is stable across
 * renders and reproducible in tests. An unstable feed reorders under the
 * user's thumb, which reads as a bug.
 */
export function rankEvents<T extends RankableEvent>(
  events: readonly T[],
  viewer: ViewerSignals = ANONYMOUS_VIEWER,
  now: number = Date.now(),
): ScoredEvent<T>[] {
  return events
    .map((event) => scoreEvent(event, viewer, now))
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.event.goingCount - a.event.goingCount ||
        a.event.id.localeCompare(b.event.id),
    );
}

/* ---------------- Feed modes ---------------- */

export type FeedMode = "foryou" | "tonight" | "weekend" | "trending";

export const FEED_MODES: { id: FeedMode; label: string }[] = [
  { id: "foryou", label: "For you" },
  { id: "tonight", label: "Tonight" },
  { id: "weekend", label: "This weekend" },
  { id: "trending", label: "Trending" },
];

/** Which events a mode is willing to show, before ranking. */
function eligibleFor<T extends RankableEvent>(
  mode: FeedMode,
  events: readonly T[],
  now: number,
): T[] {
  switch (mode) {
    case "tonight":
      return events.filter((e) => isTonight(e.startsAt, now));
    case "weekend":
      return events.filter((e) => isThisWeekend(e.startsAt, now));
    case "trending":
      return events.filter((e) => e.trending || e.goingCount > 40);
    case "foryou":
      return [...events];
  }
}

/**
 * Build the discovery feed.
 *
 * The cap is a product decision, not a paging strategy: IRL NOW deliberately
 * runs out and tells you to go outside. Do not replace it with infinite
 * scroll — see docs/ASSESSMENT.md.
 */
export function buildFeed<T extends RankableEvent>(
  events: readonly T[],
  mode: FeedMode,
  viewer: ViewerSignals = ANONYMOUS_VIEWER,
  cap: number = FEED_CAP,
  now: number = Date.now(),
): ScoredEvent<T>[] {
  const eligible = eligibleFor(mode, events, now);
  // Trending is an explicit "what is everyone doing" view; personal signals
  // would defeat the point of choosing it.
  const ranked =
    mode === "trending"
      ? eligible
          .map((event) => scoreEvent(event, viewer, now))
          .sort(
            (a, b) =>
              b.event.goingCount - a.event.goingCount || a.event.id.localeCompare(b.event.id),
          )
      : rankEvents(eligible, viewer, now);

  return ranked.slice(0, cap);
}

/* ------------------------------------------------------------------
   Adapting the fixture catalogue.

   `IrlEvent` stores display strings — "Tonight · 7:30pm", "£12",
   "1.2 km" — because it predates the backend. This converts one into
   the shape ranking works in, so the web app keeps its fixtures while
   mobile passes Convex data straight through.

   It goes away with the last fixture.
------------------------------------------------------------------- */

/** Tonight, or the coming Saturday, matching the fixture's coarse buckets. */
function fixtureStartsAt(event: IrlEvent, now: number): number {
  const start = new Date(now);
  if (event.when === "weekend") {
    const daysToSaturday = (6 - start.getDay() + 7) % 7 || 7;
    start.setDate(start.getDate() + daysToSaturday);
    start.setHours(19, 0, 0, 0);
  } else {
    start.setHours(20, 0, 0, 0);
    if (start.getTime() < now) start.setDate(start.getDate() + 1);
  }
  return start.getTime();
}

export function toRankable(event: IrlEvent, now: number = Date.now()): RankableEvent {
  const km = distanceKm(event);
  return {
    id: event.id,
    interests: event.interests,
    goingCount: event.goingCount,
    startsAt: fixtureStartsAt(event, now),
    distanceKm: km > 0 ? km : null,
    priceMinor: isFree(event)
      ? 0
      : Math.round((parseFloat(event.price.replace(/[^\d.]/g, "")) || 0) * 100),
    spotsLeft: event.spotsLeft ?? null,
    attendeeIds: event.going,
    ...(event.trending !== undefined && { trending: event.trending }),
  };
}
