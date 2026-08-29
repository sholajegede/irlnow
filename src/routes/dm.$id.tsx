import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Lock, SendHorizonal, ShieldAlert } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { ReportSheet } from "@/components/ReportSheet";
import { getPerson } from "@/lib/data";
import { dmThread, timeAgo } from "@/lib/social";
import { DM_QUICK_REPLIES } from "@/lib/live";
import { useLiveThread } from "@/lib/use-live-thread";
import { useApp, useConnectionState } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dm/$id")({
  loader: ({ params }) => {
    const person = getPerson(params.id);
    if (!person) throw notFound();
    return { person };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Conversation unavailable — IRL NOW" }, { name: "robots", content: "noindex" }] };
    }
    const title = `Chat with ${loaderData.person.name} — IRL NOW`;
    const description = `A private conversation with someone you actually met in real life.`;
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
  component: DirectMessage,
});

function DirectMessage() {
  const { person } = Route.useLoaderData();
  const { sentMessages, sendMessage } = useApp();
  const { typing, triggerReply, replies } = useLiveThread({
    threadId: `dm:${person.id}`,
    responders: [person],
    dm: true,
  });
  const state = useConnectionState(person.id);
  const threadId = `dm:${person.id}`;
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const [reporting, setReporting] = useState(false);
  const history = dmThread(person.id);
  const mine = sentMessages[threadId] ?? [];
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mine.length + replies.length + (typing ? 1 : 0)]);

  if (state !== "connected") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-8 text-center">
        <Lock className="h-9 w-9 text-primary" />
        <h1 className="font-display text-2xl font-extrabold">You're not connected yet</h1>
        <p className="text-sm text-muted-foreground">
          Messages only open once you've both agreed to connect. No cold DMs on IRL NOW — ever.
        </p>
        <Link
          to="/person/$id"
          params={{ id: person.id }}
          className="rounded-2xl bg-gradient-brand px-6 py-3.5 font-display font-bold text-primary-foreground shadow-glow"
        >
          View {person.name}'s profile
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
        <Link to="/person/$id" params={{ id: person.id }} className="flex min-w-0 flex-1 items-center gap-2.5">
          <Avatar person={person} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-display text-base font-extrabold leading-tight">{person.name}</p>
            <p className="text-xs text-muted-foreground">Met at an event</p>
          </div>
        </Link>
        <button
          onClick={() => setReporting(true)}
          aria-label="Report or block"
          className="rounded-full p-2 active:bg-secondary"
        >
          <ShieldAlert className="h-4 w-4 text-muted-foreground" />
        </button>
      </header>

      <main className="flex-1 space-y-3 px-4 py-4">
        <p className="mx-auto max-w-xs rounded-2xl bg-secondary/50 px-4 py-2 text-center text-[11px] leading-relaxed text-muted-foreground">
          You connected after an event. Block or report at any time — {person.name} is never told.
        </p>
        {history.map((m) =>
          m.authorId === "you" ? (
            <div key={m.id} className="flex justify-end">
              <div className="max-w-[80%]">
                <p className="rounded-2xl rounded-br-sm bg-gradient-brand px-3.5 py-2.5 text-sm text-primary-foreground">
                  {m.text}
                </p>
                <p className="mt-0.5 text-right text-[10px] text-muted-foreground">{timeAgo(m.minutesAgo)}</p>
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex justify-start">
              <div className="max-w-[80%]">
                <p className="rounded-2xl rounded-tl-sm bg-card px-3.5 py-2.5 text-sm">{m.text}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{timeAgo(m.minutesAgo)}</p>
              </div>
            </div>
          ),
        )}
        {mine.map((m) => (
          <div key={m.id} className="flex justify-end">
            <div className="max-w-[80%]">
              <p className="rounded-2xl rounded-br-sm bg-gradient-brand px-3.5 py-2.5 text-sm text-primary-foreground">
                {m.text}
              </p>
              <p className="mt-0.5 text-right text-[10px] text-muted-foreground">
                now · {replies.length ? "Read" : "Delivered"}
              </p>
            </div>
          </div>
        ))}
        {replies.map((m) => (
          <div key={m.id} className="flex justify-start">
            <div className="max-w-[80%]">
              <p className="rounded-2xl rounded-tl-sm bg-card px-3.5 py-2.5 text-sm">{m.text}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">now</p>
            </div>
          </div>
        ))}

        {typing && (
          <p className="text-[11px] text-muted-foreground">{person.name} is typing…</p>
        )}
        <div ref={endRef} />
      </main>

      <div className="sticky bottom-[68px] flex gap-2 overflow-x-auto px-3 pb-2 [scrollbar-width:none]">
        {DM_QUICK_REPLIES.map((q) => (
          <button
            key={q}
            onClick={() => {
              sendMessage(`dm:${person.id}`, q);
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
          placeholder={`Message ${person.name}…`}
          className="h-11 flex-1 rounded-2xl border border-border bg-card px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
        />
        <button
          type="submit"
          aria-label="Send"
          disabled={!draft.trim()}
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-2xl",
            draft.trim() ? "bg-gradient-brand text-primary-foreground shadow-glow" : "bg-secondary text-muted-foreground",
          )}
        >
          <SendHorizonal className="h-5 w-5" />
        </button>
      </form>

      <ReportSheet person={person} open={reporting} onClose={() => setReporting(false)} />
    </div>
  );
}
