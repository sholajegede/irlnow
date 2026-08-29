import { getEvent } from "./data";
import type { Broadcast } from "./store";

/* ------------------------------------------------------------------
   Attendee inbox — host broadcasts, per event.
   Seeded deterministically so the demo always has something to read,
   then merged with anything the host actually sent in this session.
------------------------------------------------------------------- */

export interface InboxMessage {
  id: string;
  eventId: string;
  eventTitle: string;
  host: string;
  text: string;
  when: string;
  urgent: boolean;
  scheduled: boolean;
  scheduledFor?: string | undefined;
  seeded: boolean;
}

const SEEDS: { text: string; when: string; urgent: boolean }[] = [
  {
    text: "Door info: use the side entrance to the left of the main door. Show your ticket QR and you're straight in.",
    when: "2h ago",
    urgent: false,
  },
  {
    text: "Small venue change — we've moved to the ground floor bar in the same building. Rain forecast, so we're staying dry.",
    when: "5h ago",
    urgent: true,
  },
  {
    text: "We start properly at 19:00 but come early if you actually want to meet people. There'll be someone on the door from 18:30.",
    when: "yesterday",
    urgent: false,
  },
];

function hash(s: string): number {
  return s.split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 5);
}

/** Seeded host updates for one event. */
export function seededMessages(eventId: string): InboxMessage[] {
  const event = getEvent(eventId);
  if (!event) return [];
  const n = 1 + (hash(eventId) % 3);
  return SEEDS.slice(0, n).map((s, i) => ({
    id: `seed-${eventId}-${i}`,
    eventId,
    eventTitle: event.title,
    host: event.host,
    text: s.text,
    when: s.when,
    urgent: s.urgent,
    scheduled: false,
    seeded: true,
  }));
}

/** All host updates for the events you're part of, newest first. */
export function inboxMessages(eventIds: string[], sent: Broadcast[]): InboxMessage[] {
  const live: InboxMessage[] = sent.map((b) => {
    const event = getEvent(b.eventId);
    return {
      id: b.id,
      eventId: b.eventId,
      eventTitle: event?.title ?? b.eventId,
      host: event?.host ?? "Host",
      text: b.text,
      when: b.when,
      urgent: b.urgent,
      scheduled: Boolean(b.scheduled),
      scheduledFor: b.scheduledFor,
      seeded: false,
    };
  });
  const seeded = eventIds.flatMap((id) => seededMessages(id));
  return [...live, ...seeded];
}

/** Group messages by event for the inbox list. */
export interface InboxThread {
  eventId: string;
  eventTitle: string;
  host: string;
  messages: InboxMessage[];
  latest: InboxMessage;
  urgent: boolean;
}

export function inboxThreads(eventIds: string[], sent: Broadcast[]): InboxThread[] {
  const all = inboxMessages(eventIds, sent);
  const byEvent = new Map<string, InboxMessage[]>();
  for (const m of all) {
    const list = byEvent.get(m.eventId) ?? [];
    list.push(m);
    byEvent.set(m.eventId, list);
  }
  return [...byEvent.entries()]
    .map(([eventId, messages]) => ({
      eventId,
      eventTitle: messages[0]!.eventTitle,
      host: messages[0]!.host,
      messages,
      latest: messages[0]!,
      urgent: messages.some((m) => m.urgent && !m.scheduled),
    }))
    .sort((a, b) => Number(b.urgent) - Number(a.urgent));
}
