import { describe, expect, it } from "vitest";
import { events, type IrlEvent } from "@/lib/data";
import {
  accessChecklist,
  accessFor,
  expectsLoudMusic,
  hasDeclaredAccess,
  UNKNOWN_ACCESS,
  type EventAccess,
} from "@/lib/events/access";

function makeEvent(overrides: Partial<IrlEvent> = {}): IrlEvent {
  return {
    id: "e",
    title: "Event",
    category: "Food & drink",
    cover: "supper",
    host: "Tomás",
    dateLabel: "Sat · 7pm",
    when: "weekend",
    location: "Somewhere",
    area: "Hackney",
    distance: "2.0 km",
    price: "£10",
    going: [],
    goingCount: 0,
    interests: [],
    description: "",
    vibes: [],
    ...overrides,
  };
}

/**
 * The rule this file exists to defend: access answers come from the host or
 * they do not exist. A fabricated "yes" strands someone at a step; a
 * fabricated "no" tells them not to come at all.
 */
describe("event access is never inferred", () => {
  it("reports every facility as unknown when the host declared nothing", () => {
    const items = accessChecklist(makeEvent());
    expect(items).not.toHaveLength(0);
    expect(items.every((i) => i.answer === "unknown")).toBe(true);
  });

  it("gives identical answers for events differing only by id", () => {
    const a = accessChecklist(makeEvent({ id: "aaaa" }));
    const b = accessChecklist(makeEvent({ id: "zzzz-completely-different" }));
    expect(a).toEqual(b);
  });

  it("gives identical answers across the whole real catalogue", () => {
    const shapes = new Set(
      events.map((event) => JSON.stringify(accessChecklist(event).map((i) => i.answer))),
    );
    // Nothing in the catalogue declares access, so every event must read the
    // same. More than one shape means something is deriving answers again.
    expect(shapes.size).toBe(1);
    expect(events.every((event) => !hasDeclaredAccess(event))).toBe(true);
  });

  it("falls back to the unknown set for an undeclared event", () => {
    expect(accessFor(makeEvent())).toEqual(UNKNOWN_ACCESS);
  });
});

describe("host-declared access", () => {
  const declared: EventAccess = {
    stepFree: "yes",
    accessibleToilet: "yes",
    seating: "no",
    quietSpace: "unknown",
    hearingLoop: "no",
    brightEnoughToLipRead: "unknown",
    note: "Use the side door on Bethnal Green Road.",
  };

  it("reports exactly what the host answered", () => {
    const items = accessChecklist(makeEvent({ access: declared }));
    const byId = Object.fromEntries(items.map((i) => [i.id, i.answer]));

    expect(byId["stepFree"]).toBe("yes");
    expect(byId["seating"]).toBe("no");
    expect(byId["quietSpace"]).toBe("unknown");
  });

  it("keeps unanswered facilities unknown rather than defaulting them to no", () => {
    const partial = accessChecklist(makeEvent({ access: { ...UNKNOWN_ACCESS, stepFree: "yes" } }));
    const byId = Object.fromEntries(partial.map((i) => [i.id, i.answer]));

    expect(byId["stepFree"]).toBe("yes");
    expect(byId["accessibleToilet"]).toBe("unknown");
  });

  it("counts an event as declared once any facility is answered", () => {
    expect(hasDeclaredAccess(makeEvent({ access: { ...UNKNOWN_ACCESS, seating: "no" } }))).toBe(
      true,
    );
    expect(hasDeclaredAccess(makeEvent({ access: UNKNOWN_ACCESS }))).toBe(false);
  });

  it("preserves the host's note", () => {
    expect(accessFor(makeEvent({ access: declared })).note).toBe(
      "Use the side door on Bethnal Green Road.",
    );
  });
});

describe("expectsLoudMusic", () => {
  it("infers volume from the event's own category, not from its id", () => {
    expect(expectsLoudMusic(makeEvent({ category: "Nightlife" }))).toBe(true);
    expect(expectsLoudMusic(makeEvent({ interests: ["music"] }))).toBe(true);
    expect(expectsLoudMusic(makeEvent({ category: "Food & drink" }))).toBe(false);
  });
});
