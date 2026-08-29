import { describe, expect, it } from "vitest";
import { FEED_CAP, events, type IrlEvent } from "../src/data";
import {
  ANONYMOUS_VIEWER,
  PERSONALISABLE_REASONS,
  buildFeed,
  rankEvents,
  scoreEvent,
  type ReasonKind,
  type ViewerSignals,
} from "../src/discovery/ranking";

/** A neutral event, so each test varies exactly one thing. */
function makeEvent(overrides: Partial<IrlEvent> = {}): IrlEvent {
  return {
    id: "base",
    title: "Base Event",
    category: "Food & drink",
    cover: "supper",
    host: "Tomás",
    dateLabel: "Sat · 7pm",
    when: "weekend",
    location: "Somewhere",
    area: "Hackney",
    distance: "9.0 km",
    price: "£10",
    going: [],
    goingCount: 0,
    interests: [],
    description: "",
    vibes: [],
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

describe("scoreEvent", () => {
  it("scores a neutral event at zero", () => {
    expect(scoreEvent(makeEvent(), ANONYMOUS_VIEWER).score).toBe(0);
  });

  it("rewards each shared interest and records how many matched", () => {
    const event = makeEvent({ interests: ["food", "music", "art"] });
    const viewer = identified({ interests: ["food", "music"] });

    const reason = scoreEvent(event, viewer).reasons.find((r) => r.kind === "shared-interests");
    expect(reason?.count).toBe(2);
    expect(reason?.points).toBeGreaterThan(0);
  });

  it("weights a connection going above a shared interest", () => {
    const viewer = identified({ interests: ["food"], connectionIds: ["maya"] });
    const byInterest = scoreEvent(makeEvent({ interests: ["food"] }), viewer).score;
    const byConnection = scoreEvent(makeEvent({ going: ["maya"] }), viewer).score;

    expect(byConnection).toBeGreaterThan(byInterest);
  });

  it("demotes an event the viewer already said yes to", () => {
    const event = makeEvent({ id: "rooftop" });
    const going = scoreEvent(event, identified({ goingIds: ["rooftop"] }));

    expect(going.score).toBeLessThan(scoreEvent(event, identified()).score);
    expect(kinds(going.reasons)).toContain("already-going");
  });

  it("favours tonight over the weekend, all else equal", () => {
    const tonight = scoreEvent(makeEvent({ when: "tonight" }), ANONYMOUS_VIEWER).score;
    const weekend = scoreEvent(makeEvent({ when: "weekend" }), ANONYMOUS_VIEWER).score;
    expect(tonight).toBeGreaterThan(weekend);
  });

  it("decays proximity with distance and stops discriminating past the cutoff", () => {
    const at = (distance: string) => scoreEvent(makeEvent({ distance }), ANONYMOUS_VIEWER).score;

    expect(at("0.5 km")).toBeGreaterThan(at("3.0 km"));
    expect(at("3.0 km")).toBeGreaterThan(at("7.0 km"));
    expect(at("9.0 km")).toBe(at("40.0 km"));
  });

  it("caps popularity so a crowd cannot bury a well-matched event", () => {
    const huge = scoreEvent(makeEvent({ goingCount: 5000 }), ANONYMOUS_VIEWER).score;
    const matched = scoreEvent(
      makeEvent({ interests: ["food", "music"] }),
      identified({ interests: ["food", "music"] }),
    ).score;

    expect(matched).toBeGreaterThan(huge);
  });

  it("treats scarcity as real only when spots are genuinely low", () => {
    const scarce = scoreEvent(makeEvent({ spotsLeft: 4 }), ANONYMOUS_VIEWER);
    const roomy = scoreEvent(makeEvent({ spotsLeft: 60 }), ANONYMOUS_VIEWER);

    expect(kinds(scarce.reasons)).toContain("nearly-full");
    expect(kinds(roomy.reasons)).not.toContain("nearly-full");
  });

  it("does not call a sold-out event nearly full", () => {
    const soldOut = scoreEvent(makeEvent({ spotsLeft: 0 }), ANONYMOUS_VIEWER);
    expect(kinds(soldOut.reasons)).not.toContain("nearly-full");
  });

  it("counts pay-as-you-eat as free, matching the product's own definition", () => {
    const payAsYouEat = scoreEvent(makeEvent({ price: "Pay as you eat" }), ANONYMOUS_VIEWER);
    expect(kinds(payAsYouEat.reasons)).toContain("free");
  });

  it("orders reasons by contribution so the strongest can be shown first", () => {
    const scored = scoreEvent(
      makeEvent({ when: "tonight", interests: ["food", "music", "art"], goingCount: 90 }),
      identified({ interests: ["food", "music", "art"] }),
    );
    const points = scored.reasons.map((r) => r.points);
    expect(points).toEqual([...points].sort((a, b) => b - a));
  });

  it("score always equals the sum of its reasons", () => {
    for (const event of events) {
      const scored = scoreEvent(event, identified({ interests: ["food", "music"] }));
      const summed = scored.reasons.reduce((total, r) => total + r.points, 0);
      expect(scored.score).toBe(summed);
    }
  });
});

/**
 * The product rule: an anonymous visitor is never shown a claim implying we
 * know who they are. This is the invariant the whole anonymous-discovery flow
 * rests on, so it is asserted directly rather than inferred from scores.
 */
describe("anonymous viewers are never personalised", () => {
  const wouldMatchEverything = makeEvent({
    id: "rooftop",
    interests: ["food", "music"],
    going: ["maya"],
  });

  it("emits no personalisable reason for an anonymous viewer", () => {
    const scored = scoreEvent(wouldMatchEverything, {
      ...ANONYMOUS_VIEWER,
      // Even if signals leak in, `identified: false` must suppress them.
      interests: ["food", "music"],
      connectionIds: ["maya"],
      savedIds: ["rooftop"],
      goingIds: ["rooftop"],
    });

    for (const reason of scored.reasons) {
      expect(PERSONALISABLE_REASONS.has(reason.kind)).toBe(false);
    }
  });

  it("emits those reasons once the viewer is identified", () => {
    const scored = scoreEvent(
      wouldMatchEverything,
      identified({ interests: ["food", "music"], connectionIds: ["maya"] }),
    );

    expect(kinds(scored.reasons)).toContain("shared-interests");
    expect(kinds(scored.reasons)).toContain("connections-going");
  });

  it("still ranks the real catalogue for an anonymous visitor", () => {
    const ranked = rankEvents(events, ANONYMOUS_VIEWER);
    expect(ranked).toHaveLength(events.length);
    expect(ranked[0]!.score).toBeGreaterThan(0);
  });
});

describe("rankEvents", () => {
  it("returns every event, strongest first", () => {
    const ranked = rankEvents(events, identified({ interests: ["food"] }));
    const scores = ranked.map((r) => r.score);

    expect(ranked).toHaveLength(events.length);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it("is stable: equal events always come back in the same order", () => {
    const tied = [makeEvent({ id: "b" }), makeEvent({ id: "a" }), makeEvent({ id: "c" })];
    const order = () => rankEvents(tied, ANONYMOUS_VIEWER).map((r) => r.event.id);

    expect(order()).toEqual(["a", "b", "c"]);
    expect(order()).toEqual(order());
  });

  it("puts an interest-matched event above an unmatched one", () => {
    const ranked = rankEvents(
      [makeEvent({ id: "unmatched" }), makeEvent({ id: "matched", interests: ["climbing"] })],
      identified({ interests: ["climbing"] }),
    );
    expect(ranked[0]!.event.id).toBe("matched");
  });
});

describe("buildFeed", () => {
  it("never exceeds the deliberate feed cap", () => {
    const many = Array.from({ length: 200 }, (_, i) => makeEvent({ id: `e${i}` }));
    expect(buildFeed(many, "foryou", ANONYMOUS_VIEWER)).toHaveLength(FEED_CAP);
  });

  it("shows only tonight's events in the Tonight view", () => {
    const feed = buildFeed(events, "tonight", ANONYMOUS_VIEWER);
    expect(feed.length).toBeGreaterThan(0);
    expect(feed.every((r) => r.event.when === "tonight")).toBe(true);
  });

  it("shows only weekend events in the Weekend view", () => {
    const feed = buildFeed(events, "weekend", ANONYMOUS_VIEWER);
    expect(feed.length).toBeGreaterThan(0);
    expect(feed.every((r) => r.event.when === "weekend")).toBe(true);
  });

  it("orders Trending by headcount, ignoring personal signals", () => {
    const viewer = identified({ interests: ["climbing"] });
    const counts = buildFeed(events, "trending", viewer).map((r) => r.event.goingCount);
    expect(counts).toEqual([...counts].sort((a, b) => b - a));
  });

  it("reorders For You around the viewer's interests", () => {
    const anon = buildFeed(events, "foryou", ANONYMOUS_VIEWER).map((r) => r.event.id);
    const climber = buildFeed(events, "foryou", identified({ interests: ["climbing"] })).map(
      (r) => r.event.id,
    );

    expect(climber).not.toEqual(anon);
    const climbingEvent = events.find((e) => e.interests.includes("climbing"))!;
    expect(climber.indexOf(climbingEvent.id)).toBeLessThan(anon.indexOf(climbingEvent.id));
  });

  it("returns an empty feed rather than throwing when nothing is eligible", () => {
    expect(buildFeed([], "foryou", ANONYMOUS_VIEWER)).toEqual([]);
  });
});
