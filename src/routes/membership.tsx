import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Sparkles } from "lucide-react";
import { useState } from "react";
import {
  MEMBERSHIP_PERKS,
  MEMBERSHIP_PRICES,
  memberSavings,
  type MembershipPlan,
} from "@/lib/money";
import { money } from "@/lib/tickets";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/membership")({
  head: () => ({
    meta: [
      { title: "IRL NOW+ — early access, no booking fees | IRL NOW" },
      {
        name: "description",
        content:
          "Members get early access to popular plans, priority on waitlists, no booking fees and unlimited memory storage.",
      },
      { property: "og:title", content: "IRL NOW+ membership" },
      {
        property: "og:description",
        content: "Early access, priority waitlists, no booking fees, memories kept forever.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MembershipPage,
});

function MembershipPage() {
  const { membership, joinMembership, cancelMembership, goingIds, claimedDropIds, orders } = useApp();
  const [plan, setPlan] = useState<MembershipPlan>("yearly");

  const paidJoined = Object.keys(orders).length || goingIds.length;
  const saved = memberSavings(paidJoined, claimedDropIds.length);
  const yearlyMonthly = Math.round(MEMBERSHIP_PRICES.yearly / 12);

  return (
    <div className="flex min-h-dvh flex-col pb-12">
      <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur-xl">
        <Link to="/you" className="rounded-full p-1.5 active:bg-secondary" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <p className="font-display text-lg font-extrabold tracking-tight">IRL NOW+</p>
      </header>

      <main className="flex flex-col gap-5 p-4">
        <section className="rounded-3xl border border-primary/40 bg-gradient-brand/10 p-5">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-primary-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Membership
          </span>
          <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight">
            {membership ? "You're a member" : "Get in before everyone else"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {membership
              ? `${membership.plan === "yearly" ? "Yearly" : "Monthly"} plan · started ${membership.startedAt} · renews ${membership.renewsOn}`
              : "The good things fill up in minutes. Members see them first, skip the fees, and keep every photo."}
          </p>
        </section>

        {!membership && (
          <section className="grid grid-cols-2 gap-2">
            {(["monthly", "yearly"] as MembershipPlan[]).map((p) => (
              <button
                key={p}
                onClick={() => setPlan(p)}
                className={cn(
                  "rounded-3xl border p-4 text-left transition-colors",
                  plan === p ? "border-primary bg-primary/10" : "border-border bg-card",
                )}
              >
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {p === "monthly" ? "Monthly" : "Yearly"}
                </p>
                <p className="mt-1 font-display text-2xl font-extrabold">
                  {money(MEMBERSHIP_PRICES[p])}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {p === "monthly" ? "per month, cancel anytime" : `${money(yearlyMonthly)}/mo · two months free`}
                </p>
                {p === "yearly" && (
                  <span className="mt-2 inline-block rounded-full bg-accent px-2 py-0.5 text-[10px] font-extrabold uppercase text-accent-foreground">
                    Best value
                  </span>
                )}
              </button>
            ))}
          </section>
        )}

        <section className="flex flex-col gap-2">
          <h2 className="font-display text-xl font-extrabold">What you get</h2>
          {MEMBERSHIP_PERKS.map((perk) => (
            <div key={perk.id} className="flex gap-3 rounded-2xl border border-border bg-card p-4">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15">
                <Check className="h-3.5 w-3.5 text-accent" strokeWidth={3} />
              </div>
              <div>
                <p className="font-display font-bold">{perk.title}</p>
                <p className="text-xs text-muted-foreground">{perk.blurb}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-border bg-card p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Based on how you use IRL NOW
          </p>
          <p className="mt-1 font-display text-2xl font-extrabold">
            You'd have saved {money(saved)} <span className="text-sm font-bold text-muted-foreground">this month</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {paidJoined} paid plans joined · {claimedDropIds.length} venue drops claimed. Fees waived and
            member-only offers counted.
          </p>
        </section>

        {membership ? (
          <button
            onClick={cancelMembership}
            className="rounded-2xl border border-border bg-secondary py-3.5 font-display font-bold"
          >
            Cancel membership
          </button>
        ) : (
          <button
            onClick={() => joinMembership(plan)}
            className="rounded-2xl bg-gradient-brand py-4 font-display text-lg font-extrabold text-primary-foreground shadow-glow active:scale-[0.99]"
          >
            Join for {money(MEMBERSHIP_PRICES[plan])}
            {plan === "monthly" ? "/mo" : "/yr"}
          </button>
        )}
        <p className="text-center text-[11px] text-muted-foreground">
          Demo billing — no card is charged.
        </p>
      </main>
    </div>
  );
}
