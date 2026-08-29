import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  Download,
  Infinity as InfinityIcon,
  Sparkles,
  Timer,
  Users,
} from "lucide-react";
import { getEvent } from "@irlnow/domain";
import { eventCovers } from "@/lib/covers";
import { wallPhotos, wallStats } from "@irlnow/domain";
import { retentionFor, FREE_RETENTION_DAYS } from "@irlnow/domain";
import { MEMBERSHIP_PRICES, type MembershipPlan } from "@irlnow/domain";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/keep/$id")({
  head: () => ({
    meta: [
      { title: "Keep these memories — IRL NOW" },
      {
        name: "description",
        content:
          "Free walls are kept for 30 days. Keep every photo, face tag and recap from the nights and days you showed up.",
      },
      { property: "og:title", content: "Keep these memories — IRL NOW" },
      {
        property: "og:description",
        content: "Your wall disappears soon. Members keep every photo forever.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: KeepPage,
});

function KeepPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const event = getEvent(id);
  const {
    membership,
    joinMembership,
    keepForever,
    cards,
    defaultCardId,
    keepReceipts,
    recordKeepReceipt,
  } = useApp();
  const [plan, setPlan] = useState<MembershipPlan>("yearly");
  const [done, setDone] = useState(false);

  const stats = wallStats(id);
  const photos = wallPhotos(id, 9);
  const r = retentionFor(id, Boolean(membership));
  const daysLeft = r.daysLeft;
  const price = MEMBERSHIP_PRICES[plan];
  const card = cards.find((c) => c.id === defaultCardId) ?? cards[0];

  if (done || membership) {
    const receipt = keepReceipts[id];
    const paidPlan = receipt?.plan ?? membership?.plan ?? plan;
    const amount = receipt?.amount ?? MEMBERSHIP_PRICES[paidPlan];
    return (
      <div className="flex min-h-dvh flex-col px-5 pb-10 pt-8">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-brand shadow-glow">
            <InfinityIcon className="h-8 w-8 text-primary-foreground" />
          </span>
          <h1 className="mt-4 font-display text-[2rem] font-extrabold leading-[1.05]">
            {stats.total} photos are yours forever
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Nothing from {event?.title ?? "this event"} expires now — and every wall you join from
            here stays too.
          </p>
        </div>

        <section className="mt-6 rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Receipt
          </p>
          <div className="mt-2.5 space-y-1.5 text-sm">
            <p className="flex justify-between">
              <span className="text-muted-foreground">IRL NOW+ {paidPlan}</span>
              <span className="font-bold">£{(amount / 100).toFixed(2)}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-muted-foreground">Memories kept</span>
              <span className="font-bold">
                {receipt?.photos ?? stats.total} photos · {stats.contributors} people
              </span>
            </p>
            <p className="flex justify-between">
              <span className="text-muted-foreground">Paid with</span>
              <span className="font-bold">{receipt?.card ?? card?.label ?? "Apple Pay"}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span className="font-bold">{receipt?.when ?? "just now"}</span>
            </p>
          </div>
          <p className="mt-3 border-t border-border/60 pt-2.5 text-[11px] leading-relaxed text-muted-foreground">
            Renews {paidPlan === "yearly" ? "yearly" : "monthly"}. Cancel any time — anything you've
            kept stays kept for 12 months after.
          </p>
        </section>

        <section className="mt-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
            What to do next
          </p>
          <div className="mt-2 space-y-2">
            {[
              {
                t: "Download the full-res pack",
                s: "No watermark, all " + stats.total + " photos",
                to: "/w/$id" as const,
                params: { id },
              },
              {
                t: "Tag the people you met",
                s: "Face tags stay searchable forever now",
                to: "/w/$id" as const,
                params: { id },
              },
              {
                t: "Share the recap card",
                s: "One card, the whole night or day",
                to: "/recap/$id" as const,
                params: { id },
              },
            ].map((step, i) => (
              <Link
                key={step.t}
                to={step.to}
                params={step.params}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary font-display text-xs font-extrabold">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold">{step.t}</span>
                  <span className="block text-[11px] text-muted-foreground">{step.s}</span>
                </span>
                <Check className="h-4 w-4 shrink-0 text-accent" />
              </Link>
            ))}
          </div>
        </section>

        <Link
          to="/w/$id"
          params={{ id }}
          className="mt-5 flex h-14 items-center justify-center rounded-2xl bg-gradient-brand font-display text-base font-extrabold text-primary-foreground shadow-glow"
        >
          Back to the wall
        </Link>
        <Link to="/archive" className="mt-3 text-center text-xs font-bold text-primary">
          See everything you've kept
        </Link>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-dvh flex-col">
      {/* Fading grid of what's at stake */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[46vh] overflow-hidden">
        <div className="grid grid-cols-3 gap-1">
          {photos.map((p, i) => (
            <img
              key={p.id}
              src={eventCovers[p.cover]}
              alt=""
              aria-hidden
              loading="lazy"
              className={cn(
                "aspect-square w-full object-cover",
                i > 2 && "opacity-60",
                i > 5 && "opacity-30 blur-[2px]",
              )}
            />
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
      </div>

      <header className="relative z-10 flex items-center gap-2 px-4 py-3">
        <button
          onClick={() => navigate({ to: "/w/$id", params: { id } })}
          aria-label="Back to the wall"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-background/70 backdrop-blur active:bg-secondary"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </header>

      <main className="relative z-10 mt-[28vh] flex flex-1 flex-col px-5 pb-8">
        <div
          className={cn(
            "inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold",
            r.urgent ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
          )}
        >
          <Timer className="h-3.5 w-3.5" />
          {r.expired
            ? "Expired on free accounts"
            : daysLeft === 1
              ? "1 day left"
              : `${daysLeft} days left`}
        </div>

        <h1 className="mt-3 font-display text-[2.1rem] font-extrabold leading-[1.02]">
          {r.expired ? "These are already gone." : `${daysLeft} days left — keep them.`}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {stats.total} photos, {stats.contributors} people and every face tag from{" "}
          <span className="font-semibold text-foreground">{event?.title ?? "this event"}</span>.
          Free accounts keep a wall for {FREE_RETENTION_DAYS} days. Members keep every wall they
          were ever on.
        </p>

        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={cn("h-full rounded-full", r.urgent ? "bg-primary" : "bg-gradient-brand")}
            style={{ width: `${Math.round(r.progress * 100)}%` }}
          />
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          Day {r.ageDays} of {FREE_RETENTION_DAYS}
        </p>

        <ul className="mt-5 space-y-2">
          {[
            {
              icon: InfinityIcon,
              t: "Every wall kept forever",
              s: "Past, present and future events",
            },
            { icon: Download, t: "Full-resolution downloads", s: "Your photo pack, no watermark" },
            { icon: Users, t: "Face tags stay searchable", s: "Find the people you met again" },
            { icon: Sparkles, t: "No booking fees", s: "Members skip the fee on every ticket" },
          ].map((f) => (
            <li
              key={f.t}
              className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/80 p-3 backdrop-blur"
            >
              <f.icon className="h-4.5 w-4.5 shrink-0 text-accent" />
              <span className="min-w-0">
                <span className="block text-sm font-bold">{f.t}</span>
                <span className="block text-[11px] text-muted-foreground">{f.s}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-5 grid grid-cols-2 gap-2">
          {(["monthly", "yearly"] as MembershipPlan[]).map((p) => (
            <button
              key={p}
              onClick={() => setPlan(p)}
              className={cn(
                "relative rounded-2xl border p-3 text-left",
                plan === p ? "border-primary bg-primary/10" : "border-border bg-card",
              )}
            >
              {p === "yearly" && (
                <span className="absolute right-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-extrabold text-accent-foreground">
                  2 months free
                </span>
              )}
              <span className="block text-xs font-bold capitalize text-muted-foreground">{p}</span>
              <span className="mt-0.5 block font-display text-xl font-extrabold">
                £{(MEMBERSHIP_PRICES[p] / 100).toFixed(2)}
              </span>
              <span className="block text-[11px] text-muted-foreground">
                {p === "yearly" ? "per year" : "per month"}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            joinMembership(plan);
            keepForever(id);
            recordKeepReceipt({
              id: `keep-${id}-${Date.now()}`,
              eventId: id,
              plan,
              amount: price,
              when: new Date().toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              }),
              photos: stats.total,
              card: card?.label ?? "Apple Pay",
            });
            setDone(true);
          }}

          className="mt-4 flex h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-brand font-display text-base font-extrabold text-primary-foreground shadow-glow active:scale-[0.98]"
        >
          <Check className="h-5 w-5" strokeWidth={3} /> Keep them for £{(price / 100).toFixed(2)}
        </button>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Cancel any time — anything you've kept stays kept for 12 months after.
        </p>

        <Link
          to="/w/$id"
          params={{ id }}
          className="mt-3 text-center text-xs font-bold text-muted-foreground"
        >
          Not now, let them expire
        </Link>
      </main>
    </div>
  );
}
