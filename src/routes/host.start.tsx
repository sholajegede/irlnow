import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BadgeCheck,
  Banknote,
  Check,
  Rocket,
  Sparkles,
  Ticket,
  Users,
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    id: "profile",
    icon: Sparkles,
    title: "Set up your organiser profile",
    body: "A photo, one line about what you run, and the area you run it in.",
    cta: "Add details",
    to: "/onboard",
  },
  {
    id: "verify",
    icon: BadgeCheck,
    title: "Verify your ID",
    body: "Required before you can sell tickets. Takes a minute, reviewed within a day.",
    cta: "Start verification",
    to: "/host",
  },
  {
    id: "payout",
    icon: Banknote,
    title: "Add a payout account",
    body: "Where your ticket money lands. Paid out three days after each event.",
    cta: "Add account",
    to: "/host/payouts",
  },
  {
    id: "first",
    icon: Ticket,
    title: "Publish your first event",
    body: "Free events go live instantly. Paid events go live once you're verified.",
    cta: "Create event",
    to: "/create",
  },
] as const;

export const Route = createFileRoute("/host/start")({
  head: () => ({
    meta: [
      { title: "Start hosting — IRL NOW" },
      {
        name: "description",
        content:
          "Four steps to your first event on IRL NOW: profile, ID verification, payouts and publishing.",
      },
      { property: "og:title", content: "Start hosting — IRL NOW" },
      { property: "og:description", content: "From nothing to a full room." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HostStart,
});

function HostStart() {
  const { hostOnboardSteps, completeHostStep } = useApp();
  const doneCount = hostOnboardSteps.length;
  const pct = Math.round((doneCount / STEPS.length) * 100);

  return (
    <div className="flex min-h-dvh flex-col pb-24">
      <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur-xl">
        <Link to="/host" aria-label="Back" className="rounded-full p-1.5 active:bg-secondary">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <p className="font-display text-lg font-extrabold tracking-tight">Start hosting</p>
          <p className="text-xs text-muted-foreground">
            {doneCount} of {STEPS.length} done
          </p>
        </div>
      </header>

      <main className="flex-1 space-y-5 px-4 pt-4">
        <section className="rounded-3xl bg-gradient-brand p-5 text-primary-foreground shadow-glow">
          <Rocket className="h-7 w-7" />
          <h1 className="mt-2 font-display text-2xl font-extrabold leading-tight">
            The first 30 people are the hard part
          </h1>
          <p className="mt-1 text-sm opacity-90">
            IRL NOW puts your event in front of people already going out in your area tonight. You
            bring the room, we bring the demand.
          </p>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-background/25">
            <div className="h-full rounded-full bg-background" style={{ width: `${pct}%` }} />
          </div>
        </section>

        <div className="flex flex-col gap-2">
          {STEPS.map((s, i) => {
            const done = hostOnboardSteps.includes(s.id);
            return (
              <div
                key={s.id}
                className={cn(
                  "rounded-3xl border p-4",
                  done ? "border-accent/40 bg-accent/10" : "border-border bg-card",
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
                      done ? "bg-accent text-accent-foreground" : "bg-secondary text-primary",
                    )}
                  >
                    {done ? (
                      <Check className="h-5 w-5" strokeWidth={3} />
                    ) : (
                      <s.icon className="h-5 w-5" />
                    )}
                  </span>
                  <div className="flex-1">
                    <p className="font-display text-base font-extrabold">
                      {i + 1}. {s.title}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{s.body}</p>
                    {!done && (
                      <div className="mt-3 flex gap-2">
                        <Link
                          to={s.to}
                          onClick={() => completeHostStep(s.id)}
                          className="rounded-full bg-gradient-brand px-4 py-2 text-xs font-bold text-primary-foreground"
                        >
                          {s.cta}
                        </Link>
                        <button
                          onClick={() => completeHostStep(s.id)}
                          className="rounded-full bg-secondary px-4 py-2 text-xs font-bold text-muted-foreground"
                        >
                          Mark done
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <section className="rounded-3xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h2 className="font-display text-sm font-extrabold uppercase tracking-wider">
              What it costs
            </h2>
          </div>
          <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
            <li>· Free events: free, always.</li>
            <li>· Paid tickets: 6% + 30p, taken from the booking fee, not your price.</li>
            <li>· Boosting reach: optional, from £8 per event.</li>
          </ul>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
