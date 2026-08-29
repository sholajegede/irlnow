import { getEvent, type IrlEvent } from "@/lib/data";

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
  return `TX-${(s % 9000 + 1000).toString()}`;
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

export function buildIcs(event: IrlEvent, hours = 3): string {
  const start = eventStart(event);
  const end = new Date(start.getTime() + hours * 3_600_000);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//IRL NOW//EN",
    "BEGIN:VEVENT",
    `UID:${event.id}@irlnow.app`,
    `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART:${icsStamp(start)}`,
    `DTEND:${icsStamp(end)}`,
    `SUMMARY:${event.title}`,
    `LOCATION:${event.location}, ${event.area}`,
    `DESCRIPTION:${event.description.replace(/\n/g, " ")} — hosted by ${event.host}. Details: irlnow.app/event/${event.id}`,
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

export function downloadIcs(eventId: string): boolean {
  const event = getEvent(eventId);
  if (!event || typeof document === "undefined") return false;
  const blob = new Blob([buildIcs(event)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.id}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return true;
}

/* ---------------- Travel-time hints ---------------- */

export interface TravelOption {
  mode: "walk" | "cycle" | "transit" | "cab";
  label: string;
  minutes: number;
  detail: string;
}

const TUBE = ["Northern line", "Victoria line", "Overground", "Central line", "Elizabeth line"];

export function travelOptions(event: IrlEvent): TravelOption[] {
  const km = parseFloat(event.distance) || 1 + (seed(event.id) % 5);
  const s = seed(event.id);
  return [
    { mode: "walk", label: "Walk", minutes: Math.round(km * 12), detail: "Straightforward, mostly lit streets" },
    { mode: "cycle", label: "Cycle", minutes: Math.round(km * 4) + 2, detail: `Docking station ${1 + (s % 4)} min from the door` },
    {
      mode: "transit",
      label: "Transit",
      minutes: Math.round(km * 3) + 9,
      detail: `${TUBE[s % TUBE.length]} · ${1 + (s % 3)} change${s % 3 === 0 ? "" : "s"}`,
    },
    { mode: "cab", label: "Cab", minutes: Math.round(km * 2.5) + 4, detail: `About £${8 + (s % 9)} at this time` },
  ];
}

/** When to leave, based on the fastest sensible option. */
export function leaveBy(event: IrlEvent): { minutes: number; label: string } {
  const fastest = travelOptions(event).reduce((a, b) => (b.minutes < a.minutes ? b : a));
  const start = eventStart(event);
  const leave = new Date(start.getTime() - (fastest.minutes + 10) * 60000);
  const h = leave.getHours();
  const label = `${((h + 11) % 12) + 1}:${pad(leave.getMinutes())}${h >= 12 ? "pm" : "am"}`;
  return { minutes: fastest.minutes, label };
}

/** Last transport home — the thing people actually worry about. */
export function lastTransport(event: IrlEvent): string {
  const s = seed(event.id);
  return `Last ${TUBE[s % TUBE.length]} home around ${11 + (s % 2)}:${pad((s * 7) % 60)}pm · night buses after`;
}

/* ---------------- Accessibility ---------------- */

export interface AccessInfo {
  stepFree: boolean;
  accessibleToilet: boolean;
  seating: boolean;
  quietSpace: boolean;
  hearingLoop: boolean;
  lowLight: boolean;
  loudMusic: boolean;
  note: string;
}

export function accessInfo(event: IrlEvent): AccessInfo {
  const s = seed(event.id);
  const loud = event.category === "Nightlife" || event.interests.includes("music");
  return {
    stepFree: s % 3 !== 0,
    accessibleToilet: s % 4 !== 0,
    seating: s % 2 === 0 || event.interests.includes("food"),
    quietSpace: s % 5 === 0,
    hearingLoop: s % 6 === 0,
    lowLight: loud || s % 7 === 0,
    loudMusic: loud,
    note:
      s % 3 === 0
        ? "Entrance has two steps and no ramp — message the host and they'll meet you at the side door."
        : "Step-free from the street. Ask at the door if you need a seat kept for you.",
  };
}

export function accessChecklist(event: IrlEvent): { label: string; ok: boolean }[] {
  const a = accessInfo(event);
  return [
    { label: "Step-free access", ok: a.stepFree },
    { label: "Accessible toilet", ok: a.accessibleToilet },
    { label: "Seating available", ok: a.seating },
    { label: "Quiet space", ok: a.quietSpace },
    { label: "Hearing loop", ok: a.hearingLoop },
    { label: "Bright enough to lip-read", ok: !a.lowLight },
  ];
}
