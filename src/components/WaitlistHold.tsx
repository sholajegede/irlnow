import { Clock, PartyPopper, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { HOLD_MINUTES, holdRemaining, waitlistOdds } from "@/lib/attend";
import type { IrlEvent } from "@/lib/data";
import { useApp, waitlistPosition } from "@/lib/store";

/**
 * Waitlist auto-promotion: when a spot frees up, it's held for you for
 * HOLD_MINUTES. Take it or it rolls to the next person.
 */
export function WaitlistHold({ event, holdOnly = false }: { event: IrlEvent; holdOnly?: boolean }) {
  const {
    waitlistIds,
    waitlistHolds,
    declinedHolds,
    offerWaitlistHold,
    acceptWaitlistHold,
    declineWaitlistHold,
    goingIds,
  } = useApp();
  const [now, setNow] = useState(() => Date.now());
  const onList = waitlistIds.includes(event.id);
  const expiresAt = waitlistHolds[event.id];
  const position = waitlistPosition(event.id);

  // A spot frees up shortly after you join the list (prototype simulation).
  useEffect(() => {
    if (!onList || expiresAt || declinedHolds.includes(event.id) || goingIds.includes(event.id))
      return;
    const t = setTimeout(() => offerWaitlistHold(event.id, HOLD_MINUTES), 6000);
    return () => clearTimeout(t);
  }, [onList, expiresAt, declinedHolds, goingIds, event.id, offerWaitlistHold]);

  useEffect(() => {
    if (!expiresAt) return;
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, [expiresAt]);

  if (!onList && !expiresAt) return null;
  if (!expiresAt && holdOnly) return null;

  if (!expiresAt) {
    return (
      <div className="rounded-2xl border border-primary/40 bg-primary/10 p-4">
        <p className="flex items-center gap-1.5 text-sm font-bold text-primary">
          <Clock className="h-4 w-4" /> #{position} on the waitlist
        </p>
        <p className="mt-1 text-sm text-foreground/85">
          {waitlistOdds(event.id, position)}. If a spot frees up it's held for you for{" "}
          {HOLD_MINUTES} minutes — keep notifications on.
        </p>
      </div>
    );
  }

  const left = holdRemaining(expiresAt, now);
  const expired = expiresAt <= now;

  if (expired) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-sm font-bold">Your hold expired</p>
        <p className="mt-1 text-sm text-muted-foreground">
          The spot went to the next person. You're back on the list at #{position + 1}.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-accent/50 bg-accent/12 p-4">
      <p className="flex items-center gap-1.5 font-display text-base font-extrabold text-accent">
        <PartyPopper className="h-4 w-4" /> A spot just opened
      </p>
      <p className="mt-1 text-sm text-foreground/90">
        You were next. It's yours if you claim it in{" "}
        <span className="font-display font-extrabold tabular-nums text-accent">{left}</span>.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => acceptWaitlistHold(event.id)}
          className="h-11 flex-1 rounded-xl bg-gradient-brand font-display text-sm font-bold text-primary-foreground shadow-glow"
        >
          Claim my spot
        </button>
        <button
          onClick={() => declineWaitlistHold(event.id)}
          className="flex h-11 items-center gap-1.5 rounded-xl border border-border px-3 text-xs font-semibold text-muted-foreground"
        >
          <X className="h-3.5 w-3.5" /> Pass
        </button>
      </div>
      <Link to="/going" className="mt-2 block text-center text-[11px] text-muted-foreground">
        Manage everything you're waiting on
      </Link>
    </div>
  );
}
