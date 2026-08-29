import { useMemo, useState } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, CreditCard, Lock, Minus, Plus, ShieldCheck, Ticket } from "lucide-react";
import { eventCovers, getEvent } from "@/lib/data";
import { useApp } from "@/lib/store";
import {
  feeFor,
  money,
  questionsFor,
  ticketCode,
  tiersFor,
  type RegQuestion,
  type TicketTier,
} from "@/lib/tickets";
import { MethodPicker, PaymentMethodSheet } from "@/components/PaymentMethodSheet";
import { AUTH_STAGES } from "@/lib/payments";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkout/$id")({
  loader: ({ params }) => {
    const event = getEvent(params.id);
    if (!event) throw notFound();
    return { event };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Checkout unavailable | IRL NOW" }, { name: "robots", content: "noindex" }] };
    }
    const t = `Get your ticket — ${loaderData.event.title} | IRL NOW`;
    return {
      meta: [
        { title: t },
        {
          name: "description",
          content: `Pick a ticket, answer a couple of questions from the host and you're on the door list for ${loaderData.event.title}.`,
        },
        { property: "og:title", content: t },
        { property: "og:description", content: "Two taps to a real plan." },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  component: Checkout,
});

type Step = "tier" | "questions" | "pay" | "done";

function Checkout() {
  const { event } = Route.useLoaderData();
  const navigate = useNavigate();
  const { placeOrder, name, orders, membership, cards, defaultCardId } = useApp();
  const tiers = useMemo(() => tiersFor(event), [event]);
  const questions = useMemo(() => questionsFor(event), [event]);

  const existing = orders[event.id];
  const [step, setStep] = useState<Step>(existing ? "done" : "tier");
  const [tierId, setTierId] = useState(tiers[0]!.id);
  const [qty, setQty] = useState(1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [paying, setPaying] = useState(false);
  const [stage, setStage] = useState(-1);
  const [methodId, setMethodId] = useState(defaultCardId);
  const [addingCard, setAddingCard] = useState(false);
  const method = cards.find((c) => c.id === methodId) ?? cards[0];

  const tier = tiers.find((t) => t.id === tierId)!;
  const subtotal = tier.price * qty;
  const fee = membership ? 0 : feeFor(subtotal);
  const total = subtotal + fee;
  const code = ticketCode(event.id);

  const missing = questions.filter((q) => q.required && !answers[q.id]);

  const confirm = () => {
    setPaying(true);
    setStage(0);
    window.setTimeout(() => setStage(1), 700);
    window.setTimeout(() => setStage(2), 1400);
    window.setTimeout(() => {
      placeOrder({
        eventId: event.id,
        tierId: tier.id,
        tierName: tier.name,
        qty,
        subtotal,
        fee,
        total,
        code,
        answers,
        purchasedAt: "just now",
      });
      setPaying(false);
      setStage(-1);
      setStep("done");
    }, 2100);
  };

  return (
    <div className="min-h-dvh bg-background pb-28">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-xl">
        <Link
          to="/event/$id"
          params={{ id: event.id }}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border"
          aria-label="Back to event"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-lg font-bold">
            {step === "done" ? "You're in" : "Get your ticket"}
          </h1>
          <p className="truncate text-xs text-muted-foreground">{event.title}</p>
        </div>
        {step !== "done" && (
          <span className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
            <Lock className="h-3 w-3" /> Secure
          </span>
        )}
      </header>

      {step !== "done" && (
        <div className="flex gap-1.5 px-4 pt-4">
          {(["tier", "questions", "pay"] as Step[]).map((s, i) => (
            <div
              key={s}
              className={cn(
                "h-1 flex-1 rounded-full",
                ["tier", "questions", "pay"].indexOf(step) >= i ? "bg-primary" : "bg-secondary",
              )}
            />
          ))}
        </div>
      )}

      <div className="space-y-5 px-4 py-5">
        {step === "tier" && (
          <>
            <div className="flex gap-3 rounded-2xl border border-border bg-card p-3">
              <img
                src={eventCovers[event.cover]}
                alt=""
                className="h-16 w-16 rounded-xl object-cover"
                loading="lazy"
              />
              <div className="min-w-0">
                <p className="font-display font-bold leading-tight">{event.title}</p>
                <p className="text-xs text-muted-foreground">{event.dateLabel}</p>
                <p className="truncate text-xs text-muted-foreground">{event.location}</p>
              </div>
            </div>

            <section className="space-y-2.5">
              <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Choose a ticket
              </h2>
              {tiers.map((t) => (
                <TierCard key={t.id} tier={t} active={t.id === tierId} onSelect={() => setTierId(t.id)} />
              ))}
            </section>

            <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
              <div>
                <p className="font-semibold">How many?</p>
                <p className="text-xs text-muted-foreground">Max 4 per person.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border disabled:opacity-40"
                  disabled={qty === 1}
                  aria-label="Fewer tickets"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-5 text-center font-display text-lg font-bold">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(4, q + 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border disabled:opacity-40"
                  disabled={qty === 4}
                  aria-label="More tickets"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}

        {step === "questions" && (
          <>
            <div className="rounded-2xl border border-accent/30 bg-accent/10 p-4">
              <p className="font-display font-bold text-accent">{event.host} asks</p>
              <p className="mt-1 text-sm text-muted-foreground">
                A couple of quick things so the night actually works for you.
              </p>
            </div>
            {questions.map((q) => (
              <QuestionField
                key={q.id}
                q={q}
                value={answers[q.id] ?? ""}
                onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
              />
            ))}
            <p className="text-xs text-muted-foreground">
              Answers go to the host only — never onto your public profile.
            </p>
          </>
        )}

        {step === "pay" && (
          <>
            <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
              <Row label={`${tier.name} × ${qty}`} value={money(subtotal)} />
              <Row
                label={membership ? "Booking fee (IRL NOW+ waived)" : "Booking fee"}
                value={membership && subtotal > 0 ? "£0 · waived" : money(fee)}
                muted
              />
              <div className="border-t border-border pt-3">
                <Row label="Total" value={money(total)} bold />
              </div>
            </section>

            <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                <p className="font-display font-bold">Pay with</p>
              </div>
              <MethodPicker
                selectedId={methodId}
                onSelect={setMethodId}
                onAddNew={() => setAddingCard(true)}
              />
              <p className="text-xs text-muted-foreground">
                Demo checkout — no card is charged in this prototype.
              </p>
            </section>

            {paying && (
              <section className="space-y-2 rounded-2xl border border-primary/40 bg-primary/10 p-4">
                {AUTH_STAGES.map((s, i) => (
                  <p
                    key={s.id}
                    className={cn(
                      "flex items-center gap-2 text-sm font-semibold",
                      i <= stage ? "text-foreground" : "text-muted-foreground/60",
                    )}
                  >
                    {i < stage ? (
                      <Check className="h-4 w-4 text-accent" strokeWidth={3} />
                    ) : (
                      <span
                        className={cn(
                          "h-3.5 w-3.5 rounded-full border-2",
                          i === stage ? "animate-pulse border-primary bg-primary/40" : "border-border",
                        )}
                      />
                    )}
                    {s.label}
                  </p>
                ))}
              </section>
            )}

            <div className="flex items-start gap-2.5 rounded-2xl border border-border bg-card p-4">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <p className="text-xs text-muted-foreground">
                Full refund up to 24 hours before. If the host cancels, you're refunded automatically —
                fee included.
              </p>
            </div>
          </>
        )}

        {step === "done" && <Done event={event} code={existing?.code ?? code} name={name} />}
      </div>

      {step !== "done" && (
        <div className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 border-t border-border bg-background/90 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-xl">
          {step === "tier" && (
            <button
              onClick={() => setStep(questions.length ? "questions" : "pay")}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-brand font-display text-lg font-bold text-primary-foreground shadow-glow active:scale-[0.98]"
            >
              Continue · {money(total)}
            </button>
          )}
          {step === "questions" && (
            <button
              onClick={() => setStep("pay")}
              disabled={missing.length > 0}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-brand font-display text-lg font-bold text-primary-foreground shadow-glow disabled:opacity-40 active:scale-[0.98]"
            >
              {missing.length ? `${missing.length} left to answer` : "Continue to pay"}
            </button>
          )}
          {step === "pay" && (
            <button
              onClick={confirm}
              disabled={paying}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-brand font-display text-lg font-bold text-primary-foreground shadow-glow disabled:opacity-70 active:scale-[0.98]"
            >
              {paying
                ? "Confirming…"
                : total === 0
                  ? "Confirm my spot"
                  : method?.kind === "applepay"
                    ? `Pay ${money(total)} with Apple Pay`
                    : `Pay ${money(total)}`}
            </button>
          )}
          {step !== "tier" && (
            <button
              onClick={() => setStep(step === "pay" ? (questions.length ? "questions" : "tier") : "tier")}
              className="mt-2 h-9 w-full text-sm font-semibold text-muted-foreground"
            >
              Back
            </button>
          )}
        </div>
      )}

      <PaymentMethodSheet
        open={addingCard}
        onClose={() => setAddingCard(false)}
        onAdded={(id) => setMethodId(id)}
      />

      {step === "done" && (
        <div className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 border-t border-border bg-background/90 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-xl">
          <div className="flex gap-2.5">
            <Link
              to="/ticket/$id"
              params={{ id: event.id }}
              className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-brand font-display text-lg font-bold text-primary-foreground shadow-glow active:scale-[0.98]"
            >
              <Ticket className="h-5 w-5" /> See my ticket
            </Link>
            <button
              onClick={() => navigate({ to: "/going" })}
              className="h-14 rounded-2xl border border-border px-4 text-sm font-semibold text-muted-foreground"
            >
              Agenda
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TierCard({ tier, active, onSelect }: { tier: TicketTier; active: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full rounded-2xl border p-4 text-left transition-colors",
        active ? "border-primary bg-primary/10" : "border-border bg-card",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display font-bold">{tier.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{tier.blurb}</p>
        </div>
        <span className="shrink-0 font-display text-lg font-bold">{money(tier.price)}</span>
      </div>
      {tier.perks && (
        <ul className="mt-2.5 space-y-1">
          {tier.perks.map((p) => (
            <li key={p} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Check className="h-3 w-3 text-accent" strokeWidth={3} /> {p}
            </li>
          ))}
        </ul>
      )}
      <p className={cn("mt-2 text-[11px] font-semibold", tier.left <= 5 ? "text-primary" : "text-muted-foreground")}>
        {tier.left <= 5 ? `Only ${tier.left} left` : `${tier.left} available`}
      </p>
    </button>
  );
}

function QuestionField({
  q,
  value,
  onChange,
}: {
  q: RegQuestion;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2 rounded-2xl border border-border bg-card p-4">
      <div>
        <p className="font-semibold">
          {q.label}{" "}
          {!q.required && <span className="text-xs font-normal text-muted-foreground">(optional)</span>}
        </p>
        {q.hint && <p className="text-xs text-muted-foreground">{q.hint}</p>}
      </div>
      {q.type === "short" ? (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type here…"
          className="h-11 w-full rounded-xl border border-border bg-secondary px-3 text-sm outline-none focus:border-primary"
        />
      ) : (
        <div className="flex flex-wrap gap-2">
          {q.options?.map((o) => (
            <button
              key={o}
              onClick={() => onChange(o)}
              className={cn(
                "rounded-full border px-3 py-2 text-sm font-semibold transition-colors",
                value === o ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground",
              )}
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, muted, bold }: { label: string; value: string; muted?: boolean; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={cn("text-sm", muted ? "text-muted-foreground" : "")}>{label}</span>
      <span className={cn(bold ? "font-display text-lg font-bold" : "text-sm font-semibold")}>{value}</span>
    </div>
  );
}

function Done({ event, code, name }: { event: ReturnType<typeof getEvent> & object; code: string; name: string }) {
  return (
    <div className="space-y-5 pt-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/20">
        <Check className="h-8 w-8 text-accent" strokeWidth={3} />
      </div>
      <div>
        <h2 className="font-display text-2xl font-bold">
          {name ? `${name}, you're on the list` : "You're on the list"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {event.title} · {event.dateLabel}
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Door code</p>
        <p className="mt-1 font-display text-3xl font-bold tracking-[0.1em] text-primary">{code}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Show this at the door, or let them scan your ticket QR.
        </p>
      </div>
    </div>
  );
}
