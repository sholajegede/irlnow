import { describe, expect, it } from "vitest";
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { api } from "../../convex/_generated/api";
import { seedEvent, seedUser, withIdentity } from "./helpers";

/* ------------------------------------------------------------------
   "I'm Going" — the core social primitive.

   These tests exist mainly to hold the authorisation line. The client
   never supplies a user id, so the only thing standing between one
   account and another's data is the identity check in convex/auth.ts.
------------------------------------------------------------------- */

describe("setStatus", () => {
  it("refuses an anonymous caller", async () => {
    const t = convexTest(schema);
    const { eventId } = await seedEvent(t);

    await expect(t.mutation(api.rsvps.setStatus, { eventId, status: "going" })).rejects.toThrow(
      /not signed in/i,
    );
  });

  it("records a going for the signed-in user and counts it", async () => {
    const t = convexTest(schema);
    const { eventId } = await seedEvent(t);
    const maya = await seedUser(t, "maya");

    const result = await withIdentity(t, maya).mutation(api.rsvps.setStatus, {
      eventId,
      status: "going",
    });

    expect(result).toEqual({ status: "going", goingCount: 1 });
  });

  it("keeps one row per person, so going twice counts once", async () => {
    const t = convexTest(schema);
    const { eventId } = await seedEvent(t);
    const maya = await seedUser(t, "maya");
    const as = withIdentity(t, maya);

    await as.mutation(api.rsvps.setStatus, { eventId, status: "going" });
    const second = await as.mutation(api.rsvps.setStatus, { eventId, status: "going" });

    expect(second.goingCount).toBe(1);
  });

  it("moves a person between states rather than stacking rows", async () => {
    const t = convexTest(schema);
    const { eventId } = await seedEvent(t);
    const maya = await seedUser(t, "maya");
    const as = withIdentity(t, maya);

    await as.mutation(api.rsvps.setStatus, { eventId, status: "going" });
    await as.mutation(api.rsvps.setStatus, { eventId, status: "cancelled" });

    expect(await as.query(api.rsvps.mine, { eventId })).toMatchObject({ status: "cancelled" });
    expect(await t.query(api.events.getBySlug, { slug: "test-event" })).toMatchObject({
      goingCount: 0,
    });
  });

  it("counts each attendee separately", async () => {
    const t = convexTest(schema);
    const { eventId } = await seedEvent(t);

    for (const key of ["maya", "josh", "nina"]) {
      const user = await seedUser(t, key);
      await withIdentity(t, user).mutation(api.rsvps.setStatus, { eventId, status: "going" });
    }

    expect(await t.query(api.events.getBySlug, { slug: "test-event" })).toMatchObject({
      goingCount: 3,
    });
  });

  /**
   * Capacity is enforced here because it is a real-world constraint: a room
   * that holds 2 people holds 2 people regardless of what the client believes.
   */
  it("waitlists rather than oversells a full event", async () => {
    const t = convexTest(schema);
    const { eventId } = await seedEvent(t, { capacity: 2 });

    const results = [];
    for (const key of ["maya", "josh", "nina"]) {
      const user = await seedUser(t, key);
      results.push(
        await withIdentity(t, user).mutation(api.rsvps.setStatus, { eventId, status: "going" }),
      );
    }

    expect(results.map((r) => r.status)).toEqual(["going", "going", "waitlist"]);
    expect(results[2]!.goingCount).toBe(2);
  });

  it("reports no spots left once an event is full", async () => {
    const t = convexTest(schema);
    const { eventId } = await seedEvent(t, { capacity: 1 });
    const maya = await seedUser(t, "maya");

    await withIdentity(t, maya).mutation(api.rsvps.setStatus, { eventId, status: "going" });

    expect(await t.query(api.events.getBySlug, { slug: "test-event" })).toMatchObject({
      spotsLeft: 0,
    });
  });

  it("reports null spots left for an uncapped event", async () => {
    const t = convexTest(schema);
    await seedEvent(t);
    expect(await t.query(api.events.getBySlug, { slug: "test-event" })).toMatchObject({
      spotsLeft: null,
    });
  });

  it("does not let someone already going be bumped to the waitlist", async () => {
    const t = convexTest(schema);
    const { eventId } = await seedEvent(t, { capacity: 1 });
    const maya = await seedUser(t, "maya");
    const as = withIdentity(t, maya);

    await as.mutation(api.rsvps.setStatus, { eventId, status: "going" });
    const again = await as.mutation(api.rsvps.setStatus, { eventId, status: "going" });

    expect(again.status).toBe("going");
  });

  it("refuses an RSVP to an unpublished event", async () => {
    const t = convexTest(schema);
    const { eventId } = await seedEvent(t, { status: "draft" });
    const maya = await seedUser(t, "maya");

    await expect(
      withIdentity(t, maya).mutation(api.rsvps.setStatus, { eventId, status: "going" }),
    ).rejects.toThrow(/not open for RSVPs/i);
  });
});

