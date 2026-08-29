import { getEvent, getPerson, people, type Person } from "./data";

export interface ChatMessage {
  id: string;
  authorId: string; // person id, or "you"
  text: string;
  minutesAgo: number;
  system?: boolean;
}

function hash(s: string): number {
  return s.split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
}

const OPENERS = [
  "Anyone heading from the Overground? Happy to walk over together.",
  "Just so you know the door is round the side, not the main entrance.",
  "First timer here — is it a stand-up thing or are there tables?",
  "Bringing a friend, hope that's alright.",
  "Running 10 mins late, save me a spot!",
  "What's the vibe, dressed up or trainers?",
  "I'll be the one in the yellow jacket, come say hi.",
  "Weather looks decent for once. See you all there.",
];

const HOST_LINES = [
  "Doors at 7:30, we'll start properly around 8. Come early, it's nicer.",
  "Trainers are perfectly fine. It's a warm crowd, no dress code.",
  "There'll be a few of us on the door — just say you're on the list.",
];

/** Deterministic group chat for an event. */
export function eventChat(eventId: string): ChatMessage[] {
  const event = getEvent(eventId);
  if (!event) return [];
  const seed = hash(eventId);
  const roster = event.going.map(getPerson).filter(Boolean) as Person[];
  if (!roster.length) return [];
  const count = 4 + (seed % 3);
  const msgs: ChatMessage[] = [
    {
      id: `${eventId}-sys`,
      authorId: "system",
      text: `${event.host} started this chat for everyone going to ${event.title}.`,
      minutesAgo: 2880,
      system: true,
    },
  ];
  for (let i = 0; i < count; i++) {
    const person = roster[(seed + i) % roster.length]!;
    msgs.push({
      id: `${eventId}-m${i}`,
      authorId: person.id,
      text: OPENERS[(seed + i * 3) % OPENERS.length]!,
      minutesAgo: 900 - i * 140,
    });
    if (i === 1) {
      msgs.push({
        id: `${eventId}-h${i}`,
        authorId: roster[0]!.id,
        text: HOST_LINES[seed % HOST_LINES.length]!,
        minutesAgo: 880 - i * 140,
      });
    }
  }
  return msgs;
}

/** Deterministic 1:1 history with a connection. */
export function dmThread(personId: string): ChatMessage[] {
  const seed = hash(personId);
  const lines: [string, string][] = [
    ["Good to meet you at the rooftop thing!", "You too — that view was unreal."],
    ["Are you going to the supper club next week?", "Thinking about it. Go on then, I'm in."],
  ];
  const pick = lines[seed % lines.length]!;
  return [
    { id: `${personId}-1`, authorId: personId, text: pick[0], minutesAgo: 2200 },
    { id: `${personId}-2`, authorId: "you", text: pick[1], minutesAgo: 2100 },
  ];
}

export type NotificationKind = "connection" | "event" | "wall" | "message" | "host";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  minutesAgo: number;
  personId?: string;
  eventId?: string;
  to?: string;
}

export function buildNotifications(p: {
  incomingRequests: string[];
  goingIds: string[];
}): AppNotification[] {
  const out: AppNotification[] = [];

  for (const id of p.incomingRequests) {
    const person = getPerson(id);
    if (!person) continue;
    out.push({
      id: `req-${id}`,
      kind: "connection",
      title: `${person.name} wants to connect`,
      body: `You met at an event · ${person.mutuals} mutual connections`,
      minutesAgo: 40,
      personId: id,
    });
  }

  out.push({
    id: "wall-supper",
    kind: "wall",
    title: "The wall is up from Long Table Supper Club",
    body: "24 photos from 8 people — you're in 14 of them.",
    minutesAgo: 300,
    eventId: "supper-club",
  });

  for (const id of p.goingIds.slice(0, 2)) {
    const event = getEvent(id);
    if (!event) continue;
    out.push({
      id: `ev-${id}`,
      kind: "event",
      title: `${event.title} is ${event.dateLabel.toLowerCase()}`,
      body: `${event.goingCount} people going · ${event.location}.`,
      minutesAgo: 120,
      eventId: id,
    });
    out.push({
      id: `chat-${id}`,
      kind: "message",
      title: `New messages in ${event.title}`,
      body: "People are sorting out who's arriving when.",
      minutesAgo: 90,
      eventId: id,
    });
  }

  out.push({
    id: "host-nudge",
    kind: "host",
    title: "Thinking of hosting?",
    body: "You've been to 2 events. The people you've met are one tap away.",
    minutesAgo: 1400,
  });

  return out.sort((a, b) => a.minutesAgo - b.minutesAgo);
}

export function timeAgo(minutes: number): string {
  if (minutes < 1) return "now";
  if (minutes < 60) return `${Math.round(minutes)}m`;
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)}h`;
  return `${Math.round(minutes / (60 * 24))}d`;
}

export const REPORT_REASONS = [
  "Harassment or abusive messages",
  "Fake profile or impersonation",
  "Unwanted sexual advances",
  "Spam or scam",
  "Something happened at an event",
  "Something else",
];

export function suggestedPeople(excluded: string[]): Person[] {
  return people.filter((p) => !excluded.includes(p.id)).slice(0, 4);
}
