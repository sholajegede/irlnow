import type { FeedEvent } from "@/features/discovery/types";

const HOUR = 3_600_000;

/** A neutral feed event, so each test varies exactly one thing. */
export function makeFeedEvent(overrides: Partial<FeedEvent> = {}): FeedEvent {
  return {
    id: "evt_1",
    slug: "test-event",
    title: "Test Event",
    description: "Something to do.",
    category: "Food & drink",
    interests: ["food"],
    coverKey: "supper",
    areaLabel: "Hackney",
    whenLabel: "Sat · 7pm",
    priceLabel: "Free",
    startsAt: Date.now() + 24 * HOUR,
    goingCount: 12,
    spotsLeft: null,
    distanceKm: 2,
    priceMinor: 0,
    trending: false,
    attendeeIds: [],
    organiserName: "Tomás",
    venueName: "Studio Kitchen",
    ...overrides,
  };
}
