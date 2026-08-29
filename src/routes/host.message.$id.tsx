import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BellRing,
  CloudRain,
  Clock,
  DoorOpen,
  MapPin,
  Megaphone,
  Send,
  Users,
} from "lucide-react";
import { getEvent } from "@/lib/data";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

type Audience = "going" | "waitlist" | "checked-in";

const TEMPLATES: {
  id: string;
  icon: typeof MapPin;
  label: string;
  urgent: boolean;
  text: string;
}[] = [
  {
    id: "venue",
    icon: MapPin,
    label: "Venue change",
    urgent: true,
    text: "Venue change: we've moved to [new address]. Same start time — head there instead, it's a 4 minute walk from the original spot.",
  },
  {
    id: "rain",
    icon: CloudRain,
    label: "Rain delay",
    urgent: true,
    text: "Rain delay: we're pushing the start back by 45 minutes and moving under cover. Come when you can — nothing is cancelled.",
  },
  {
    id: "late",
    icon: Clock,
    label: "Running late",
    urgent: true,
    text: "We're running about 20 minutes behind. Grab a drink at the bar and we'll wave you over when we start.",
  },
  {
    id: "door",
    icon: DoorOpen,
    label: "Door info",
    urgent: false,
    text: "Door info: use the side entrance on the left of the pub, not the main door. Show your ticket QR and you're straight in.",
  },
  {
    id: "hype",
    icon: Megaphone,
    label: "Day-of hype",
    urgent: false,
    text: "Tonight's the one. Doors at 18:30, we start properly at 19:00 — come early if you want to actually meet people.",
  },
];

const AUDIENCES: { id: Audience; label: string }[] = [
  { id: "going", label: "Everyone going" },
  { id: "waitlist", label: "Waitlist too" },
  { id: "checked-in", label: "Only checked in" },
];

const SEND_TIMES: { id: string; label: string; hint: string }[] = [
  { id: "now", label: "Send now", hint: "Lands on lock screens within seconds" },
  { id: "1h", label: "In 1 hour", hint: "Good for a venue change you're still confirming" },
  { id: "3h", label: "In 3 hours", hint: "Weather calls — send once the forecast firms up" },
  { id: "morning", label: "Tomorrow 9:00", hint: "Non-urgent details, read over coffee" },
  { id: "2hbefore", label: "2 hours before doors", hint: "The highest-open slot we see" },
];

