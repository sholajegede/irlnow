import { events, getEvent, getPerson, type Person } from "@/lib/data";

/**
 * The going graph: Person -> Going -> Event.
 * Everything social in IRL NOW is derived from who said yes to what,
 * never from browsing strangers.
 */
export interface GoingGraph {
  /** everyone confirmed going (that we have profiles for) */
  roster: Person[];
  /** people who share at least one interest with you */
  likeYou: Person[];
  /** people coming on their own and open to meeting */
  solo: Person[];
  /** people connected to people you know */
  mutuals: Person[];
  /** people you were at a past event with */
  metBefore: Person[];
  /** one-line human summary, people-first */
  headline: string;
  /** secondary line, always about people */
  subline: string;
}

function hash(s: string): number {
  return s.split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 11);
}

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

export function goingGraph(
  eventId: string,
  myInterests: string[] = [],
  metPersonIds: string[] = [],
): GoingGraph {
  const event = getEvent(eventId);
  const empty: GoingGraph = {
    roster: [],
    likeYou: [],
    solo: [],
    mutuals: [],
    metBefore: [],
    headline: "Be the first to say you're going",
    subline: "Someone has to start it.",
  };
  if (!event) return empty;

  const roster = event.going.map(getPerson).filter((p): p is Person => Boolean(p));
  if (!roster.length) return empty;

  const seed = hash(eventId);
  const likeYou = roster.filter((p) => p.interests.some((i) => myInterests.includes(i)));
  const solo = roster.filter((p, i) => p.goingSolo || (seed + i) % 4 === 0);
  const mutuals = roster.filter((p) => p.mutuals > 0);
  const metBefore = roster.filter((p) => metPersonIds.includes(p.id));

  // scale the sampled roster up to the real headcount, deterministically
  const scale = Math.max(1, Math.round(event.goingCount / roster.length));
  const likeYouCount = likeYou.length ? Math.min(event.goingCount, likeYou.length * scale) : 0;
  const soloCount = Math.min(event.goingCount, Math.max(1, solo.length * Math.max(1, scale - 1)));

  const first = roster[0]!;
  const second = roster[1];

  const headline = metBefore.length
    ? `${metBefore[0]!.name} is going — you two were at the same thing before`
    : likeYouCount > 0
      ? `${plural(likeYouCount, "person", "people")} into the same things as you`
      : second
        ? `${first.name}, ${second.name} and ${event.goingCount - 2} others are going`
        : `${first.name} and ${event.goingCount - 1} others are going`;

  const bits: string[] = [];
  if (soloCount) bits.push(`${soloCount} coming solo`);
  if (mutuals.length) bits.push(`${plural(mutuals.length, "mutual", "mutuals")}`);
  bits.push(`${event.goingCount} going`);

  return {
    roster,
    likeYou,
    solo,
    mutuals,
    metBefore,
    headline,
    subline: bits.join(" · "),
  };
}

/** People worth meeting at an event you're going to — ranked, never strangers-at-large. */
export function peopleToMeet(
  eventId: string,
  myInterests: string[] = [],
  metPersonIds: string[] = [],
  limit = 4,
): Person[] {
  const g = goingGraph(eventId, myInterests, metPersonIds);
  const score = (p: Person) =>
    (metPersonIds.includes(p.id) ? 4 : 0) +
    p.interests.filter((i) => myInterests.includes(i)).length * 2 +
    (p.goingSolo ? 2 : 0) +
    Math.min(p.mutuals, 3);
  return [...g.roster].sort((a, b) => score(b) - score(a)).slice(0, limit);
}

export interface PersonOut {
  person: Person;
  event: { id: string; title: string; area: string; dateLabel: string; when: "tonight" | "weekend" };
  /** why this person is surfaced — always tied to an event, never stranger-browsing */
  reason: string;
  likeYou: boolean;
  solo: boolean;
  mutual: boolean;
  met: boolean;
  score: number;
}

/**
 * Everyone who is out in the next few days, derived from Person -> Going -> Event.
 * A person only appears here because they said yes to something you can join.
 */
export function peopleOut(
  myInterests: string[] = [],
  metPersonIds: string[] = [],
): PersonOut[] {
  const seen = new Set<string>();
  const out: PersonOut[] = [];

  for (const event of events) {
    const graph = goingGraph(event.id, myInterests, metPersonIds);
    for (const person of graph.roster) {
      if (seen.has(person.id)) continue;
      seen.add(person.id);
      const shared = person.interests.filter((i) => myInterests.includes(i));
      const likeYou = shared.length > 0;
      const solo = graph.solo.some((p) => p.id === person.id);
      const mutual = person.mutuals > 0;
      const met = metPersonIds.includes(person.id);
      const reason = met
        ? "You've been at the same thing before"
        : likeYou
          ? `You both like ${shared
              .slice(0, 2)
              .map((i) => i[0]!.toUpperCase() + i.slice(1))
              .join(" & ")}`
          : solo
            ? "Going on their own"
            : mutual
              ? `${person.mutuals} mutual${person.mutuals === 1 ? "" : "s"}`
              : "Out this week";
      out.push({
        person,
        event: {
          id: event.id,
          title: event.title,
          area: event.area,
          dateLabel: event.dateLabel,
          when: event.when,
        },
        reason,
        likeYou,
        solo,
        mutual,
        met,
        score:
          (met ? 5 : 0) + shared.length * 2 + (solo ? 2 : 0) + Math.min(person.mutuals, 3),
      });
    }
  }

  return out.sort((a, b) => b.score - a.score);
}
