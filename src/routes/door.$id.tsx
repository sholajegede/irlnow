import { useMemo, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  Delete,
  QrCode,
  Search,
  ShieldAlert,
  Undo2,
  UserPlus,
  Users,
} from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { getEvent, guestList, type Guest } from "@/lib/data";
import { arrivalCurve, doorCodeFor, eventCapacity, normaliseDoorCode } from "@/lib/hosting";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/door/$id")({
  loader: ({ params }) => {
    const event = getEvent(params.id);
    if (!event) throw notFound();
    return { event };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Door mode unavailable | IRL NOW" }, { name: "robots", content: "noindex" }] };
    }
    const t = `Door mode — ${loaderData.event.title} | IRL NOW`;
    return {
      meta: [
        { title: t },
        {
          name: "description",
          content: `Fast check-in at the door for ${loaderData.event.title}: scan codes, tap names, watch capacity in real time.`,
        },
        { property: "og:title", content: t },
        { property: "og:description", content: "One screen for the person on the door." },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  component: DoorMode,
});

type Feedback = { kind: "ok" | "warn" | "err"; text: string } | null;

function DoorMode() {
  const { event } = Route.useLoaderData();
  const { doorCheckins, doorCheckIn, doorUndo } = useApp();
  const [query, setQuery] = useState("");
  const [code, setCode] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [last, setLast] = useState<Guest | null>(null);

  const guests = useMemo(() => guestList(event.id, Math.min(event.goingCount, 40)), [event.id]);
  const doorList = doorCheckins[event.id] ?? [];
  const preChecked = guests.filter((g) => g.status === "checked-in").length;
  const inRoom = preChecked + doorList.length;
  const capacity = eventCapacity(event);
  const pct = Math.min(100, Math.round((inRoom / capacity) * 100));
  const curve = arrivalCurve(event.id, inRoom);

  const expected = guests.filter((g) => g.status === "going" || g.status === "waitlist");
  const filtered = query
    ? expected.filter((g) => g.name.toLowerCase().includes(query.toLowerCase()))
    : expected;

  const admit = (g: Guest, note?: string) => {
    doorCheckIn(event.id, g.id);
    setLast(g);
    setFeedback({ kind: "ok", text: note ?? `${g.name} is in` });
    setQuery("");
  };

  const submitCode = () => {
    const value = normaliseDoorCode(code);
    setCode("");
    if (!value) return;
    if (value.startsWith("TX-")) {
      const target = expected.find((g) => !doorList.includes(g.id));
      if (target) {
        admit(target, `Transferred ticket accepted · ${target.name}`);
        return;
      }
    }
    const match = expected.find((g) => doorCodeFor(event.id, g.id) === value);
    if (match) {
      if (doorList.includes(match.id)) {
        setFeedback({ kind: "warn", text: `${match.name} already scanned in` });
        return;
      }
      admit(match);
      return;
    }
    setFeedback({ kind: "err", text: "Code not on the list — check the name instead" });
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Link
            to="/host/$id"
            params={{ id: event.id }}
            aria-label="Back to event"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-accent">Door mode</p>
            <h1 className="truncate font-display text-lg font-extrabold leading-tight">{event.title}</h1>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-[10px] font-extrabold uppercase text-accent">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" /> Live
          </span>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-4 p-4 pb-10">
        <section className="rounded-3xl border border-border bg-card p-5">
          <div className="flex items-end justify-between">
            <div>
              <p className="font-display text-4xl font-extrabold leading-none">{inRoom}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                In the room
              </p>
            </div>
            <p className="text-right text-xs text-muted-foreground">
              capacity {capacity}
              <br />
              <span className={cn("font-bold", pct > 90 ? "text-primary" : "text-accent")}>{pct}% full</span>
            </p>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full", pct > 90 ? "bg-primary" : "bg-gradient-brand")}
              style={{ width: `${pct}%` }}
            />
          </div>
          {pct > 90 && (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-primary">
              <ShieldAlert className="h-3.5 w-3.5" /> Near capacity — hold the queue until people leave.
            </p>
          )}
          <div className="mt-4 grid grid-cols-5 gap-1.5">
            {curve.map((b) => (
              <div key={b.label} className="rounded-xl bg-secondary p-2 text-center">
                <p className="font-display text-sm font-extrabold leading-none">{b.count}</p>
                <p className="mt-1 text-[9px] font-semibold uppercase leading-tight text-muted-foreground">
                  {b.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <QrCode className="h-4 w-4 text-primary" />
            <h2 className="font-display text-base font-extrabold">Scan or type a code</h2>
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitCode()}
              placeholder="IRL-0000"
              aria-label="Ticket code"
              className="h-12 flex-1 rounded-2xl border border-border bg-secondary px-4 font-mono text-base uppercase tracking-widest outline-none placeholder:text-muted-foreground focus:border-primary"
            />
            <button
              onClick={submitCode}
              className="flex h-12 items-center gap-1.5 rounded-2xl bg-gradient-brand px-5 text-sm font-bold text-primary-foreground shadow-glow"
            >
              <Check className="h-4 w-4" /> Admit
            </button>
          </div>
          {feedback && (
            <div
              className={cn(
                "mt-3 flex items-center justify-between gap-2 rounded-2xl px-3 py-2.5 text-sm font-semibold",
                feedback.kind === "ok" && "bg-accent/15 text-accent",
                feedback.kind === "warn" && "bg-primary/15 text-primary",
                feedback.kind === "err" && "bg-muted text-muted-foreground",
              )}
            >
              <span>{feedback.text}</span>
              {feedback.kind === "ok" && last && (
                <button
                  onClick={() => {
                    doorUndo(event.id, last.id);
                    setFeedback({ kind: "warn", text: `Undid ${last.name}` });
                    setLast(null);
                  }}
                  className="flex shrink-0 items-center gap-1 rounded-full bg-background/40 px-2.5 py-1 text-[11px] font-bold"
                >
                  <Undo2 className="h-3 w-3" /> Undo
                </button>
              )}
            </div>
          )}
          <p className="mt-2 text-[11px] text-muted-foreground">
            Transferred tickets start with <span className="font-mono">TX-</span> and check in the new
            holder, not the buyer.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a name on the list"
              className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {expected.length - doorList.length} still to arrive · tap a name to let them in.
          </p>
          {filtered.map((g) => {
            const done = doorList.includes(g.id);
            return (
              <button
                key={g.id}
                onClick={() => (done ? doorUndo(event.id, g.id) : admit(g))}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-3 text-left transition-transform active:scale-[0.99]",
                  done ? "border-accent/40 bg-accent/10" : "border-border bg-card",
                )}
              >
                <Avatar person={{ name: g.name, avatar: g.avatar }} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{g.name}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {doorCodeFor(event.id, g.id)}
                    {g.plusOnes ? ` · +${g.plusOnes}` : ""}
                    {g.status === "waitlist" ? " · waitlist" : ""}
                  </p>
                </div>
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full",
                    done ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground",
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                </span>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No one matching "{query}". They may be a walk-up — admit on the code screen.
            </div>
          )}
        </section>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              setQuery("");
              setCode("");
              setFeedback(null);
            }}
            className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-secondary text-sm font-bold text-secondary-foreground"
          >
            <Delete className="h-4 w-4" /> Clear screen
          </button>
          <Link
            to="/host/$id"
            params={{ id: event.id }}
            className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-secondary text-sm font-bold text-secondary-foreground"
          >
            <Users className="h-4 w-4" /> Full guest list
          </Link>
        </div>
      </main>
    </div>
  );
}
