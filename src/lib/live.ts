import { getEvent, getPerson, type Person } from "@/lib/data";

/** A message that arrives while you're in the thread. */
export interface LiveMessage {
  id: string;
  threadId: string;
  authorId: string;
  text: string;
  at: number;
}

function hash(s: string): number {
  return s.split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 11);
}

/** Reactions people can drop on a message. */
export const REACTIONS = ["🔥", "👏", "😂", "👀", "💯"] as const;

/** Quick replies for an event group chat — the four things people actually say. */
export function eventQuickReplies(dateLabel: string): string[] {
  return [
    "On my way",
    "Running 10 late",
    `See you ${dateLabel.toLowerCase().startsWith("tonight") ? "tonight" : "there"}`,
    "Who's getting there first?",
  ];
}

export const DM_QUICK_REPLIES = [
  "Good to see you!",
  "Are you going to this one?",
  "Let's sort a plan",
];

const GROUP_REPLIES = [
  "Nice one, see you there.",
  "Same — I'll be about 10 minutes behind you.",
  "I'll grab a table if I land first.",
  "Perfect. I'll message here when I'm outside.",
  "Anyone want to share a cab back after?",
  "Adding it to my calendar now.",
];

const DM_REPLIES = [
  "Ha, yes — I'm in.",
  "Sounds good. What time were you thinking?",
  "That works for me. See you there.",
  "Let me check and come back to you tonight.",
];

/** Who replies next in a thread, and what they say — deterministic per turn. */
export function nextReply(p: {
  threadId: string;
  turn: number;
  responders: Person[];
  dm: boolean;
}): { author: Person; text: string; delayMs: number; typingMs: number } | null {
  if (!p.responders.length) return null;
  const seed = hash(p.threadId) + p.turn * 17;
  const author = p.responders[seed % p.responders.length]!;
  const pool = p.dm ? DM_REPLIES : GROUP_REPLIES;
  return {
    author,
    text: pool[seed % pool.length]!,
    delayMs: 900 + (seed % 5) * 250,
    typingMs: 1400 + (seed % 4) * 400,
  };
}

/** How many guests are "in" an event chat right now. */
export function presenceCount(eventId: string): number {
  const event = getEvent(eventId);
  if (!event) return 0;
  const seed = hash(eventId);
  return 2 + (seed % Math.max(3, Math.min(6, event.goingCount)));
}

/** The host's pinned note for an event chat. */
export function pinnedHostNote(eventId: string): string | null {
  const event = getEvent(eventId);
  if (!event) return null;
  const notes = [
    `Meet by the entrance just before we start. Ask for ${event.host} if you can't find us.`,
    `Doors open 15 minutes before. ${event.location} — the side door, not the main one.`,
    `Bring a card, the bar's cashless. Any issues, message here.`,
  ];
  return notes[hash(eventId) % notes.length]!;
}

/** People who could plausibly reply in an event chat. */
export function respondersFor(eventId: string, blocked: string[]): Person[] {
  const event = getEvent(eventId);
  if (!event) return [];
  return event.going
    .filter((id) => !blocked.includes(id))
    .map(getPerson)
    .filter(Boolean) as Person[];
}
