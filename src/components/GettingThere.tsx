import { Accessibility, Bike, Car, Check, Footprints, Minus, TrainFront } from "lucide-react";
import { accessChecklist, accessInfo, lastTransport, leaveBy, travelOptions } from "@/lib/attend";
import type { IrlEvent } from "@/lib/data";
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
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{o.detail}</p>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">{lastTransport(event)}</p>
    </section>
  );
}

export function AccessPanel({ event }: { event: IrlEvent }) {
  const info = accessInfo(event);
  const list = accessChecklist(event);

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <h2 className="flex items-center gap-1.5 font-display text-base font-bold">
        <Accessibility className="h-4 w-4 text-accent" /> Access & comfort
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-y-2">
        {list.map((i) => (
          <div key={i.label} className="flex items-center gap-1.5 text-xs">
            {i.ok ? (
              <Check className="h-3.5 w-3.5 shrink-0 text-accent" strokeWidth={3} />
            ) : (
              <Minus className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            )}
            <span
              className={cn(i.ok ? "text-foreground/90" : "text-muted-foreground line-through")}
            >
              {i.label}
            </span>
          </div>
        ))}
      </div>
      {info.loudMusic && (
        <p className="mt-3 text-[11px] text-muted-foreground">
          Loud from about 9pm — earplugs at the bar if you want them.
        </p>
      )}
      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{info.note}</p>
    </section>
  );
}
