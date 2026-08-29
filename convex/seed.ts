import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { AREA_COORDS, SEED_EVENTS, SEED_ORGANISERS, SEED_PEOPLE } from "./seedData";

/* ------------------------------------------------------------------
   Development seed.

   An internalMutation, so it is not callable from any client — only from
   the CLI or another server function. Seeding is a developer action, not
   a product feature, and must not be reachable from the browser.
------------------------------------------------------------------- */

const TIMEZONE = "Europe/London";
const CITY = "London";

/**
 * Local-time start for an event, `dayOffset` days from now.
 *
 * Uses fixed UTC offsets because Convex runs functions in UTC and the seed
 * only has to land events at a plausible hour, not survive a DST boundary
 * exactly. Real events carry a timezone and a precise `startsAt`.
 */
function startTime(dayOffset: number, hour: number, minute: number): number {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + dayOffset);
  date.setUTCHours(hour, minute, 0, 0);
  return date.getTime();
}

/**
 * Replace the catalogue with sample data.
 *
 * Destructive by design: seeding twice must not produce two of everything.
 * It refuses to run anywhere but a development deployment, so it cannot
 * delete real data.
 */
export const seedDevelopmentData = internalMutation({
  args: {},
  returns: v.object({
    organisers: v.number(),
    users: v.number(),
    events: v.number(),
    rsvps: v.number(),
  }),
  handler: async (ctx) => {
    const deployment = process.env["CONVEX_CLOUD_URL"] ?? "";
    // Belt and braces: internalMutation already blocks client calls, but a
    // seed that wipes tables should also refuse to run against production.
    if (/\bprod\b/.test(process.env["CONVEX_DEPLOYMENT"] ?? "")) {
      throw new Error(`Refusing to seed a production deployment (${deployment})`);
    }

    // A full scan per table is correct here: this wipes the whole catalogue,
    // and a development deployment holds only the small seed set below.
    for (const table of ["rsvps", "events", "profiles", "organisers", "users"] as const) {
      for (const row of await ctx.db.query(table).collect()) {
        await ctx.db.delete(row._id);
      }
    }

    const now = Date.now();

    const organiserIds = new Map<string, Id<"organisers">>();
    for (const organiser of SEED_ORGANISERS) {
      organiserIds.set(
        organiser.key,
        await ctx.db.insert("organisers", {
          name: organiser.name,
          blurb: organiser.blurb,
          avatarSeed: organiser.avatarSeed,
          verified: organiser.verified,
          createdAt: now,
        }),
      );
    }

    const eventIds = new Map<string, Id<"events">>();
    for (const event of SEED_EVENTS) {
      const organiserId = organiserIds.get(event.organiserKey);
      if (!organiserId) throw new Error(`Unknown organiser "${event.organiserKey}"`);

      const coords = AREA_COORDS[event.area];
      if (!coords) throw new Error(`No coordinates for area "${event.area}"`);

      const startsAt = startTime(event.dayOffset, event.hour, event.minute);

      eventIds.set(
        event.slug,
        await ctx.db.insert("events", {
          slug: event.slug,
          title: event.title,
          description: event.description,
          startsAt,
          endsAt: startsAt + event.durationHours * 3_600_000,
          timezone: TIMEZONE,
          place: { name: event.venueName, area: event.area, lat: coords.lat, lng: coords.lng },
          priceMinor: event.priceMinor,
          currency: "GBP",
          ...(event.capacity !== undefined && { capacity: event.capacity }),
          organiserId,
          category: event.category,
          interests: event.interests,
          coverKey: event.coverKey,
          vibes: event.vibes,
          // No access details: the seed does not invent them, and the UI says
          // so honestly. See src/lib/events/access.ts.
          status: "published",
          visibility: "public",
          createdAt: now,
          updatedAt: now,
        }),
      );
    }

    let rsvpCount = 0;
    for (const person of SEED_PEOPLE) {
      const userId = await ctx.db.insert("users", {
        // Sample accounts are namespaced so they can never collide with a real
        // Kinde subject.
        kindeId: `seed|${person.key}`,
        email: `${person.key}@example.invalid`,
        name: person.name,
        createdAt: now,
        lastSeenAt: now,
      });

      await ctx.db.insert("profiles", {
        userId,
        displayName: person.name,
        bio: person.bio,
        avatarSeed: person.avatarSeed,
        interests: person.interests,
        city: CITY,
        openToMeeting: person.goingSolo,
        visibility: "attendees",
      });

      for (const slug of person.going) {
        const eventId = eventIds.get(slug);
        if (!eventId) throw new Error(`"${person.key}" is going to unknown event "${slug}"`);
        await ctx.db.insert("rsvps", {
          eventId,
          userId,
          status: "going",
          goingSolo: person.goingSolo,
          createdAt: now,
          updatedAt: now,
        });
        rsvpCount++;
      }
    }

    return {
      organisers: SEED_ORGANISERS.length,
      users: SEED_PEOPLE.length,
      events: SEED_EVENTS.length,
      rsvps: rsvpCount,
    };
  },
});
