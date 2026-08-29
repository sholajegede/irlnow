import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Banknote,
  Megaphone,
  BarChart3,
  CalendarPlus,
  Eye,
  MapPin,
  Repeat,
  ScanLine,
  Sparkles,
  Users,
} from "lucide-react";
import { HostReputation } from "@/components/HostReputation";
import { hostReliability } from "@irlnow/domain";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { events, guestList, hostedEventIds } from "@irlnow/domain";
import { eventCovers } from "@/lib/covers";
import { useApp } from "@/lib/store";
import { money, payoutsFor } from "@irlnow/domain";

export const Route = createFileRoute("/host/")({
  head: () => ({
    meta: [
      { title: "Organiser workspace — run your events | IRL NOW" },
      {
        name: "description",
        content:
          "Guest lists, live check-ins, door QR codes and post-event insight for every event you host.",
      },
      { property: "og:title", content: "Organiser workspace — run your events" },
      {
        property: "og:description",
        content: "Everything you need to run the event, in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HostHome,
});

function HostHome() {
  const { createdEvents, eventRatings, doorCheckins, boosts } = useApp();
  const reliability = hostReliability("amara", Object.values(eventRatings));
  const hosted = events.filter((e) => hostedEventIds.includes(e.id));

  const totalGuests = hosted.reduce((sum, e) => sum + e.goingCount, 0);
  const totalViews = hosted.length * 2360;
  const pendingPayout = payoutsFor(hostedEventIds)
    .filter((p) => p.status !== "paid")
    .reduce((a, p) => a + p.net, 0);

  return (
    <div className="flex min-h-dvh flex-col pb-24">
      <AppHeader title="Organiser workspace" />
      <main className="flex flex-col gap-6 p-4">
        <section className="rounded-3xl border border-border bg-gradient-brand/10 p-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-accent">Your rooms</p>
          <h1 className="mt-1 font-display text-2xl font-extrabold leading-tight">
            You've brought {totalGuests} people into a room
          </h1>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Stat icon={Users} value={String(totalGuests)} label="Guests" />
            <Stat icon={Eye} value={`${(totalViews / 1000).toFixed(1)}k`} label="Views" />
            <Stat icon={Sparkles} value={reliability.stars.toFixed(1)} label="Host rating" />
          </div>
        </section>

        <Link
          to="/host/start"
          className="mb-2 flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/10 p-4"
        >
          <span>
            <span className="block font-display text-sm font-extrabold">
              New here? Start hosting
            </span>
            <span className="block text-[11px] text-muted-foreground">
              Profile, ID, payouts, first event
            </span>
          </span>
          <span className="text-xs font-bold text-primary">Open</span>
        </Link>

        <Link
          to="/host/payouts"
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-transform active:scale-[0.99]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15">
            <Banknote className="h-5 w-5 text-accent" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display font-bold">Payouts & fees</p>
            <p className="text-xs text-muted-foreground">
              {money(pendingPayout)} landing after your next events
            </p>
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </Link>

        <Link
          to="/host/templates"
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-transform active:scale-[0.99]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
            <Repeat className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display font-bold">Run it again</p>
            <p className="text-xs text-muted-foreground">
              Reuse a format, publish the next four dates as a series
            </p>
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </Link>

        {hosted[0] && (
          <Link
            to="/host/boost/$id"
            params={{ id: hosted[0].id }}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-transform active:scale-[0.99]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
              <Megaphone className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display font-bold">
                {boosts[hosted[0].id] ? "Promotion running" : "Promote an event"}
              </p>
              <p className="text-xs text-muted-foreground">
                {boosts[hosted[0].id]
                  ? `${money(boosts[hosted[0].id]!.budget)} budget on ${hosted[0].title}`
                  : "Reach people nearby who are still deciding what to do"}
              </p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        )}

        <HostReputation organiserId="amara" />

        <section className="flex flex-col gap-3">
          <h2 className="font-display text-xl font-extrabold">Events you host</h2>
          {hosted.map((e) => {
            const guests = guestList(e.id, Math.min(e.goingCount, 40));
            const checkedIn = guests.filter((g) => g.status === "checked-in").length;
            return (
              <Link
                key={e.id}
                to="/host/$id"
                params={{ id: e.id }}
                className="overflow-hidden rounded-3xl border border-border bg-card transition-transform active:scale-[0.99]"
              >
                <div className="relative h-32">
                  <img
                    src={eventCovers[e.cover]}
                    alt={e.title}
                    loading="lazy"
                    width={1024}
                    height={1280}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-fade" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-accent">
                        {e.dateLabel}
                      </p>
                      <h3 className="font-display text-xl font-extrabold leading-tight">
                        {e.title}
                      </h3>
                    </div>
                    <ArrowUpRight className="h-5 w-5 shrink-0" />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 p-4 text-xs">
                  <p className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 text-primary" /> {e.area}
                  </p>
                  <p className="font-semibold">
                    <span className="text-accent">
                      {checkedIn + (doorCheckins[e.id]?.length ?? 0)}
                    </span>{" "}
                    checked in · <span className="text-foreground">{e.goingCount}</span> going
                  </p>
                </div>
              </Link>
            );
          })}

          <div className="grid grid-cols-2 gap-2">
            {hosted.slice(0, 2).map((e) => (
              <Link
                key={`door-${e.id}`}
                to="/door/$id"
                params={{ id: e.id }}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-secondary px-3 text-xs font-bold text-secondary-foreground"
              >
                <ScanLine className="h-4 w-4 shrink-0 text-accent" />
                <span className="truncate">Door · {e.area}</span>
              </Link>
            ))}
          </div>

          {createdEvents.map((e) => (
            <div key={e.id} className="rounded-3xl border border-dashed border-border bg-card p-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-accent">
                Just created
              </p>
              <h3 className="font-display text-lg font-extrabold">{e.title}</h3>
              <p className="text-xs text-muted-foreground">
                {e.date} · {e.time} · {e.location}
              </p>
              <Link
                to="/qr/$id"
                params={{ id: e.id }}
                className="mt-3 inline-flex h-10 items-center rounded-xl bg-secondary px-4 text-xs font-bold text-secondary-foreground"
              >
                Get the door QR
              </Link>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <h2 className="font-display text-lg font-extrabold">What works for you</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Your Thursday events fill 2x faster than weekends, and 61% of your guests arrive from
            the Discover feed rather than your own share links.
          </p>
          <Link
            to="/create"
            className="mt-1 flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-brand font-display font-bold text-primary-foreground shadow-glow"
          >
            <CalendarPlus className="h-5 w-5" /> Plan the next one
          </Link>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}

function Stat({ icon: Icon, value, label }: { icon: typeof Users; value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-secondary p-3 text-center">
      <Icon className="mx-auto h-4 w-4 text-accent" />
      <p className="mt-1 font-display text-lg font-extrabold leading-none">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
