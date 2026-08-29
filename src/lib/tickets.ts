import { events, getEvent, organisers, type IrlEvent } from "@/lib/data";

/* ---------- Ticketing ---------- */

export interface TicketTier {
  id: string;
  name: string;
  price: number; // pence, 0 = free
  blurb: string;
  left: number;
  perks?: string[];
}

export interface RegQuestion {
  id: string;
  label: string;
  hint?: string;
  type: "short" | "choice";
  required: boolean;
  options?: string[];
}

export function priceToPence(price: string): number {
  const m = price.match(/([\d.]+)/);
  if (!m || /free/i.test(price)) return 0;
  return Math.round(parseFloat(m[1]!) * 100);
}

export function money(pence: number): string {
  if (pence === 0) return "Free";
  return `£${(pence / 100).toFixed(2).replace(/\.00$/, "")}`;
}

/** Platform fee: 5% + 40p, only on paid tickets. */
export function feeFor(subtotal: number): number {
  return subtotal === 0 ? 0 : Math.round(subtotal * 0.05) + 40;
}

export function tiersFor(event: IrlEvent): TicketTier[] {
  const base = priceToPence(event.price);
  const seed = event.id.length;
  if (base === 0) {
    return [
      {
        id: "free",
        name: "Free entry",
        price: 0,
        blurb: "Just say you're coming so the host can plan.",
        left: event.spotsLeft || 40 + seed,
      },
    ];
  }
  return [
    {
      id: "standard",
      name: "Standard entry",
      price: base,
      blurb: "Entry for one. Name on the door list.",
      left: event.spotsLeft || 24,
      perks: ["Entry for one", "Event wall access"],
    },
    {
      id: "plus-one",
      name: "You + one",
      price: Math.round(base * 1.8),
      blurb: "Bring someone. Cheaper than two singles.",
      left: Math.max(2, Math.round((event.spotsLeft || 24) / 3)),
      perks: ["Entry for two", "Skip the door queue"],
    },
    {
      id: "supporter",
      name: "Supporter",
      price: base + 1000,
      blurb: "Pays for someone who couldn't otherwise come.",
      left: 5,
      perks: ["Entry for one", "Covers a free spot", "Thanked by the host"],
    },
  ];
}

export function questionsFor(event: IrlEvent): RegQuestion[] {
  const q: RegQuestion[] = [
    {
      id: "first-time",
      label: "First time at one of these?",
      type: "choice",
      required: true,
      options: ["First time", "Been before"],
    },
  ];
  if (/food|supper|dinner/i.test(event.category + event.title)) {
    q.push({
      id: "diet",
      label: "Anything you don't eat?",
      hint: "The kitchen actually reads these.",
      type: "short",
      required: false,
    });
  }
  if (/run|climb/i.test(event.category + event.title)) {
    q.push({
      id: "pace",
      label: "What pace / level are you?",
      type: "choice",
      required: true,
      options: ["Taking it easy", "Middle of the pack", "Fast"],
    });
  }
  q.push({
    id: "arriving",
    label: "Coming alone or with people?",
    hint: "Hosts use this to seat and introduce you.",
    type: "choice",
    required: false,
    options: ["On my own", "With one other", "With a group"],
  });
  return q;
}

export interface Order {
  eventId: string;
  tierId: string;
  tierName: string;
  qty: number;
  subtotal: number;
  fee: number;
  total: number;
  code: string;
  answers: Record<string, string>;
  purchasedAt: string;
}

export function ticketCode(eventId: string): string {
  const seed = eventId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const a = letters[seed % 24]! + letters[(seed * 7) % 24]!;
  const n = String(1000 + ((seed * 31) % 8999));
  return `${a}-${n}`;
}

/* ---------- Organiser money ---------- */

export interface PayoutRow {
  id: string;
  eventTitle: string;
  date: string;
  gross: number;
  fees: number;
  net: number;
  status: "paid" | "scheduled" | "processing";
}

