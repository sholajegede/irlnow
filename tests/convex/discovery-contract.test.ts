import { describe, expect, it } from "vitest";
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { api } from "../../convex/_generated/api";
import {
  ANONYMOUS_VIEWER,
  buildFeed,
  distanceBetween,
  priceLabel,
  whenLabel,
  type RankableEvent,
} from "../../packages/domain/src";
import { seedEvent, seedUser, withIdentity } from "./helpers";

/* ------------------------------------------------------------------
   The contract between the backend and the feed.

   Unit tests cover each side of this separately: the Convex functions
   in their own suite, the ranking engine in the domain's. Neither
   catches the failure that actually matters — the query returning a
   shape the feed cannot consume.

   These tests run the real query and put its output through the real
   formatting and ranking path, which is what the mobile app does.
------------------------------------------------------------------- */

const HOUR = 3_600_000;

/** The view-model conversion the mobile client performs, kept in step. */
function toRankable(
  event: {
    id: string;
    interests: string[];
    goingCount: number;
    startsAt: number;
    priceMinor: number;
    spotsLeft: number | null;
    place: { lat: number; lng: number };
  },
  viewer: { lat: number; lng: number } | null,
): RankableEvent {
  return {
    id: event.id,
    interests: event.interests,
    goingCount: event.goingCount,
    startsAt: event.startsAt,
    distanceKm: viewer ? distanceBetween(viewer, event.place) : null,
    priceMinor: event.priceMinor,
    spotsLeft: event.spotsLeft,
  };
}

describe("listUpcoming returns what the feed needs", () => {
  it("supplies every field the ranking engine reads", async () => {
    const t = convexTest(schema);
    await seedEvent(t);

    const [event] = await t.query(api.events.listUpcoming, {});
    expect(event).toBeDefined();

    // If the query ever stops returning one of these, the feed silently
    // ranks on undefined rather than failing loudly.
    expect(typeof event!.id).toBe("string");
    expect(Array.isArray(event!.interests)).toBe(true);
    expect(typeof event!.goingCount).toBe("number");
    expect(typeof event!.startsAt).toBe("number");
    expect(typeof event!.priceMinor).toBe("number");
    expect(event!.spotsLeft === null || typeof event!.spotsLeft === "number").toBe(true);
    expect(typeof event!.place.lat).toBe("number");
    expect(typeof event!.place.lng).toBe("number");
  });

  it("supplies every field the card renders", async () => {
    const t = convexTest(schema);
    await seedEvent(t);

    const [event] = await t.query(api.events.listUpcoming, {});
    expect(event!.title).toBeTruthy();
    expect(event!.slug).toBeTruthy();
    expect(event!.coverKey).toBeTruthy();
    expect(event!.place.area).toBeTruthy();
    expect(event!.organiser.name).toBeTruthy();
    expect(event!.currency).toBeTruthy();
  });

  it("ranks and caps a real query result end to end", async () => {
    const t = convexTest(schema);
    const now = Date.now();
    for (let i = 0; i < 15; i++) {
      await seedEvent(t, { slug: `event-${i}`, startsAt: now + (i + 1) * HOUR });
    }

    const events = await t.query(api.events.listUpcoming, { limit: 20 });
    const feed = buildFeed(
      events.map((e) => toRankable(e, null)),
      "foryou",
      ANONYMOUS_VIEWER,
    );

    // 15 events in, 10 out. The cap holds against real data, not fixtures.
    expect(events).toHaveLength(15);
    expect(feed).toHaveLength(10);
  });

  it("formats a real event's time and price into readable copy", async () => {
    const t = convexTest(schema);
    const startsAt = Date.now() + 6 * HOUR;
    await seedEvent(t, { startsAt });

    const [event] = await t.query(api.events.listUpcoming, {});

    // The backend stores 0 pence and an epoch; the person reads words.
    expect(priceLabel(event!.priceMinor, event!.currency)).toBe("Free");
    expect(whenLabel(event!.startsAt)).toMatch(/^(Tonight|Tomorrow) · /);
  });

  it("computes distance from the viewer, not from the event", async () => {
    const t = convexTest(schema);
    await seedEvent(t);

    const [event] = await t.query(api.events.listUpcoming, {});

    // Shoreditch from two different places must give two different answers,
    // which is the whole reason distance is not a stored field.
    const fromSoho = distanceBetween({ lat: 51.5137, lng: -0.1341 }, event!.place);
    const fromBrixton = distanceBetween({ lat: 51.4613, lng: -0.1156 }, event!.place);

    expect(fromSoho).toBeGreaterThan(0);
    expect(fromBrixton).toBeGreaterThan(fromSoho);
  });

  it("keeps goingCount and spotsLeft consistent as people join", async () => {
    const t = convexTest(schema);
    const { eventId } = await seedEvent(t, { capacity: 3 });

    for (const key of ["maya", "josh"]) {
      const user = await seedUser(t, key);
      await withIdentity(t, user).mutation(api.rsvps.setStatus, { eventId, status: "going" });
    }

    const [event] = await t.query(api.events.listUpcoming, {});
    expect(event!.goingCount).toBe(2);
    expect(event!.spotsLeft).toBe(1);

    // The card shows scarcity from spotsLeft, so the two must never disagree.
    expect(event!.goingCount + (event!.spotsLeft ?? 0)).toBe(3);
  });
});

/**
 * Anonymous discovery has to survive the whole path, not just the query.
 * This is the flow a first-time visitor takes before any account exists.
 */
describe("the anonymous path works end to end", () => {
  it("goes from an empty session to a ranked feed", async () => {
    const t = convexTest(schema);
    const now = Date.now();
    await seedEvent(t, { slug: "tonight", startsAt: now + 4 * HOUR });
    await seedEvent(t, { slug: "later", startsAt: now + 5 * 24 * HOUR });

    // No identity anywhere in this chain.
    const events = await t.query(api.events.listUpcoming, {});
    const feed = buildFeed(
      events.map((e) => toRankable(e, null)),
      "foryou",
      ANONYMOUS_VIEWER,
    );

    expect(feed).toHaveLength(2);
    // Tonight outranks next week, with no personal signals involved.
    expect(feed[0]!.event.id).toBe(events.find((e) => e.slug === "tonight")!.id);
  });

  it("emits no personalised reason anywhere in a real feed", async () => {
    const t = convexTest(schema);
    await seedEvent(t, { interests: ["food", "music"] });

    const events = await t.query(api.events.listUpcoming, {});
    const feed = buildFeed(
      events.map((e) => toRankable(e, { lat: 51.5265, lng: -0.0784 })),
      "foryou",
      ANONYMOUS_VIEWER,
    );

    for (const scored of feed) {
      for (const reason of scored.reasons) {
        expect(["shared-interests", "connections-going", "saved", "already-going"]).not.toContain(
          reason.kind,
        );
      }
    }
  });
});
