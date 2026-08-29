import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Eye, Megaphone, TrendingUp, Users } from "lucide-react";
import { useState } from "react";
import {
  BOOST_AUDIENCES,
  BOOST_BUDGETS,
  boostAttendance,
  boostCostPerGuest,
  boostReach,
  boostReturn,
  type BoostAudience,
} from "@/lib/money";
import { getEvent } from "@/lib/data";
import { money } from "@/lib/tickets";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/host/boost/$id")({
  head: () => ({
    meta: [
      { title: "Promote your event — reach people nearby | IRL NOW" },
      {
        name: "description",
        content:
          "Put your event in front of people nearby who are deciding what to do. Set a budget, pick an audience, see projected turnout.",
      },
      { property: "og:title", content: "Promote your event — IRL NOW" },
      { property: "og:description", content: "Paid reach, measured in people through the door." },
    ],
  }),
  component: BoostPage,
});

function BoostPage() {
  const { id } = useParams({ from: "/host/boost/$id" });
  const event = getEvent(id);
  const { boosts, startBoost, stopBoost } = useApp();
  const live = boosts[id];

  const [budget, setBudget] = useState(live?.budget ?? BOOST_BUDGETS[1]!);
  const [audience, setAudience] = useState<BoostAudience>(live?.audience ?? "interest");
  const [days, setDays] = useState(live?.days ?? 3);

  const reach = boostReach(budget, audience, days);
  const guests = boostAttendance(budget, audience, days);
  const cpg = boostCostPerGuest(budget, audience, days);
  const ret = boostReturn(id, budget, audience, days);

  if (!event) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        Event not found.{" "}
        <Link to="/host" className="font-bold text-primary">
          Back to workspace
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col pb-12">
      <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur-xl">
        <Link to="/host" className="rounded-full p-1.5 active:bg-secondary" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-extrabold tracking-tight">
            Promote this event
          </p>
          <p className="truncate text-xs text-muted-foreground">{event.title}</p>
        </div>
      </header>

      <main className="flex flex-col gap-5 p-4">
        {live && (
          <section className="rounded-3xl border border-accent/50 bg-accent/10 p-4">
            <p className="flex items-center gap-2 font-display font-extrabold">
              <Megaphone className="h-4 w-4 text-accent" /> Promotion running
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {money(live.budget)} over {live.days} days · started {live.startedAt}. Your event now
              carries a “Promoted” label in the feed.
            </p>
            <button
              onClick={() => stopBoost(id)}
              className="mt-3 rounded-full border border-border bg-background px-4 py-2 text-xs font-bold"
            >
              Stop promotion
            </button>
          </section>
        )}

        <section>
          <h2 className="font-display text-xl font-extrabold">Budget</h2>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {BOOST_BUDGETS.map((b) => (
              <button
                key={b}
                onClick={() => setBudget(b)}
                className={cn(
                  "rounded-2xl border py-3 font-display text-sm font-extrabold",
                  budget === b ? "border-primary bg-primary/15" : "border-border bg-card",
                )}
              >
                {money(b)}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl font-extrabold">Who sees it</h2>
          <div className="mt-2 flex flex-col gap-2">
            {BOOST_AUDIENCES.map((a) => (
              <button
                key={a.id}
                onClick={() => setAudience(a.id)}
                className={cn(
                  "rounded-2xl border p-4 text-left",
                  audience === a.id ? "border-primary bg-primary/10" : "border-border bg-card",
                )}
              >
                <p className="font-display font-bold">{a.label}</p>
                <p className="text-xs text-muted-foreground">{a.blurb}</p>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl font-extrabold">For how long</h2>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {[1, 3, 7].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={cn(
                  "rounded-2xl border py-3 font-display text-sm font-extrabold",
                  days === d ? "border-primary bg-primary/15" : "border-border bg-card",
                )}
              >
                {d} {d === 1 ? "day" : "days"}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Projected
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { icon: Eye, value: `${(reach / 1000).toFixed(1)}k`, label: "People reached" },
              { icon: Users, value: `+${guests}`, label: "Extra guests" },
              { icon: TrendingUp, value: money(cpg), label: "Cost per guest" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-secondary p-3">
                <s.icon className="h-4 w-4 text-primary" />
                <p className="mt-1 font-display text-base font-extrabold">{s.value}</p>
                <p className="text-[10px] leading-tight text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {ret.revenue > 0
              ? `At ${event.price} a ticket that's about ${money(ret.revenue)} in sales — ${ret.net >= 0 ? "a net" : "a shortfall of"} ${money(Math.abs(ret.net))} against your budget.`
              : "Free event — this is measured in turnout, not revenue."}
          </p>
        </section>

        <button
          onClick={() =>
            startBoost({
              eventId: id,
              budget,
              audience,
              days,
              startedAt: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
            })
          }
          className="rounded-2xl bg-gradient-brand py-4 font-display text-lg font-extrabold text-primary-foreground shadow-glow active:scale-[0.99]"
        >
          {live ? "Update promotion" : `Promote for ${money(budget)}`}
        </button>
        <p className="text-center text-[11px] text-muted-foreground">
          Demo billing — you're only charged when the promotion delivers views.
        </p>
      </main>
    </div>
  );
}