describe("checkIn", () => {
  it("refuses an anonymous caller", async () => {
    const t = convexTest(schema);
    const { eventId } = await seedEvent(t);
    await expect(t.mutation(api.rsvps.checkIn, { eventId })).rejects.toThrow(/not signed in/i);
  });

  it("records an arrival for someone who said they were going", async () => {
    const t = convexTest(schema);
    const { eventId } = await seedEvent(t);
    const maya = await seedUser(t, "maya");
    const as = withIdentity(t, maya);

    await as.mutation(api.rsvps.setStatus, { eventId, status: "going" });
    const { checkedInAt } = await as.mutation(api.rsvps.checkIn, { eventId });

    expect(checkedInAt).toBeGreaterThan(0);
    expect(await as.query(api.rsvps.mine, { eventId })).toMatchObject({ checkedInAt });
  });

  it("admits someone who turns up without RSVPing, because people do", async () => {
    const t = convexTest(schema);
    const { eventId } = await seedEvent(t);
    const walkIn = await seedUser(t, "walkin");
    const as = withIdentity(t, walkIn);

    await as.mutation(api.rsvps.checkIn, { eventId });

    expect(await as.query(api.rsvps.mine, { eventId })).toMatchObject({ status: "going" });
  });

  it("does not move the arrival time when a code is scanned twice", async () => {
    const t = convexTest(schema);
    const { eventId } = await seedEvent(t);
    const maya = await seedUser(t, "maya");
    const as = withIdentity(t, maya);

    const first = await as.mutation(api.rsvps.checkIn, { eventId });
    const second = await as.mutation(api.rsvps.checkIn, { eventId });

    expect(second.checkedInAt).toBe(first.checkedInAt);
  });
});

describe("reading your own RSVPs", () => {
  it("returns null for an anonymous viewer instead of failing", async () => {
    const t = convexTest(schema);
    const { eventId } = await seedEvent(t);
    // An event page has to render for someone who is not signed in.
    expect(await t.query(api.rsvps.mine, { eventId })).toBeNull();
  });

  it("returns nothing for an anonymous viewer's event list", async () => {
    const t = convexTest(schema);
    expect(await t.query(api.rsvps.myEventIds, { status: "going" })).toEqual([]);
  });

  it("never returns another person's RSVP", async () => {
    const t = convexTest(schema);
    const { eventId } = await seedEvent(t);
    const maya = await seedUser(t, "maya");
    const josh = await seedUser(t, "josh");

    await withIdentity(t, maya).mutation(api.rsvps.setStatus, { eventId, status: "going" });

    expect(await withIdentity(t, josh).query(api.rsvps.mine, { eventId })).toBeNull();
    expect(await withIdentity(t, josh).query(api.rsvps.myEventIds, { status: "going" })).toEqual(
      [],
    );
  });

  it("separates saved from going", async () => {
    const t = convexTest(schema);
    const { eventId } = await seedEvent(t);
    const maya = await seedUser(t, "maya");
    const as = withIdentity(t, maya);

    await as.mutation(api.rsvps.setStatus, { eventId, status: "saved" });

    expect(await as.query(api.rsvps.myEventIds, { status: "saved" })).toEqual([eventId]);
    expect(await as.query(api.rsvps.myEventIds, { status: "going" })).toEqual([]);
  });
});
