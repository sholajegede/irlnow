import { describe, expect, it } from "vitest";
import { FEED_CAP, events } from "../src/data";
import {
  ANONYMOUS_VIEWER,
  PERSONALISABLE_REASONS,
  buildFeed,
  rankEvents,
  scoreEvent,
  toRankable,
  type RankableEvent,
  type ReasonKind,
  type ViewerSignals,
} from "../src/discovery/ranking";

const HOUR = 3_600_000;
const DAY = 86_400_000;

/** A fixed reference point, so "tonight" means the same thing every run. */
const NOW = new Date("2026-09-02T12:00:00Z").getTime(); // A Wednesday, midday.

/** A neutral event, so each test varies exactly one thing. */
function makeEvent(overrides: Partial<RankableEvent> = {}): RankableEvent {
  return {
    id: "base",
    interests: [],
    goingCount: 0,
    // Two days out: neither tonight nor the weekend.
    startsAt: NOW + 2 * DAY,
    distanceKm: 9,
    priceMinor: 1000,
    spotsLeft: null,
    attendeeIds: [],
    ...overrides,
  };
}

function identified(overrides: Partial<ViewerSignals> = {}): ViewerSignals {
  return {
    identified: true,
    interests: [],
    connectionIds: [],
    goingIds: [],
    savedIds: [],
    ...overrides,
  };
}

const kinds = (reasons: { kind: ReasonKind }[]) => reasons.map((r) => r.kind);
const catalogue = () => events.map((e) => toRankable(e, NOW));

describe("scoreEvent", () => {
  it("scores a neutral event at zero", () => {
    expect(scoreEvent(makeEvent(), ANONYMOUS_VIEWER, NOW).score).toBe(0);
  });

  it("rewards each shared interest and records how many matched", () => {
    const event = makeEvent({ interests: ["food", "music", "art"] });
    const viewer = identified({ interests: ["food", "music"] });

    const reason = scoreEvent(event, viewer, NOW).reasons.find(
      (r) => r.kind === "shared-interests",
    );
    expect(reason?.count).toBe(2);
    expect(reason?.points).toBeGreaterThan(0);
  });

  it("weights a connection going above a shared interest", () => {
    const viewer = identified({ interests: ["food"], connectionIds: ["maya"] });
    const byInterest = scoreEvent(makeEvent({ interests: ["food"] }), viewer, NOW).score;
    const byConnection = scoreEvent(makeEvent({ attendeeIds: ["maya"] }), viewer, NOW).score;

    expect(byConnection).toBeGreaterThan(byInterest);
  });

  it("demotes an event the viewer already said yes to", () => {
    const event = makeEvent({ id: "rooftop" });
    const going = scoreEvent(event, identified({ goingIds: ["rooftop"] }), NOW);

    expect(going.score).toBeLessThan(scoreEvent(event, identified(), NOW).score);
    expect(kinds(going.reasons)).toContain("already-going");
  });

  it("favours tonight over later in the week, all else equal", () => {
    const tonight = scoreEvent(makeEvent({ startsAt: NOW + 6 * HOUR }), ANONYMOUS_VIEWER, NOW);
    const later = scoreEvent(makeEvent({ startsAt: NOW + 3 * DAY }), ANONYMOUS_VIEWER, NOW);

    expect(kinds(tonight.reasons)).toContain("happening-tonight");
    expect(tonight.score).toBeGreaterThan(later.score);
  });

  it("does not call an event tonight when it starts tomorrow", () => {
    const tomorrow = scoreEvent(makeEvent({ startsAt: NOW + 20 * HOUR }), ANONYMOUS_VIEWER, NOW);
    expect(kinds(tomorrow.reasons)).not.toContain("happening-tonight");
  });

  it("decays proximity with distance and stops discriminating past the cutoff", () => {
    const at = (distanceKm: number) =>
      scoreEvent(makeEvent({ distanceKm }), ANONYMOUS_VIEWER, NOW).score;

    expect(at(0.5)).toBeGreaterThan(at(3));
    expect(at(3)).toBeGreaterThan(at(7));
    expect(at(9)).toBe(at(40));
  });

  it("does not penalise an event when the viewer's location is unknown", () => {
    // Not knowing where someone is must not push nearby events down.
    const unknown = scoreEvent(makeEvent({ distanceKm: null }), ANONYMOUS_VIEWER, NOW);
    expect(unknown.score).toBe(0);
    expect(kinds(unknown.reasons)).not.toContain("nearby");
  });

  it("caps popularity so a crowd cannot bury a well-matched event", () => {
    const huge = scoreEvent(makeEvent({ goingCount: 5000 }), ANONYMOUS_VIEWER, NOW).score;
    const matched = scoreEvent(
      makeEvent({ interests: ["food", "music"] }),
      identified({ interests: ["food", "music"] }),
      NOW,
    ).score;

    expect(matched).toBeGreaterThan(huge);
  });

  it("treats scarcity as real only when spots are genuinely low", () => {
    const scarce = scoreEvent(makeEvent({ spotsLeft: 4 }), ANONYMOUS_VIEWER, NOW);
    const roomy = scoreEvent(makeEvent({ spotsLeft: 60 }), ANONYMOUS_VIEWER, NOW);

    expect(kinds(scarce.reasons)).toContain("nearly-full");
    expect(kinds(roomy.reasons)).not.toContain("nearly-full");
  });

  it("does not call a sold-out event nearly full", () => {
    expect(
      kinds(scoreEvent(makeEvent({ spotsLeft: 0 }), ANONYMOUS_VIEWER, NOW).reasons),
    ).not.toContain("nearly-full");
  });

  it("does not call an uncapped event nearly full", () => {
    expect(
      kinds(scoreEvent(makeEvent({ spotsLeft: null }), ANONYMOUS_VIEWER, NOW).reasons),
    ).not.toContain("nearly-full");
  });

  it("credits a free event", () => {
    expect(
      kinds(scoreEvent(makeEvent({ priceMinor: 0 }), ANONYMOUS_VIEWER, NOW).reasons),
    ).toContain("free");
    expect(
      kinds(scoreEvent(makeEvent({ priceMinor: 1200 }), ANONYMOUS_VIEWER, NOW).reasons),
    ).not.toContain("free");
  });

  it("orders reasons by contribution so the strongest can be shown first", () => {
    const scored = scoreEvent(
      makeEvent({
        startsAt: NOW + 6 * HOUR,
        interests: ["food", "music", "art"],
        goingCount: 90,
      }),
      identified({ interests: ["food", "music", "art"] }),
      NOW,
    );
    const points = scored.reasons.map((r) => r.points);
    expect(points).toEqual([...points].sort((a, b) => b - a));
  });

  it("score always equals the sum of its reasons", () => {
    for (const event of catalogue()) {
      const scored = scoreEvent(event, identified({ interests: ["food", "music"] }), NOW);
      const summed = scored.reasons.reduce((total, r) => total + r.points, 0);
      expect(scored.score).toBe(summed);
    }
  });
});

