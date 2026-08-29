import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bell,
  Calendar,
  Clock,
  MapPin,
  MessagesSquare,
  QrCode,
  Sparkles,
  Ticket,
  Users,
} from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { AddToCalendar } from "@/components/AddToCalendar";
import { WaitlistHold } from "@/components/WaitlistHold";
import { BottomNav } from "@/components/BottomNav";
import { RecapBanner } from "@/components/RecapBanner";
import { Avatar, AvatarStack } from "@/components/Avatar";
import { events, eventCovers, getPerson } from "@/lib/data";
import { goingGraph, peopleToMeet } from "@/lib/graph";
import { useApp, waitlistPosition } from "@/lib/store";
import { getDrop } from "@/lib/venues";
import { getPlan, planHost } from "@/lib/plans";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/going")({
  head: () => ({
    meta: [
      { title: "Going — your real-world agenda | IRL NOW" },
      {
        name: "description",
        content: "Everything you've said yes to, who else is going, and how you'll get in.",
      },
      { property: "og:title", content: "Going — your real-world agenda" },
      { property: "og:description", content: "Your upcoming plans and the people you'll meet." },
    ],
  }),
  component: GoingPage,
});

function GoingPage() {
  const {
    interests,
    connectedIds,
    goingIds,
    savedIds,
    goingSoloIds,
    toggleGoingSolo,
    waitlistIds,
    crews,
    orders,
    joinedPlanIds,
    myPlans,
    claimedDropIds,
  } = useApp();
  const joinedPlans = joinedPlanIds
    .map((id) => myPlans.find((p) => p.id === id) ?? getPlan(id))
    .filter((p) => p !== undefined);
  const claimedDrops = claimedDropIds.map(getDrop).filter((d) => d !== undefined);
  const upcoming = events.filter((e) => goingIds.includes(e.id));
  const saved = events.filter((e) => savedIds.includes(e.id) && !goingIds.includes(e.id));
  const waitlisted = events.filter((e) => waitlistIds.includes(e.id));

  return (
    <div className="flex min-h-dvh flex-col pb-24">
      <AppHeader title="Your real-world agenda" />
      <main className="flex flex-col gap-6 p-4">
        <RecapBanner />
        {upcoming.length === 0 ? (
          <div className="mt-16 flex flex-col items-center gap-3 px-6 text-center">
            <Calendar className="h-10 w-10 text-muted-foreground" />
            <h2 className="font-display text-xl font-extrabold">Nothing in the diary</h2>
            <p className="text-sm text-muted-foreground">
              Your agenda is empty. That's a solvable problem.
            </p>
            <Link
              to="/"
              className="mt-2 rounded-2xl bg-gradient-brand px-6 py-3 font-display font-bold text-primary-foreground shadow-glow"
            >
              Find something to do
            </Link>
          </div>
        ) : (
          <section className="flex flex-col gap-4">
            <h2 className="font-display text-xl font-extrabold">Upcoming</h2>
            {upcoming.map((e) => {
              const solo = goingSoloIds.includes(e.id);
              const graph = goingGraph(e.id, interests, connectedIds);
              const meet = peopleToMeet(e.id, interests, connectedIds);
              const crew = (crews[e.id] ?? []).map(getPerson).filter((p) => p !== undefined);

              return (
                <div
                  key={e.id}
                  className="overflow-hidden rounded-3xl border border-border bg-card"
                >
                  <Link to="/event/$id" params={{ id: e.id }} className="relative block h-36">
                    <img
                      src={eventCovers[e.cover]}
                      alt={e.title}
                      loading="lazy"
                      width={1024}
                      height={1280}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-fade" />
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-accent">
                        {e.dateLabel}
                      </p>
                      <h3 className="font-display text-xl font-extrabold leading-tight">
                        {e.title}
                      </h3>
                    </div>
                  </Link>
                  <div className="flex flex-col gap-3 p-4">
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 text-primary" /> {e.location}
                    </p>
                    <div className="flex items-center gap-2 rounded-2xl bg-secondary p-3">
                      <Bell className="h-4 w-4 shrink-0 text-accent" />
                      <p className="text-xs text-secondary-foreground">
                        Reminder set for 2 hours before. Doors at {e.dateLabel.split("· ")[1]}.
                      </p>
                    </div>
                    {crew.length > 0 && (
                      <div className="flex items-center gap-3 rounded-2xl border border-accent/40 bg-accent/10 p-3">
                        <AvatarStack people={crew} />
                        <p className="text-xs text-foreground/85">
                          <span className="font-bold text-accent">Your crew:</span>{" "}
                          {crew.map((p) => p.name).join(", ")} invited to come with you.
                        </p>
                      </div>
                    )}
                    <div className="rounded-2xl border border-primary/30 bg-primary/10 p-3">
                      <p className="font-display text-sm font-extrabold">{graph.headline}</p>
                      <p className="text-[11px] text-muted-foreground">{graph.subline}</p>
                      <div className="mt-3 flex gap-3 overflow-x-auto no-scrollbar">
                        {meet.map((p) => (
                          <Link
                            key={p.id}
                            to="/person/$id"
                            params={{ id: p.id }}
                            className="flex w-16 shrink-0 flex-col items-center gap-1 text-center"
                          >
                            <Avatar person={p} size="lg" />
                            <span className="truncate text-[11px] font-bold">{p.name}</span>
                            <span className="line-clamp-2 text-[10px] leading-tight text-muted-foreground">
                              {p.goingSolo
                                ? "Going solo"
                                : p.mutuals
                                  ? `${p.mutuals} mutuals`
                                  : "Shared interests"}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleGoingSolo(e.id)}
                        className={cn(
                          "flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl text-xs font-bold transition-all active:scale-95",
                          solo
                            ? "bg-accent text-accent-foreground"
                            : "bg-secondary text-secondary-foreground",
                        )}
                      >
                        <Sparkles className="h-4 w-4" />{" "}
                        {solo ? "Going solo · on" : "I'm going solo"}
                      </button>
                      <Link
                        to="/connections"
                        className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-secondary text-xs font-bold text-secondary-foreground"
                      >
                        <Users className="h-4 w-4" /> Plan with friends
                      </Link>
                    </div>
                    <Link
                      to="/chat/$id"
                      params={{ id: e.id }}
                      className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-secondary font-display text-sm font-bold"
                    >
                      <MessagesSquare className="h-4 w-4" /> Group chat
                    </Link>
                    {orders[e.id] && (
                      <Link
                        to="/ticket/$id"
                        params={{ id: e.id }}
                        className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-accent/40 bg-accent/10 font-display text-sm font-bold text-accent"
                      >
                        <Ticket className="h-4 w-4" /> Your ticket · {orders[e.id]!.code}
                      </Link>
                    )}
                    <AddToCalendar eventId={e.id} />
                    <Link
                      to="/e/$id"
                      params={{ id: e.id }}
                      className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-gradient-brand text-xs font-bold text-primary-foreground"
                    >
                      <QrCode className="h-4 w-4" /> Check in & event wall
                    </Link>
                    {solo && (
                      <p className="text-[11px] text-muted-foreground">
                        You'll be shown to others going solo to this event. Turn off anytime.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {claimedDrops.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="font-display text-xl font-extrabold">Spots you're holding</h2>
            {claimedDrops.map((d) => (
              <Link
                key={d.id}
                to="/drop/$id"
                params={{ id: d.id }}
                className="flex items-center gap-3 rounded-2xl border border-accent/40 bg-accent/10 p-3"
              >
                <img
                  src={eventCovers[d.cover]}
                  alt={d.title}
                  loading="lazy"
                  width={1024}
                  height={1280}
                  className="h-14 w-14 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{d.offer}</p>
                  <p className="text-xs text-accent">
                    {d.slot} · {d.area} · give your name at the door
                  </p>
                </div>
              </Link>
            ))}
          </section>
        )}

        {joinedPlans.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="font-display text-xl font-extrabold">Plans you're in</h2>
            {joinedPlans.map((p) => (
              <Link
                key={p.id}
                to="/plan/$id"
                params={{ id: p.id }}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
              >
                <span className="text-2xl">{p.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{p.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {planHost(p).name} · {p.when} · {p.place}
                  </p>
                </div>
              </Link>
            ))}
          </section>
        )}

        {waitlisted.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="font-display text-xl font-extrabold">Waitlisted</h2>
            {waitlisted.map((e) => (
              <Link
                key={e.id}
                to="/event/$id"
                params={{ id: e.id }}
                className="flex items-center gap-3 rounded-2xl border border-primary/40 bg-primary/10 p-3"
              >
                <img
                  src={eventCovers[e.cover]}
                  alt={e.title}
                  loading="lazy"
                  width={1024}
                  height={1280}
                  className="h-14 w-14 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{e.title}</p>
                  <p className="flex items-center gap-1 text-xs text-primary">
                    <Clock className="h-3 w-3" /> #{waitlistPosition(e.id)} on the waitlist
                  </p>
                </div>
              </Link>
            ))}
            {waitlisted.map((e) => (
              <WaitlistHold key={`hold-${e.id}`} event={e} holdOnly />
            ))}
            <p className="text-[11px] text-muted-foreground">
              We'll notify you the moment a spot opens — most free up 24–48h before the event.
            </p>
          </section>
        )}

        {saved.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="font-display text-xl font-extrabold">Saved for later</h2>
            {saved.map((e) => (
              <Link
                key={e.id}
                to="/event/$id"
                params={{ id: e.id }}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
              >
                <img
                  src={eventCovers[e.cover]}
                  alt={e.title}
                  loading="lazy"
                  width={1024}
                  height={1280}
                  className="h-14 w-14 rounded-xl object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{e.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.dateLabel} · {e.area}
                  </p>
                </div>
              </Link>
            ))}
          </section>
        )}

        <Link
          to="/memories"
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
        >
          <Avatar person={{ name: "Supper Club", avatar: 2 }} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Last Saturday's supper club</p>
            <p className="text-xs text-muted-foreground">9 new photos from the event →</p>
          </div>
        </Link>
      </main>
      <BottomNav />
    </div>
  );
}
