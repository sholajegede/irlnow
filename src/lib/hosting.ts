import { events, getEvent, hostedEventIds, type CoverKey, type IrlEvent } from "@/lib/data";
import { organiserQuality, type EventRating } from "@/lib/ratings";

/* ---------- Templates & repeat scheduling ---------- */

export interface HostTemplate {
  id: string;
  name: string;
  type: string;
  title: string;
  description: string;
  time: string;
  location: string;
  cover: CoverKey;
  capacity: number;
  price: string;
  /** Where it came from, shown as a small caption. */
  origin: string;
}

export const starterTemplates: HostTemplate[] = [
  {
    id: "t-supper",
    name: "Long table dinner",
    type: "dinner",
    title: "Long Table Supper",
    description:
      "One long table, sharing courses, twenty people who won't be strangers by dessert. BYOB welcome.",
    time: "19:00",
    location: "Hackney",
    cover: "supper",
    capacity: 20,
    price: "£35",
    origin: "IRL NOW starter",
  },
  {
    id: "t-morning",
    name: "Morning run + coffee",
    type: "meetup",
    title: "Sunrise Run Club",
    description: "5k at whatever pace you've got, coffee after. No one gets dropped.",
    time: "06:45",
    location: "Victoria Park",
    cover: "run",
    capacity: 60,
    price: "Free",
    origin: "IRL NOW starter",
  },
  {
    id: "t-rooftop",
    name: "Golden hour rooftop",
    type: "party",
    title: "Golden Hour Rooftop",
    description:
      "Sunset, a slow set, and the best view in the neighbourhood. Come alone, leave with people.",
    time: "18:30",
    location: "Shoreditch",
    cover: "rooftop",
    capacity: 120,
    price: "£12",
    origin: "IRL NOW starter",
  },
  {
    id: "t-games",
    name: "Board game takeover",
    type: "hangout",
    title: "Board Game Takeover",
    description: "Twelve games on the shelf, teachers on hand, nobody sits out a round.",
    time: "18:00",
    location: "Camden",
    cover: "games",
    capacity: 40,
    price: "£5",
    origin: "IRL NOW starter",
  },
];

export function templateFromEvent(event: IrlEvent): HostTemplate {
  return {
    id: `t-${event.id}`,
    name: event.title,
    type: event.category,
    title: event.title,
    description: event.description,
    time: (event.dateLabel.split("·")[1] ?? "7:00pm").trim(),
    location: event.area,
    cover: event.cover,
    capacity: Math.max(20, Math.round(event.goingCount * 1.2)),
    price: event.price,
    origin: `From ${event.dateLabel} · ${event.goingCount} came`,
  };
}

/** Templates built from the events you've already hosted. */
export function myTemplates(): HostTemplate[] {
  return events.filter((e) => hostedEventIds.includes(e.id)).map(templateFromEvent);
}

export type Cadence = "weekly" | "fortnightly" | "monthly";

export const cadences: { id: Cadence; label: string; every: number }[] = [
  { id: "weekly", label: "Every week", every: 7 },
  { id: "fortnightly", label: "Every two weeks", every: 14 },
  { id: "monthly", label: "Every month", every: 28 },
];

const DAY = 86_400_000;

/** The next few dates for a repeating event, starting from the coming week. */
export function nextDates(
  cadence: Cadence,
  count = 4,
  from = Date.now(),
): { iso: string; label: string }[] {
  const every = cadences.find((c) => c.id === cadence)?.every ?? 7;
  const out: { iso: string; label: string }[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(from + (i + 1) * every * DAY);
    out.push({
      iso: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }),
    });
  }
  return out;
}

/* ---------- Host reputation ---------- */

export type HostTier = "New host" | "Trusted host" | "Verified host" | "Signature host";

export interface Reliability {
  tier: HostTier;
  score: number;
  stars: number;
  reviews: number;
  /** % of people who said they'd come back. */
  returnRate: number;
  /** % of ticket holders who actually turned up. */
  showRate: number;
  onTimeRate: number;
  responseHours: number;
  repeatGuests: number;
  nextTier?: { tier: HostTier; needs: string };
}