export const Route = createFileRoute("/host/message/$id")({
  head: () => ({
    meta: [
      { title: "Message everyone going — IRL NOW" },
      {
        name: "description",
        content:
          "Tell every guest about a venue change, rain delay or door detail in one send — urgent updates break through quiet hours.",
      },
      { property: "og:title", content: "Message everyone going — IRL NOW" },
      {
        property: "og:description",
        content: "One send reaches every guest's lock screen, chat thread and inbox.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HostMessagePage,
});

function HostMessagePage() {
  const { id } = Route.useParams();
  const event = getEvent(id);
  const { broadcasts, sendBroadcast } = useApp();

  const [text, setText] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [audience, setAudience] = useState<Audience>("going");
  const [pushed, setPushed] = useState(false);
  const [sendAt, setSendAt] = useState<string>("now");

  const going = event?.goingCount ?? 0;
  const reach =
    audience === "going" ? going : audience === "waitlist" ? going + 6 : Math.round(going * 0.7);
  const mine = broadcasts.filter((b) => b.eventId === id);
  const scheduled = sendAt !== "now";
  const sendLabel = SEND_TIMES.find((s) => s.id === sendAt)?.label ?? sendAt;

  return (
    <div className="flex min-h-dvh flex-col pb-16">
      <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur-xl">
        <Link
          to="/host/$id"
          params={{ id }}
          aria-label="Back"
          className="rounded-full p-1.5 active:bg-secondary"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-extrabold tracking-tight">
            Message everyone
          </p>
          <p className="truncate text-xs text-muted-foreground">{event?.title ?? id}</p>
        </div>
      </header>

      <main className="flex-1 space-y-5 px-4 pt-4">
        <section>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Common updates
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setText(t.text);
                  setUrgent(t.urgent);
                  setPushed(false);
                }}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-bold active:scale-[0.97]"
              >
                <t.icon className="h-3.5 w-3.5 text-primary" /> {t.label}
              </button>
            ))}
          </div>
        </section>

        <section>
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setPushed(false);
            }}
            rows={5}
            maxLength={280}
            placeholder="Rain's moved us indoors — same building, ground floor bar…"
            className="w-full rounded-2xl border border-border bg-secondary/40 p-4 text-sm leading-relaxed outline-none focus:border-primary"
          />
          <p className="mt-1 text-right text-[11px] text-muted-foreground">{text.length}/280</p>

          <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {AUDIENCES.map((a) => (
              <button
                key={a.id}
                onClick={() => setAudience(a.id)}
                className={cn(
                  "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold",
                  audience === a.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground",
                )}
              >
                {a.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setUrgent((u) => !u)}
            className={cn(
              "mt-2 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold",
              urgent
                ? "bg-destructive text-destructive-foreground"
                : "bg-secondary text-muted-foreground",
            )}
          >
            <BellRing className="h-3 w-3" />
            {urgent ? "Urgent — breaks quiet hours and mutes" : "Send as urgent"}
          </button>
        </section>

        <section>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
            When it goes out
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {SEND_TIMES.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setSendAt(s.id);
                  setPushed(false);
                }}
                className={cn(
                  "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold",
                  sendAt === s.id
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary text-muted-foreground",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
          <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3 text-accent" />
            {SEND_TIMES.find((s) => s.id === sendAt)?.hint}
            {scheduled && urgent ? " · urgent still overrides quiet hours on delivery" : ""}
          </p>
        </section>

        {/* Lock-screen preview of what guests get */}
        <section>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
            How it lands
          </h2>
          <div className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(160deg,#241a30,#0d0910)] p-4">
            <div
              className={cn(
                "rounded-2xl bg-white/12 p-3 backdrop-blur-xl",
                urgent && "ring-1 ring-primary",
              )}
            >
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-brand text-[9px] font-extrabold text-primary-foreground">
                  IRL
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                  IRL NOW
                </span>
                <span className="ml-auto text-[11px] text-white/50">
                  {scheduled ? sendLabel.toLowerCase() : "now"}
                </span>
              </div>
              <p className="mt-1 text-sm font-bold leading-snug text-white">
                Update from {event?.host ?? "the host"} — {event?.title ?? "your event"}
              </p>
              <p className="text-xs leading-snug text-white/70">
                {text.trim() || "Your message appears here, exactly as guests see it."}
              </p>
            </div>
            <p className="mt-2 text-center text-[11px] text-white/50">
              Also posted to the group chat and pinned to the event page.
            </p>
          </div>
        </section>

        <button
          disabled={!text.trim()}
          onClick={() => {
            sendBroadcast({
              id: `${id}-${Date.now()}`,
              eventId: id,
              text: text.trim(),
              when: scheduled ? `scheduled · ${sendLabel}` : "just now",
              urgent,
              scheduled,
              ...(scheduled ? { scheduledFor: sendLabel } : {}),
            });
            setText("");
            setUrgent(false);
            setPushed(true);
          }}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-brand font-display text-base font-extrabold text-primary-foreground shadow-glow disabled:opacity-40"
        >
          {scheduled ? <Clock className="h-5 w-5" /> : <Send className="h-5 w-5" />}
          {scheduled
            ? `Schedule for ${sendLabel.toLowerCase()}`
            : `Send to ${reach} ${reach === 1 ? "guest" : "guests"}`}
        </button>
        {pushed && (
          <p className="text-center text-xs font-bold text-accent">
            {scheduled
              ? `Queued — goes to ${reach} guests ${sendLabel.toLowerCase()}. You can cancel it until then.`
              : `Delivered — ${reach} push notifications, ${reach} chat messages, pinned to the event.`}
          </p>
        )}

        {mine.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Sent &amp; scheduled
            </h2>
            {mine.map((b) => (
              <div
                key={b.id}
                className={cn(
                  "rounded-2xl border bg-card p-3",
                  b.scheduled ? "border-accent/40" : "border-border",
                )}
              >
                {b.scheduled && (
                  <p className="mb-1 flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-accent">
                    <Clock className="h-3 w-3" /> Scheduled · {b.scheduledFor}
                  </p>
                )}
                <p className="text-sm leading-relaxed">{b.text}</p>
                <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {b.urgent ? "Urgent · " : ""}
                  {b.scheduled
                    ? `will reach ${going} guests`
                    : `${b.when} · delivered to ${going} · opened by ${Math.round(going * 0.82)}`}
                </p>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
