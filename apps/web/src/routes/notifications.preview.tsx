import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BellRing, Moon, Check } from "lucide-react";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

type Kind = "event" | "wall" | "host" | "connection" | "message";

interface Preview {
  id: string;
  kind: Kind;
  time: string;
  title: string;
  body: string;
  why: string;
  urgent?: boolean;
}

const PREVIEWS: Preview[] = [
  {
    id: "p1",
    kind: "event",
    time: "in 2 hours",
    title: "Rooftop golden hour starts at 18:30",
    body: "9 people going · 12 min walk from you. Leave by 18:10.",
    why: "Sent once, two hours before an event you said you're going to.",
  },
  {
    id: "p2",
    kind: "host",
    time: "now",
    title: "Venue change — Rooftop golden hour",
    body: "Rain moved us indoors: same building, ground floor bar. Door on the left.",
    why: "Host updates always break through, even in quiet hours.",
    urgent: true,
  },
  {
    id: "p3",
    kind: "wall",
    time: "9:12",
    title: "42 photos from last night are up",
    body: "You're in 6 of them. Claim yourself to unblur the wall.",
    why: "The morning after — one notification, the day after an event you attended.",
  },
  {
    id: "p4",
    kind: "wall",
    time: "8:04",
    title: "3 days left to keep last month's photos",
    body: "28 photos from Sunday market expire Friday.",
    why: "Sent twice at most: seven days out, then three days out.",
  },
  {
    id: "p5",
    kind: "connection",
    time: "22:40",
    title: "Maya wants to stay in touch",
    body: "You both went to Rooftop golden hour.",
    why: "Only from people you were actually at an event with.",
  },
  {
    id: "p6",
    kind: "message",
    time: "17:55",
    title: "Rooftop golden hour · group chat",
    body: "Sam: heading in now, we're by the fire pit 🔥",
    why: "Muted threads never notify. Group chats close 24 hours after the event.",
  },
];

const KIND_LABEL: Record<Kind, string> = {
  event: "Reminders",
  wall: "Memories",
  host: "Host updates",
  connection: "People you met",
  message: "Messages",
};