/**
 * The product rule: an anonymous visitor is never shown a claim implying we
 * know who they are. The whole anonymous-discovery flow rests on it, so it is
 * asserted directly rather than inferred from scores.
 */
describe("anonymous viewers are never personalised", () => {
  const wouldMatchEverything = makeEvent({
    id: "rooftop",
    interests: ["food", "music"],
    attendeeIds: ["maya"],
  });

  it("emits no personalisable reason for an anonymous viewer", () => {
    const scored = scoreEvent(
      wouldMatchEverything,
      {
        ...ANONYMOUS_VIEWER,
        // Even if signals leak in, `identified: false` must suppress them.
        interests: ["food", "music"],
        connectionIds: ["maya"],
        savedIds: ["rooftop"],
        goingIds: ["rooftop"],
      },
      NOW,
    );

    for (const reason of scored.reasons) {
      expect(PERSONALISABLE_REASONS.has(reason.kind)).toBe(false);
    }
  });

  it("emits those reasons once the viewer is identified", () => {
    const scored = scoreEvent(
      wouldMatchEverything,
      identified({ interests: ["food", "music"], connectionIds: ["maya"] }),
      NOW,
    );

    expect(kinds(scored.reasons)).toContain("shared-interests");
    expect(kinds(scored.reasons)).toContain("connections-going");
  });

  it("still ranks the real catalogue for an anonymous visitor", () => {
    const ranked = rankEvents(catalogue(), ANONYMOUS_VIEWER, NOW);
    expect(ranked).toHaveLength(events.length);
    expect(ranked[0]!.score).toBeGreaterThan(0);
  });
});

