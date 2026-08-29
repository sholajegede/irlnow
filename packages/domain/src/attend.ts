import { getEvent, type IrlEvent } from "./data";

/* ------------------------------------------------------------------
   Attendee depth: waitlist holds, transfers and plus-ones, calendar
   sync, travel hints and access info. All deterministic from ids so
   the prototype behaves the same on every render.
------------------------------------------------------------------- */

function seed(id: string): number {
  return id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
}

/* ---------------- Waitlist auto-promotion ---------------- */

/** How long a released spot is held for you before it rolls on. */
export const HOLD_MINUTES = 30;

export interface WaitlistHold {
  eventId: string;
  expiresAt: number;
}

export function holdRemaining(expiresAt: number, now: number): string {
  const ms = Math.max(0, expiresAt - now);
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/** People ahead of you who typically drop out — used for the "you're next" copy. */
export function waitlistOdds(eventId: string, position: number): string {
  const s = seed(eventId);
  const pct = Math.min(92, 40 + (s % 45) - position * 4);
  return `${Math.max(15, pct)}% of people in your position got in last time`;
}

/* ---------------- Transfers & plus-ones ---------------- */

export interface TicketTransfer {
  eventId: string;
  toName: string;
  toContact: string;
  code: string;
  claimed: boolean;
}

export interface PlusOne {
  eventId: string;
  name: string;
  contact: string;
}

export function transferCode(eventId: string, toName: string): string {
  const s = seed(eventId + toName);
  return `TX-${((s % 9000) + 1000).toString()}`;
}

/* ---------------- Calendar sync (.ics) ---------------- */

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

/** Turn "Tonight · 7:30pm" / "Sat · 2:00pm" into a concrete Date near today. */
export function eventStart(event: IrlEvent, from = new Date()): Date {
  const timePart = event.dateLabel.split("·")[1]?.trim() ?? "7:00pm";
  const m = timePart.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  let hour = m ? parseInt(m[1]!, 10) : 19;
  const mins = m?.[2] ? parseInt(m[2], 10) : 0;
  const mer = m?.[3]?.toLowerCase();
  if (mer === "pm" && hour < 12) hour += 12;
  if (mer === "am" && hour === 12) hour = 0;

  const d = new Date(from);
  d.setHours(hour, mins, 0, 0);
  if (event.when === "weekend") {
    const daysToSat = (6 - d.getDay() + 7) % 7 || 7;
    d.setDate(d.getDate() + daysToSat);
  } else if (d.getTime() < from.getTime()) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

function icsStamp(d: Date): string {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`
  );
}

export interface IcsOptions {
  /** Host used in the event UID, e.g. "irlnow.app". */
  domain: string;
  /** Link a calendar entry points back to. */
  url: string;
  hours?: number;
}

export function buildIcs(event: IrlEvent, options: IcsOptions): string {
  const hours = options.hours ?? 3;
  const start = eventStart(event);
  const end = new Date(start.getTime() + hours * 3_600_000);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//IRL NOW//EN",
    "BEGIN:VEVENT",
    `UID:${event.id}@${options.domain}`,
    `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART:${icsStamp(start)}`,
    `DTEND:${icsStamp(end)}`,
    `SUMMARY:${event.title}`,
    `LOCATION:${event.location}, ${event.area}`,
    `DESCRIPTION:${event.description.replace(/\n/g, " ")} — hosted by ${event.host}. Details: ${options.url}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Leave soon",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}

/* ---------------- Travel-time estimates ---------------- */

/**
 * Rough journey times, derived from straight-line distance alone.
 *
 * These are arithmetic, not routing: no line names, fares or departure times
 * are claimed, because a specific claim we cannot source is worse than an
 * honest estimate. Swap in a real routing provider to make these exact.
 */
export interface TravelOption {
  mode: "walk" | "cycle" | "transit" | "cab";
  label: string;
  /** Estimated door-to-door minutes. */
  minutes: number;
}

/** Average speeds in minutes per km, including the usual stopping and waiting. */
const MINUTES_PER_KM = { walk: 12, cycle: 4, transit: 3, cab: 2.5 } as const;

/** Fixed overhead per mode: unlocking a bike, waiting on a platform, hailing. */
const OVERHEAD_MINUTES = { walk: 0, cycle: 2, transit: 9, cab: 4 } as const;

export function travelOptions(event: IrlEvent): TravelOption[] {
  const km = parseFloat(event.distance) || 0;
  const estimate = (mode: TravelOption["mode"]) =>
    Math.max(1, Math.round(km * MINUTES_PER_KM[mode]) + OVERHEAD_MINUTES[mode]);

  return [
    { mode: "walk", label: "Walk", minutes: estimate("walk") },
    { mode: "cycle", label: "Cycle", minutes: estimate("cycle") },
    { mode: "transit", label: "Transit", minutes: estimate("transit") },
    { mode: "cab", label: "Cab", minutes: estimate("cab") },
  ];
}

/** When to leave, based on the fastest option plus ten minutes of slack. */
export function leaveBy(event: IrlEvent): { minutes: number; label: string } {
  const fastest = travelOptions(event).reduce((a, b) => (b.minutes < a.minutes ? b : a));
  const start = eventStart(event);
  const leave = new Date(start.getTime() - (fastest.minutes + 10) * 60000);
  const h = leave.getHours();
  const label = `${((h + 11) % 12) + 1}:${pad(leave.getMinutes())}${h >= 12 ? "pm" : "am"}`;
  return { minutes: fastest.minutes, label };
}
