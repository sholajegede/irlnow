import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Users } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { Avatar } from "@/components/Avatar";
import { ConnectButton } from "@/components/ConnectButton";
import { peopleOut } from "@irlnow/domain";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/people")({
  head: () => ({
    meta: [
      { title: "People out this week — IRL NOW" },
      {
        name: "description",
        content:
          "See who's actually going out near you this week — people like you, people going solo, people you've met — and join the thing they're going to.",
      },
      { property: "og:title", content: "People out this week — IRL NOW" },
      {
        property: "og:description",
        content: "Everyone here is going somewhere real. Join them.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PeoplePage,
});

type Filter = "all" | "likeyou" | "solo" | "mutuals" | "met";

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "Everyone out" },
  { id: "likeyou", label: "Like you" },
  { id: "solo", label: "Going solo" },
  { id: "mutuals", label: "Mutuals" },
  { id: "met", label: "Met before" },
];

function PeoplePage() {
  const { interests, connectedIds } = useApp();
  const [filter, setFilter] = useState<Filter>("all");

  const all = useMemo(() => peopleOut(interests, connectedIds), [interests, connectedIds]);
  const list = useMemo(() => {
    if (filter === "likeyou") return all.filter((p) => p.likeYou);
    if (filter === "solo") return all.filter((p) => p.solo);
    if (filter === "mutuals") return all.filter((p) => p.mutual);
    if (filter === "met") return all.filter((p) => p.met);
    return all;
  }, [all, filter]);

  const tonight = all.filter((p) => p.event.when === "tonight").length;

  return (
    <div className="min-h-dvh pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      <AppHeader actions />

      <header className="px-4 pb-3 pt-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          People
        </p>
        <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight">
          {all.length} people are out this week
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {tonight} of them tonight. Everyone here already said yes to something — tap in and go.
        </p>
      </header>

      <div className="sticky top-[57px] z-30 flex gap-2 overflow-x-auto border-b border-border/60 bg-background/85 px-4 py-2 no-scrollbar backdrop-blur-xl">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-all active:scale-95",
              filter === f.id
                ? "bg-foreground text-background"
                : "bg-secondary text-secondary-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <main className="flex flex-col gap-3 p-4">
        {list.map((entry) => (
          <article
            key={entry.person.id}
            className="rounded-3xl border border-border/60 bg-card p-4"
          >
            <div className="flex items-start gap-3">
              <Link to="/person/$id" params={{ id: entry.person.id }}>
                <Avatar person={entry.person} size="lg" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  to="/person/$id"
                  params={{ id: entry.person.id }}
                  className="font-display text-lg font-extrabold leading-tight"
                >
                  {entry.person.name}
                </Link>
                <p className="text-xs font-semibold text-primary">{entry.reason}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {entry.person.bio}
                </p>
              </div>
              <ConnectButton person={entry.person} size="sm" />
            </div>

            <Link
              to="/event/$id"
              params={{ id: entry.event.id }}
              className="mt-3 flex items-center gap-3 rounded-2xl bg-secondary/70 p-3 active:scale-[0.99]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-brand">
                <Users className="h-4 w-4 text-primary-foreground" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Going to
                </span>
                <span className="block truncate text-sm font-bold">{entry.event.title}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {entry.event.area} · {entry.event.dateLabel}
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          </article>
        ))}

        {list.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <p className="font-display text-xl font-bold">Nobody here yet</p>
            <p className="text-sm text-muted-foreground">
              Try another filter — or say you're going to something and you'll show up for others.
            </p>
            <Link
              to="/"
              className="mt-2 rounded-full bg-gradient-brand px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-glow"
            >
              See what's happening
            </Link>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
