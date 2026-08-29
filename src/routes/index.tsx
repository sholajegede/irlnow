import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Clock, DoorOpen, Flame, Sparkles, Users } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { EventFeedCard } from "@/components/EventFeedCard";
import { FEED_CAP, eventCovers, events } from "@/lib/data";
import { liveDrops } from "@/lib/venues";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Discover — IRL NOW" },
      {
        name: "description",
        content:
          "Swipe through the best real-world experiences near you — run clubs, markets, supper clubs, galleries and jazz.",
      },
      { property: "og:title", content: "Discover — IRL NOW" },
      {
        property: "og:description",
        content: "Real-world plans around you, curated and finite.",
      },
    ],
  }),
  component: DiscoverPage,
});

type Mode = "foryou" | "tonight" | "weekend" | "trending";

const modes: { id: Mode; label: string }[] = [
  { id: "foryou", label: "For you" },
  { id: "tonight", label: "Tonight" },
  { id: "weekend", label: "This weekend" },
  { id: "trending", label: "Trending" },
];

function DiscoverPage() {
  const { interests, onboarded } = useApp();
  const [mode, setMode] = useState<Mode>("foryou");

  const feed = useMemo(() => {
    let list = [...events];
    if (mode === "tonight") list = list.filter((e) => e.when === "tonight");
    if (mode === "weekend") list = list.filter((e) => e.when === "weekend");
    if (mode === "trending") {
      list = list
        .filter((e) => e.trending || e.goingCount > 40)
        .sort((a, b) => b.goingCount - a.goingCount);
    }
    if (mode === "foryou" && onboarded && interests.length) {
      list.sort(
        (a, b) =>
          b.interests.filter((i) => interests.includes(i)).length -
          a.interests.filter((i) => interests.includes(i)).length,
      );
    }
    return list.slice(0, FEED_CAP);
  }, [mode, interests, onboarded]);

  const pulse = useMemo(() => {
    const soon = events.filter((e) => e.when === "tonight" || e.when === "weekend");
    const heads = soon.reduce((n, e) => n + e.goingCount, 0);
    return { count: soon.length, heads };
  }, []);

  return (
    <div className="flex h-dvh flex-col pb-[calc(4.25rem+env(safe-area-inset-bottom))]">
      <AppHeader actions />
      <div className="sticky top-[57px] z-30 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <Link to="/people" className="flex items-center gap-2 px-4 pt-2 active:opacity-70">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          <p className="flex items-center gap-1.5 truncate text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            <span>
              {pulse.heads} people out at {pulse.count} things near you
            </span>
            <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-primary-foreground underline decoration-1 underline-offset-2">
              See who
            </span>
          </p>
        </Link>
        <div className="flex gap-2 overflow-x-auto px-4 py-2 no-scrollbar">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={cn(
                "flex shrink-0 items-center gap-1 rounded-full px-4 py-1.5 text-xs font-bold transition-all active:scale-95",
                mode === m.id
                  ? "bg-foreground text-background"
                  : "bg-secondary text-secondary-foreground",
              )}
            >
              {m.id === "trending" && <Flame className="h-3.5 w-3.5" />}
              {m.label}
            </button>
          ))}
          <Link
            to="/plans"
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-brand px-3.5 py-1.5 text-xs font-bold text-primary-foreground shadow-glow"
          >
            <Users className="h-3.5 w-3.5" /> Plans
          </Link>
          {liveDrops()
            .slice(0, 3)
            .map((d) => (
              <Link
                key={d.id}
                to="/drop/$id"
                params={{ id: d.id }}
                className="flex shrink-0 items-center gap-2 rounded-full bg-secondary py-1 pl-1 pr-3.5"
              >
                <img
                  src={eventCovers[d.cover]}
                  alt=""
                  width={64}
                  height={64}
                  loading="lazy"
                  className="h-6 w-6 rounded-full object-cover"
                />
                <span className="text-xs font-bold">
                  <Clock className="mr-1 inline h-3 w-3 text-accent" />
                  {d.offer}
                </span>
              </Link>
            ))}
        </div>
      </div>

      <main className="snap-feed min-h-0 flex-1 snap-y snap-mandatory overflow-y-auto no-scrollbar">
        {feed.map((event) => (
          <EventFeedCard key={event.id} event={event} />
        ))}

        {feed.length > 0 && (
          <section className="snap-card flex h-full w-full flex-col items-center justify-center gap-4 px-8 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-brand shadow-glow">
              <DoorOpen className="h-7 w-7 text-primary-foreground" />
            </span>
            <h2 className="font-display text-3xl font-extrabold leading-tight tracking-tight">
              That's it for now.
              <br />
              Go outside.
            </h2>
            <p className="max-w-xs text-sm text-muted-foreground">
              We don't do infinite scroll. You've seen everything worth leaving the house for — pick
              one and actually go.
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <Link
                to="/going"
                className="rounded-full bg-gradient-brand px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-glow active:scale-95"
              >
                What I'm going to
              </Link>
              <Link
                to="/search"
                className="rounded-full bg-secondary px-5 py-2.5 text-sm font-bold active:scale-95"
              >
                Search something specific
              </Link>
            </div>
          </section>
        )}

        {feed.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
            <p className="font-display text-xl font-bold">Nothing here yet</p>
            <p className="text-sm text-muted-foreground">
              Try another view — the city is full of plans.
            </p>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
