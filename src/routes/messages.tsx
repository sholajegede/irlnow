import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BellOff, MessageCircle, MoonStar, Users } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { BottomNav } from "@/components/BottomNav";
import { getEvent, getPerson, type Person } from "@/lib/data";
import { dmThread, eventChat, timeAgo } from "@/lib/social";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/messages")({
  head: () => ({
    meta: [
      { title: "Messages — IRL NOW" },
      {
        name: "description",
        content:
          "Group chats for the events you're going to, and private conversations with people you actually met.",
      },
      { property: "og:title", content: "Messages — IRL NOW" },
      {
        property: "og:description",
        content: "Event group chats and conversations with people you met in real life.",
      },
    ],
  }),
  component: MessagesPage,
});

function MessagesPage() {
  const {
    goingIds,
    checkedInIds,
    connectedIds,
    sentMessages,
    mutedThreads,
    blockedIds,
    unreadThreads,
    liveReplies,
    notifPrefs,
  } = useApp();
  const [filter, setFilter] = useState<"all" | "events" | "people">("all");

  const eventThreads = Array.from(new Set([...goingIds, ...checkedInIds]))
    .map((id) => getEvent(id))
    .filter(Boolean)
    .map((event) => {
      const threadId = `event:${event!.id}`;
      const seeded = eventChat(event!.id).filter((m) => !m.system);
      const mine = sentMessages[threadId] ?? [];
      const last = mine.length ? mine[mine.length - 1]! : seeded[seeded.length - 1];
      return {
        event: event!,
        threadId,
        preview: last?.text ?? "Say hello to everyone going.",
        minutesAgo: mine.length ? 0 : (seeded[seeded.length - 1]?.minutesAgo ?? 0),
        muted: mutedThreads.includes(threadId),
        unread: unreadThreads.includes(threadId),
      };
    })
    .sort((a, b) => a.minutesAgo - b.minutesAgo);

  const dmThreads = connectedIds
    .filter((id) => !blockedIds.includes(id))
    .map((id) => getPerson(id))
    .filter(Boolean)
    .map((person) => {
      const threadId = `dm:${person!.id}`;
      const seeded = dmThread(person!.id);
      const mine = sentMessages[threadId] ?? [];
      const live = liveReplies[threadId] ?? [];
      const last = live.length
        ? live[live.length - 1]!
        : mine.length
          ? mine[mine.length - 1]!
          : seeded[seeded.length - 1]!;
      return {
        person: person as Person,
        unread: unreadThreads.includes(threadId),
        preview: last.text,
        minutesAgo: mine.length ? 0 : seeded[seeded.length - 1]!.minutesAgo,
      };
    })
    .sort((a, b) => a.minutesAgo - b.minutesAgo);

  return (
    <div className="flex min-h-dvh flex-col pb-24">
      <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur-xl">
        <Link to="/you" aria-label="Back" className="rounded-full p-1.5 active:bg-secondary">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <p className="font-display text-lg font-extrabold tracking-tight">Messages</p>
          <p className="text-xs text-muted-foreground">
            Only events you're going to and people you've met
          </p>
        </div>
      </header>

      <main className="flex-1 space-y-6 px-4 pt-4">
        <div className="flex gap-2">
          {(["all", "events", "people"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={
                f === filter
                  ? "rounded-full bg-gradient-brand px-3.5 py-1.5 text-xs font-bold capitalize text-primary-foreground"
                  : "rounded-full border border-border px-3.5 py-1.5 text-xs font-bold capitalize text-muted-foreground"
              }
            >
              {f}
            </button>
          ))}
        </div>

        {notifPrefs.quietHours && (
          <p className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3.5 py-2.5 text-xs text-muted-foreground">
            <MoonStar className="h-3.5 w-3.5 text-primary" />
            Quiet hours on — messages wait until 8am.
          </p>
        )}

        <section hidden={filter === "people"}>
          <h2 className="pb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Event chats
          </h2>
          <div className="space-y-2">
            {eventThreads.map(({ event, preview, minutesAgo, muted, unread }) => (
              <Link
                key={event.id}
                to="/chat/$id"
                params={{ id: event.id }}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15">
                  <Users className="h-5 w-5 text-primary" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-display text-sm font-bold">{event.title}</p>
                    {muted && <BellOff className="h-3 w-3 shrink-0 text-muted-foreground" />}
                    {unread && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                    <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                      {timeAgo(minutesAgo)}
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{preview}</p>
                </div>
              </Link>
            ))}
            {eventThreads.length === 0 && (
              <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Say you're going to something and its group chat appears here.
              </p>
            )}
          </div>
        </section>

        <section hidden={filter === "events"}>
          <h2 className="pb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            People you've met
          </h2>
          <div className="space-y-2">
            {dmThreads.map(({ person, preview, minutesAgo, unread }) => (
              <Link
                key={person.id}
                to="/dm/$id"
                params={{ id: person.id }}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
              >
                <Avatar person={person} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-display text-sm font-bold">{person.name}</p>
                    {unread && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                    <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                      {timeAgo(minutesAgo)}
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{preview}</p>
                </div>
              </Link>
            ))}
            {dmThreads.length === 0 && (
              <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                <MessageCircle className="mx-auto mb-2 h-5 w-5" />
                No conversations yet. Connections start at events, not in a DM request.
              </p>
            )}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
