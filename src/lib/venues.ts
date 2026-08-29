import { type CoverKey } from "@/lib/data";

/* ------------------------------------------------------------------
   IRL NOW as a demand engine for venues.
   Venues don't buy "event software" — they buy people through the door.
   This layer models pay-per-attendee capacity drops (yield management
   for physical experiences). All figures are mock/demo data.
------------------------------------------------------------------- */

export interface Venue {
  id: string;
  name: string;
  kind: string;
  area: string;
  cover: CoverKey;
  avgSpend: number; // pence a typical guest spends in venue
  rating: number;
  verified: boolean;
}

export const venues: Venue[] = [
  {
    id: "arcade-lane",
    name: "Arcade Lane Kitchen",
    kind: "Restaurant",
    area: "Soho",
    cover: "streetfood",
    avgSpend: 4200,
    rating: 4.6,
    verified: true,
  },
  {
    id: "substation",
    name: "Substation Climbing",
    kind: "Climbing gym",
    area: "Brixton",
    cover: "climb",
    avgSpend: 2200,
    rating: 4.8,
    verified: true,
  },
  {
    id: "blue-room",
    name: "The Blue Room",
    kind: "Jazz bar",
    area: "Dalston",
    cover: "jazz",
    avgSpend: 3100,
    rating: 4.5,
    verified: false,
  },
];

export function getVenue(id: string) {
  return venues.find((v) => v.id === id);
}

/** The venue you're "logged in as" in the demo portal. */
export const myVenue = venues[0]!;

export type DropStatus = "live" | "scheduled" | "filled" | "ended";

export interface CapacityDrop {
  id: string;
  venueId: string;
  title: string;
  offer: string;
  slot: string; // human label, e.g. "Tonight · 7:00pm"
  when: "tonight" | "weekend";
  seats: number;
  claimed: number;
  bid: number; // pence paid to IRL NOW per attendee delivered
  budget: number; // pence cap
  reach: number; // nearby people the drop is shown to
  kind: "eat" | "do" | "drink";
  status: DropStatus;
  area: string;
  cover: CoverKey;
  walkMins: number;
}

export const capacityDrops: CapacityDrop[] = [
  {
    id: "arcade-7pm",
    kind: "eat" as const,
    venueId: "arcade-lane",
    title: "30 empty seats, 7pm",
    offer: "£10 small plate + a drink",
    slot: "Tonight · 7:00pm",
    when: "tonight",
    seats: 30,
    claimed: 19,
    bid: 300,
    budget: 9000,
    reach: 2140,
    status: "live",
    area: "Soho",
    cover: "streetfood",
    walkMins: 12,
  },
  {
    id: "substation-late",
    kind: "do" as const,
    venueId: "substation",
    title: "Late session, 5 spots",
    offer: "Free shoe hire + first climb £6",
    slot: "Tonight · 8:30pm",
    when: "tonight",
    seats: 12,
    claimed: 7,
    bid: 250,
    budget: 3000,
    reach: 1320,
    status: "live",
    area: "Brixton",
    cover: "climb",
    walkMins: 21,
  },
  {
    id: "blue-room-early",
    kind: "drink" as const,
    venueId: "blue-room",
    title: "Free entry before 8pm",
    offer: "No cover charge, house set till 9",
    slot: "Tonight · 7:30pm",
    when: "tonight",
    seats: 40,
    claimed: 34,
    bid: 200,
    budget: 8000,
    reach: 1880,
    status: "live",
    area: "Dalston",
    cover: "jazz",
    walkMins: 25,
  },
  {
    id: "arcade-sun-lunch",
    kind: "eat" as const,
    venueId: "arcade-lane",
    title: "Sunday lunch, 20 covers",
    offer: "Two courses £18",
    slot: "Sun · 1:00pm",
    when: "weekend",
    seats: 20,
    claimed: 4,
    bid: 350,
    budget: 7000,
    reach: 1610,
    status: "scheduled",
    area: "Soho",
    cover: "supper",
    walkMins: 12,
  },
];

export function getDrop(id: string) {
  return capacityDrops.find((d) => d.id === id);
}

export function liveDrops() {
  return capacityDrops.filter((d) => d.status === "live");
}

export function dropsForVenue(venueId: string) {
  return capacityDrops.filter((d) => d.venueId === venueId);
}

export function spotsLeft(d: CapacityDrop, extraClaims = 0) {
  return Math.max(0, d.seats - d.claimed - extraClaims);
}

/** What the venue has spent so far on a drop (pay-per-attendee). */
export function dropSpend(d: CapacityDrop, extraClaims = 0) {
  return Math.min(d.budget, (d.claimed + extraClaims) * d.bid);
}

/** Rough revenue the drop returned, using the venue's average spend. */
export function dropRevenue(d: CapacityDrop, avgSpend: number, extraClaims = 0) {
  return (d.claimed + extraClaims) * avgSpend;
}

export function roiMultiple(d: CapacityDrop, avgSpend: number, extraClaims = 0) {
  const spend = dropSpend(d, extraClaims);
  if (spend === 0) return 0;
  return dropRevenue(d, avgSpend, extraClaims) / spend;
}

/** Estimated attendance for a proposed bid — higher bid = better placement. */
export function estimateAttendance(seats: number, bid: number, reach: number) {
  const rate = Math.min(0.9, 0.12 + (bid / 100) * 0.055);
  return Math.min(seats, Math.round(reach * (rate / 30)));
}

export const BID_PRESETS = [150, 250, 350, 500];
