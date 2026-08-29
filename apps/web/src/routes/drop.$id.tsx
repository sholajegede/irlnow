import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, BadgeCheck, Clock, Footprints, MapPin, Ticket, Users } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { eventCovers } from "@/lib/covers";
import { getDrop, getVenue, spotsLeft } from "@irlnow/domain";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/drop/$id")({
  head: () => ({
    meta: [
      { title: "Spontaneous capacity — IRL NOW" },
      {
        name: "description",
        content: "A venue near you has space right now. Claim a spot, walk over, no ticket needed.",
      },
      { property: "og:title", content: "Space right now, near you" },
      { property: "og:description", content: "Last-minute capacity from venues around you." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DropPage,
});

function DropPage() {
  const { id } = useParams({ from: "/drop/$id" });
  const drop = getDrop(id);
  const { claimedDropIds, claimDrop, releaseDrop, name } = useApp();

  if (!drop) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="font-display text-2xl font-extrabold">That spot has gone</p>
        <Link
          to="/"
          className="rounded-full bg-gradient-brand px-5 py-2.5 text-sm font-bold text-primary-foreground"
        >
          Find something else
        </Link>
      </div>
    );
  }

  const venue = getVenue(drop.venueId)!;
  const claimed = claimedDropIds.includes(drop.id);
  const left = spotsLeft(drop, claimed ? 1 : 0);

  return (
    <div className="flex min-h-dvh flex-col pb-28">
      <div className="relative h-64">
        <img
          src={eventCovers[drop.cover]}
          alt={venue.name}
          width={1024}
          height={1280}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-fade" />
        <Link
          to="/"
          className="absolute left-4 top-4 rounded-full bg-background/70 p-2 backdrop-blur-md"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="absolute inset-x-0 bottom-0 p-4">
          <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-accent-foreground">
            <Clock className="h-3 w-3" /> Open right now
          </span>
          <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight tracking-tight">
            {drop.offer}
          </h1>
          <p className="text-sm text-muted-foreground">
            {venue.name} · {drop.slot}
          </p>
        </div>
      </div>

      <main className="flex flex-col gap-5 p-4">
        <section className="grid grid-cols-3 gap-2">
          {[
            { icon: Users, label: `${left} spots left`, sub: `of ${drop.seats}` },
            { icon: Footprints, label: `${drop.walkMins} min`, sub: "walk away" },
            { icon: MapPin, label: drop.area, sub: venue.kind },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-3 text-center">
              <s.icon className="mx-auto h-4 w-4 text-primary" />
              <p className="mt-1 text-sm font-bold">{s.label}</p>
              <p className="text-[11px] text-muted-foreground">{s.sub}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <p className="font-display text-lg font-extrabold">{venue.name}</p>
            {venue.verified && <BadgeCheck className="h-4 w-4 text-accent" />}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {drop.title}. {venue.kind} in {venue.area}, rated {venue.rating}. No ticket, no queue —
            give your name at the door and the spot is yours.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {["Walk in", "Held for 30 min", "Pay at the venue"].map((v) => (
              <span
                key={v}
                className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold"
              >
                {v}
              </span>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-dashed border-border p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Why you're seeing this
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {venue.name} had space at {drop.slot.split("· ")[1]} and asked us to fill it. They pay
            IRL NOW only when someone actually turns up — so we only show it to people close enough
            to go.
          </p>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-16 z-40 mx-auto w-full max-w-md border-t border-border bg-background/95 p-3 backdrop-blur-xl">
        {claimed ? (
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="flex items-center gap-1.5 font-display text-sm font-extrabold">
                <Ticket className="h-4 w-4 text-accent" /> Spot held for {name || "you"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Give your name at the door. Held 30 minutes past {drop.slot.split("· ")[1]}.
              </p>
            </div>
            <button
              onClick={() => releaseDrop(drop.id)}
              className="rounded-full bg-secondary px-4 py-2.5 text-xs font-bold"
            >
              Release
            </button>
          </div>
        ) : (
          <button
            onClick={() => claimDrop(drop.id)}
            disabled={left === 0}
            className="w-full rounded-2xl bg-gradient-brand py-3.5 font-display font-bold text-primary-foreground shadow-glow disabled:opacity-50"
          >
            {left === 0 ? "Fully claimed" : "Claim a spot — free to hold"}
          </button>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
