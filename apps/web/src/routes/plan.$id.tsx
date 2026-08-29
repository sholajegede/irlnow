import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  Clock,
  Lock,
  MapPin,
  MessagesSquare,
  Share2,
  Users,
  Vote,
  Wallet,
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { Avatar, AvatarStack } from "@/components/Avatar";
import { getEvent, peopleByIds } from "@irlnow/domain";
import {
  getPlan,
  leadingOption,
  planHost,
  rsvpCountdown,
  splitCost,
  type Plan,
} from "@irlnow/domain";
import { money } from "@irlnow/domain";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/plan/$id")({
  head: () => ({
    meta: [
      { title: "A plan — IRL NOW" },
      {
        name: "description",
        content: "Someone's going somewhere. Say you're in, or vote on what the group does.",
      },
      { property: "og:title", content: "Come along — a plan on IRL NOW" },
      { property: "og:description", content: "No ticket, no event page. Just a plan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlanDetail,
});

function PlanDetail() {
  const { id } = useParams({ from: "/plan/$id" });
  const {
    myPlans,
    joinedPlanIds,
    togglePlanIn,
    planVotes,
    votePlan,
    name,
    lockedPlans,
    lockPlan,
    planSplitsIn,
    togglePlanSplit,
  } = useApp();
  const plan: Plan | undefined = myPlans.find((p) => p.id === id) ?? getPlan(id);

  if (!plan) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="font-display text-2xl font-extrabold">This plan's gone</p>
        <Link
          to="/plans"
          className="rounded-full bg-gradient-brand px-5 py-2.5 text-sm font-bold text-primary-foreground"
        >
          See other plans
        </Link>
      </div>
    );
  }

  const host = planHost(plan);
  const joined = joinedPlanIds.includes(plan.id);
  const myVote = planVotes[plan.id];
  const inPeople = peopleByIds(plan.inIds);

  const locked = lockedPlans.includes(plan.id);
  const countdown = rsvpCountdown(plan);
  const split = splitCost(plan, joined);
  const leading = leadingOption(plan, myVote);
  const splittingIn = planSplitsIn.includes(plan.id);

  const totalVotes =
    (plan.options ?? []).reduce((s, o) => s + o.votes.length, 0) + (myVote ? 1 : 0);

  return (
    <div className="flex min-h-dvh flex-col pb-28">
      <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur-xl">
        <Link to="/plans" className="rounded-full p-1.5 active:bg-secondary" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <p className="font-display text-lg font-extrabold tracking-tight">Plan</p>
      </header>

      <main className="flex flex-col gap-5 p-4">
        <section>
          <span className="text-4xl">{plan.emoji}</span>
          <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight tracking-tight">
            {plan.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {plan.when} · {plan.place}
          </p>
          <p className="mt-3 text-sm leading-relaxed">{plan.note}</p>
          {countdown && (
            <p
              className={cn(
                "mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold",
                countdown.closed
                  ? "bg-secondary text-muted-foreground"
                  : countdown.urgent
                    ? "bg-primary/15 text-primary"
                    : "bg-secondary text-secondary-foreground",
              )}
            >
              <Clock className="h-3.5 w-3.5" /> {countdown.label}
            </p>
          )}
        </section>

        <section className="flex items-center gap-3 rounded-3xl border border-border bg-card p-3">
          <Avatar person={{ name: host.name, avatar: (host as { avatar: number }).avatar }} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">{host.name}</p>
            <p className="text-xs text-muted-foreground">
              {plan.audience === "connections"
                ? "Shared with their connections"
                : plan.audience === "attendees"
                  ? "Shared with people from shared events"
                  : "Anyone with the link"}
            </p>
          </div>
          <button className="rounded-full bg-secondary p-2" aria-label="Share plan">
            <Share2 className="h-4 w-4" />
          </button>
        </section>

        {plan.options && (
          <section className="rounded-3xl border border-border bg-card p-4">
            <p className="flex items-center gap-1.5 font-display text-base font-extrabold">
              <Vote className="h-4 w-4 text-accent" /> Vote on what we do
            </p>
            <p className="text-xs text-muted-foreground">
              {totalVotes} votes in{plan.votingClosesIn ? ` · closes ${plan.votingClosesIn}` : ""}
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {plan.options.map((o) => {
                const count = o.votes.length + (myVote === o.id ? 1 : 0);
                const pct = totalVotes ? Math.round((count / totalVotes) * 100) : 0;
                const linked = o.eventId ? getEvent(o.eventId) : undefined;
                return (
                  <button
                    key={o.id}
                    onClick={() => votePlan(plan.id, o.id)}
                    className={cn(
                      "relative overflow-hidden rounded-2xl border p-3 text-left",
                      myVote === o.id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-secondary",
                    )}
                  >
                    <div
                      className="absolute inset-y-0 left-0 bg-primary/10"
                      style={{ width: `${pct}%` }}
                    />
                    <div className="relative flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold">
                          {o.label}{" "}
                          {myVote === o.id && <Check className="inline h-3.5 w-3.5 text-primary" />}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {linked ? `${linked.dateLabel} · ${linked.area}` : o.detail}
                        </p>
                      </div>
                      <span className="shrink-0 font-display text-sm font-extrabold">{pct}%</span>
                    </div>
                  </button>
                );
              })}
            </div>
            {locked ? (
              <p className="mt-3 flex items-center gap-1.5 rounded-2xl bg-accent/12 p-3 text-xs font-semibold text-accent">
                <Lock className="h-3.5 w-3.5" /> Locked in: {leading?.label}. Everyone who's in has
                it on their agenda now.
              </p>
            ) : (
              <>
                {myVote && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Your vote is in. Someone needs to call it — otherwise this drifts until Saturday
                    happens without you.
                  </p>
                )}
                <button
                  onClick={() => lockPlan(plan.id)}
                  className="mt-3 flex h-11 w-full items-center justify-center gap-1.5 rounded-2xl bg-gradient-brand font-display text-sm font-bold text-primary-foreground shadow-glow"
                >
                  <Lock className="h-4 w-4" /> Lock in {leading?.label ?? "the leader"}
                </button>
              </>
            )}
          </section>
        )}

        {split && (
          <section className="rounded-3xl border border-border bg-card p-4">
            <p className="flex items-center gap-1.5 font-display text-base font-extrabold">
              <Wallet className="h-4 w-4 text-accent" /> Splitting the cost
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{split.note}</p>
            <div className="mt-3 flex items-end justify-between rounded-2xl bg-secondary p-3">
              <div>
                <p className="font-display text-2xl font-extrabold text-accent">
                  {money(split.perHead)}
                </p>
                <p className="text-[11px] text-muted-foreground">each, {split.heads} people in</p>
              </div>
              <p className="text-xs text-muted-foreground">{money(split.totalPence)} total</p>
            </div>
            <button
              onClick={() => togglePlanSplit(plan.id)}
              className={cn(
                "mt-3 h-11 w-full rounded-2xl text-sm font-bold",
                splittingIn ? "bg-accent/15 text-accent" : "bg-secondary text-secondary-foreground",
              )}
            >
              {splittingIn ? `You're in for ${money(split.perHead)}` : "I'll chip in my share"}
            </button>
            <p className="mt-2 text-[11px] text-muted-foreground">
              No money moves here — we just keep the tally so nobody has to do the awkward maths at
              the table.
            </p>
          </section>
        )}

        <section className="rounded-3xl border border-border bg-card p-4">
          <p className="font-display text-base font-extrabold">Who's in</p>
          <div className="mt-2 flex items-center gap-2">
            <AvatarStack people={inPeople} />
            <span className="text-sm text-muted-foreground">
              <Users className="mr-1 inline h-3.5 w-3.5" />
              {plan.inIds.length + (joined ? 1 : 0)} people
              {joined ? `, including ${name || "you"}` : ""}
            </span>
          </div>
          <Link
            to="/messages"
            className="mt-3 flex items-center justify-center gap-1.5 rounded-2xl bg-secondary py-2.5 text-xs font-bold"
          >
            <MessagesSquare className="h-4 w-4" /> Message the group
          </Link>
        </section>

        <section className="flex items-start gap-2 rounded-3xl border border-dashed border-border p-4 text-xs text-muted-foreground">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          Plans aren't events. There's no ticket and no host duty — turn up, or don't. If more than
          eight people say they're in we'll nudge {host.name} to pick a meeting point.
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-16 z-40 mx-auto w-full max-w-md border-t border-border bg-background/95 p-3 backdrop-blur-xl">
        <button
          onClick={() => togglePlanIn(plan.id)}
          className={cn(
            "w-full rounded-2xl py-3.5 font-display font-bold",
            joined ? "bg-secondary" : "bg-gradient-brand text-primary-foreground shadow-glow",
          )}
        >
          {joined
            ? "You're in — tap to drop out"
            : countdown?.closed
              ? "RSVPs closed — ask to squeeze in"
              : countdown?.urgent
                ? `I'm in · ${countdown.label}`
                : "I'm in"}
        </button>
      </div>
      <BottomNav />
    </div>
  );
}
