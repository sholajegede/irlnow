import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Check, Sparkles, Users } from "lucide-react";
import { money } from "@/lib/tickets";
import { BID_PRESETS, estimateAttendance, myVenue } from "@/lib/venues";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/venue/fill")({
  head: () => ({
    meta: [
      { title: "Fill empty capacity — IRL NOW venue portal" },
      {
        name: "description",
        content:
          "Tell IRL NOW how many seats are empty and what a guest is worth. We fill them with nearby people tonight.",
      },
      { property: "og:title", content: "Fill empty capacity — IRL NOW" },
      { property: "og:description", content: "Publish spare seats, pay per attendee delivered." },
    ],
  }),
  component: FillCapacity,
});

const SLOTS = ["Tonight · 6:00pm", "Tonight · 7:00pm", "Tonight · 8:30pm", "Tomorrow · 1:00pm"];
const OFFERS = [
  "£10 small plate + a drink",
  "Two courses £18",
  "Free entry before 8pm",
  "20% off the whole table",
];

function FillCapacity() {
  const navigate = useNavigate();
  const { publishDrop } = useApp();
  const [step, setStep] = useState(0);
  const [slot, setSlot] = useState(SLOTS[1]!);
  const [seats, setSeats] = useState(30);
  const [offer, setOffer] = useState(OFFERS[0]!);
  const [bid, setBid] = useState(300);

  const reach = 1200 + seats * 30;
  const estimate = useMemo(() => estimateAttendance(seats, bid, reach), [seats, bid, reach]);
  const budget = estimate * bid;
  const takings = estimate * myVenue.avgSpend;

  const publish = () => {
    publishDrop({
      id: `drop-${Date.now()}`,
      title: `${seats} spots, ${slot.split("· ")[1]}`,
      offer,
      slot,
      seats,
      bid,
      budget,
      reach,
    });
    setStep(2);
  };

  return (
    <div className="flex min-h-dvh flex-col pb-12">
      <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur-xl">
        <Link to="/venue" className="rounded-full p-1.5 active:bg-secondary" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <p className="font-display text-lg font-extrabold tracking-tight">Fill empty capacity</p>
          <p className="text-xs text-muted-foreground">{myVenue.name}</p>
        </div>
      </header>

      {step === 2 ? (
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-brand shadow-glow">
            <Check className="h-7 w-7 text-primary-foreground" strokeWidth={3} />
          </span>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">You're live</h1>
          <p className="max-w-xs text-sm text-muted-foreground">
            {seats} spots at {slot.split("· ")[1]} are now in front of ~{reach.toLocaleString()}{" "}
            people nearby. You'll be charged {money(bid)} per person who turns up — nothing if
            nobody does.
          </p>
          <Link
            to="/venue"
            className="mt-2 rounded-2xl bg-gradient-brand px-6 py-3.5 font-display font-bold text-primary-foreground shadow-glow"
          >
            Back to the portal
          </Link>
        </main>
      ) : (
        <main className="flex flex-col gap-5 p-4">
          {step === 0 && (
            <>
              <section>
                <h2 className="font-display text-xl font-extrabold">What's empty?</h2>
                <p className="text-sm text-muted-foreground">
                  Spare capacity is perishable. Tell us what you've got.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {SLOTS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSlot(s)}
                      className={cn(
                        "rounded-full px-3.5 py-2 text-xs font-bold",
                        slot === s ? "bg-foreground text-background" : "bg-secondary",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </section>

              <section className="rounded-3xl border border-border bg-card p-4">
                <p className="text-sm font-bold">Seats to fill</p>
                <p className="font-display text-4xl font-extrabold">{seats}</p>
                <input
                  type="range"
                  min={5}
                  max={80}
                  step={5}
                  value={seats}
                  aria-label="Seats to fill"
                  onChange={(e) => setSeats(Number(e.target.value))}
                  className="mt-2 w-full accent-[hsl(var(--primary))]"
                />
              </section>

              <section>
                <p className="text-sm font-bold">The hook</p>
                <p className="text-xs text-muted-foreground">
                  People need a reason to leave the house right now.
                </p>
                <div className="mt-2 flex flex-col gap-2">
                  {OFFERS.map((o) => (
                    <button
                      key={o}
                      onClick={() => setOffer(o)}
                      className={cn(
                        "rounded-2xl border p-3 text-left text-sm font-semibold",
                        offer === o ? "border-primary bg-primary/10" : "border-border bg-card",
                      )}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </section>

              <button
                onClick={() => setStep(1)}
                className="rounded-2xl bg-gradient-brand py-3.5 font-display font-bold text-primary-foreground shadow-glow"
              >
                Next — what's a guest worth?
              </button>
            </>
          )}

          {step === 1 && (
            <>
              <section>
                <h2 className="font-display text-xl font-extrabold">What's a guest worth?</h2>
                <p className="text-sm text-muted-foreground">
                  You pay per person who actually turns up — not per impression. Bid higher and your
                  spots go in front of more nearby people.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {BID_PRESETS.map((b) => (
                    <button
                      key={b}
                      onClick={() => setBid(b)}
                      className={cn(
                        "rounded-full px-4 py-2 text-sm font-bold",
                        bid === b ? "bg-foreground text-background" : "bg-secondary",
                      )}
                    >
                      {money(b)}
                    </button>
                  ))}
                </div>
              </section>

              <section className="rounded-3xl border border-border bg-card p-4">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-accent" /> Forecast
                </p>
                <p className="mt-2 font-display text-4xl font-extrabold tracking-tight">
                  ~{estimate}{" "}
                  <span className="text-base font-bold text-muted-foreground">people in</span>
                </p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-secondary p-2">
                    <p className="font-display text-sm font-extrabold">{reach.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">people reached</p>
                  </div>
                  <div className="rounded-xl bg-secondary p-2">
                    <p className="font-display text-sm font-extrabold">{money(budget)}</p>
                    <p className="text-[10px] text-muted-foreground">max you'd pay</p>
                  </div>
                  <div className="rounded-xl bg-secondary p-2">
                    <p className="font-display text-sm font-extrabold text-accent">
                      {money(takings)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">est. takings</p>
                  </div>
                </div>
                <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
                  <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  At {money(bid)} a head against a £{(myVenue.avgSpend / 100).toFixed(0)} average
                  spend, every filled seat is roughly {(myVenue.avgSpend / bid).toFixed(1)}× what it
                  cost you.
                </p>
              </section>

              <div className="flex gap-2">
                <button
                  onClick={() => setStep(0)}
                  className="rounded-2xl bg-secondary px-5 py-3.5 font-bold"
                >
                  Back
                </button>
                <button
                  onClick={publish}
                  className="flex-1 rounded-2xl bg-gradient-brand py-3.5 font-display font-bold text-primary-foreground shadow-glow"
                >
                  Publish the drop
                </button>
              </div>
              <button
                onClick={() => navigate({ to: "/venue" })}
                className="text-xs font-semibold text-muted-foreground underline"
              >
                Cancel
              </button>
            </>
          )}
        </main>
      )}
    </div>
  );
}
