import { Link } from "@tanstack/react-router";
import { Infinity as InfinityIcon, Sparkles, Timer } from "lucide-react";
import { retentionFor, retentionPitch, FREE_RETENTION_DAYS } from "@irlnow/domain";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

/**
 * The conversion trigger for IRL NOW+: free walls are kept 30 days,
 * members keep them forever. Shown wherever memories live.
 */
export function MemoryExpiry({
  eventId,
  photoCount,
  compact = false,
}: {
  eventId: string;
  photoCount: number;
  compact?: boolean;
}) {
  const { membership } = useApp();
  const r = retentionFor(eventId, Boolean(membership));

  if (r.kept) {
    if (compact) return null;
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-accent/30 bg-accent/10 p-3">
        <InfinityIcon className="h-4 w-4 shrink-0 text-accent" />
        <p className="text-xs font-semibold text-accent">
          Kept forever — IRL NOW+ keeps every wall you were on.
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <Link
        to="/keep/$id"
        params={{ id: eventId }}
        className={cn(
          "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold",
          r.urgent ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
        )}
      >
        <Timer className="h-3 w-3" /> {r.label}
      </Link>
    );
  }

  return (
    <div
      className={cn(
        "rounded-3xl border p-4",
        r.urgent ? "border-primary/50 bg-primary/10" : "border-border/60 bg-card",
      )}
    >
      <div className="flex items-center gap-2">
        <Timer className={cn("h-4 w-4", r.urgent ? "text-primary" : "text-muted-foreground")} />
        <p className={cn("font-display font-extrabold", r.urgent && "text-primary")}>{r.label}</p>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{retentionPitch(photoCount, r.daysLeft)}</p>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn("h-full rounded-full", r.urgent ? "bg-primary" : "bg-gradient-brand")}
          style={{ width: `${Math.round(r.progress * 100)}%` }}
        />
      </div>
      <p className="mt-1.5 text-[11px] text-muted-foreground">
        Day {r.ageDays} of {FREE_RETENTION_DAYS} on a free account.
      </p>

      <Link
        to="/keep/$id"
        params={{ id: eventId }}
        className="mt-3 flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-brand font-display text-base font-bold text-primary-foreground shadow-glow active:scale-[0.98]"
      >
        <Sparkles className="h-4 w-4" /> Keep these forever
      </Link>
    </div>
  );
}