export function payoutsFor(eventIds: string[]): PayoutRow[] {
  const past: PayoutRow[] = [
    {
      id: "p-3",
      eventTitle: "Long Table Supper Club · Vol. 14",
      date: "12 Aug",
      gross: 63000,
      fees: 3950,
      net: 59050,
      status: "paid",
    },
    {
      id: "p-4",
      eventTitle: "Long Table Supper Club · Vol. 13",
      date: "8 Jul",
      gross: 56000,
      fees: 3520,
      net: 52480,
      status: "paid",
    },
  ];
  const upcoming = eventIds
    .map((id) => getEvent(id))
    .filter((e): e is IrlEvent => !!e && priceToPence(e.price) > 0)
    .map((e, i) => {
      const sold = Math.max(6, Math.round(e.goingCount * 0.6));
      const gross = sold * priceToPence(e.price);
      const fees = feeFor(gross);
      return {
        id: `p-${i}`,
        eventTitle: e.title,
        date: e.dateLabel.split("·")[0]!.trim(),
        gross,
        fees,
        net: gross - fees,
        status: (i === 0 ? "processing" : "scheduled") as PayoutRow["status"],
      };
    });
  return [...upcoming, ...past];
}

/* ---------- Admin platform ---------- */

export interface PlatformStat {
  label: string;
  value: string;
  delta: string;
  good: boolean;
}

export const platformStats: PlatformStat[] = [
  { label: "Events live this week", value: "412", delta: "+18%", good: true },
  { label: "People who actually showed", value: "9,214", delta: "+24%", good: true },
  { label: "Show-up rate", value: "78%", delta: "+3pts", good: true },
  { label: "Walls claimed", value: "6,180", delta: "+31%", good: true },
  { label: "New organisers", value: "96", delta: "+12%", good: true },
  { label: "Reports per 1k guests", value: "1.4", delta: "-0.3", good: true },
];

export type ReportKind = "event" | "person" | "photo";

export interface ModerationItem {
  id: string;
  kind: ReportKind;
  subject: string;
  reason: string;
  detail: string;
  reports: number;
  age: string;
  severity: "high" | "medium" | "low";
}

export const moderationQueue: ModerationItem[] = [
  {
    id: "m1",
    kind: "event",
    subject: "Crypto Rooftop Mixer · Canary Wharf",
    reason: "Suspected scam / paid promotion",
    detail: "Listing pushes an off-platform payment link and copies photos from another venue.",
    reports: 7,
    age: "18m",
    severity: "high",
  },
  {
    id: "m2",
    kind: "person",
    subject: "Guest account · @dl_1994",
    reason: "Harassment in an event chat",
    detail: "Three separate guests reported unsolicited messages after the Peckham gallery late.",
    reports: 3,
    age: "1h",
    severity: "high",
  },
  {
    id: "m3",
    kind: "photo",
    subject: "Photo on Neon Market Food Crawl wall",
    reason: "Someone asked to be removed",
    detail: "Untagged guest requested takedown. Auto-blurred pending review.",
    reports: 1,
    age: "3h",
    severity: "medium",
  },
  {
    id: "m4",
    kind: "event",
    subject: "Sunday Sound Bath · Hackney",
    reason: "Wrong category",
    detail: "Filed under Nightlife, clearly a wellness event. Low risk, recategorise.",
    reports: 1,
    age: "6h",
    severity: "low",
  },
];

export interface VerificationItem {
  id: string;
  name: string;
  avatar: number;
  events: number;
  showRate: number;
  rating: number;
  note: string;
}

export const verificationQueue: VerificationItem[] = [
  {
    id: "priya",
    name: "Priya",
    avatar: 2,
    events: 6,
    showRate: 81,
    rating: 4.7,
    note: "Gallery lates in Peckham. ID checked, venue letter on file.",
  },
  {
    id: "leo",
    name: "Leo",
    avatar: 5,
    events: 9,
    showRate: 74,
    rating: 4.6,
    note: "Bouldering socials. Waiting on gym partnership confirmation.",
  },
  {
    id: "freya",
    name: "Freya",
    avatar: 6,
    events: 12,
    showRate: 88,
    rating: 4.7,
    note: "Board game takeovers. Strong repeat attendance.",
  },
];

export const verifiedOrganisers = organisers.filter((o) => o.verified);

export interface CityRow {
  city: string;
  events: number;
  guests: number;
  density: number; // 0-100 scene density
}

export const cityRows: CityRow[] = [
  { city: "London · East", events: 148, guests: 3820, density: 92 },
  { city: "London · South", events: 96, guests: 2140, density: 71 },
  { city: "London · North", events: 84, guests: 1760, density: 63 },
  { city: "Manchester", events: 51, guests: 980, density: 44 },
  { city: "Bristol", events: 33, guests: 514, density: 29 },
];

export const paidEvents = events.filter((e) => priceToPence(e.price) > 0);
