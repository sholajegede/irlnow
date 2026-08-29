import { Link } from "@tanstack/react-router";
import { Cake } from "lucide-react";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

/** Host-side flywheel: turn the second event into a hosted event. */
export function BirthdayNudge() {
  const { birthday, setBirthday, goingIds } = useApp();
  const [value, setValue] = useState("");
  const eligible = goingIds.length >= 2;
  if (!eligible) return null;

  if (birthday) {
    return (
      <section className="rounded-3xl border border-accent/40 bg-accent/10 p-4">
        <p className="flex items-center gap-2 font-display text-lg font-extrabold text-accent">
          <Cake className="h-5 w-5" /> Your birthday's in 6 weeks
        </p>
        <p className="mt-1 text-sm text-foreground/85">
          Best rooms get booked 5 weeks out. Start it now, invite later — takes about 90 seconds.
        </p>
        <Link
          to="/create"
          className="mt-3 flex h-12 items-center justify-center rounded-2xl bg-gradient-brand font-display text-base font-bold text-primary-foreground shadow-glow"
        >
          Plan my birthday
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-4">
      <p className="flex items-center gap-2 font-display text-lg font-extrabold">
        <Cake className="h-5 w-5 text-primary" /> When's your birthday?
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        We'll remind you in time to actually book somewhere good.
      </p>
      <div className="mt-3 flex gap-2">
        <input
          type="date"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-11 flex-1 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary"
        />
        <button
          disabled={!value}
          onClick={() => setBirthday(value)}
          className={cn(
            "h-11 rounded-xl px-4 text-sm font-bold",
            value ? "bg-gradient-brand text-primary-foreground" : "bg-muted text-muted-foreground",
          )}
        >
          Save
        </button>
      </div>
    </section>
  );
}
