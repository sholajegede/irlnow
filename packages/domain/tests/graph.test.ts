import { describe, expect, it } from "vitest";
import { events, getEvent, people } from "../src/data";
import { goingGraph, peopleOut, peopleToMeet } from "../src/graph";

const ROOFTOP = "rooftop-golden-hour";

/**
 * The invariant this file exists to defend, stated in lib/graph.ts itself:
 *
 *   "Everything social in IRL NOW is derived from who said yes to what,
 *    never from browsing strangers."
 *
 * A person may only surface because they said yes to something the viewer can
 * also join. If that ever stops being true, IRL NOW has quietly become a
 * stranger-browsing app, and these tests are what catches it.
 */
describe("people only surface through attendance", () => {
  it("only ever returns people who are going to something", () => {
    const attending = new Set(events.flatMap((e) => e.going));
    for (const entry of peopleOut(["food", "music"])) {
      expect(attending.has(entry.person.id)).toBe(true);
    }
  });

  it("ties every surfaced person to a specific joinable event", () => {
    for (const entry of peopleOut(["food"])) {
      const event = getEvent(entry.event.id);
      expect(event, `${entry.person.name} surfaced with no real event`).toBeDefined();
      expect(event!.going).toContain(entry.person.id);
    }
  });

  it("does not surface people who are going to nothing", () => {
    // Every person in the full catalogue attends something, so narrowing to a
    // single event is what creates non-attendees to assert against.
    const onlyEvent = getEvent(ROOFTOP)!;
    const attending = new Set(onlyEvent.going);
    const homebodies = people.filter((p) => !attending.has(p.id));
    const surfaced = new Set(peopleOut([], [], [onlyEvent]).map((entry) => entry.person.id));

    // Guard the guard: if there were no non-attendees, this would prove nothing.
    expect(homebodies.length).toBeGreaterThan(0);
    for (const person of homebodies) {
      expect(surfaced.has(person.id)).toBe(false);
    }
  });

  it("lists each person once, under their strongest reason", () => {
    const ids = peopleOut(["food", "music", "art"]).map((entry) => entry.person.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("ranks by score, strongest first", () => {
    const scores = peopleOut(["food", "music"]).map((entry) => entry.score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it("gives every surfaced person a reason", () => {
    for (const entry of peopleOut(["food"])) {
      expect(entry.reason.length).toBeGreaterThan(0);
    }
  });
});

describe("goingGraph", () => {
  it("builds a roster from the people actually going", () => {
    const graph = goingGraph(ROOFTOP);
    const event = getEvent(ROOFTOP)!;
    expect(graph.roster.map((p) => p.id)).toEqual(event.going);
  });

  it("returns an invitation, not an error, for an unknown event", () => {
    const graph = goingGraph("no-such-event");
    expect(graph.roster).toEqual([]);
    expect(graph.headline).toBe("Be the first to say you're going");
  });

  it("matches people on the viewer's interests", () => {
    const graph = goingGraph(ROOFTOP, ["music"]);
    expect(graph.likeYou.length).toBeGreaterThan(0);
    for (const person of graph.likeYou) {
      expect(person.interests).toContain("music");
    }
  });

  it("leads with someone the viewer has already met", () => {
    const event = getEvent(ROOFTOP)!;
    const met = event.going[0]!;
    const graph = goingGraph(ROOFTOP, [], [met]);

    expect(graph.metBefore.map((p) => p.id)).toContain(met);
    expect(graph.headline).toContain("you two were at the same thing before");
  });

  it("never claims more matches than there are people going", () => {
    for (const event of events) {
      const graph = goingGraph(event.id, ["food", "music", "art", "photo", "nightlife"]);
      const claimed = Number(graph.headline.match(/^(\d+)/)?.[1] ?? 0);
      expect(claimed).toBeLessThanOrEqual(event.goingCount);
    }
  });

  it("always states the real headcount in the subline", () => {
    for (const event of events) {
      const graph = goingGraph(event.id, ["food"]);
      if (graph.roster.length === 0) continue;
      expect(graph.subline).toContain(`${event.goingCount} going`);
    }
  });
});

/**
 * The other half of the anonymity rule: an anonymous visitor sees social proof,
 * but never a claim that implies we know their taste.
 */
describe("anonymous viewers get honest, non-personalised copy", () => {
  it("makes no 'into the same things as you' claim without interests", () => {
    for (const event of events) {
      const graph = goingGraph(event.id);
      expect(graph.headline).not.toContain("same things as you");
    }
  });

  it("still names who is going, because that is not personal to the viewer", () => {
    const graph = goingGraph(ROOFTOP);
    const firstAttendee = getEvent(ROOFTOP)!.going[0]!;
    const name = people.find((p) => p.id === firstAttendee)!.name;
    expect(graph.headline).toContain(name);
  });

  it("reports no interest matches at all", () => {
    expect(goingGraph(ROOFTOP).likeYou).toEqual([]);
  });

  it("switches to the personalised claim once interests are known", () => {
    expect(goingGraph(ROOFTOP, ["music", "photo"]).headline).toContain("same things as you");
  });
});

describe("peopleToMeet", () => {
  it("only suggests people going to that event", () => {
    const roster = getEvent(ROOFTOP)!.going;
    for (const person of peopleToMeet(ROOFTOP, ["music"])) {
      expect(roster).toContain(person.id);
    }
  });

  it("respects the limit and never exceeds the roster", () => {
    const suggestions = peopleToMeet(ROOFTOP, ["music"], [], 2);
    expect(suggestions.length).toBeLessThanOrEqual(2);
  });

  it("puts someone the viewer has met before at the top", () => {
    const roster = getEvent(ROOFTOP)!.going;
    const met = roster[roster.length - 1]!;
    expect(peopleToMeet(ROOFTOP, [], [met])[0]?.id).toBe(met);
  });

  it("returns nothing for an unknown event rather than throwing", () => {
    expect(peopleToMeet("no-such-event", ["food"])).toEqual([]);
  });
});
