import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, X } from "lucide-react";
import { eventCovers, pastEvent } from "@/lib/data";
import { useApp } from "@/lib/store";
import { wallStats } from "@/lib/wall";

/** The morning-after nudge: the notification people actually open. */
export function RecapBanner() {
  const { recapDismissed, dismissRecap } = useApp();
  if (recapDismissed) return null;
  const stats = wallStats(pastEvent.id);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-primary/40 bg-card">
      <Link to="/w/$id" params={{ id: pastEvent.id }} className="flex items-center gap-3 p-3">
        <img
          src={eventCovers[pastEvent.cover]}
          alt={pastEvent.title}
          width={1024}
          height={1280}
          className="h-16 w-16 shrink-0 rounded-2xl object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-primary">The morning after</p>
          <p className="truncate font-display text-base font-extrabold">{pastEvent.title}</p>
          <p className="text-xs text-muted-foreground">
            {stats.total} photos are up — you're in {stats.yours}
          </p>
        </div>
        <ArrowRight className="h-5 w-5 shrink-0 text-primary" />
      </Link>
      <Link
        to="/recap/$id"
        params={{ id: pastEvent.id }}
        className="mx-3 mb-3 flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-brand text-sm font-bold text-primary-foreground"
      >
        <Sparkles className="h-4 w-4" /> See your recap card
      </Link>
      <button
        onClick={dismissRecap}
        aria-label="Dismiss recap"
        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-background/70"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
