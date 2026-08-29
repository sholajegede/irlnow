import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/* ------------------------------------------------------------------
   IRL NOW data model — core loop first.

   Scoped deliberately to what the product's central loop needs:

     discover -> identify -> see who's going -> I'm going -> attend

   Messaging, media, plans, ticketing, venues and promotion are not
   modelled here yet. Adding tables nothing reads would be guessing at
   relationships before the loop that uses them exists.

   Two rules shape everything below:

   1. Store truth, format at the edge. Timestamps are epoch millis and
      money is integer minor units — never the display strings the
      prototype used, which had to be regex-parsed back into values.
   2. The social graph derives from attendance. People are reachable
      only through an RSVP to an event, never by browsing a user table.
------------------------------------------------------------------- */

/** Where an event physically happens. Coarse by default; see `docs/ARCHITECTURE.md`. */
export const place = v.object({
  name: v.string(),
  /** Neighbourhood shown in the feed, e.g. "Shoreditch". */
  area: v.string(),
  address: v.optional(v.string()),
  /** Coordinates power distance-to-viewer, which is never stored on the event. */
  lat: v.number(),
  lng: v.number(),
});

/** A host's answer about one access facility. Absent means unanswered, never "no". */
export const accessAnswer = v.union(v.literal("yes"), v.literal("no"), v.literal("unknown"));

export const eventAccess = v.object({
  stepFree: accessAnswer,
  accessibleToilet: accessAnswer,
  seating: accessAnswer,
  quietSpace: accessAnswer,
  hearingLoop: accessAnswer,
  brightEnoughToLipRead: accessAnswer,
  note: v.optional(v.string()),
});

export default defineSchema({
  /**
   * An account, keyed by its Kinde subject.
   *
   * Kinde owns identity; this table exists so application data has something
   * stable to hang off. It holds no credentials.
   */
  users: defineTable({
    /** Kinde's `sub` claim. The only trusted link between a session and a row. */
    kindeId: v.string(),
    email: v.string(),
    /** Kinde's copy of the name; the profile's displayName is what the app shows. */
    name: v.optional(v.string()),
    createdAt: v.number(),
    lastSeenAt: v.number(),
  }).index("by_kinde_id", ["kindeId"]),

  /**
   * The public face of a user.
   *
   * Split from `users` because the two have different visibility: a profile is
   * shown to other people, an account row never is.
   */
  profiles: defineTable({
    userId: v.id("users"),
    displayName: v.string(),
    bio: v.optional(v.string()),
    /** Index into the gradient avatar set until real photo upload exists. */
    avatarSeed: v.number(),
    /** Interest ids, matching `src/lib/data.ts`. Drives feed and people ranking. */
    interests: v.array(v.string()),
    city: v.string(),
    /** ISO date, no year required. Optional: only ever asked for a reason. */
    birthday: v.optional(v.string()),
    /** Open to being approached at events they attend alone. */
    openToMeeting: v.boolean(),
    visibility: v.union(
      v.literal("public"),
      v.literal("attendees"),
      v.literal("connections"),
      v.literal("private"),
    ),
  })
    .index("by_user", ["userId"])
    .index("by_city", ["city"]),

  /**
   * A person or business that publishes events.
   *
   * Nullable `userId`: IRL NOW curates events for organisers who have not
   * signed up yet, then shows them what their attendees experienced. That
   * acquisition path only works if an organiser can exist before an account.
   */
  organisers: defineTable({
    userId: v.optional(v.id("users")),
    name: v.string(),
    blurb: v.optional(v.string()),
    avatarSeed: v.number(),
    verified: v.boolean(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  events: defineTable({
    /** Stable, human-readable id used in share URLs. */
    slug: v.string(),
    title: v.string(),
    description: v.string(),

    /** Epoch millis. `when` buckets like "tonight" are derived, never stored. */
    startsAt: v.number(),
    endsAt: v.number(),
    /** IANA zone, so a London event reads correctly to a viewer elsewhere. */
    timezone: v.string(),

    place,

    /** Integer minor units — 1200 is £12.00. Zero is free. */
    priceMinor: v.number(),
    currency: v.string(),
    /** Absent means uncapped. */
    capacity: v.optional(v.number()),

    organiserId: v.id("organisers"),
    category: v.string(),
    /** Interest ids this event matches on. */
    interests: v.array(v.string()),
    /** Key into the bundled cover images until real uploads exist. */
    coverKey: v.string(),
    vibes: v.array(v.string()),

    /** Host-declared only. Absent means the host has not answered. */
    access: v.optional(eventAccess),

    status: v.union(v.literal("draft"), v.literal("published"), v.literal("cancelled")),
    /** `unlisted` is reachable by link but never appears in discovery. */
    visibility: v.union(v.literal("public"), v.literal("unlisted")),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_organiser", ["organiserId"])
    // Discovery's main read: upcoming published events in start order.
    .index("by_status_and_start", ["status", "startsAt"])
    .index("by_area_and_start", ["place.area", "startsAt"]),

  /**
   * Someone's relationship to an event. The single most important table here:
   * social proof, people discovery, attendance and the post-event loop all
   * derive from it.
   *
   * One row per person per event; `status` moves, rather than a row per action.
   */
  rsvps: defineTable({
    eventId: v.id("events"),
    userId: v.id("users"),
    status: v.union(
      v.literal("saved"),
      v.literal("going"),
      v.literal("waitlist"),
      v.literal("cancelled"),
    ),
    /** Coming alone and open to meeting people. Powers "6 people going solo". */
    goingSolo: v.boolean(),
    /** Set when they actually walked through the door — intent is not attendance. */
    checkedInAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    // Enforces one row per person per event, and answers "am I going?".
    .index("by_event_and_user", ["eventId", "userId"])
    // "Who's going?" — the roster read behind every social-proof surface.
    .index("by_event_and_status", ["eventId", "status"])
    // "What am I going to?" — the Going tab.
    .index("by_user_and_status", ["userId", "status"]),
});
