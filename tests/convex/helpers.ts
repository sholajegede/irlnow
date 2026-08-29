import type { convexTest } from "convex-test";
import type { Id } from "../../convex/_generated/dataModel";

type TestConvex = ReturnType<typeof convexTest>;

export interface SeedEventOptions {
  slug?: string;
  capacity?: number;
  status?: "draft" | "published" | "cancelled";
  visibility?: "public" | "unlisted";
  startsAt?: number;
  interests?: string[];
}

const HOUR = 3_600_000;

/** An organiser and one event, returning the ids the tests act on. */
export async function seedEvent(
  t: TestConvex,
  options: SeedEventOptions = {},
): Promise<{ eventId: Id<"events">; organiserId: Id<"organisers"> }> {
  return await t.run(async (ctx) => {
    const now = Date.now();
    const organiserId = await ctx.db.insert("organisers", {
      name: "Test Organiser",
      avatarSeed: 0,
      verified: false,
      createdAt: now,
    });

    const startsAt = options.startsAt ?? now + 24 * HOUR;
    const eventId = await ctx.db.insert("events", {
      slug: options.slug ?? "test-event",
      title: "Test Event",
      description: "An event for tests.",
      startsAt,
      endsAt: startsAt + 3 * HOUR,
      timezone: "Europe/London",
      place: { name: "Test Venue", area: "Shoreditch", lat: 51.5265, lng: -0.0784 },
      priceMinor: 0,
      currency: "GBP",
      ...(options.capacity !== undefined && { capacity: options.capacity }),
      organiserId,
      category: "Food & drink",
      interests: options.interests ?? ["food"],
      coverKey: "supper",
      vibes: [],
      status: options.status ?? "published",
      visibility: options.visibility ?? "public",
      createdAt: now,
      updatedAt: now,
    });

    return { eventId, organiserId };
  });
}

export interface SeedUser {
  userId: Id<"users">;
  kindeId: string;
}

export interface SeedUserOptions {
  visibility?: "public" | "attendees" | "connections" | "private";
  interests?: string[];
  withProfile?: boolean;
}

/** A user and, unless told otherwise, the profile that makes them visible. */
export async function seedUser(
  t: TestConvex,
  key: string,
  options: SeedUserOptions = {},
): Promise<SeedUser> {
  const kindeId = `kinde|${key}`;
  const userId = await t.run(async (ctx) => {
    const now = Date.now();
    const id = await ctx.db.insert("users", {
      kindeId,
      email: `${key}@example.invalid`,
      name: key,
      createdAt: now,
      lastSeenAt: now,
    });

    if (options.withProfile !== false) {
      await ctx.db.insert("profiles", {
        userId: id,
        displayName: key,
        avatarSeed: 0,
        interests: options.interests ?? ["food"],
        city: "London",
        openToMeeting: false,
        visibility: options.visibility ?? "attendees",
      });
    }
    return id;
  });

  return { userId, kindeId };
}

/**
 * Act as a signed-in user.
 *
 * `subject` is what convex/auth.ts matches on, so this mirrors exactly what a
 * verified Kinde JWT provides — and nothing more.
 */
export function withIdentity(t: TestConvex, user: SeedUser) {
  return t.withIdentity({ subject: user.kindeId });
}
