import { events, getPerson, type IrlEvent, type Person } from "./data";
import { capacityDrops, type CapacityDrop } from "./venues";
import { priceToPence } from "./tickets";

/* ------------------------------------------------------------------
   Plans: the lighter-than-an-event unit.
   "Going to the park Saturday at 2 — anyone want to come?"
   Plus group planning (friends vote on options) and "make me a plan"
   (budget + free time in, an actual evening out).
------------------------------------------------------------------- */

export interface PlanOption {
  id: string;
  label: string;
  detail: string;
  eventId?: string;
  dropId?: string;
  votes: string[]; // person ids
}

export interface Plan {
  id: string;
  emoji: string;
  title: string;
  note: string;
  byId: string; // person id, or "you"
  when: string;
  place: string;
  audience: "connections" | "attendees" | "link";
  inIds: string[]; // person ids who said "I'm in"
  options?: PlanOption[]; // present when it's a group vote
  votingClosesIn?: string;
  /** Say yes by this point or the host counts you out. */
  rsvpBy?: string;
  /** Hours from now that the RSVP window closes (prototype countdown). */
  rsvpInHours?: number;
  /** Rough cost of the whole thing, in pence, to split across whoever's in. */
  costPence?: number;
  costNote?: string;
}

export const plans: Plan[] = [
  {
    id: "park-saturday",
    emoji: "🌳",
    title: "Park, blankets, nothing planned",
    note: "Going to London Fields Saturday at 2. Bringing a speaker and too much bread. Come whenever.",
    byId: "maya",
    when: "Sat · 2:00pm",
    place: "London Fields, E8",
    audience: "connections",
    inIds: ["marcus", "freya"],
    rsvpBy: "Sat 11am",
    rsvpInHours: 20,
    costPence: 2400,
    costNote: "Bread, dips and a crate of something cold",
  },
  {
    id: "arsenal-sunday",
    emoji: "⚽",
    title: "Watching Arsenal Sunday, who's around?",
    note: "Pub with the big screen near mine. Kick off 4:30, I'll get there for 4 to grab a table.",
    byId: "josh",
    when: "Sun · 4:00pm",
    place: "The Eagle, Hackney",
    audience: "connections",
    inIds: ["leo"],
    rsvpBy: "Sun 2pm",
    rsvpInHours: 44,
    costPence: 3600,
    costNote: "Table deposit plus the first round",
  },
  {
    id: "saturday-vote",
    emoji: "🗳️",
    title: "Saturday — someone decide for us",
    note: "Four of us, no plan, everyone keeps saying 'I don't mind'. Vote by Friday night.",
    byId: "freya",
    when: "Sat · evening",
    place: "East London-ish",
    audience: "connections",
    inIds: ["maya", "marcus", "nina"],
    votingClosesIn: "Fri 10pm",
    rsvpBy: "Fri 10pm",
    rsvpInHours: 9,
    costPence: 4800,
    costNote: "Rough guess — whatever we land on",
    options: [
      {
        id: "rooftop",
        label: "Rooftop drinks",
        detail: "Golden hour, Shoreditch",
        eventId: "rooftop-golden-hour",
        votes: ["maya", "nina"],
      },
      {
        id: "bowling",
        label: "Bowling then chips",
        detail: "Two lanes booked at 8",
        votes: ["marcus"],
      },
      {
        id: "games",
        label: "Board game café",
        detail: "Warm, cheap, no queue",
        eventId: "board-game-night",
        votes: [],
      },
      {
        id: "comedy",
        label: "Comedy basement",
        detail: "£8 on the door",
        votes: [],
      },
    ],
  },
];

export function getPlan(id: string) {
  return plans.find((p) => p.id === id);
}

export function planHost(p: Plan): Person | { id: string; name: string; avatar: number } {
  return getPerson(p.byId) ?? { id: "you", name: "You", avatar: 3 };
}

export const PLAN_EMOJIS = ["🌳", "⚽", "🍜", "🎬", "🎧", "🏃", "🍻", "🎲", "☕", "🛶"];

export const PLAN_TEMPLATES = [
  { emoji: "🌳", title: "Park, blankets, nothing planned" },
  { emoji: "🍻", title: "Pub, no agenda" },
  { emoji: "⚽", title: "Watching the match" },
  { emoji: "🏃", title: "Easy morning run" },
  { emoji: "🎬", title: "Cinema, whatever's on" },
  { emoji: "☕", title: "Coffee and a walk" },
];

/* ---------------- RSVP deadlines, splitting, decision lock ---------------- */

/** Head count = people in + you if you've joined. */
export function headCount(plan: Plan, joined: boolean): number {
  return plan.inIds.length + 1 + (joined ? 1 : 0); // + host
}

export interface Split {
  totalPence: number;
  perHead: number;
  heads: number;
  note: string;
}

export function splitCost(plan: Plan, joined: boolean): Split | undefined {
  if (!plan.costPence) return undefined;
  const heads = headCount(plan, joined);
  return {
    totalPence: plan.costPence,
    perHead: Math.ceil(plan.costPence / heads / 10) * 10,
    heads,
    note: plan.costNote ?? "Split evenly across everyone who's in",
  };
}

/** Countdown label for the RSVP window. */
export function rsvpCountdown(
  plan: Plan,
): { label: string; urgent: boolean; closed: boolean } | undefined {
  if (plan.rsvpInHours === undefined) return undefined;
  const h = plan.rsvpInHours;
  if (h <= 0) return { label: "RSVPs closed", urgent: false, closed: true };
  if (h < 1) return { label: `${Math.round(h * 60)} min to say yes`, urgent: true, closed: false };
  if (h < 12) return { label: `${Math.round(h)}h to say yes`, urgent: true, closed: false };
  return { label: `Say yes by ${plan.rsvpBy ?? "the day before"}`, urgent: false, closed: false };
}

/** The option currently winning a vote, if any. */
export function leadingOption(plan: Plan, myVote?: string): PlanOption | undefined {
  if (!plan.options?.length) return undefined;
  return [...plan.options]
    .map((o) => ({ o, n: o.votes.length + (myVote === o.id ? 1 : 0) }))
    .sort((a, b) => b.n - a.n)[0]?.o;
}
