import { v, type Infer } from "convex/values";
import { query, type QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { eventAccess, place } from "./schema";
import { currentUser } from "./auth";

/* ------------------------------------------------------------------
   Event reads.

   Every query here answers correctly for an anonymous caller. Discovery
   is the front door of the product and must never require a session —
   see docs/ARCHITECTURE.md.
------------------------------------------------------------------- */

/**
 * What the feed and event pages are given.
 *
 * Declared as a validator rather than a bare TypeScript type so the shape is
 * enforced at runtime too: a field accidentally added to a handler cannot leak
 * out of the API without being declared here first.
 */
export const publicEvent = v.object({
  id: v.id("events"),
  slug: v.string(),
  title: v.string(),
  description: v.string(),
  startsAt: v.number(),
  endsAt: v.number(),
  timezone: v.string(),
  place,
  priceMinor: v.number(),
  currency: v.string(),
  capacity: v.optional(v.number()),
  category: v.string(),
  interests: v.array(v.string()),
  coverKey: v.string(),
  vibes: v.array(v.string()),
  access: v.optional(eventAccess),
  organiser: v.object({
    id: v.id("organisers"),
    name: v.string(),
    avatarSeed: v.number(),
    verified: v.boolean(),
  }),
  /** Confirmed attendees. The number every social-proof surface is built on. */
  goingCount: v.number(),
  /** Remaining spots, or null when the event is uncapped. */
  spotsLeft: v.union(v.number(), v.null()),
});

export type PublicEvent = Infer<typeof publicEvent>;

async function goingCount(ctx: QueryCtx, eventId: Id<"events">): Promise<number> {
  const going = await ctx.db
    .query("rsvps")
    .withIndex("by_event_and_status", (q) => q.eq("eventId", eventId).eq("status", "going"))
    .collect();
  return going.length;
}

async function toPublicEvent(ctx: QueryCtx, event: Doc<"events">): Promise<PublicEvent | null> {
  const organiser = await ctx.db.get(event.organiserId);
  if (!organiser) return null;

  const count = await goingCount(ctx, event._id);

  return {
    id: event._id,
    slug: event.slug,
    title: event.title,
    description: event.description,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    timezone: event.timezone,
    place: event.place,
    priceMinor: event.priceMinor,
    currency: event.currency,
    ...(event.capacity !== undefined && { capacity: event.capacity }),
    category: event.category,
    interests: event.interests,
    coverKey: event.coverKey,
    vibes: event.vibes,
    ...(event.access !== undefined && { access: event.access }),
    organiser: {
      id: organiser._id,
      name: organiser.name,
      avatarSeed: organiser.avatarSeed,
      verified: organiser.verified,
    },
    goingCount: count,
    spotsLeft: event.capacity === undefined ? null : Math.max(0, event.capacity - count),
  };
}

/**
 * Published, public events that have not started, soonest first.
 *
 * Ranking deliberately happens on the client via `lib/discovery/ranking.ts`:
 * it needs the viewer's interests and connections, and keeping one ranking
 * implementation is worth more than ranking in the database.
 */
export const listUpcoming = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(publicEvent),
  handler: async (ctx, args): Promise<PublicEvent[]> => {
    const events = await ctx.db
      .query("events")
      .withIndex("by_status_and_start", (q) =>
        q.eq("status", "published").gte("startsAt", Date.now()),
      )
      .take(args.limit ?? 50);

    const visible = events.filter((event) => event.visibility === "public");
    const hydrated = await Promise.all(visible.map((event) => toPublicEvent(ctx, event)));
    return hydrated.filter((event): event is PublicEvent => event !== null);
  },
});

/**
 * One event by its share slug.
 *
 * Unlisted events resolve here on purpose: they are reachable by anyone with
 * the link, they just never appear in discovery. Draft and cancelled events
 * do not resolve.
 */
export const getBySlug = query({
  args: { slug: v.string() },
  returns: v.union(publicEvent, v.null()),
  handler: async (ctx, args): Promise<PublicEvent | null> => {
    const event = await ctx.db
      .query("events")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!event || event.status !== "published") return null;
    return await toPublicEvent(ctx, event);
  },
});

/** A person visible on an event roster. Intentionally minimal. */
export const rosterEntry = v.object({
  userId: v.id("users"),
  displayName: v.string(),
  avatarSeed: v.number(),
  interests: v.array(v.string()),
  bio: v.optional(v.string()),
  goingSolo: v.boolean(),
});

export type RosterEntry = Infer<typeof rosterEntry>;

/**
 * Who is going to an event.
 *
 * This is the only route by which one person becomes visible to another:
 * there is deliberately no query that lists users. Profiles set to
 * `connections` or `private` are excluded, and the caller's own row is always
 * omitted — you are not a stranger you might meet.
 */
export const roster = query({
  args: { eventId: v.id("events"), limit: v.optional(v.number()) },
  returns: v.array(rosterEntry),
  handler: async (ctx, args): Promise<RosterEntry[]> => {
    const viewer = await currentUser(ctx);

    const going = await ctx.db
      .query("rsvps")
      .withIndex("by_event_and_status", (q) => q.eq("eventId", args.eventId).eq("status", "going"))
      .take(args.limit ?? 100);

    const entries: RosterEntry[] = [];
    for (const rsvp of going) {
      if (viewer && rsvp.userId === viewer._id) continue;

      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_user", (q) => q.eq("userId", rsvp.userId))
        .unique();

      // No profile means nothing to show. Visibility is enforced here rather
      // than in the client, which cannot be trusted to filter.
      if (!profile) continue;
      if (profile.visibility === "private" || profile.visibility === "connections") continue;

      entries.push({
        userId: rsvp.userId,
        displayName: profile.displayName,
        avatarSeed: profile.avatarSeed,
        interests: profile.interests,
        ...(profile.bio !== undefined && { bio: profile.bio }),
        goingSolo: rsvp.goingSolo,
      });
    }
    return entries;
  },
});
