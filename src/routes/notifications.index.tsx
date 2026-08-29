import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarCheck,
  CheckCheck,
  Images,
  MessageCircle,
  MoonStar,
  PartyPopper,
  UserRoundPlus,
  X,
} from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { BottomNav } from "@/components/BottomNav";
import { getPerson } from "@/lib/data";
import { buildNotifications, timeAgo, type AppNotification } from "@/lib/social";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notifications/")({
  head: () => ({
    meta: [
      { title: "Notifications — IRL NOW" },
      {
        name: "description",
        content:
          "Connection requests, event reminders, group chats and the morning-after walls — nothing else.",
      },
      { property: "og:title", content: "Notifications — IRL NOW" },
      {
        property: "og:description",
        content: "Only the things that involve a real event you're part of.",
      },
    ],
  }),
  component: NotificationsPage,
});

const ICONS = {
  connection: UserRoundPlus,
  event: CalendarCheck,
  wall: Images,
  message: MessageCircle,
  host: PartyPopper,
} as const;

function NotificationsPage() {
  const {
    incomingRequests,
    goingIds,
    readNotificationIds,
    markNotificationsRead,
    acceptRequest,
    declineRequest,
    notifPrefs,
    dismissedNotificationIds,
    dismissNotification,
  } = useApp();
  const [kind, setKind] = useState<"all" | "connection" | "event" | "wall" | "message">("all");

  const items = useMemo(() => {
    const all = buildNotifications({ incomingRequests, goingIds });
    return all.filter((n) => {
      if (dismissedNotificationIds.includes(n.id)) return false;
      if (kind !== "all" && n.kind !== kind) return false;
      if (n.kind === "connection") return notifPrefs.connections;
      if (n.kind === "event") return notifPrefs.eventReminders;
      if (n.kind === "wall") return notifPrefs.walls;
      if (n.kind === "message") return notifPrefs.messages;
      if (n.kind === "host") return notifPrefs.suggestions;
      return true;
    });
  }, [incomingRequests, goingIds, notifPrefs, dismissedNotificationIds, kind]);

  const today = items.filter((n) => n.minutesAgo < 60 * 24);
  const earlier = items.filter((n) => n.minutesAgo >= 60 * 24);

  const unreadIds = items.filter((n) => !readNotificationIds.includes(n.id)).map((n) => n.id);

  useEffect(() => {
    if (unreadIds.length) {
      const t = setTimeout(() => markNotificationsRead(unreadIds), 1200);
      return () => clearTimeout(t);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unreadIds.join(",")]);

  return (
    <div className="flex min-h-dvh flex-col pb-24">
      <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur-xl">
        <Link to="/you" aria-label="Back" className="rounded-full p-1.5 active:bg-secondary">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <p className="font-display text-lg font-extrabold tracking-tight">Notifications</p>
          <p className="text-xs text-muted-foreground">
            Real events only — never "someone liked a post"
          </p>
        </div>
        <button
          onClick={() => markNotificationsRead(items.map((n) => n.id))}
          aria-label="Mark all as read"
          className="rounded-full p-2 active:bg-secondary"
        >
          <CheckCheck className="h-4.5 w-4.5 text-primary" />
        </button>
        <Link to="/notifications/preview" className="text-xs font-bold text-primary">
          Preview
        </Link>
        <Link to="/notifications/retention" className="text-xs font-bold text-primary">
          Retention
        </Link>
      </header>

      <main className="flex-1 space-y-2 px-4 pt-4">
        <Link
          to="/inbox"
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold">Host updates inbox</span>
            <span className="block text-[11px] text-muted-foreground">
              Venue changes, rain delays and door info, grouped by event
            </span>
          </span>
          <span className="shrink-0 text-xs font-bold text-primary">Open</span>
        </Link>

        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {(["all", "connection", "event", "message", "wall"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold capitalize",
                k === kind
                  ? "bg-gradient-brand text-primary-foreground"
                  : "border border-border text-muted-foreground",
              )}
            >
              {k === "connection" ? "People" : k === "wall" ? "Walls" : k}
            </button>
          ))}
        </div>

        {notifPrefs.quietHours && (
          <p className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3.5 py-2.5 text-xs text-muted-foreground">
            <MoonStar className="h-3.5 w-3.5 text-primary" />
            Quiet hours on — nothing buzzes between 11pm and 8am.
          </p>
        )}

        {[
          { label: "Today", rows: today },
          { label: "Earlier", rows: earlier },
        ]
          .filter((g) => g.rows.length)
          .map((g) => (
            <section key={g.label} className="space-y-2 pt-2">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {g.label}
              </h2>
              {g.rows.map((n) => (
                <NotificationRow
                  key={n.id}
                  n={n}
                  unread={!readNotificationIds.includes(n.id)}
                  onAccept={acceptRequest}
                  onDecline={declineRequest}
                  onDismiss={dismissNotification}
                />
              ))}
            </section>
          ))}
        {items.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Nothing right now. Go outside.
          </p>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function NotificationRow({
  n,
  unread,
  onAccept,
  onDecline,
  onDismiss,
}: {
  n: AppNotification;
  unread: boolean;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const Icon = ICONS[n.kind];
  const person = n.personId ? getPerson(n.personId) : undefined;

  const body = (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border p-3.5",
        unread ? "border-primary/40 bg-primary/5" : "border-border bg-card",
      )}
    >
      {person ? (
        <Avatar person={person} />
      ) : (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary">
          <Icon className="h-4.5 w-4.5 text-primary" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <p className="font-display text-sm font-bold leading-snug">{n.title}</p>
          <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
            {timeAgo(n.minutesAgo)}
          </span>
          <button
            onClick={(e) => {
              e.preventDefault();
              onDismiss(n.id);
            }}
            aria-label="Dismiss"
            className="shrink-0 text-muted-foreground/60 active:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{n.body}</p>
        {n.kind === "connection" && n.personId && (
          <div className="mt-2.5 flex gap-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                onAccept(n.personId!);
              }}
              className="h-9 flex-1 rounded-xl bg-gradient-brand font-display text-xs font-bold text-primary-foreground"
            >
              Accept
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                onDecline(n.personId!);
              }}
              className="h-9 flex-1 rounded-xl bg-secondary font-display text-xs font-bold text-muted-foreground"
            >
              Ignore
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (n.kind === "wall" && n.eventId) {
    return (
      <Link to="/w/$id" params={{ id: n.eventId }}>
        {body}
      </Link>
    );
  }
  if (n.kind === "message" && n.eventId) {
    return (
      <Link to="/chat/$id" params={{ id: n.eventId }}>
        {body}
      </Link>
    );
  }
  if (n.kind === "event" && n.eventId) {
    return (
      <Link to="/event/$id" params={{ id: n.eventId }}>
        {body}
      </Link>
    );
  }
  if (n.kind === "host") {
    return <Link to="/create">{body}</Link>;
  }
  if (n.personId) {
    return (
      <Link to="/person/$id" params={{ id: n.personId }}>
        {body}
      </Link>
    );
  }
  return body;
}