export const Route = createFileRoute("/notifications/preview")({
  head: () => ({
    meta: [
      { title: "What we'd send you — IRL NOW" },
      {
        name: "description",
        content:
          "See exactly what IRL NOW puts on your lock screen: reminders, host updates, and the morning-after wall. Nothing else.",
      },
      { property: "og:title", content: "What we'd send you — IRL NOW" },
      {
        property: "og:description",
        content: "Real lock-screen previews of every notification IRL NOW sends.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NotificationPreviewPage,
});

function NotificationPreviewPage() {
  const { notifPrefs, updateNotifPrefs } = useApp();
  const [dark, setDark] = useState(true);

  const enabled = (k: Kind) =>
    k === "event"
      ? notifPrefs.eventReminders
      : k === "wall"
        ? notifPrefs.walls
        : k === "connection"
          ? notifPrefs.connections
          : k === "message"
            ? notifPrefs.messages
            : true;

  const visible = PREVIEWS.filter((p) => enabled(p.kind));

  return (
    <div className="flex min-h-dvh flex-col pb-16">
      <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur-xl">
        <Link
          to="/notifications"
          aria-label="Back"
          className="rounded-full p-1.5 active:bg-secondary"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-extrabold tracking-tight">What we'd send you</p>
          <p className="truncate text-xs text-muted-foreground">
            Every notification IRL NOW sends, on a real lock screen
          </p>
        </div>
        <button
          onClick={() => setDark((d) => !d)}
          aria-label="Toggle lock screen style"
          className="rounded-full p-2 active:bg-secondary"
        >
          <Moon className={cn("h-4.5 w-4.5", dark ? "text-primary" : "text-muted-foreground")} />
        </button>
      </header>

      <main className="flex-1 space-y-5 px-4 pt-4">
        <p className="rounded-2xl border border-accent/30 bg-accent/10 p-3 text-xs leading-relaxed text-muted-foreground">
          We send about <span className="font-bold text-foreground">4 notifications a week</span> —
          all tied to something real: an event you're going to, a host update, or your photos. No
          streak nags, no "someone liked this".
        </p>

        {/* Lock screen mockup */}
        <section
          className={cn(
            "relative overflow-hidden rounded-[2rem] border p-4 pt-8",
            dark
              ? "border-white/10 bg-[linear-gradient(160deg,#241a30,#0d0910)]"
              : "border-border bg-[linear-gradient(160deg,#f3ecff,#dfe6ff)]",
          )}
        >
          <div className="text-center">
            <p className={cn("text-xs font-semibold", dark ? "text-white/60" : "text-black/50")}>
              Friday 28 August
            </p>
            <p
              className={cn(
                "font-display text-5xl font-extrabold tracking-tight",
                dark ? "text-white" : "text-black",
              )}
            >
              18:04
            </p>
          </div>

          <div className="mt-5 space-y-2">
            {visible.map((p) => (
              <div
                key={p.id}
                className={cn(
                  "rounded-2xl p-3 backdrop-blur-xl",
                  dark ? "bg-white/12" : "bg-white/70",
                  p.urgent && "ring-1 ring-primary",
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-brand text-[9px] font-extrabold text-primary-foreground">
                    IRL
                  </span>
                  <span
                    className={cn(
                      "text-[11px] font-bold uppercase tracking-wider",
                      dark ? "text-white/70" : "text-black/60",
                    )}
                  >
                    IRL NOW
                  </span>
                  <span
                    className={cn("ml-auto text-[11px]", dark ? "text-white/50" : "text-black/40")}
                  >
                    {p.time}
                  </span>
                </div>
                <p
                  className={cn(
                    "mt-1 text-sm font-bold leading-snug",
                    dark ? "text-white" : "text-black",
                  )}
                >
                  {p.title}
                </p>
                <p className={cn("text-xs leading-snug", dark ? "text-white/70" : "text-black/60")}>
                  {p.body}
                </p>
              </div>
            ))}
            {visible.length === 0 && (
              <p
                className={cn("py-8 text-center text-xs", dark ? "text-white/60" : "text-black/50")}
              >
                You've turned everything off — your lock screen stays empty.
              </p>
            )}
          </div>
        </section>

        {/* Why each one exists */}
        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Why you'd get each one
          </h2>
          {PREVIEWS.map((p) => (
            <div key={p.id} className="rounded-2xl border border-border bg-card p-3">
              <div className="flex items-center gap-2">
                <BellRing className="h-3.5 w-3.5 text-primary" />
                <p className="text-xs font-extrabold uppercase tracking-wider">
                  {KIND_LABEL[p.kind]}
                </p>
                {p.urgent && (
                  <span className="rounded-full bg-destructive px-2 py-0.5 text-[10px] font-extrabold text-destructive-foreground">
                    Breaks quiet hours
                  </span>
                )}
                {enabled(p.kind) ? (
                  <span className="ml-auto flex items-center gap-1 text-[11px] font-bold text-accent">
                    <Check className="h-3 w-3" /> On
                  </span>
                ) : (
                  <span className="ml-auto text-[11px] font-bold text-muted-foreground">Off</span>
                )}
              </div>
              <p className="mt-1 text-sm font-semibold leading-snug">{p.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{p.why}</p>
            </div>
          ))}
        </section>

        <section className="space-y-2 rounded-3xl border border-border bg-card p-4">
          <h2 className="font-display text-sm font-extrabold uppercase tracking-wider">
            Turn any of them off
          </h2>
          {(
            [
              ["eventReminders", "Event reminders"],
              ["walls", "Photos and memories"],
              ["connections", "People you met"],
              ["messages", "Messages"],
              ["quietHours", "Quiet hours (22:00–08:00)"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => updateNotifPrefs({ [key]: !notifPrefs[key] })}
              className="flex w-full items-center justify-between rounded-2xl bg-secondary/50 px-4 py-3 text-left"
            >
              <span className="text-sm font-semibold">{label}</span>
              <span
                className={cn(
                  "flex h-6 w-11 items-center rounded-full p-0.5 transition-colors",
                  notifPrefs[key] ? "bg-primary" : "bg-muted",
                )}
              >
                <span
                  className={cn(
                    "h-5 w-5 rounded-full bg-background transition-transform",
                    notifPrefs[key] && "translate-x-5",
                  )}
                />
              </span>
            </button>
          ))}
          <p className="pt-1 text-[11px] text-muted-foreground">
            Host updates about a venue change or delay always come through — that's the one thing we
            won't hold back.
          </p>
        </section>
      </main>
    </div>
  );
}
