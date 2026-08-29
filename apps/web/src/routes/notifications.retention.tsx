import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarCheck,
  Images,
  MessageCircle,
  PartyPopper,
  Smartphone,
  Trash2,
  UserRoundPlus,
} from "lucide-react";
import { useApp, type NotifRetention } from "@/lib/store";
import { cn } from "@/lib/utils";

const CHOICES = [1, 7, 14, 30, 90, 365] as const;

function label(days: number) {
  if (days === 1) return "1 day";
  if (days === 365) return "1 year";
  if (days % 30 === 0 && days >= 30) return `${days / 30} month${days === 30 ? "" : "s"}`;
  return `${days} days`;
}

const ROWS: {
  key: keyof NotifRetention;
  icon: typeof CalendarCheck;
  title: string;
  body: string;
}[] = [
  {
    key: "eventReminders",
    icon: CalendarCheck,
    title: "Event reminders",
    body: "Start times, leave-by nudges and door details. Useless once the event is over.",
  },
  {
    key: "hostUpdates",
    icon: PartyPopper,
    title: "Host updates",
    body: "Venue changes and rain delays. Worth keeping until you've been.",
  },
  {
    key: "walls",
    icon: Images,
    title: "Memory walls",
    body: "The morning-after photos. Kept as long as the wall itself lives.",
  },
  {
    key: "connections",
    icon: UserRoundPlus,
    title: "People you met",
    body: "Connection requests from events. Keep these longest — that's the whole point.",
  },
  {
    key: "messages",
    icon: MessageCircle,
    title: "Messages",
    body: "Group chat and DM alerts. The messages themselves stay in the thread.",
  },
];

export const Route = createFileRoute("/notifications/retention")({
  head: () => ({
    meta: [
      { title: "Notification retention — IRL NOW" },
      {
        name: "description",
        content:
          "Decide how long IRL NOW keeps each type of notification — reminders, host updates, walls, people and messages.",
      },
      { property: "og:title", content: "Notification retention — IRL NOW" },
      {
        property: "og:description",
        content: "You choose how long each kind of alert sticks around.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RetentionSettingsPage,
});

function RetentionSettingsPage() {
  const { notifRetention, updateNotifRetention, devicePush, membership } = useApp();

  const longest = Math.max(...Object.values(notifRetention));

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
          <h1 className="font-display text-lg font-extrabold tracking-tight">
            Notification retention
          </h1>
          <p className="truncate text-xs text-muted-foreground">
            How long each type stays in your notification centre
          </p>
        </div>
      </header>

      <main className="flex-1 space-y-4 px-4 pt-4">
        <p className="rounded-2xl border border-accent/30 bg-accent/10 p-3 text-xs leading-relaxed text-muted-foreground">
          Nothing here is kept longer than{" "}
          <span className="font-bold text-foreground">{label(longest)}</span>. Anything older is
          deleted from your account automatically — we don't keep a shadow copy.
        </p>

        {ROWS.map((row) => (
          <section key={row.key} className="rounded-2xl border border-border bg-card p-3.5">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary">
                <row.icon className="h-4.5 w-4.5 text-primary" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold">{row.title}</p>
                <p className="text-[11px] leading-relaxed text-muted-foreground">{row.body}</p>
              </div>
            </div>
            <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
              {CHOICES.map((d) => (
                <button
                  key={d}
                  onClick={() => updateNotifRetention({ [row.key]: d } as Partial<NotifRetention>)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1.5 text-xs font-bold",
                    notifRetention[row.key] === d
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground",
                  )}
                >
                  {label(d)}
                </button>
              ))}
            </div>
          </section>
        ))}

        <section className="rounded-2xl border border-border bg-card p-3.5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary">
              <Smartphone className="h-4.5 w-4.5 text-accent" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">This device</p>
              <p className="text-[11px] text-muted-foreground">
                {devicePush.optedIn
                  ? `Push on · delivered alerts kept ${label(devicePush.retentionDays)}`
                  : "Push is off on this device"}
              </p>
            </div>
            <Link
              to="/notifications/optin"
              className="rounded-full bg-secondary px-3 py-1.5 text-xs font-bold"
            >
              {devicePush.optedIn ? "Change" : "Turn on"}
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-3.5">
          <p className="text-sm font-bold">Photos and walls</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
            {membership
              ? "You're on IRL NOW+, so every wall you're on is kept forever — notification retention doesn't affect your photos."
              : "Free accounts keep an event wall for 30 days. That's separate from notifications — walls have their own countdown."}
          </p>
          <Link
            to={membership ? "/archive" : "/membership"}
            className="mt-2 inline-block text-xs font-bold text-primary"
          >
            {membership ? "See everything you've kept" : "Keep walls forever with IRL NOW+"}
          </Link>
        </section>

        <button
          onClick={() =>
            updateNotifRetention({
              eventReminders: 1,
              walls: 7,
              connections: 30,
              messages: 7,
              hostUpdates: 7,
            })
          }
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-secondary/50 text-sm font-bold text-muted-foreground"
        >
          <Trash2 className="h-4 w-4" /> Keep as little as possible
        </button>
      </main>
    </div>
  );
}
