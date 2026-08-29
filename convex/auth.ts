import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

/* ------------------------------------------------------------------
   Identity helpers.

   Identity comes from the verified JWT on the request context and nowhere
   else. A user id passed as an argument is a claim by the caller, not a
   fact, and must never be trusted — that mistake is how one account reads
   or writes another's data.
------------------------------------------------------------------- */

/** The signed-in user, or null when the request is anonymous. */
export async function currentUser(ctx: QueryCtx | MutationCtx): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_kinde_id", (q) => q.eq("kindeId", identity.subject))
    .unique();
}

/**
 * The signed-in user, or a thrown error.
 *
 * Use in every mutation that writes user-owned data. Anonymous discovery is
 * supported by *queries* that tolerate a null user, never by writes.
 */
export async function requireUser(ctx: QueryCtx | MutationCtx): Promise<Doc<"users">> {
  const user = await currentUser(ctx);
  if (!user) throw new Error("Not signed in");
  return user;
}

/** Assert the caller owns this organiser, for host-only writes. */
export async function requireOrganiser(
  ctx: QueryCtx | MutationCtx,
  organiserId: Id<"organisers">,
): Promise<Doc<"organisers">> {
  const user = await requireUser(ctx);
  const organiser = await ctx.db.get(organiserId);
  if (!organiser) throw new Error("Organiser not found");
  if (organiser.userId !== user._id) throw new Error("Not authorised to manage this organiser");
  return organiser;
}

/** Assert the caller may edit this event, i.e. they run the organiser behind it. */
export async function requireEventHost(
  ctx: QueryCtx | MutationCtx,
  eventId: Id<"events">,
): Promise<Doc<"events">> {
  const event = await ctx.db.get(eventId);
  if (!event) throw new Error("Event not found");
  await requireOrganiser(ctx, event.organiserId);
  return event;
}
