/** "Been out X times" identity surface. Deterministic from what you've done in the app. */

export interface StreakSummary {
  thisMonth: number;
  lastMonth: number;
  weeks: number;
  bestWeeks: number;
  newPeople: number;
  title: string;
  blurb: string;
  nextGoal: string;
  progress: number; // 0..1 toward next goal
}

const TITLES: { min: number; title: string; blurb: string }[] = [
  { min: 12, title: "Never in", blurb: "You're the reason the group chat moves." },
  { min: 8, title: "Out most weeks", blurb: "Consistently somewhere better than home." },
  { min: 4, title: "Getting out", blurb: "A real habit is forming." },
  { min: 2, title: "Warming up", blurb: "Two more and it counts as a routine." },
  { min: 0, title: "Just started", blurb: "One thing this week is all it takes." },
];

export function streakFor(input: {
  goingCount: number;
  checkedInCount: number;
  plansCount: number;
  connections: number;
}): StreakSummary {
  const thisMonth = input.checkedInCount + input.goingCount + input.plansCount;
  const lastMonth = Math.max(0, Math.round(thisMonth * 0.7) - 1);
  const weeks = Math.min(8, Math.max(0, Math.floor(thisMonth / 1.5)));
  const t = TITLES.find((x) => thisMonth >= x.min) ?? TITLES[TITLES.length - 1]!;
  const goalTarget = thisMonth < 4 ? 4 : thisMonth < 8 ? 8 : 12;
  return {
    thisMonth,
    lastMonth,
    weeks,
    bestWeeks: Math.max(weeks, 3),
    newPeople: input.connections * 2,
    title: t.title,
    blurb: t.blurb,
    nextGoal: `${goalTarget} times out this month`,
    progress: Math.min(1, thisMonth / goalTarget),
  };
}

export const MONTH_DOTS = ["M", "T", "W", "T", "F", "S", "S"];

/** Which days of the current week you were out — deterministic from a seed. */
export function weekPattern(seed: number): boolean[] {
  return MONTH_DOTS.map((_, i) => ((seed >> i) & 1) === 1);
}