describe("rankEvents", () => {
  it("returns every event, strongest first", () => {
    const ranked = rankEvents(catalogue(), identified({ interests: ["food"] }), NOW);
    const scores = ranked.map((r) => r.score);

    expect(ranked).toHaveLength(events.length);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it("is stable: equal events always come back in the same order", () => {
    const tied = [makeEvent({ id: "b" }), makeEvent({ id: "a" }), makeEvent({ id: "c" })];
    const order = () => rankEvents(tied, ANONYMOUS_VIEWER, NOW).map((r) => r.event.id);

    expect(order()).toEqual(["a", "b", "c"]);
    expect(order()).toEqual(order());
  });

  it("puts an interest-matched event above an unmatched one", () => {
    const ranked = rankEvents(
      [makeEvent({ id: "unmatched" }), makeEvent({ id: "matched", interests: ["climbing"] })],
      identified({ interests: ["climbing"] }),
      NOW,
    );
    expect(ranked[0]!.event.id).toBe("matched");
  });
});

describe("buildFeed", () => {
  it("never exceeds the deliberate feed cap", () => {
    const many = Array.from({ length: 200 }, (_, i) => makeEvent({ id: `e${i}` }));
    expect(buildFeed(many, "foryou", ANONYMOUS_VIEWER, FEED_CAP, NOW)).toHaveLength(FEED_CAP);
  });

  it("shows only events starting today in the Tonight view", () => {
    const feed = buildFeed(
      [
        makeEvent({ id: "tonight", startsAt: NOW + 6 * HOUR }),
        makeEvent({ id: "tomorrow", startsAt: NOW + 30 * HOUR }),
        makeEvent({ id: "next-week", startsAt: NOW + 8 * DAY }),
      ],
      "tonight",
      ANONYMOUS_VIEWER,
      FEED_CAP,
      NOW,
    );
    expect(feed.map((r) => r.event.id)).toEqual(["tonight"]);
  });

  it("shows only weekend events in the Weekend view", () => {
    // NOW is a Wednesday; the coming Saturday is three days out.
    const saturday = NOW + 3 * DAY;
    const feed = buildFeed(
      [
        makeEvent({ id: "weekday", startsAt: NOW + 1 * DAY }),
        makeEvent({ id: "saturday", startsAt: saturday }),
      ],
      "weekend",
      ANONYMOUS_VIEWER,
      FEED_CAP,
      NOW,
    );
    expect(feed.map((r) => r.event.id)).toEqual(["saturday"]);
  });

  it("never shows an event that has already started", () => {
    // Past events are excluded upstream by the backend query; the Tonight
    // view must not resurrect them through its own date maths.
    const feed = buildFeed(
      [makeEvent({ id: "yesterday", startsAt: NOW - 2 * DAY })],
      "tonight",
      ANONYMOUS_VIEWER,
      FEED_CAP,
      NOW,
    );
    expect(feed).toEqual([]);
  });

  it("orders Trending by headcount, ignoring personal signals", () => {
    const viewer = identified({ interests: ["climbing"] });
    const counts = buildFeed(catalogue(), "trending", viewer, FEED_CAP, NOW).map(
      (r) => r.event.goingCount,
    );
    expect(counts).toEqual([...counts].sort((a, b) => b - a));
  });

  it("reorders For You around the viewer's interests", () => {
    const list = catalogue();
    const anon = buildFeed(list, "foryou", ANONYMOUS_VIEWER, FEED_CAP, NOW).map((r) => r.event.id);
    const climber = buildFeed(
      list,
      "foryou",
      identified({ interests: ["climbing"] }),
      FEED_CAP,
      NOW,
    ).map((r) => r.event.id);

    const climbingEvent = events.find((e) => e.interests.includes("climbing"))!;
    expect(climber.indexOf(climbingEvent.id)).toBeLessThan(anon.indexOf(climbingEvent.id));
  });

  it("returns an empty feed rather than throwing when nothing is eligible", () => {
    expect(buildFeed([], "foryou", ANONYMOUS_VIEWER, FEED_CAP, NOW)).toEqual([]);
  });
});

/**
 * The fixture adapter exists only until the web app reads from Convex. It is
 * tested because a wrong conversion silently changes what the feed shows.
 */
describe("toRankable", () => {
  it("converts a price string to integer minor units", () => {
    const paid = events.find((e) => e.price.startsWith("£"))!;
    const expected = Math.round(parseFloat(paid.price.replace(/[^\d.]/g, "")) * 100);
    expect(toRankable(paid, NOW).priceMinor).toBe(expected);
  });

  it("treats the catalogue's free prices as zero", () => {
    for (const event of events.filter((e) => /free|pay as you eat/i.test(e.price))) {
      expect(toRankable(event, NOW).priceMinor).toBe(0);
    }
  });

  it("converts a distance string to a number", () => {
    const event = events.find((e) => parseFloat(e.distance) > 0)!;
    expect(toRankable(event, NOW).distanceKm).toBeCloseTo(parseFloat(event.distance), 5);
  });

  it("gives a tonight event a timestamp later today", () => {
    const tonight = events.find((e) => e.when === "tonight")!;
    const startsAt = toRankable(tonight, NOW).startsAt;
    expect(startsAt).toBeGreaterThan(NOW);
    expect(startsAt - NOW).toBeLessThan(DAY);
  });

  it("carries attendees through, so the connections signal still works", () => {
    const event = events.find((e) => e.going.length > 0)!;
    expect(toRankable(event, NOW).attendeeIds).toEqual(event.going);
  });

  it("maps an absent capacity to null rather than zero", () => {
    const uncapped = events.find((e) => e.spotsLeft === undefined)!;
    expect(toRankable(uncapped, NOW).spotsLeft).toBeNull();
  });
});
