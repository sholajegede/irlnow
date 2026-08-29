import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, CreditCard, Receipt } from "lucide-react";
import { venueInvoices } from "@irlnow/domain";
import { money } from "@irlnow/domain";
import { myVenue } from "@irlnow/domain";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/venue/billing")({
  head: () => ({
    meta: [
      { title: "Venue billing — pay per attendee delivered | IRL NOW" },
      {
        name: "description",
        content:
          "Weekly invoices for the people IRL NOW sent through your door. No subscription, no listing fee — you pay per attendee.",
      },
      { property: "og:title", content: "Venue billing — IRL NOW" },
      { property: "og:description", content: "Weekly pay-per-attendee invoices for your venue." },
    ],
  }),
  component: VenueBilling,
});

function VenueBilling() {
  const { claimedDropIds, paidInvoices, payInvoice } = useApp();
  const extras = Object.fromEntries(claimedDropIds.map((id) => [id, 1]));
  const invoices = venueInvoices(extras);
  const outstanding = invoices
    .filter((i) => i.status === "due" && !paidInvoices.includes(i.id))
    .reduce((s, i) => s + i.amount, 0);

  return (
    <div className="flex min-h-dvh flex-col pb-12">
      <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur-xl">
        <Link to="/venue" className="rounded-full p-1.5 active:bg-secondary" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <p className="font-display text-lg font-extrabold tracking-tight">Billing</p>
          <p className="text-xs text-muted-foreground">{myVenue.name} · pay per attendee</p>
        </div>
      </header>

      <main className="flex flex-col gap-5 p-4">
        <section className="rounded-3xl border border-border bg-card p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Outstanding
          </p>
          <p className="mt-1 font-display text-4xl font-extrabold tracking-tight">
            {money(outstanding)}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            No subscription, no listing fee. You're charged only for people who claimed a spot and
            turned up.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-display text-xl font-extrabold">Invoices</h2>
          {invoices.map((inv) => {
            const paid = inv.status === "paid" || paidInvoices.includes(inv.id);
            return (
              <div key={inv.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display font-bold">{inv.period}</p>
                    <p className="text-xs text-muted-foreground">
                      {inv.attendees} attendees delivered ·{" "}
                      {inv.attendees ? money(Math.round(inv.amount / inv.attendees)) : money(0)}{" "}
                      each
                    </p>
                  </div>
                  <p className="font-display text-lg font-extrabold">{money(inv.amount)}</p>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider",
                      paid
                        ? "bg-accent/15 text-accent"
                        : inv.status === "due"
                          ? "bg-primary/15 text-primary"
                          : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {paid ? "Paid" : inv.status === "due" ? "Due" : "In progress"}
                  </span>
                  {!paid && inv.status === "due" && (
                    <button
                      onClick={() => payInvoice(inv.id)}
                      className="flex items-center gap-1.5 rounded-full bg-gradient-brand px-4 py-2 text-xs font-bold text-primary-foreground shadow-glow"
                    >
                      <CreditCard className="h-3.5 w-3.5" /> Pay {money(inv.amount)}
                    </button>
                  )}
                  {paid && (
                    <span className="flex items-center gap-1 text-xs font-bold text-accent">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} /> Settled
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </section>

        <section className="rounded-3xl border border-border bg-secondary p-4">
          <p className="flex items-center gap-2 font-display font-bold">
            <Receipt className="h-4 w-4 text-primary" /> How pricing works
          </p>
          <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-xs text-muted-foreground">
            <li>You set the bid per attendee when you publish a capacity drop.</li>
            <li>Higher bids get better placement with nearby people who are still deciding.</li>
            <li>A no-show is never billed — attendance is confirmed at your door.</li>
            <li>Invoices settle weekly on Monday. Demo billing, no card charged.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
