import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, Check, Megaphone, Pencil, Send, Undo2 } from "lucide-react";
import { getEvent } from "@/lib/data";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

const CANCEL_REASONS = [
  "Not enough people signed up",
  "Venue pulled out",
  "Illness",
  "Weather",
  "Rescheduling to another date",
];

export const Route = createFileRoute("/host/edit/$id")({
  head: () => ({
    meta: [
      { title: "Edit event — IRL NOW" },
      {
        name: "description",
        content:
          "Change the details, message everyone who's going, or cancel and refund in one place.",
      },
      { property: "og:title", content: "Edit event — IRL NOW" },
      { property: "og:description", content: "Update, broadcast or cancel — guests are told instantly." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EditEventPage,
});

function EditEventPage() {
  const { id } = Route.useParams();
  const event = getEvent(id);
  const {
    eventEdits,
    saveEventEdit,
    broadcasts,
    sendBroadcast,
    cancelledEvents,
    cancelEvent,
    restoreEvent,
  } = useApp();

  const saved = eventEdits[id];
  const [title, setTitle] = useState(saved?.title ?? event?.title ?? "");
  const [time, setTime] = useState(saved?.time ?? event?.dateLabel ?? "");
  const [location, setLocation] = useState(saved?.location ?? event?.location ?? "");
  const [note, setNote] = useState(saved?.note ?? "");
  const [savedFlash, setSavedFlash] = useState(false);

  const [msg, setMsg] = useState("");
  const [urgent, setUrgent] = useState(false);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [cancelMsg, setCancelMsg] = useState("");
  const [refund, setRefund] = useState(true);

  const cancelled = cancelledEvents[id];
  const mine = broadcasts.filter((b) => b.eventId === id);
  const going = event?.goingCount ?? 0;

  return (
    <div className="flex min-h-dvh flex-col pb-16">
      <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur-xl">
        <Link to="/host/$id" params={{ id }} aria-label="Back" className="rounded-full p-1.5 active:bg-secondary">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-extrabold tracking-tight">Manage event</p>
          <p className="truncate text-xs text-muted-foreground">{event?.title ?? id}</p>
        </div>
      </header>

      <main className="flex-1 space-y-6 px-4 pt-4">
        {cancelled && (
          <section className="rounded-3xl border border-destructive/40 bg-destructive/10 p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <h2 className="font-display text-base font-extrabold">Cancelled</h2>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {cancelled.reason} · {cancelled.when}. {going} people were told
              {cancelled.refunded ? " and refunded in full." : "."}
            </p>
            <button
              onClick={() => restoreEvent(id)}
              className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-secondary font-display text-sm font-bold"
            >
              <Undo2 className="h-4 w-4" /> Undo cancellation
            </button>
          </section>
        )}

        <section>
          <h2 className="mb-2 flex items-center gap-2 font-display text-sm font-extrabold uppercase tracking-wider">
            <Pencil className="h-4 w-4 text-primary" /> Details
          </h2>
          <div className="flex flex-col gap-2">
            <Field label="Title" value={title} onChange={setTitle} />
            <Field label="When" value={time} onChange={setTime} />
            <Field label="Where" value={location} onChange={setLocation} />
            <Field label="Note to guests about the change" value={note} onChange={setNote} />
          </div>
          <button
            onClick={() => {
              saveEventEdit(id, { title, time, location, note });
              setSavedFlash(true);
              window.setTimeout(() => setSavedFlash(false), 1600);
            }}
            className="mt-3 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-brand py-3.5 font-display text-sm font-bold text-primary-foreground shadow-glow"
          >
            {savedFlash ? <Check className="h-4 w-4" strokeWidth={3} /> : null}
            {savedFlash ? `Saved — ${going} guests notified` : "Save and notify guests"}
          </button>
        </section>

        <section>
          <h2 className="mb-2 flex items-center gap-2 font-display text-sm font-extrabold uppercase tracking-wider">
            <Megaphone className="h-4 w-4 text-primary" /> Message everyone
          </h2>
          <Link
            to="/host/message/$id"
            params={{ id }}
            className="mb-2 flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/10 p-3 text-sm font-bold"
          >
            Venue change or rain delay? Use the update templates
            <span className="text-xs text-primary">Open</span>
          </Link>
          <textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            rows={3}
            placeholder="Door's on the left of the pub, not the main entrance…"
            className="w-full rounded-2xl border border-border bg-secondary/40 p-4 text-sm outline-none focus:border-primary"
          />
          <button
            onClick={() => setUrgent((u) => !u)}
            className={cn(
              "mt-2 rounded-full px-3 py-1.5 text-[11px] font-bold",
              urgent ? "bg-destructive text-destructive-foreground" : "bg-secondary text-muted-foreground",
            )}
          >
            {urgent ? "Urgent — breaks quiet hours" : "Send as urgent"}
          </button>
          <button
            disabled={!msg.trim()}
            onClick={() => {
              sendBroadcast({
                id: `${id}-${Date.now()}`,
                eventId: id,
                text: msg.trim(),
                when: "just now",
                urgent,
              });
              setMsg("");
              setUrgent(false);
            }}
            className="mt-2 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-secondary py-3.5 font-display text-sm font-bold disabled:opacity-40"
          >
            <Send className="h-4 w-4" /> Send to {going} guests
          </button>

          {mine.length > 0 && (
            <div className="mt-3 flex flex-col gap-2">
              {mine.map((b) => (
                <div key={b.id} className="rounded-2xl border border-border bg-card p-3">
                  <p className="text-sm leading-relaxed">{b.text}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {b.urgent ? "Urgent · " : ""}
                    {b.when} · delivered to {going}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {!cancelled && (
          <section className="rounded-3xl border border-destructive/30 bg-card p-4">
            <h2 className="font-display text-sm font-extrabold uppercase tracking-wider text-destructive">
              Cancel event
            </h2>
            {!cancelOpen ? (
              <>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Everyone going is told immediately. Cancelling within 24 hours of the start affects your
                  organiser rating.
                </p>
                <button
                  onClick={() => setCancelOpen(true)}
                  className="mt-3 h-11 w-full rounded-2xl border border-destructive/40 font-display text-sm font-bold text-destructive"
                >
                  Cancel this event
                </button>
              </>
            ) : (
              <>
                <div className="mt-3 flex flex-col gap-1.5">
                  {CANCEL_REASONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => setReason(r)}
                      className={cn(
                        "rounded-2xl border px-4 py-3 text-left text-sm font-semibold",
                        reason === r ? "border-destructive bg-destructive/10" : "border-border bg-secondary/40",
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <textarea
                  value={cancelMsg}
                  onChange={(e) => setCancelMsg(e.target.value)}
                  rows={2}
                  placeholder="What guests will read…"
                  className="mt-2 w-full rounded-2xl border border-border bg-secondary/40 p-4 text-sm outline-none focus:border-primary"
                />
                <button
                  onClick={() => setRefund((r) => !r)}
                  role="switch"
                  aria-checked={refund}
                  className="mt-2 flex w-full items-center gap-3 rounded-2xl border border-border bg-secondary/40 p-3 text-left"
                >
                  <span className="flex-1 text-sm font-bold">Refund every ticket in full</span>
                  <span
                    className={cn(
                      "flex h-6 w-11 shrink-0 items-center rounded-full p-0.5",
                      refund ? "bg-primary" : "bg-secondary",
                    )}
                  >
                    <span
                      className={cn(
                        "h-5 w-5 rounded-full bg-background transition-transform",
                        refund && "translate-x-5",
                      )}
                    />
                  </span>
                </button>
                <button
                  disabled={!reason}
                  onClick={() => {
                    cancelEvent(id, {
                      reason: reason!,
                      message: cancelMsg,
                      refunded: refund,
                      when: "just now",
                    });
                    setCancelOpen(false);
                  }}
                  className="mt-3 h-13 w-full rounded-2xl bg-destructive py-3.5 font-display text-sm font-bold text-destructive-foreground disabled:opacity-40"
                >
                  Cancel and notify {going} guests
                </button>
              </>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="rounded-2xl border border-border bg-card p-3">
      <span className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-transparent text-sm font-semibold outline-none"
      />
    </label>
  );
}
