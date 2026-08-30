/**
 * Stand-in for the generated Convex API.
 *
 * The real one is produced by `convex dev` and is a runtime object of
 * function references. Tests never reach a deployment — they drive the
 * components through mocked `useQuery`/`useMutation` — so all these need to
 * be is stable, distinguishable identities.
 */
export const api = {
  events: {
    listUpcoming: "events:listUpcoming",
    getBySlug: "events:getBySlug",
    roster: "events:roster",
  },
  rsvps: {
    setStatus: "rsvps:setStatus",
    checkIn: "rsvps:checkIn",
    mine: "rsvps:mine",
    myEventIds: "rsvps:myEventIds",
  },
} as const;
