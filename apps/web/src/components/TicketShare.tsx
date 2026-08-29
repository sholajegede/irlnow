import { Check, Send, UserPlus, Users, X } from "lucide-react";
import { useState } from "react";
import { transferCode } from "@irlnow/domain";
import type { IrlEvent } from "@irlnow/domain";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

type Mode = "none" | "plus" | "transfer";

/** Assign a +1 or hand your whole ticket to someone else. */
export function TicketShare({ event }: { event: IrlEvent }) {
  const { plusOnes, setPlusOne, removePlusOne, transfers, transferTicket, cancelTransfer } =
    useApp();
  const [mode, setMode] = useState<Mode>("none");
  const [who, setWho] = useState("");
  const [contact, setContact] = useState("");

  const plusOne = plusOnes[event.id];
  const transfer = transfers[event.id];

  if (transfer) {
    return (
      <section className="rounded-2xl border border-accent/40 bg-accent/10 p-4">
        <p className="font-display text-base font-bold text-accent">
          Ticket sent to {transfer.toName}
        </p>
        <p className="mt-1 text-sm text-foreground/85">
          They have a claim link and the code <span className="font-bold">{transfer.code}</span>.
          Your door QR stopped working the moment you sent it.
        </p>
        <button
          onClick={() => cancelTransfer(event.id)}
          className="mt-3 h-10 w-full rounded-xl border border-border text-xs font-bold"
        >
          Take it back
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <h2 className="flex items-center gap-1.5 font-display text-base font-bold">
        <Users className="h-4 w-4 text-primary" /> Bringing someone, or can't go?
      </h2>

      {plusOne ? (
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-secondary p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/20">
            <Check className="h-4 w-4 text-accent" strokeWidth={3} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">+1 assigned to {plusOne.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              They get their own door code at {plusOne.contact || "their number"}
            </p>
          </div>
          <button
            onClick={() => removePlusOne(event.id)}
            className="rounded-full p-1.5 text-muted-foreground active:bg-background"
            aria-label="Remove plus one"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {mode === "none" ? (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => {
              setMode("plus");
              setWho("");
              setContact("");
            }}
            className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-secondary text-xs font-bold"
          >
            <UserPlus className="h-4 w-4" /> {plusOne ? "Change +1" : "Assign my +1"}
          </button>
          <button
            onClick={() => {
              setMode("transfer");
              setWho("");
              setContact("");
            }}
            className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-secondary text-xs font-bold"
          >
            <Send className="h-4 w-4" /> Transfer ticket
          </button>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            {mode === "plus"
              ? "They'll get their own QR — no need to arrive together."
              : "Your spot moves to them. Free transfers up to doors opening."}
          </p>
          <input
            value={who}
            onChange={(e) => setWho(e.target.value)}
            placeholder="Their name"
            className="h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
          />
          <input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="Phone or email"
            className="h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
          />
          <div className="flex gap-2">
            <button
              disabled={!who.trim()}
              onClick={() => {
                if (mode === "plus") {
                  setPlusOne({ eventId: event.id, name: who.trim(), contact: contact.trim() });
                } else {
                  transferTicket({
                    eventId: event.id,
                    toName: who.trim(),
                    toContact: contact.trim(),
                    code: transferCode(event.id, who.trim()),
                    claimed: false,
                  });
                }
                setMode("none");
              }}
              className={cn(
                "h-11 flex-1 rounded-xl font-display text-sm font-bold",
                who.trim()
                  ? "bg-gradient-brand text-primary-foreground shadow-glow"
                  : "bg-secondary text-muted-foreground",
              )}
            >
              {mode === "plus" ? "Send their code" : "Send the ticket"}
            </button>
            <button
              onClick={() => setMode("none")}
              className="h-11 rounded-xl border border-border px-4 text-xs font-semibold text-muted-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
