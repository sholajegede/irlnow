import { v, type Infer } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { currentUser, requireUser } from "./auth";

/* ------------------------------------------------------------------
   "I'm Going" — the core social primitive.

   Not merely an RSVP: this relation is what social proof, people
   discovery, attendance and the whole post-event loop are derived from.

   The caller never supplies a user id. Identity comes from the verified
   session, so one account cannot RSVP, cancel or check in as another.
------------------------------------------------------------------- */

export const rsvpStatus = v.union(
  v.literal("saved"),
  v.literal("going"),
  v.literal("waitlist"),
  v.literal("cancelled"),
);

export type RsvpStatus = Infer<typeof rsvpStatus>;

async function findRsvp(
  ctx: MutationCtx,
  eventId: Id<"events">,
  userId: Id<"users">,
): Promise<Doc<"rsvps"> | null> {
  return await ctx.db
    .query("rsvps")
    .withIndex("by_event_and_user", (q) => q.eq("eventId", eventId).eq("userId", userId))
    .unique();
}

async function confirmedCount(ctx: MutationCtx, eventId: Id<"events">): Promise<number> {
  const going = await ctx.db
    .query("rsvps")
    .withIndex("by_event_and_status", (q) => q.eq("eventId", eventId).eq("status", "going"))
    .collect();
  return going.length;
}

/**
 * Set the caller's relationship to an event.
 *
 * One row per person per event, moved between states rather than appended to,
 * so "going" can never be counted twice for the same person.
 *
 * Asking to go to a full event puts the caller on the waitlist instead of
 * failing. Overselling a room is a real-world problem, not a validation error,
 * so capacity is enforced here and never in the client.
 */
export const setStatus = mutation({
  args: {
    eventId: v.id("events"),
    status: rsvpStatus,
    goingSolo: v.optional(v.boolean()),
  },
  returns: v.object({ status: rsvpStatus, goingCount: v.number() }),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");
    if (event.status !== "published") throw new Error("This event is not open for RSVPs");

    const existing = await findRsvp(ctx, args.eventId, user._id);
    const now = Date.now();

    let status = args.status;
    if (status === "going" && existing?.status !== "going" && event.capacity !== undefined) {
      const count = await confirmedCount(ctx, args.eventId);
      if (count >= event.capacity) status = "waitlist";
    }

    const goingSolo = args.goingSolo ?? existing?.goingSolo ?? false;

    if (existing) {
      await ctx.db.patch(existing._id, { status, goingSolo, updatedAt: now });
    } else {
      await ctx.db.insert("rsvps", {
        eventId: args.eventId,
        userId: user._id,
        status,
        goingSolo,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { status, goingCount: await confirmedCount(ctx, args.eventId) };
  },
});

/**
 * Record that someone actually walked through the door.
 *
 * Kept separate from `status` because intent and attendance are different
 * facts, and the post-event loop — walls, memories, who you met — must be
 * driven by attendance rather than by who said they would come.
 */
export const checkIn = mutation({
  args: { eventId: v.id("events") },
  returns: v.object({ checkedInAt: v.number() }),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const existing = await findRsvp(ctx, args.eventId, user._id);
    const now = Date.now();

    // Turning up without having RSVP'd is normal — people find events at the
    // door. Record it as an attendance rather than rejecting them.
    if (!existing) {
      await ctx.db.insert("rsvps", {
        eventId: args.eventId,
        userId: user._id,
        status: "going",
        goingSolo: false,
        checkedInAt: now,
        createdAt: now,
        updatedAt: now,
      });
      return { checkedInAt: now };
    }

    // Re-scanning a code must not move the arrival time.
    if (existing.checkedInAt !== undefined) return { checkedInAt: existing.checkedInAt };

    await ctx.db.patch(existing._id, { status: "going", checkedInAt: now, updatedAt: now });
    return { checkedInAt: now };
  },
});

/**
 * The caller's own RSVP for an event, or null.
 *
 * Answers for an anonymous caller with null rather than an error: an event
 * page must render for someone who is not signed in.
 */
export const mine = query({
  args: { eventId: v.id("events") },
  returns: v.union(
    v.object({
      status: rsvpStatus,
      goingSolo: v.boolean(),
      checkedInAt: v.union(v.number(), v.null()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const user = await currentUser(ctx);
    if (!user) return null;

    const rsvp = await ctx.db
      .query("rsvps")
      .withIndex("by_event_and_user", (q) => q.eq("eventId", args.eventId).eq("userId", user._id))
      .unique();
    if (!rsvp) return null;

    return {
      status: rsvp.status,
      goingSolo: rsvp.goingSolo,
      checkedInAt: rsvp.checkedInAt ?? null,
    };
  },
});

/** Event ids the caller has a given relationship to — powers Going and Saved. */
export const myEventIds = query({
  args: { status: rsvpStatus },
  returns: v.array(v.id("events")),
  handler: async (ctx, args): Promise<Id<"events">[]> => {
    const user = await currentUser(ctx);
    if (!user) return [];

    const rows = await ctx.db
      .query("rsvps")
      .withIndex("by_user_and_status", (q) => q.eq("userId", user._id).eq("status", args.status))
      .collect();

    return rows.map((row) => row.eventId);
  },
});
