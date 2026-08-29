import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Building2, Check, TrendingUp } from "lucide-react";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

const AREAS = ["Shoreditch", "Peckham", "Soho", "Dalston", "Brixton", "Hackney Wick"];

export const Route = createFileRoute("/venue/claim")({
  head: () => ({
    meta: [
      { title: "Claim your venue — IRL NOW" },
      {
        name: "description",
        content:
          "List your quiet hours as capacity drops and only pay for the people who actually walk in.",
      },
      { property: "og:title", content: "Claim your venue — IRL NOW" },
      { property: "og:description", content: "Pay per attendee. Never for impressions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VenueClaim,
});

function VenueClaim() {
  const { venueClaim, claimVenue } = useApp();
  const [name, setName] = useState(venueClaim?.name ?? "");
  const [area, setArea] = useState(venueClaim?.area ?? AREAS[0]!);
  const [capacity, setCapacity] = useState(venueClaim?.capacity ?? 120);
  const [done, setDone] = useState(Boolean(venueClaim));

  if (done) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-8 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/15">
          <Check className="h-8 w-8 text-accent" strokeWidth={3} />
        </span>
        <h1 className="font-display text-2xl font-extrabold">
          {name || venueClaim?.name} is claimed
        </h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          We verify ownership within a day. Meanwhile you can already draft your first capacity
          drop.
        </p>
        <Link
          to="/venue/fill"
          className="mt-3 rounded-2xl bg-gradient-brand px-6 py-3.5 font-display text-sm font-bold text-primary-foreground shadow-glow"
        >
          Create a drop
        </Link>
        <Link to="/venue" className="text-xs font-bold text-primary">
          Go to your venue portal
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col pb-10">
      <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur-xl">
        <Link to="/venue" aria-label="Back" className="rounded-full p-1.5 active:bg-secondary">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <p className="font-display text-lg font-extrabold tracking-tight">Claim your venue</p>
      </header>

      <main className="flex-1 space-y-5 px-4 pt-4">
        <section className="rounded-3xl bg-gradient-brand p-5 text-primary-foreground shadow-glow">
          <Building2 className="h-7 w-7" />
          <h1 className="mt-2 font-display text-2xl font-extrabold leading-tight">
            Empty Tuesday? Sell it.
          </h1>
          <p className="mt-1 text-sm opacity-90">
            Post the hours you want filled. We send people who are already deciding where to go. You
            pay £1.80 per person who actually checks in — nothing for the rest.
          </p>
        </section>

        <label className="block rounded-2xl border border-border bg-card p-3">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Venue name
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="The Parallax"
            className="mt-1 w-full bg-transparent font-display text-lg font-bold outline-none"
          />
        </label>

        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Area
          </p>
          <div className="flex flex-wrap gap-1.5">
            {AREAS.map((a) => (
              <button
                key={a}
                onClick={() => setArea(a)}
                className={cn(
                  "rounded-full px-3.5 py-2 text-xs font-bold",
                  area === a
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground",
                )}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold">Capacity</p>
            <p className="font-display text-xl font-extrabold text-primary">{capacity}</p>
          </div>
          <input
            type="range"
            min={20}
            max={600}
            step={10}
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
            className="mt-3 w-full accent-[hsl(var(--primary))]"
          />
        </div>

        <div className="rounded-2xl border border-accent/30 bg-accent/10 p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent" />
            <p className="text-sm font-bold">Estimated for a quiet weeknight</p>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {Math.round(capacity * 0.28)}–{Math.round(capacity * 0.45)} people, about £
            {Math.round(capacity * 0.35 * 1.8)} in platform cost, roughly £
            {Math.round(capacity * 0.35 * 14)} across the bar.
          </p>
        </div>

        <button
          disabled={!name.trim()}
          onClick={() => {
            claimVenue({ name: name.trim(), area, capacity });
            setDone(true);
          }}
          className="h-14 w-full rounded-2xl bg-gradient-brand font-display font-bold text-primary-foreground shadow-glow disabled:opacity-40"
        >
          Claim venue
        </button>
      </main>
    </div>
  );
}
