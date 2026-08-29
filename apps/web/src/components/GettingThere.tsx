import {
  Accessibility,
  Bike,
  Car,
  Check,
  Footprints,
  HelpCircle,
  TrainFront,
  X,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { leaveBy, travelOptions } from "@irlnow/domain";
import type { IrlEvent } from "@irlnow/domain";
import { accessChecklist, accessFor, expectsLoudMusic, hasDeclaredAccess } from "@irlnow/domain";
import { cn } from "@/lib/utils";

const ICONS = {
  walk: Footprints,
  cycle: Bike,
  transit: TrainFront,
  cab: Car,
} as const;

export function GettingThere({ event }: { event: IrlEvent }) {
  const options = travelOptions(event);
  const leave = leaveBy(event);

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-base font-bold">Getting there</h2>
        <span className="text-xs text-muted-foreground">{event.distance} away</span>
      </div>
      <p className="mt-1 text-sm text-primary">
        Leave by <span className="font-bold">{leave.label}</span> to walk in on time.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {options.map((o) => {
          const Icon = ICONS[o.mode];
          return (
            <div key={o.mode} className="rounded-xl bg-secondary p-3">
              <div className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-bold">{o.label}</span>
                <span className="ml-auto font-display text-sm font-extrabold">{o.minutes}m</span>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">
        Estimated from distance — check your route app before you set off.
      </p>
    </section>
  );
}

const ANSWER_STYLES = {
  yes: { Icon: Check, iconClass: "text-accent", labelClass: "text-foreground/90" },
  no: { Icon: X, iconClass: "text-muted-foreground", labelClass: "text-muted-foreground" },
  unknown: {
    Icon: HelpCircle,
    iconClass: "text-muted-foreground/70",
    labelClass: "text-muted-foreground/70",
  },
} as const;

/**
 * Access details, shown only as the host declared them.
 *
 * An unanswered facility reads "not answered", never a tick or a cross.
 * Someone decides whether to leave the house on this panel, so a guess here
 * is worse than an absence.
 */
export function AccessPanel({ event }: { event: IrlEvent }) {
  const access = accessFor(event);
  const items = accessChecklist(event);
  const declared = hasDeclaredAccess(event);

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <h2 className="flex items-center gap-1.5 font-display text-base font-bold">
        <Accessibility className="h-4 w-4 text-accent" /> Access &amp; comfort
      </h2>

      {declared ? (
        <>
          <div className="mt-3 grid grid-cols-2 gap-y-2">
            {items.map((item) => {
              const { Icon, iconClass, labelClass } = ANSWER_STYLES[item.answer];
              return (
                <div key={item.id} className="flex items-center gap-1.5 text-xs">
                  <Icon className={cn("h-3.5 w-3.5 shrink-0", iconClass)} strokeWidth={3} />
                  <span className={labelClass}>{item.label}</span>
                  {item.answer === "unknown" && (
                    <span className="sr-only">— not answered by the host</span>
                  )}
                </div>
              );
            })}
          </div>
          {access.note && (
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">{access.note}</p>
          )}
        </>
      ) : (
        <div className="mt-3 rounded-xl bg-secondary p-3">
          <p className="text-xs font-semibold">
            {event.host} hasn&apos;t added access details yet.
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            We won&apos;t guess — a wrong answer here could send you to a door you can&apos;t get
            through. Ask and they&apos;ll come straight back to you.
          </p>
          <Link
            to="/chat/$id"
            params={{ id: event.id }}
            className="mt-2 inline-flex rounded-full bg-foreground px-3 py-1.5 text-[11px] font-bold text-background active:scale-95"
          >
            Ask {event.host} about access
          </Link>
        </div>
      )}

      {expectsLoudMusic(event) && (
        <p className="mt-3 text-[11px] text-muted-foreground">
          Expect it to be loud — it&apos;s a music night.
        </p>
      )}
    </section>
  );
}
