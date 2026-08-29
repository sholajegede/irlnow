import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Clock, MessageCircle } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { BottomNav } from "@/components/BottomNav";
import { ConnectButton } from "@/components/ConnectButton";
import { getEvent, getPerson, people } from "@/lib/data";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/connections")({
  head: () => ({
    meta: [
      { title: "Connections — IRL NOW" },
      {
        name: "description",
        content:
          "People you've met through events — the social graph you built by actually turning up.",
      },
      { property: "og:title", content: "Connections — IRL NOW" },
      { property: "og:description", content: "Everyone you've met in real life through IRL NOW." },
    ],
  }),
  component: ConnectionsPage,
});

function ConnectionsPage() {
  const {
    connectedIds,
    incomingRequests,
    outgoingRequests,
    blockedIds,
    goingIds,
    acceptRequest,
    declineRequest,
    cancelRequest,
  } = useApp();

  const visible = (id: string) => !blockedIds.includes(id);
  const connections = connectedIds.filter(visible).map(getPerson).filter(Boolean);
  const incoming = incomingRequests.filter(visible).map(getPerson).filter(Boolean);
  const outgoing = outgoingRequests.filter(visible).map(getPerson).filter(Boolean);

  const known = [...connectedIds, ...incomingRequests, ...outgoingRequests, ...blockedIds];
  // People you can meet at events you're already going to — event-context only.
  const atYourEvents = goingIds
    .map((id) => getEvent(id))
    .filter(Boolean)
    .flatMap((e) =>
      e!.going
        .filter((pid) => !known.includes(pid))
        .map((pid) => ({ person: people.find((p) => p.id === pid)!, event: e! })),
    )
    .filter((x) => x.person);

  return (
    <div className="flex min-h-dvh flex-col pb-24">
      <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur-xl">
        <Link to="/you" className="rounded-full p-1.5 active:bg-secondary">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <p className="font-display text-lg font-extrabold tracking-tight">Connections</p>
          <p className="text-xs text-muted-foreground">
            {connections.length} {connections.length === 1 ? "person" : "people"} you've met in real life
          </p>
        </div>
        <Link to="/messages" aria-label="Messages" className="rounded-full bg-secondary p-2">
          <MessageCircle className="h-4 w-4" />
        </Link>
      </header>

      <main className="flex-1 space-y-6 px-4 pt-4">
        {incoming.length > 0 && (
          <section>
            <h2 className="pb-2 text-xs font-bold uppercase tracking-widest text-primary">
              Requests · {incoming.length}
            </h2>
            <div className="space-y-2">
              {incoming.map((p) => (
                <div
                  key={p!.id}
                  className="rounded-2xl border border-primary/40 bg-primary/5 p-3"
                >
                  <div className="flex items-center gap-3">
                    <Link to="/person/$id" params={{ id: p!.id }}>
                      <Avatar person={p!} />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link to="/person/$id" params={{ id: p!.id }} className="font-display text-base font-bold">
                        {p!.name}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">{p!.reason}</p>
                    </div>
                  </div>
                  <div className="mt-2.5 flex gap-2">
                    <button
                      onClick={() => acceptRequest(p!.id)}
                      className="h-9 flex-1 rounded-xl bg-gradient-brand font-display text-xs font-bold text-primary-foreground"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => declineRequest(p!.id)}
                      className="h-9 flex-1 rounded-xl bg-secondary font-display text-xs font-bold text-muted-foreground"
                    >
                      Ignore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-2">
          {connections.length > 0 && (
            <h2 className="pb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Connected
            </h2>
          )}
          {connections.map((p) => (
            <div key={p!.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
              <Link to="/person/$id" params={{ id: p!.id }}>
                <Avatar person={p!} />
              </Link>
              <Link to="/person/$id" params={{ id: p!.id }} className="min-w-0 flex-1">
                <p className="font-display text-base font-bold">{p!.name}</p>
                <p className="truncate text-xs text-muted-foreground">{p!.bio}</p>
              </Link>
              <Link
                to="/dm/$id"
                params={{ id: p!.id }}
                aria-label={`Message ${p!.name}`}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary"
              >
                <MessageCircle className="h-4 w-4" />
              </Link>
            </div>
          ))}
          {connections.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No connections yet. You'll meet people at the events you go to.
            </p>
          )}
        </section>

        {outgoing.length > 0 && (
          <section>
            <h2 className="pb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Waiting on them
            </h2>
            <div className="space-y-2">
              {outgoing.map((p) => (
                <div key={p!.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                  <Avatar person={p!} />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-base font-bold">{p!.name}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> Request sent
                    </p>
                  </div>
                  <button
                    onClick={() => cancelRequest(p!.id)}
                    className="h-9 shrink-0 rounded-xl bg-secondary px-3.5 font-display text-xs font-bold text-muted-foreground"
                  >
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {atYourEvents.length > 0 && (
          <section>
            <h2 className="pb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              At events you're going to
            </h2>
            <div className="space-y-2">
              {atYourEvents.map(({ person, event }) => (
                <div
                  key={`${event.id}-${person.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
                >
                  <Link to="/person/$id" params={{ id: person.id }}>
                    <Avatar person={person} />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      to="/person/$id"
                      params={{ id: person.id }}
                      className="font-display text-base font-bold"
                    >
                      {person.name}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">
                      Also going to {event.title}
                    </p>
                  </div>
                  <ConnectButton person={person} size="sm" />
                </div>
              ))}
            </div>
            <p className="pt-3 text-xs text-muted-foreground">
              IRL NOW only suggests people you'll actually be in a room with — no stranger browsing.
            </p>
          </section>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
