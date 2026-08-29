import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Banknote, Building2, Check, Info, TrendingUp } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { hostedEventIds } from "@/lib/data";
import { money, payoutsFor } from "@/lib/tickets";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/host/payouts")({
  head: () => ({
    meta: [
      { title: "Payouts & fees — IRL NOW for organisers" },
      {
        name: "description",
        content:
          "See ticket revenue, platform fees and when money lands in your account for every event you host.",
      },
      { property: "og:title", content: "Payouts & fees — IRL NOW for organisers" },
      { property: "og:description", content: "Clear money, no surprises." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Payouts,
});

const statusStyle = {
  paid: "bg-accent/15 text-accent",
  processing: "bg-primary/15 text-primary",
  scheduled: "bg-secondary text-muted-foreground",
} as const;

function Payouts() {
  const rows = payoutsFor(hostedEventIds);
  const pending = rows.filter((r) => r.status !== "paid").reduce((a, r) => a + r.net, 0);
  const lifetime = rows.reduce((a, r) => a + r.net, 0);

  return (
    <div className="min-h-dvh bg-background pb-24">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-xl">
        <Link
          to="/host"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border"
          aria-label="Back to workspace"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-display text-lg font-bold">Payouts</h1>
          <p className="text-xs text-muted-foreground">Money in, fees out, nothing hidden</p>
        </div>
      </header>

      <div className="space-y-5 p-4">
        <div className="rounded-3xl border border-primary/30 bg-primary/10 p-5">
          <p className="text-xs uppercase tracking-[0.14em] text-primary">Next payout</p>
          <p className="mt-1 font-display text-4xl font-bold">{money(pending)}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Lands 3 working days after each event. Lifetime paid out {money(lifetime)}.
          </p>
        </div>

        <section className="space-y-2.5">
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Per event
          </h2>
          {rows.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-display font-bold">{r.eventTitle}</p>
                  <p className="text-xs text-muted-foreground">{r.date}</p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold capitalize",
                    statusStyle[r.status],
                  )}
                >
                  {r.status}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <Cell label="Tickets" value={money(r.gross)} />
                <Cell label="Fees" value={`−${money(r.fees)}`} />
                <Cell label="You get" value={money(r.net)} highlight />
              </div>
            </div>
          ))}
        </section>

        <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-accent" />
            <h2 className="font-display font-bold">How fees work</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            5% + 40p per paid ticket. Free events cost nothing, ever. Refunds return the fee too, so
            a cancelled night never leaves you out of pocket.
          </p>
          <ul className="space-y-1.5">
            {["No monthly fee", "No fee on free events", "Fees refunded on cancellations"].map(
              (t) => (
                <li key={t} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-accent" strokeWidth={3} /> {t}
                </li>
              ),
            )}
          </ul>
        </section>

        <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <h2 className="font-display font-bold">Payout account</h2>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-secondary px-3 py-3">
            <div>
              <p className="text-sm font-semibold">Monzo · •••• 8842</p>
              <p className="text-xs text-muted-foreground">Verified · GBP</p>
            </div>
            <Banknote className="h-5 w-5 text-muted-foreground" />
          </div>
          <button className="h-11 w-full rounded-xl border border-border text-sm font-semibold text-muted-foreground">
            Change payout account
          </button>
        </section>

        <div className="flex items-start gap-2.5 rounded-2xl border border-accent/30 bg-accent/10 p-4">
          <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <p className="text-sm text-muted-foreground">
            Events priced £10–£20 in your area sell out 2× faster than free ones — a small price
            makes people actually turn up.
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

function Cell({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-xl bg-secondary py-2">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("font-display font-bold", highlight && "text-accent")}>{value}</p>
    </div>
  );
}
