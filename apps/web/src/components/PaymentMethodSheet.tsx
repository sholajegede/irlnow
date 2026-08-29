import { useState } from "react";
import { Check, CreditCard, Lock, Plus, X } from "lucide-react";
import {
  formatCardNumber,
  formatExpiry,
  methodFromDraft,
  validateCard,
  type CardDraft,
} from "@irlnow/domain";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

const empty: CardDraft = { number: "", expiry: "", cvc: "", name: "", postcode: "" };

/** Add-a-card sheet. Demo only — nothing is transmitted or stored off-device. */
export function PaymentMethodSheet({
  open,
  onClose,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  onAdded?: (id: string) => void;
}) {
  const { addCard } = useApp();
  const [draft, setDraft] = useState<CardDraft>(empty);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const set = (k: keyof CardDraft, v: string) => setDraft((d) => ({ ...d, [k]: v }));

  const save = () => {
    const problem = validateCard(draft);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setSaving(true);
    window.setTimeout(() => {
      const method = methodFromDraft(draft);
      addCard(method);
      setSaving(false);
      setDraft(empty);
      onAdded?.(method.id);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-background/70 backdrop-blur-sm">
      <div className="w-full max-w-md space-y-3 rounded-t-3xl border-t border-border bg-card p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-lg font-extrabold">
            <CreditCard className="h-4 w-4 text-primary" /> Add a card
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <input
          inputMode="numeric"
          value={draft.number}
          onChange={(e) => set("number", formatCardNumber(e.target.value))}
          placeholder="Card number"
          className="h-12 w-full rounded-xl border border-border bg-secondary px-3 text-sm outline-none focus:border-primary"
        />
        <div className="flex gap-2">
          <input
            inputMode="numeric"
            value={draft.expiry}
            onChange={(e) => set("expiry", formatExpiry(e.target.value))}
            placeholder="MM/YY"
            className="h-12 w-full rounded-xl border border-border bg-secondary px-3 text-sm outline-none focus:border-primary"
          />
          <input
            inputMode="numeric"
            value={draft.cvc}
            onChange={(e) => set("cvc", e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="CVC"
            className="h-12 w-full rounded-xl border border-border bg-secondary px-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <input
          value={draft.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Name on card"
          className="h-12 w-full rounded-xl border border-border bg-secondary px-3 text-sm outline-none focus:border-primary"
        />
        <input
          value={draft.postcode}
          onChange={(e) => set("postcode", e.target.value.toUpperCase())}
          placeholder="Billing postcode (optional)"
          className="h-12 w-full rounded-xl border border-border bg-secondary px-3 text-sm outline-none focus:border-primary"
        />

        {error && <p className="text-xs font-semibold text-primary">{error}</p>}

        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" /> Demo wallet — no card is charged or sent anywhere.
        </p>

        <button
          onClick={save}
          disabled={saving}
          className={cn(
            "flex h-13 h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-brand font-display text-base font-bold text-primary-foreground shadow-glow active:scale-[0.98]",
            saving && "opacity-70",
          )}
        >
          {saving ? (
            "Saving…"
          ) : (
            <>
              <Plus className="h-4 w-4" /> Save card
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/** Compact picker used in checkout and membership. */
export function MethodPicker({
  selectedId,
  onSelect,
  onAddNew,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
  onAddNew: () => void;
}) {
  const { cards } = useApp();
  return (
    <div className="space-y-2">
      {cards.map((m) => (
        <button
          key={m.id}
          onClick={() => onSelect(m.id)}
          className={cn(
            "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors",
            selectedId === m.id ? "border-primary bg-primary/10" : "border-border bg-card",
          )}
        >
          <span className="flex h-9 w-12 items-center justify-center rounded-lg bg-secondary text-[10px] font-bold uppercase tracking-wider">
            {m.kind === "applepay" ? "Pay" : m.label.slice(0, 4)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold">
              {m.kind === "applepay" ? "Apple Pay" : `${m.label} ···· ${m.last4}`}
            </span>
            {m.expiry && (
              <span className="block text-xs text-muted-foreground">Expires {m.expiry}</span>
            )}
          </span>
          {selectedId === m.id && (
            <Check className="h-4 w-4 shrink-0 text-primary" strokeWidth={3} />
          )}
        </button>
      ))}
      <button
        onClick={onAddNew}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border text-sm font-semibold text-muted-foreground"
      >
        <Plus className="h-4 w-4" /> Add another card
      </button>
    </div>
  );
}
