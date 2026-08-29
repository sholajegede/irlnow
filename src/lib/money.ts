import { getEvent } from "@/lib/data";
import { money, priceToPence } from "@/lib/tickets";
import { capacityDrops, myVenue, dropSpend } from "@/lib/venues";

/* ------------------------------------------------------------------
   Monetisation layer (all figures are mock/demo data).
   Three revenue lines:
     1. Consumer membership  — IRL NOW+
     2. Organiser promotion  — paid reach for an event
     3. Venue demand         — pay-per-attendee, invoiced weekly
------------------------------------------------------------------- */

/* ---------------- 1. Membership ---------------- */

export type MembershipPlan = "monthly" | "yearly";

export interface Membership {
  plan: MembershipPlan;
  startedAt: string;
  renewsOn: string;
}

export const MEMBERSHIP_PRICES: Record<MembershipPlan, number> = {
  monthly: 599,
  yearly: 4900,
};

export const MEMBERSHIP_PERKS = [
  {
    id: "early",
    title: "12-hour early access",
    blurb: "See spots on popular events half a day before everyone else.",
  },
  {
    id: "waitlist",
    title: "Priority on waitlists",
    blurb: "When someone drops out, members get the hold offer first.",
  },
  {
    id: "storage",
    title: "Unlimited memory storage",
    blurb: "Full-resolution photo packs from every wall you were on, kept forever.",
  },
  {
    id: "fees",
    title: "No booking fees",
    blurb: "The 5% + 40p ticket fee is waived on every paid event you join.",
  },
  {
    id: "drops",
    title: "First look at venue drops",
    blurb: "Spontaneous offers near you land in your feed before general release.",
  },
  {
    id: "guest",
    title: "One free +1 a month",
    blurb: "Bring someone to a paid event without paying twice.",
  },
];

export function memberSavings(paidEventsJoined: number, dropsClaimed: number): number {
  return paidEventsJoined * 155 + dropsClaimed * 400;
}

export function renewalDate(plan: MembershipPlan, from = new Date()): string {
  const d = new Date(from);
  if (plan === "monthly") d.setMonth(d.getMonth() + 1);
  else d.setFullYear(d.getFullYear() + 1);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/* ---------------- 2. Promoted events ---------------- */

export interface Boost {
  eventId: string;
  budget: number; // pence
  audience: BoostAudience;
  days: number;
  startedAt: string;
}

export type BoostAudience = "nearby" | "interest" | "returning";

export const BOOST_BUDGETS = [1500, 3000, 6000, 12000];

export const BOOST_AUDIENCES: { id: BoostAudience; label: string; blurb: string; strength: number }[] = [
  {
    id: "nearby",
    label: "People nearby",
    blurb: "Anyone within a few miles who is deciding what to do.",
    strength: 1,
  },
  {
    id: "interest",
    label: "Matching interests",
    blurb: "People who follow this kind of thing. Fewer eyes, better ones.",
    strength: 0.72,
  },
  {
    id: "returning",
    label: "People who came before",
    blurb: "Past guests of yours and of similar events in the area.",
    strength: 0.44,
  },
];

/** Deterministic reach estimate for a budget + audience. */
export function boostReach(budget: number, audience: BoostAudience, days: number): number {
  const a = BOOST_AUDIENCES.find((x) => x.id === audience)!;
  const perPenny = 0.42 * a.strength;
  return Math.round(budget * perPenny * (0.7 + days * 0.1));
}

/** Estimated extra people through the door for a boost. */
export function boostAttendance(budget: number, audience: BoostAudience, days: number): number {
  const a = BOOST_AUDIENCES.find((x) => x.id === audience)!;
  const conversion = 0.006 + a.strength * 0.004;
  return Math.max(1, Math.round(boostReach(budget, audience, days) * conversion));
}

export function boostCostPerGuest(budget: number, audience: BoostAudience, days: number): number {
  return Math.round(budget / boostAttendance(budget, audience, days));
}

/** Does promoting pay for itself at this ticket price? */
export function boostReturn(eventId: string, budget: number, audience: BoostAudience, days: number) {
  const event = getEvent(eventId);
  const price = event ? priceToPence(event.price) : 0;
  const guests = boostAttendance(budget, audience, days);
  const revenue = guests * price;
  return {
    guests,
    revenue,
    net: revenue - budget,
    label: price === 0 ? "Free event — measured in attendance, not revenue" : money(revenue - budget),
  };
}

/* ---------------- 3. Venue invoices ---------------- */

export interface Invoice {
  id: string;
  period: string;
  attendees: number;
  amount: number;
  status: "paid" | "due" | "upcoming";
}

export function venueInvoices(extraClaims: Record<string, number> = {}): Invoice[] {
  const mine = capacityDrops.filter((d) => d.venueId === myVenue.id);
  const thisWeekAttendees = mine.reduce(
    (s, d) => s + d.claimed + (extraClaims[d.id] ?? 0),
    0,
  );
  const thisWeekAmount = mine.reduce((s, d) => s + dropSpend(d, extraClaims[d.id] ?? 0), 0);
  return [
    {
      id: "inv-current",
      period: "This week (in progress)",
      attendees: thisWeekAttendees,
      amount: thisWeekAmount,
      status: "upcoming",
    },
    { id: "inv-33", period: "Week 33 · 11–17 Aug", attendees: 84, amount: 24600, status: "due" },
    { id: "inv-32", period: "Week 32 · 4–10 Aug", attendees: 71, amount: 20300, status: "paid" },
    { id: "inv-31", period: "Week 31 · 28 Jul–3 Aug", attendees: 63, amount: 18100, status: "paid" },
  ];
}

/* ---------------- Platform revenue mix (admin) ---------------- */

export const REVENUE_MIX = [
  { id: "venues", label: "Venue demand", amount: 1842000, share: 0.46 },
  { id: "tickets", label: "Ticket fees", amount: 1204000, share: 0.3 },
  { id: "promotion", label: "Promoted events", amount: 536000, share: 0.13 },
  { id: "membership", label: "Memberships", amount: 442000, share: 0.11 },
];
