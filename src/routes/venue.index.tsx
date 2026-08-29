import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BadgeCheck, Coins, Plus, Receipt, TrendingUp, Users } from "lucide-react";
import { money } from "@/lib/tickets";
import {
  capacityDrops,
  dropRevenue,
  dropSpend,
  dropsForVenue,
  myVenue,
  roiMultiple,
  spotsLeft,
} from "@/lib/venues";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/venue/")({
  head: () => ({
    meta: [
      { title: "Venue portal — fill your empty capacity | IRL NOW" },
      {
        name: "description",
        content:
          "Pay only for people who actually turn up. Publish spare capacity and IRL NOW sends nearby people who are deciding what to do.",
      },
      { property: "og:title", content: "Venue portal — IRL NOW" },
      {
        property: "og:description",
        content: "Yield management for physical experiences: pay per attendee delivered.",
      },
    ],
  }),
  component: VenuePortal,
});

function VenuePortal() {
  const { claimedDropIds, publishedDrops } = useApp();
  const drops = dropsForVenue(myVenue.id);
  const extra = (id: string) => (claimedDropIds.includes(id) ? 1 : 0);

  const delivered = capacityDrops
    .filter((d) => d.venueId === myVenue.id)
    .reduce((s, d) => s + d.claimed + extra(d.id), 0);
  const spend = drops.reduce((s, d) => s + dropSpend(d, extra(d.id)), 0);
  const revenue = drops.reduce((s, d) => s + dropRevenue(d, myVenue.avgSpend, extra(d.id)), 0);
  const cpa = delivered ? Math.round(spend / delivered) : 0;

  return (
    <div className="flex min-h-dvh flex-col pb-12">
      <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur-xl">
        <Link to="/you" className="rounded-full p-1.5 active:bg-secondary" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 font-display text-lg font-extrabold tracking-tight">
            {myVenue.name}
            {myVenue.verified && <BadgeCheck className="h-4 w-4 text-accent" />}
          </p>
          <p className="text-xs text-muted-foreground">
            {myVenue.kind} · {myVenue.area} · venue portal
          </p>
        </div>
      </header>

      <main className="flex flex-col gap-5 p-4">
        <section className="rounded-3xl border border-border bg-card p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            This week
          </p>
          <p className="mt-1 font-display text-4xl font-extrabold tracking-tight">
            {delivered} <span className="text-lg font-bold text-muted-foreground">people through the door</span>
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { label: "Cost per attendee", value: money(cpa), icon: Coins },
              { label: "Total spend", value: money(spend), icon: Users },
              { label: "Est. takings", value: money(revenue), icon: TrendingUp },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-secondary p-3">
                <s.icon className="h-4 w-4 text-primary" />
                <p className="mt-1 font-display text-base font-extrabold">{s.value}</p>
                <p className="text-[10px] leading-tight text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            You only pay when someone claims a spot and shows up. Based on your £
            {(myVenue.avgSpend / 100).toFixed(0)} average spend, this week returned about{" "}
            <span className="font-bold text-accent">
              {spend ? (revenue / spend).toFixed(1) : "0"}× what you paid us
            </span>
            .
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-extrabold">Your capacity drops</h2>
            <div className="flex items-center gap-2">
            <Link
              to="/venue/claim"
              className="flex h-11 flex-1 items-center justify-center rounded-2xl border border-border bg-card font-display text-sm font-bold"
            >
              Claim a venue
            </Link>
            <Link
              to="/venue/billing"
              className="flex items-center gap-1 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-bold"
            >
              <Receipt className="h-3.5 w-3.5" /> Billing
            </Link>
            <Link
              to="/venue/fill"
              className="flex items-center gap-1 rounded-full bg-gradient-brand px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-glow"
            >
              <Plus className="h-3.5 w-3.5" /> Fill seats
            </Link>
            </div>
          </div>

          {publishedDrops.map((d) => (
            <div key={d.id} className="rounded-3xl border border-accent/40 bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="font-display text-base font-extrabold">{d.title}</p>
                <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-extrabold uppercase text-accent-foreground">
                  Just published
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {d.slot} · {d.offer}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Showing to ~{d.reach.toLocaleString()} people nearby · {money(d.bid)} per attendee ·
                cap {money(d.budget)}
              </p>
            </div>
          ))}

          {drops.map((d) => {
            const claims = d.claimed + extra(d.id);
            const pct = Math.min(100, Math.round((claims / d.seats) * 100));
            return (
              <div key={d.id} className="rounded-3xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-display text-base font-extrabold">{d.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.slot} · {d.offer}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase",
                      d.status === "live"
                        ? "bg-primary/15 text-primary"
                        : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {d.status}
                  </span>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-gradient-brand" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {claims} claimed · {spotsLeft(d, extra(d.id))} spots still open · shown to{" "}
                  {d.reach.toLocaleString()} nearby
                </p>

                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-secondary p-2">
                    <p className="font-display text-sm font-extrabold">{money(d.bid)}</p>
                    <p className="text-[10px] text-muted-foreground">per attendee</p>
                  </div>
                  <div className="rounded-xl bg-secondary p-2">
                    <p className="font-display text-sm font-extrabold">
                      {money(dropSpend(d, extra(d.id)))}
                    </p>
                    <p className="text-[10px] text-muted-foreground">spent of {money(d.budget)}</p>
                  </div>
                  <div className="rounded-xl bg-secondary p-2">
                    <p className="font-display text-sm font-extrabold text-accent">
                      {roiMultiple(d, myVenue.avgSpend, extra(d.id)).toFixed(1)}×
                    </p>
                    <p className="text-[10px] text-muted-foreground">est. return</p>
                  </div>
                </div>

                <Link
                  to="/drop/$id"
                  params={{ id: d.id }}
                  className="mt-3 block rounded-2xl bg-secondary py-2.5 text-center text-xs font-bold"
                >
                  See what people see
                </Link>
              </div>
            );
          })}
        </section>

        <section className="rounded-3xl border border-dashed border-border p-4">
          <p className="font-display text-base font-extrabold">How the pricing works</p>
          <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
            <li>· You set what a person through the door is worth to you.</li>
            <li>· We show your spare capacity to nearby people deciding what to do.</li>
            <li>· You're charged only when someone claims and checks in.</li>
            <li>· Stop any drop the second you're full.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