function seed(id: string) {
  return id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
}

export function hostReliability(organiserId: string, myRatings: EventRating[]): Reliability {
  const q = organiserQuality(organiserId, myRatings);
  const n = seed(organiserId);
  const showRate = Math.min(0.97, 0.74 + (n % 20) / 100);
  const onTimeRate = Math.min(0.99, 0.8 + (n % 17) / 100);
  const responseHours = 1 + (n % 6);
  const repeatGuests = Math.round(q.reviews * (0.2 + (n % 15) / 100));

  const tier: HostTier =
    q.score >= 92 && q.reviews > 100
      ? "Signature host"
      : q.score >= 84
        ? "Verified host"
        : q.score >= 74
          ? "Trusted host"
          : "New host";

  const nextTier =
    tier === "Signature host"
      ? undefined
      : tier === "Verified host"
        ? {
            tier: "Signature host" as HostTier,
            needs: `${Math.max(1, 101 - q.reviews)} more reviews at this rating`,
          }
        : tier === "Trusted host"
          ? { tier: "Verified host" as HostTier, needs: "Verify your ID and host 2 more events" }
          : { tier: "Trusted host" as HostTier, needs: "Host 3 events with a 4.5+ rating" };

  return {
    tier,
    score: q.score,
    stars: q.stars,
    reviews: q.reviews,
    returnRate: q.returnRate,
    showRate: Math.round(showRate * 100) / 100,
    onTimeRate: Math.round(onTimeRate * 100) / 100,
    responseHours,
    repeatGuests,
    ...(nextTier ? { nextTier } : {}),
  };
}

export interface VerificationStep {
  id: string;
  label: string;
  detail: string;
  minutes: number;
}

export const verificationSteps: VerificationStep[] = [
  {
    id: "email",
    label: "Confirm your email",
    detail: "So guests can reach you if plans change.",
    minutes: 1,
  },
  {
    id: "phone",
    label: "Add a phone number",
    detail: "Used for door problems only. Never shown to guests.",
    minutes: 1,
  },
  {
    id: "id",
    label: "Verify your ID",
    detail: "A photo of a passport or driving licence. Unlocks the verified badge.",
    minutes: 3,
  },
  {
    id: "payout",
    label: "Add payout details",
    detail: "Where ticket money lands after the event.",
    minutes: 2,
  },
  {
    id: "safety",
    label: "Read the safety basics",
    detail: "What to do about capacity, incidents and refusals at the door.",
    minutes: 4,
  },
];

/* ---------- Door mode ---------- */

export interface ArrivalBucket {
  label: string;
  count: number;
}

/** Deterministic arrival curve for the live door view. */
export function arrivalCurve(eventId: string, checkedIn: number): ArrivalBucket[] {
  const n = seed(eventId);
  const weights = [0.34, 0.26, 0.18, 0.12, 0.1].map((w, i) => w + (((n + i * 7) % 7) - 3) / 100);
  const labels = ["First 20m", "20–40m", "40–60m", "1–2h", "Later"];
  return labels.map((label, i) => ({
    label,
    count: Math.max(0, Math.round(checkedIn * weights[i]!)),
  }));
}

/** Codes the door scanner accepts: normal tickets and transferred ones. */
export function normaliseDoorCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export function doorCodeFor(eventId: string, guestId: string): string {
  const n = seed(eventId + guestId);
  return `IRL-${String(n % 10000).padStart(4, "0")}`;
}

export function eventCapacity(event: IrlEvent): number {
  return Math.max(event.goingCount + (event.spotsLeft ?? 0), Math.round(event.goingCount * 1.15));
}

export function hostedEvents(): IrlEvent[] {
  return hostedEventIds.map((id) => getEvent(id)).filter((e): e is IrlEvent => !!e);
}
