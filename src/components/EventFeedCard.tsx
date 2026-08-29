import { Bookmark, Check, MapPin, Users } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { eventCovers, type IrlEvent } from "@/lib/data";
import { goingGraph } from "@/lib/graph";
import { useApp } from "@/lib/store";
import { Avatar } from "./Avatar";
import { cn } from "@/lib/utils";

export function EventFeedCard({ event }: { event: IrlEvent }) {
  const { goingIds, savedIds, toggleGoing, toggleSaved, boosts, interests, connectedIds } =
    useApp();
  const going = goingIds.includes(event.id);
  const saved = savedIds.includes(event.id);
  const graph = goingGraph(event.id, interests, connectedIds);
  const faces = graph.roster.slice(0, 4);

  return (
    <article className="snap-card relative h-full w-full overflow-hidden">
      <img
        src={eventCovers[event.cover]}
        alt={event.title}
        loading="lazy"
        width={1024}
        height={1280}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-fade" />

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-5 pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary-foreground">
            {event.category}
          </span>
          {boosts[event.id] && (
            <span className="rounded-full bg-background/70 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary backdrop-blur">
              Promoted
            </span>
          )}
          {event.trending && (
            <span className="rounded-full bg-accent px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-accent-foreground">
              Trending
            </span>
          )}
        </div>

        <Link to="/event/$id" params={{ id: event.id }} className="group">
          <h2 className="font-display text-3xl font-extrabold leading-tight tracking-tight group-active:opacity-80">
            {event.title}
          </h2>
        </Link>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-foreground/85">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-primary" /> {event.area} · {event.distance}
          </span>
          <span>{event.dateLabel}</span>
          <span className="rounded-md bg-background/60 px-2 py-0.5 text-xs font-bold backdrop-blur">
            {event.price}
          </span>
          {event.spotsLeft ? (
            <span className="text-xs font-bold text-accent">{event.spotsLeft} spots left</span>
          ) : null}
        </div>

        {/* People are the reason to care — the event is the context. */}
        <Link
          to="/event/$id"
          params={{ id: event.id }}
          className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/45 p-2.5 backdrop-blur active:scale-[0.99]"
        >
          <div className="flex -space-x-3">
            {faces.map((p) => (
              <Avatar key={p.id} person={p} size="md" />
            ))}
          </div>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 font-display text-sm font-extrabold leading-tight">
              {graph.headline}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">{graph.subline}</p>
          </div>
        </Link>

        <div className="mt-1 flex gap-2.5">
          <button
            onClick={() => toggleGoing(event.id)}
            className={cn(
              "flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl font-display text-base font-bold transition-all active:scale-[0.97]",
              going
                ? "bg-accent text-accent-foreground"
                : "bg-gradient-brand text-primary-foreground shadow-glow",
            )}
          >
            {going ? <Check className="h-5 w-5" strokeWidth={3} /> : null}
            {going ? "You're going" : "I'm Going"}
          </button>
          <button
            onClick={() => toggleSaved(event.id)}
            aria-label={saved ? "Unsave" : "Save"}
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-2xl border backdrop-blur transition-all active:scale-95",
              saved
                ? "border-primary bg-primary/20 text-primary"
                : "border-border bg-background/50 text-foreground",
            )}
          >
            <Bookmark className={cn("h-5 w-5", saved && "fill-primary")} />
          </button>
          <Link
            to="/event/$id"
            params={{ id: event.id }}
            aria-label="Event details"
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-background/50 text-foreground backdrop-blur transition-all active:scale-95"
          >
            <Users className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
