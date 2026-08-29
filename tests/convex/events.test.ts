import { describe, expect, it } from "vitest";
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { api } from "../../convex/_generated/api";
import { seedEvent, seedUser, withIdentity } from "./helpers";

const HOUR = 3_600_000;

/* ------------------------------------------------------------------
   Discovery must work without a session.

   Authentication is never the front door: a visitor sees what is on and
   who is going before anything asks who they are.
------------------------------------------------------------------- */

describe("listUpcoming", () => {
  it("answers an anonymous caller", async () => {
    const t = convexTest(schema);
    await seedEvent(t, { slug: "tonight" });

    const events = await t.query(api.events.listUpcoming, {});
    expect(events).toHaveLength(1);
    expect(events[0]!.slug).toBe("tonight");
  });

  it("excludes drafts", async () => {
    const t = convexTest(schema);
    await seedEvent(t, { slug: "draft", status: "draft" });
    expect(await t.query(api.events.listUpcoming, {})).toEqual([]);
  });

  it("excludes cancelled events", async () => {
    const t = convexTest(schema);
    await seedEvent(t, { slug: "off", status: "cancelled" });
    expect(await t.query(api.events.listUpcoming, {})).toEqual([]);
  });

  it("excludes unlisted events, which are link-only", async () => {
    const t = convexTest(schema);
    await seedEvent(t, { slug: "secret", visibility: "unlisted" });
    expect(await t.query(api.events.listUpcoming, {})).toEqual([]);
  });

  it("excludes events that have already started", async () => {
    const t = convexTest(schema);
    await seedEvent(t, { slug: "yesterday", startsAt: Date.now() - 24 * HOUR });
    expect(await t.query(api.events.listUpcoming, {})).toEqual([]);
  });

  it("returns events soonest first", async () => {
    const t = convexTest(schema);
    const now = Date.now();
    await seedEvent(t, { slug: "later", startsAt: now + 72 * HOUR });
    await seedEvent(t, { slug: "sooner", startsAt: now + 2 * HOUR });

    const slugs = (await t.query(api.events.listUpcoming, {})).map((e) => e.slug);
    expect(slugs).toEqual(["sooner", "later"]);
  });

  it("respects the limit", async () => {
    const t = convexTest(schema);
    const now = Date.now();
    for (let i = 0; i < 5; i++) {
      await seedEvent(t, { slug: `e${i}`, startsAt: now + (i + 1) * HOUR });
    }
    expect(await t.query(api.events.listUpcoming, { limit: 2 })).toHaveLength(2);
  });

  it("stores money as integer minor units, not a display string", async () => {
    const t = convexTest(schema);
    await seedEvent(t);
    const event = (await t.query(api.events.listUpcoming, {}))[0]!;

    expect(typeof event.priceMinor).toBe("number");
    expect(event.currency).toBe("GBP");
  });

  it("stores a real timestamp, not a label like 'Tonight · 7:30pm'", async () => {
    const t = convexTest(schema);
    const startsAt = Date.now() + 5 * HOUR;
    await seedEvent(t, { startsAt });

    expect((await t.query(api.events.listUpcoming, {}))[0]!.startsAt).toBe(startsAt);
  });
});

describe("getBySlug", () => {
  it("resolves a published event for an anonymous caller", async () => {
    const t = convexTest(schema);
    await seedEvent(t, { slug: "jazz-late" });
    expect(await t.query(api.events.getBySlug, { slug: "jazz-late" })).toMatchObject({
      slug: "jazz-late",
    });
  });

  it("resolves an unlisted event, which is reachable by link", async () => {
    const t = convexTest(schema);
    await seedEvent(t, { slug: "secret", visibility: "unlisted" });
    expect(await t.query(api.events.getBySlug, { slug: "secret" })).not.toBeNull();
  });

  it("does not resolve a draft", async () => {
    const t = convexTest(schema);
    await seedEvent(t, { slug: "draft", status: "draft" });
    expect(await t.query(api.events.getBySlug, { slug: "draft" })).toBeNull();
  });

  it("returns null for an unknown slug rather than throwing", async () => {
    const t = convexTest(schema);
    expect(await t.query(api.events.getBySlug, { slug: "nope" })).toBeNull();
  });
});

/* ------------------------------------------------------------------
   The roster is the only route by which one person becomes visible to
   another. There is deliberately no query that lists users, so these
   tests are what stop IRL NOW becoming a stranger-browsing app.
------------------------------------------------------------------- */

