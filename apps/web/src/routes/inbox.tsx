import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  Clock,
  Inbox as InboxIcon,
  Megaphone,
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { EmptyState } from "@/components/EmptyState";
import { getEvent } from "@irlnow/domain";
import { eventCovers } from "@/lib/covers";
import { inboxThreads } from "@irlnow/domain";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/inbox")({
  head: () => ({
    meta: [
      { title: "Host updates — IRL NOW" },
      {
        name: "description",
        content:
          "Every update from the hosts of events you're going to: venue changes, rain delays, door info — in one place.",
      },
      { property: "og:title", content: "Host updates — IRL NOW" },
      {
        property: "og:description",
        content: "Venue changes, rain delays and door details from your hosts, grouped by event.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InboxPage,
});

function InboxPage() {
  const { goingIds, waitlistIds, broadcasts, markBroadcastRead } = useApp();
  const [open, setOpen] = useState<string | null>(null);

  const eventIds = useMemo(
    () => [...new Set([...goingIds, ...waitlistIds])],
    [goingIds, waitlistIds],
  );
  const threads = useMemo(() => inboxThreads(eventIds, broadcasts), [eventIds, broadcasts]);

  return (
    <div className="flex min-h-dvh flex-col pb-24">
      <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur-xl">
        <Link to="/going" aria-label="Back" className="rounded-full p-1.5 active:bg-secondary">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-lg font-extrabold tracking-tight">Host updates</h1>
          <p className="truncate text-xs text-muted-foreground">
            Venue changes, delays and door info for what you're going to
          </p>
        </div>
        <Link to="/notifications" className="text-xs font-bold text-primary">
          All alerts
        </Link>
      </header>

      <main className="flex-1 space-y-3 px-4 pt-4">
        {threads.length === 0 && (
          <EmptyState
            icon={InboxIcon}
            title="No host updates yet"
            body="When you're going to something, anything the host announces lands here — and on your lock screen."
            action="Find something to go to"
            actionTo="/"
          />
        )}

        {threads.map((t) => {
          const event = getEvent(t.eventId);
          const expanded = open === t.eventId;
          return (
            <section
              key={t.eventId}
              className={cn(
                "overflow-hidden rounded-2xl border bg-card",
                t.urgent ? "border-primary/60" : "border-border",
              )}
            >
              <button
                onClick={() => {
                  setOpen(expanded ? null : t.eventId);
                  t.messages.forEach((m) => !m.seeded && markBroadcastRead(m.id));
                }}
                className="flex w-full items-center gap-3 p-3 text-left active:bg-secondary/40"
              >
                {event && (
                  <img
                    src={eventCovers[event.cover]}
                    alt=""
                    aria-hidden
                    className="h-12 w-12 shrink-0 rounded-xl object-cover"
                  />
                )}
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-bold">{t.eventTitle}</span>
                    {t.urgent && (
                      <span className="shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-primary-foreground">
                        Urgent
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {t.host}: {t.latest.text}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">
                    {t.messages.length} update{t.messages.length === 1 ? "" : "s"} · {t.latest.when}
                  </span>
                </span>
                <ChevronRight
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                    expanded && "rotate-90",
                  )}
                />
              </button>

              {expanded && (
                <div className="space-y-2 border-t border-border/60 bg-secondary/20 p-3">
                  {t.messages.map((m) => (
                    <article
                      key={m.id}
                      className={cn(
                        "rounded-xl border p-3",
                        m.urgent ? "border-primary/40 bg-primary/5" : "border-border/60 bg-card",
                      )}
                    >
                      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        <Megaphone className="h-3 w-3 text-primary" />
                        {m.host}
                        <span className="ml-auto font-medium normal-case tracking-normal">
                          {m.scheduled ? (
                            <span className="flex items-center gap-1 text-accent">
                              <Clock className="h-3 w-3" /> sends {m.scheduledFor}
                            </span>
                          ) : (
                            m.when
                          )}
                        </span>
                      </p>
                      <p className="mt-1.5 text-sm leading-relaxed">{m.text}</p>
                      {m.urgent && !m.scheduled && (
                        <p className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-primary">
                          <AlertTriangle className="h-3 w-3" /> Sent as urgent — broke quiet hours
                        </p>
                      )}
                    </article>
                  ))}

                  <div className="flex gap-2 pt-1">
                    <Link
                      to="/event/$id"
                      params={{ id: t.eventId }}
                      className="flex h-11 flex-1 items-center justify-center rounded-xl bg-gradient-brand text-sm font-bold text-primary-foreground"
                    >
                      Event details
                    </Link>
                    <Link
                      to="/chat/$id"
                      params={{ id: t.eventId }}
                      className="flex h-11 flex-1 items-center justify-center rounded-xl bg-secondary text-sm font-bold"
                    >
                      Group chat
                    </Link>
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </main>

      <BottomNav />
    </div>
  );
}
