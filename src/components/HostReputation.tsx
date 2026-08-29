import { BadgeCheck, Clock3, Repeat, Star, TrendingUp, Users } from "lucide-react";
import { hostReliability, verificationSteps } from "@/lib/hosting";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

const tierStyles: Record<string, string> = {
  "New host": "bg-secondary text-secondary-foreground",
  "Trusted host": "bg-accent/15 text-accent",
  "Verified host": "bg-primary/15 text-primary",
  "Signature host": "bg-gradient-brand text-primary-foreground",
};

export function HostReputation({ organiserId, compact }: { organiserId: string; compact?: boolean }) {
  const { eventRatings, verifiedSteps, completeVerification } = useApp();
  const r = hostReliability(organiserId, Object.values(eventRatings));
  const doneSteps = verificationSteps.filter((s) => verifiedSteps.includes(s.id)).length;

  return (
    <section className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Your reputation
          </p>
          <p className="mt-1 flex items-center gap-2 font-display text-2xl font-extrabold leading-none">
            {r.stars.toFixed(1)}
            <Star className="h-5 w-5 fill-accent text-accent" />
            <span className="text-sm font-semibold text-muted-foreground">{r.reviews} reviews</span>
          </p>
        </div>
        <span
          className={cn(
            "flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-extrabold uppercase",
            tierStyles[r.tier],
          )}
        >
          <BadgeCheck className="h-3.5 w-3.5" /> {r.tier}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Signal icon={Users} value={`${Math.round(r.showRate * 100)}%`} label="Turn up after saying yes" />
        <Signal icon={Repeat} value={`${Math.round(r.returnRate * 100)}%`} label="Would come again" />
        <Signal icon={Clock3} value={`${Math.round(r.onTimeRate * 100)}%`} label="Started on time" />
        <Signal icon={TrendingUp} value={String(r.repeatGuests)} label="Guests who came back" />
      </div>

      {!compact && (
        <>
          <p className="text-xs text-muted-foreground">
            Reputation decides where your events sit in Discover. Turnout and honest descriptions move it
            more than ratings do — replies within {r.responseHours}h keep it steady.
          </p>

          {r.nextTier && (
            <div className="rounded-2xl bg-secondary p-3">
              <p className="text-xs font-bold">Next: {r.nextTier.tier}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{r.nextTier.needs}</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="font-display text-base font-extrabold">Trust checklist</p>
              <p className="text-xs text-muted-foreground">
                {doneSteps}/{verificationSteps.length} done
              </p>
            </div>
            {verificationSteps.map((s) => {
              const done = verifiedSteps.includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => !done && completeVerification(s.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border p-3 text-left transition-transform active:scale-[0.99]",
                    done ? "border-accent/40 bg-accent/10" : "border-border bg-secondary",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                      done ? "bg-accent text-accent-foreground" : "bg-background text-muted-foreground",
                    )}
                  >
                    {done ? "✓" : `${s.minutes}m`}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold">{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.detail}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

function Signal({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Users;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl bg-secondary p-3">
      <Icon className="h-4 w-4 text-accent" />
      <p className="mt-1.5 font-display text-xl font-extrabold leading-none">{value}</p>
      <p className="mt-1 text-[11px] leading-tight text-muted-foreground">{label}</p>
    </div>
  );
}
