import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Check, Plus, Receipt as ReceiptIcon, Sparkles, Trash2 } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { MethodPicker, PaymentMethodSheet } from "@/components/PaymentMethodSheet";
import { useApp } from "@/lib/store";
import { getEvent } from "@irlnow/domain";
import { money } from "@irlnow/domain";
import { MEMBERSHIP_PRICES } from "@irlnow/domain";
import { capacityDrops } from "@irlnow/domain";
import type { Receipt } from "@irlnow/domain";

export const Route = createFileRoute("/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet & receipts — IRL NOW" },
      {
        name: "description",
        content:
          "Your payment methods, ticket receipts, membership charges and refunds in one place.",
      },
      { property: "og:title", content: "Wallet & receipts — IRL NOW" },
      { property: "og:description", content: "Everything you've paid for, in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WalletPage,
});

function WalletPage() {
  const { cards, defaultCardId, setDefaultCard, removeCard, orders, membership, claimedDropIds } =
    useApp();
  const [adding, setAdding] = useState(false);

  const receipts = useMemo<Receipt[]>(() => {
    const out: Receipt[] = [];
    for (const order of Object.values(orders)) {
      const event = getEvent(order.eventId);
      out.push({
        id: `r-${order.eventId}`,
        title: event?.title ?? "Ticket",
        sub: `${order.tierName} × ${order.qty}${order.fee ? ` · inc. ${money(order.fee)} fee` : " · fee waived"}`,
        amount: order.total,
        when: order.purchasedAt,
        kind: "ticket",
      });
    }
    if (membership) {
      out.push({
        id: "r-membership",
        title: "IRL NOW+",
        sub: `${membership.plan === "monthly" ? "Monthly" : "Yearly"} · renews ${membership.renewsOn}`,
        amount: MEMBERSHIP_PRICES[membership.plan],
        when: membership.startedAt,
        kind: "membership",
      });
    }
    for (const id of claimedDropIds) {
      const drop = capacityDrops.find((d) => d.id === id);
      if (drop) {
        out.push({
          id: `r-${id}`,
          title: drop.title,
          sub: `Venue drop · ${drop.area} · ${drop.offer} — venue pays, you don't`,
          amount: 0,
          when: drop.slot,
          kind: "drop",
        });
      }
    }
    out.push({
      id: "r-past-1",
      title: "Peckham Supper Club",
      sub: "General · 1 ticket",
      amount: 2840,
      when: "last month",
      kind: "ticket",
    });
    out.push({
      id: "r-past-refund",
      title: "Canal Boat Session — refunded",
      sub: "Host cancelled · fee returned",
      amount: -1850,
      when: "last month",
      kind: "refund",
    });
    return out;
  }, [orders, membership, claimedDropIds]);

  const spent = receipts.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="min-h-dvh pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border/60 bg-background/85 px-4 py-3 backdrop-blur-xl">
        <Link
          to="/you"
          aria-label="Back"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display text-lg font-extrabold">Wallet</h1>
      </header>

      <main className="space-y-6 p-4">
        <section className="rounded-3xl border border-border/60 bg-card p-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Spent going out
          </p>
          <p className="font-display text-3xl font-extrabold">{money(spent)}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Across {receipts.length} payments
            {membership ? " — booking fees waived by IRL NOW+" : ""}.
          </p>
          {!membership && (
            <Link
              to="/membership"
              className="mt-3 flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-brand text-sm font-bold text-primary-foreground shadow-glow"
            >
              <Sparkles className="h-4 w-4" /> Stop paying booking fees
            </Link>
          )}
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Payment methods
            </h2>
            <button
              onClick={() => setAdding(true)}
              className="flex items-center gap-1 text-xs font-bold text-primary"
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </div>
          {cards.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
            >
              <span className="flex h-9 w-12 items-center justify-center rounded-lg bg-secondary text-[10px] font-bold uppercase tracking-wider">
                {m.kind === "applepay" ? "Pay" : m.label.slice(0, 4)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">
                  {m.kind === "applepay" ? "Apple Pay" : `${m.label} ···· ${m.last4}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {m.id === defaultCardId ? "Default" : m.expiry ? `Expires ${m.expiry}` : "Wallet"}
                </p>
              </div>
              {m.id === defaultCardId ? (
                <Check className="h-4 w-4 text-primary" strokeWidth={3} />
              ) : (
                <button
                  onClick={() => setDefaultCard(m.id)}
                  className="rounded-full bg-secondary px-3 py-1.5 text-xs font-bold"
                >
                  Make default
                </button>
              )}
              <button
                onClick={() => removeCard(m.id)}
                aria-label={`Remove ${m.label}`}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {cards.length === 0 && (
            <button
              onClick={() => setAdding(true)}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border text-sm font-semibold text-muted-foreground"
            >
              <Plus className="h-4 w-4" /> Add a payment method
            </button>
          )}
        </section>

        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Receipts
          </h2>
          {receipts.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary">
                <ReceiptIcon className="h-4 w-4 text-muted-foreground" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{r.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {r.sub} · {r.when}
                </p>
              </div>
              <span
                className={
                  r.amount < 0 ? "font-display font-bold text-accent" : "font-display font-bold"
                }
              >
                {r.amount < 0 ? `+${money(-r.amount)}` : money(r.amount)}
              </span>
            </div>
          ))}
          <p className="pt-1 text-xs text-muted-foreground">
            Demo wallet — figures are illustrative and nothing is charged.
          </p>
        </section>
      </main>

      <PaymentMethodSheet open={adding} onClose={() => setAdding(false)} />
      <BottomNav />
    </div>
  );
}