describe("roster", () => {
  it("shows who is going, to an anonymous caller", async () => {
    const t = convexTest(schema);
    const { eventId } = await seedEvent(t);
    const maya = await seedUser(t, "maya");
    await withIdentity(t, maya).mutation(api.rsvps.setStatus, { eventId, status: "going" });

    const roster = await t.query(api.events.roster, { eventId });
    expect(roster.map((r) => r.displayName)).toEqual(["maya"]);
  });

  it("only includes people who said they are going", async () => {
    const t = convexTest(schema);
    const { eventId } = await seedEvent(t);
    const going = await seedUser(t, "going-person");
    const saved = await seedUser(t, "saved-person");

    await withIdentity(t, going).mutation(api.rsvps.setStatus, { eventId, status: "going" });
    await withIdentity(t, saved).mutation(api.rsvps.setStatus, { eventId, status: "saved" });

    const roster = await t.query(api.events.roster, { eventId });
    expect(roster.map((r) => r.displayName)).toEqual(["going-person"]);
  });

  it("drops someone who cancels", async () => {
    const t = convexTest(schema);
    const { eventId } = await seedEvent(t);
    const maya = await seedUser(t, "maya");
    const as = withIdentity(t, maya);

    await as.mutation(api.rsvps.setStatus, { eventId, status: "going" });
    await as.mutation(api.rsvps.setStatus, { eventId, status: "cancelled" });

    expect(await t.query(api.events.roster, { eventId })).toEqual([]);
  });

  /** Privacy is enforced on the server. A client cannot be trusted to filter. */
  it("hides a private profile", async () => {
    const t = convexTest(schema);
    const { eventId } = await seedEvent(t);
    const hidden = await seedUser(t, "hidden", { visibility: "private" });
    const shown = await seedUser(t, "shown", { visibility: "public" });

    for (const user of [hidden, shown]) {
      await withIdentity(t, user).mutation(api.rsvps.setStatus, { eventId, status: "going" });
    }

    const names = (await t.query(api.events.roster, { eventId })).map((r) => r.displayName);
    expect(names).toEqual(["shown"]);
  });

  it("hides a connections-only profile from people who are not connections", async () => {
    const t = convexTest(schema);
    const { eventId } = await seedEvent(t);
    const friendsOnly = await seedUser(t, "friends-only", { visibility: "connections" });
    await withIdentity(t, friendsOnly).mutation(api.rsvps.setStatus, { eventId, status: "going" });

    expect(await t.query(api.events.roster, { eventId })).toEqual([]);
  });

  it("omits someone with no profile, who has nothing to show", async () => {
    const t = convexTest(schema);
    const { eventId } = await seedEvent(t);
    const ghost = await seedUser(t, "ghost", { withProfile: false });
    await withIdentity(t, ghost).mutation(api.rsvps.setStatus, { eventId, status: "going" });

    expect(await t.query(api.events.roster, { eventId })).toEqual([]);
  });

  it("omits the viewer — you are not a stranger you might meet", async () => {
    const t = convexTest(schema);
    const { eventId } = await seedEvent(t);
    const maya = await seedUser(t, "maya");
    const josh = await seedUser(t, "josh");

    for (const user of [maya, josh]) {
      await withIdentity(t, user).mutation(api.rsvps.setStatus, { eventId, status: "going" });
    }

    const seenByMaya = await withIdentity(t, maya).query(api.events.roster, { eventId });
    expect(seenByMaya.map((r) => r.displayName)).toEqual(["josh"]);
  });

  it("exposes only the fields the product needs, never the email", async () => {
    const t = convexTest(schema);
    const { eventId } = await seedEvent(t);
    const maya = await seedUser(t, "maya");
    await withIdentity(t, maya).mutation(api.rsvps.setStatus, { eventId, status: "going" });

    const entry = (await t.query(api.events.roster, { eventId }))[0]!;
    expect(Object.keys(entry).sort()).toEqual(
      ["avatarSeed", "displayName", "goingSolo", "interests", "userId"].sort(),
    );
    expect(JSON.stringify(entry)).not.toContain("example.invalid");
  });

  it("surfaces who is coming alone, which drives 'going solo' copy", async () => {
    const t = convexTest(schema);
    const { eventId } = await seedEvent(t);
    const solo = await seedUser(t, "solo");

    await withIdentity(t, solo).mutation(api.rsvps.setStatus, {
      eventId,
      status: "going",
      goingSolo: true,
    });

    expect((await t.query(api.events.roster, { eventId }))[0]!.goingSolo).toBe(true);
  });
});
