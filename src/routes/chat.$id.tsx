import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Bell, BellOff, Lock, Pin, SendHorizonal, ShieldAlert, Users } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { ReportSheet } from "@/components/ReportSheet";
import { getEvent, getPerson, type Person } from "@/lib/data";
import { eventChat, timeAgo } from "@/lib/social";
import { REACTIONS, eventQuickReplies, pinnedHostNote, presenceCount, respondersFor } from "@/lib/live";
import { useLiveThread } from "@/lib/use-live-thread";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/chat/$id")({
  loader: ({ params }) => {
    const event = getEvent(params.id);
    if (!event) throw notFound();
    return { event };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Chat unavailable — IRL NOW" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${loaderData.event.title} group chat — IRL NOW`;
    const description = `Sort out arrivals, plus-ones and where to meet with everyone going to ${loaderData.event.title}.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "robots", content: "noindex" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: EventChat,
});

function EventChat() {
  const { event } = Route.useLoaderData();
  const {
    goingIds,
    checkedInIds,
    sentMessages,
    sendMessage,
    mutedThreads,
    toggleMute,
    blockedIds,
    name,
    pinnedMessages,
    togglePinned,
    reactions,
    toggleReaction,
  } = useApp();
  const threadId = `event:${event.id}`;
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const [reporting, setReporting] = useState<Person | null>(null);
  const [showRoster, setShowRoster] = useState(false);

  const allowed = goingIds.includes(event.id) || checkedInIds.includes(event.id);
  const muted = mutedThreads.includes(threadId);

  const messages = useMemo(
    () => eventChat(event.id).filter((m) => !blockedIds.includes(m.authorId)),
    [event.id, blockedIds],
  );
  const mine = sentMessages[threadId] ?? [];
  const roster = event.going.map(getPerson).filter(Boolean) as Person[];
  const responders = useMemo(() => respondersFor(event.id, blockedIds), [event.id, blockedIds]);
  const { typing, triggerReply, replies } = useLiveThread({ threadId, responders, dm: false });
  const hostNote = pinnedHostNote(event.id);
  const here = presenceCount(event.id);
  const pinnedId = pinnedMessages[threadId];
  const pinned = messages.find((m) => m.id === pinnedId);
  const quickReplies = eventQuickReplies(event.dateLabel);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mine.length + replies.length + (typing ? 1 : 0)]);

  if (!allowed) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-8 text-center">
        <Lock className="h-9 w-9 text-primary" />
        <h1 className="font-display text-2xl font-extrabold">This chat is for people going</h1>
        <p className="text-sm text-muted-foreground">
          Group chats only open to guests. Say you're going to {event.title} and you're in.
        </p>
        <Link
          to="/event/$id"
          params={{ id: event.id }}
          className="rounded-2xl bg-gradient-brand px-6 py-3.5 font-display font-bold text-primary-foreground shadow-glow"
        >
          Back to the event
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border/60 bg-background/90 px-3 py-3 backdrop-blur-xl">
        <Link to="/messages" aria-label="Back" className="rounded-full p-1.5 active:bg-secondary">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Link to="/event/$id" params={{ id: event.id }} className="min-w-0 flex-1">
          <p className="truncate font-display text-base font-extrabold leading-tight">{event.title}</p>
          <p className="text-xs text-muted-foreground">
            {event.goingCount} going ·{" "}
            <span className="font-semibold text-primary">{here} here now</span>
          </p>
        </Link>
        <button
          onClick={() => setShowRoster((v) => !v)}
          aria-label="Who's in this chat"
          className="rounded-full p-2 active:bg-secondary"
        >
          <Users className="h-4 w-4 text-muted-foreground" />
        </button>
        <button
          onClick={() => toggleMute(threadId)}
          aria-label={muted ? "Unmute chat" : "Mute chat"}
          className="rounded-full p-2 active:bg-secondary"
        >
          {muted ? (
            <BellOff className="h-4 w-4 text-primary" />
          ) : (
            <Bell className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </header>

      {showRoster && (
        <div className="border-b border-border bg-card/60 px-4 py-3">
          <p className="pb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            In this chat
          </p>
          <div className="flex flex-wrap gap-2">
            {roster.map((p) => (
              <Link
                key={p.id}
                to="/person/$id"
                params={{ id: p.id }}
                className="flex items-center gap-2 rounded-full bg-secondary px-2 py-1 pr-3"
              >
                <Avatar person={p} size="sm" />
                <span className="text-xs font-semibold">{p.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <main className="flex-1 space-y-3 px-4 py-4">
        <p className="mx-auto max-w-xs rounded-2xl bg-secondary/50 px-4 py-2 text-center text-[11px] leading-relaxed text-muted-foreground">
          Group chats close 48 hours after the event. Be decent — anything here can be reported.
        </p>

        {hostNote && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-primary/30 bg-primary/5 p-3">
            <Pin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                Pinned by {event.host}
              </p>
              <p className="mt-0.5 text-sm leading-relaxed">{hostNote}</p>
            </div>
          </div>
        )}

        {pinned && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-border bg-secondary/40 p-3">
            <Pin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <p className="flex-1 text-xs leading-relaxed text-muted-foreground">
              <span className="font-bold text-foreground">
                {getPerson(pinned.authorId)?.name ?? "Someone"}:
              </span>{" "}
              {pinned.text}
            </p>
            <button
              onClick={() => togglePinned(threadId, pinned.id)}
              className="text-[10px] font-bold text-primary"
            >
              Unpin
            </button>
          </div>
        )}

        {messages.map((m) => {
          if (m.system) {
            return (
              <p key={m.id} className="text-center text-xs text-muted-foreground">
                {m.text}
              </p>
            );
          }
          const person = getPerson(m.authorId);
          if (!person) return null;
          return (
            <div key={m.id} className="flex items-start gap-2.5">
              <Link to="/person/$id" params={{ id: person.id }}>
                <Avatar person={person} size="sm" />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-sm font-bold">{person.name}</span>
                  <span className="text-[10px] text-muted-foreground">{timeAgo(m.minutesAgo)}</span>
                  <button
                    onClick={() => setReporting(person)}
                    aria-label={`Report ${person.name}`}
                    className="ml-auto text-muted-foreground/60 active:text-destructive"
                  >
                    <ShieldAlert className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="mt-0.5 rounded-2xl rounded-tl-sm bg-card px-3.5 py-2.5 text-sm leading-relaxed">
                  {m.text}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1">
                  {REACTIONS.map((emoji) => {
                    const key = `${threadId}:${m.id}`;
                    const on = (reactions[key] ?? []).includes(emoji);
                    return (
                      <button
                        key={emoji}
                        onClick={() => toggleReaction(key, emoji)}
                        aria-label={`React ${emoji}`}
                        aria-pressed={on}
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[11px] transition-opacity",
                          on ? "bg-primary/15 opacity-100" : "opacity-35 active:opacity-100",
                        )}
                      >
                        {emoji}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => togglePinned(threadId, m.id)}
                    className="ml-1 text-[10px] font-bold text-muted-foreground active:text-primary"
                  >
                    {pinnedId === m.id ? "Unpin" : "Pin"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {mine.map((m) => (
          <div key={m.id} className="flex justify-end">
            <div className="max-w-[80%]">
              <p className="rounded-2xl rounded-br-sm bg-gradient-brand px-3.5 py-2.5 text-sm leading-relaxed text-primary-foreground">
                {m.text}
              </p>
              <p className="mt-0.5 text-right text-[10px] text-muted-foreground">
                {name || "You"} · now
              </p>
            </div>
          </div>
        ))}
        {replies.map((m) => {
          const person = getPerson(m.authorId);
          if (!person) return null;
          return (
            <div key={m.id} className="flex items-start gap-2.5">
              <Avatar person={person} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-sm font-bold">{person.name}</span>
                  <span className="text-[10px] text-muted-foreground">now</span>
                </div>
                <p className="mt-0.5 rounded-2xl rounded-tl-sm bg-card px-3.5 py-2.5 text-sm leading-relaxed">
                  {m.text}
                </p>
              </div>
            </div>
          );
        })}

        {typing && (
          <div className="flex items-center gap-2.5">
            <Avatar person={typing} size="sm" />
            <span className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-card px-3.5 py-3">
              <Dot delay="0ms" />
              <Dot delay="150ms" />
              <Dot delay="300ms" />
            </span>
            <span className="text-[10px] text-muted-foreground">{typing.name} is typing…</span>
          </div>
        )}
        <div ref={endRef} />
      </main>

      <div className="sticky bottom-[68px] flex gap-2 overflow-x-auto px-3 pb-2 [scrollbar-width:none]">
        {quickReplies.map((q) => (
          <button
            key={q}
            onClick={() => {
              sendMessage(threadId, q);
              triggerReply();
            }}
            className="shrink-0 rounded-full border border-border bg-card/90 px-3 py-1.5 text-xs font-semibold backdrop-blur"
          >
            {q}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.trim()) return;
          sendMessage(threadId, draft.trim());
          setDraft("");
          triggerReply();
        }}
        className="sticky bottom-0 flex items-center gap-2 border-t border-border bg-background/95 px-3 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur-xl"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Message everyone going…`}
          className="h-11 flex-1 rounded-2xl border border-border bg-card px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
        />
        <button
          type="submit"
          aria-label="Send"
          disabled={!draft.trim()}
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-2xl transition-opacity",
            draft.trim() ? "bg-gradient-brand text-primary-foreground shadow-glow" : "bg-secondary text-muted-foreground",
          )}
        >
          <SendHorizonal className="h-5 w-5" />
        </button>
      </form>

      {reporting && (
        <ReportSheet person={reporting} open onClose={() => setReporting(null)} />
      )}
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground"
      style={{ animationDelay: delay }}
    />
  );
}
