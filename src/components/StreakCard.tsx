import { Flame, TrendingUp } from "lucide-react";
import { MONTH_DOTS, streakFor, weekPattern } from "@/lib/streaks";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

/** Identity, not vanity: "you've been out X times this month". */
export function StreakCard() {
  const { goingIds, checkedInIds, myPlans, joinedPlanIds, connectedIds } = useApp();
  const s = streakFor({
    goingCount: goingIds.length,
    checkedInCount: checkedInIds.length,
    plansCount: myPlans.length + joinedPlanIds.length,
    connections: connectedIds.length,
  });
  const pattern = weekPattern(s.thisMonth * 11 + 37);

  return (
    <section className="rounded-3xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-brand shadow-glow">
          <Flame className="h-5 w-5 text-primary-foreground" />
        </span>
        <div className="flex-1">
          <p className="font-display text-lg font-extrabold leading-tight">
            Out {s.thisMonth} time{s.thisMonth === 1 ? "" : "s"} this month
          </p>
          <p className="text-xs text-muted-foreground">
            {s.title} · {s.blurb}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        {MONTH_DOTS.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-xl text-[11px] font-bold",
                pattern[i]
                  ? "bg-gradient-brand text-primary-foreground"
                  : "bg-secondary text-muted-foreground",
              )}
            >
              {d}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] font-semibold">
          <span className="text-muted-foreground">Next: {s.nextGoal}</span>
          <span className="text-primary">{Math.round(s.progress * 100)}%</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-gradient-brand"
            style={{ width: `${s.progress * 100}%` }}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Mini value={`${s.weeks}`} label="weeks in a row" />
        <Mini value={`${s.newPeople}`} label="new people met" />
        <Mini
          value={`${s.thisMonth - s.lastMonth >= 0 ? "+" : ""}${s.thisMonth - s.lastMonth}`}
          label="vs last month"
          icon
        />
      </div>
    </section>
  );
}

function Mini({ value, label, icon }: { value: string; label: string; icon?: boolean }) {
  return (
    <div className="rounded-2xl bg-secondary/50 p-2.5 text-center">
      <p className="flex items-center justify-center gap-1 font-display text-base font-extrabold">
        {icon && <TrendingUp className="h-3.5 w-3.5 text-accent" />}
        {value}
      </p>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
