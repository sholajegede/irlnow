import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Plus, Users, Vote, Wallet } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { AvatarStack } from "@/components/Avatar";
import { peopleByIds } from "@irlnow/domain";
import { planHost, plans as seedPlans, rsvpCountdown, splitCost } from "@irlnow/domain";
import { money } from "@irlnow/domain";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/plans")({
  head: () => ({
    meta: [
      { title: "Plans — smaller than events, easier to say yes to | IRL NOW" },
      {
        name: "description",
        content:
          "Park at 2, watching the match, coffee and a walk. Post a plan, let people join, or vote on what the group does.",
      },
      { property: "og:title", content: "Plans — IRL NOW" },
      {
        property: "og:description",
        content: "The unit is a plan, not an event. Say where you're going and bring people.",
      },
    ],
  }),
  component: PlansPage,
});

function PlansPage() {
  const { myPlans, joinedPlanIds, togglePlanIn } = useApp();
  const all = [...myPlans, ...seedPlans];

  return (
    <div className="flex min-h-dvh flex-col pb-24">
      <AppHeader title="Plans from your people" />
      <main className="flex flex-col gap-4 p-4">
        <Link
          to="/plan/new"
          className="flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-brand py-3 font-display text-sm font-bold text-primary-foreground shadow-glow"
        >
          <Plus className="h-4 w-4" /> Post a plan
        </Link>

        <p className="text-sm text-muted-foreground">
          A plan is lighter than an event. No tickets, no page to build — just "I'm going here, come
          if you want."
        </p>

        {all.map((p) => {
          const host = planHost(p);
          const joined = joinedPlanIds.includes(p.id);
          const inPeople = peopleByIds(p.inIds);
          const countdown = rsvpCountdown(p);
          const split = splitCost(p, joined);
          return (
            <article key={p.id} className="rounded-3xl border border-border bg-card p-4">
              <Link to="/plan/$id" params={{ id: p.id }} className="block">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{p.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-lg font-extrabold leading-tight">{p.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {host.name} · {p.when} · {p.place}
                    </p>
                  </div>
                  {p.options && (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-extrabold uppercase text-accent-foreground">
                      <Vote className="h-3 w-3" /> Vote
                    </span>
                  )}
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.note}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {countdown && (
                    <span
                      className={
                        countdown.urgent
                          ? "flex items-center gap-1 rounded-full bg-primary/15 px-2 py-1 text-[10px] font-bold text-primary"
                          : "flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-[10px] font-bold text-muted-foreground"
                      }
                    >
                      <Clock className="h-3 w-3" /> {countdown.label}
                    </span>
                  )}
                  {split && (
                    <span className="flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-[10px] font-bold text-muted-foreground">
                      <Wallet className="h-3 w-3" /> ~{money(split.perHead)} each
                    </span>
                  )}
                </div>
              </Link>

              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AvatarStack people={inPeople} />
                  <span className="text-xs font-medium text-muted-foreground">
                    <Users className="mr-1 inline h-3 w-3" />
                    {p.inIds.length + (joined ? 1 : 0)} in
                  </span>
                </div>
                <button
                  onClick={() => togglePlanIn(p.id)}
                  className={
                    joined
                      ? "rounded-full bg-secondary px-4 py-2 text-xs font-bold"
                      : "rounded-full bg-gradient-brand px-4 py-2 text-xs font-bold text-primary-foreground shadow-glow"
                  }
                >
                  {joined ? "You're in" : "I'm in"}
                </button>
              </div>
            </article>
          );
        })}
      </main>
      <BottomNav />
    </div>
  );
}
