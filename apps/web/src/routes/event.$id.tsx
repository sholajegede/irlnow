import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bookmark,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  MapPin,
  MessagesSquare,
  Repeat,
  Send,
  Share2,
  Ticket,
  UserPlus,
} from "lucide-react";
import { ConnectButton } from "@/components/ConnectButton";
import { AddToCalendar } from "@/components/AddToCalendar";
import { AccessPanel, GettingThere } from "@/components/GettingThere";
import { WaitlistHold } from "@/components/WaitlistHold";
import { Avatar } from "@/components/Avatar";
import {
  getEvent,
  getPerson,
  interests as allInterests,
  peopleByIds,
  seriesForEvent,
} from "@irlnow/domain";
import { eventCovers } from "@/lib/covers";
import { useApp, waitlistPosition } from "@/lib/store";
import { priceToPence } from "@irlnow/domain";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/event/$id")({
  loader: ({ params }) => {
    const event = getEvent(params.id);
    if (!event) throw notFound();
    return { event };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Event unavailable — IRL NOW" }, { name: "robots", content: "noindex" }],
      };
    }
    const { event } = loaderData;
    return {
      meta: [
        { title: `${event.title} — IRL NOW` },
        { name: "description", content: event.description },
        { property: "og:title", content: `${event.title} — IRL NOW` },
        { property: "og:description", content: event.description },
      ],
    };
  },
  component: EventDetail,
});

function EventDetail() {
  const { event } = Route.useLoaderData();
  const {
    goingIds,
    savedIds,
    toggleGoing,
    toggleSaved,
    connectedIds,
    toggleConnected,
    interests,
    waitlistIds,
    toggleWaitlist,
    crews,
    toggleCrewInvite,
    cancelledEvents,
  } = useApp();
  const cancelled = cancelledEvents[event.id];
  const going = goingIds.includes(event.id);
  const isPaid = priceToPence(event.price) > 0;
  const saved = savedIds.includes(event.id);
  const attendees = peopleByIds(event.going);
  const shared = event.interests.filter((i) => interests.includes(i));
  const soldOut = event.spotsLeft === 0;
  const waitlisted = waitlistIds.includes(event.id);
  const series = seriesForEvent(event.id);
  const crew = crews[event.id] ?? [];
  const connections = connectedIds.map(getPerson).filter((p) => p !== undefined);

  return (
    <div className="flex min-h-dvh flex-col pb-28">
      <div className="relative h-80 w-full">
        <img
          src={eventCovers[event.cover]}
          alt={event.title}
          width={1024}
          height={1280}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-fade" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
          <Link
            to="/"
            aria-label="Back to discover"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-background/60 backdrop-blur"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex gap-2">
            <button
              onClick={() => toggleSaved(event.id)}
              aria-label="Save event"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-background/60 backdrop-blur"
            >
              <Bookmark className={cn("h-5 w-5", saved && "fill-primary text-primary")} />
            </button>
            <Link
              to="/share/$id"
              params={{ id: event.id }}
              aria-label="Share event"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-background/60 backdrop-blur"
            >
              <Share2 className="h-5 w-5" />
            </Link>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-5">
          <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary-foreground">
            {event.category}
          </span>
          <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight tracking-tight">
            {event.title}
          </h1>
        </div>
      </div>

      <div className="flex flex-col gap-6 p-5">
        {cancelled && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4">
            <p className="font-display text-base font-extrabold text-destructive">
              This event was cancelled
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {cancelled.message || cancelled.reason}
              {cancelled.refunded
                ? " Your ticket was refunded in full — it lands in 3–5 days."
                : ""}
            </p>
            <Link to="/" className="mt-2 inline-block text-xs font-bold text-primary">
              Find something else on
            </Link>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          <InfoTile
            icon={Calendar}
            label={event.dateLabel.split(" · ")[0] ?? ""}
            sub={event.dateLabel.split(" · ")[1] ?? ""}
          />
          <InfoTile icon={MapPin} label={event.area} sub={event.distance} />
          <InfoTile
            icon={Ticket}
            label={event.price}
            sub={soldOut ? "Sold out" : event.spotsLeft ? `${event.spotsLeft} left` : "Open"}
          />
        </div>

        {series && (
          <Link
            to="/series/$id"
            params={{ id: series.id }}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/50"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15">
              <Repeat className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Part of a series
              </p>
              <p className="truncate font-semibold">
                {series.name} · {series.cadence}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
          </Link>
        )}

        {soldOut && !waitlisted && (
          <div className="rounded-2xl border border-primary/40 bg-primary/10 p-4">
            <p className="text-sm font-bold text-primary">Sold out — but plans change</p>
            <p className="mt-1 text-sm text-foreground/85">
              {waitlistPosition(event.id) + 4} people are on the waitlist. Spots usually free up
              24–48h before, and we hold the first one that opens for you.
            </p>
          </div>
        )}

        <WaitlistHold event={event} />

        {going && <AddToCalendar eventId={event.id} className="w-full" />}

        <p className="text-[15px] leading-relaxed text-foreground/90">{event.description}</p>

        <div className="flex flex-wrap gap-2">
          {event.vibes.map((v) => (
            <span
              key={v}
              className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground"
            >
              {v}
            </span>
          ))}
        </div>

        {shared.length > 0 && (
          <div className="rounded-2xl border border-accent/40 bg-accent/10 p-4">
            <p className="text-sm font-bold text-accent">Why you're seeing this</p>
            <p className="mt-1 text-sm text-foreground/85">
              {shared.length} shared interest{shared.length > 1 ? "s" : ""}:{" "}
              {shared.map((s) => allInterests.find((i) => i.id === s)?.label).join(", ")}
            </p>
          </div>
        )}

        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-xl font-extrabold">Who's going</h2>
            <span className="text-sm text-muted-foreground">{event.goingCount} people</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Only people who chose to be visible are shown here.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {attendees.map((p) => {
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
                >
                  <Link to="/person/$id" params={{ id: p.id }}>
                    <Avatar person={p} />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      to="/person/$id"
                      params={{ id: p.id }}
                      className="font-display text-base font-bold"
                    >
                      {p.name}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">{p.reason}</p>
                  </div>
                  <ConnectButton person={p} size="sm" />
                </div>
              );
            })}
          </div>
        </section>

        {going && (
          <Link
            to="/chat/$id"
            params={{ id: event.id }}
            className="flex items-center gap-3 rounded-2xl border border-primary/40 bg-primary/10 p-4"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20">
              <MessagesSquare className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display font-bold">Group chat</p>
              <p className="truncate text-xs text-muted-foreground">
                Sort out arrivals and plus-ones with everyone going.
              </p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
          </Link>
        )}

        {going && connections.length > 0 && (
          <section className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-xl font-extrabold">Bring your crew</h2>
              <span className="text-xs text-muted-foreground">
                {crew.length > 0 ? `${crew.length} invited` : "Nights out are better together"}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {connections.map((p) => {
                const invited = crew.includes(p.id);
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
                  >
                    <Avatar person={p} />
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-base font-bold">{p.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {invited ? "Invite sent — they'll see it in Discover" : "Connected"}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleCrewInvite(event.id, p.id)}
                      className={cn(
                        "flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-bold transition-all active:scale-95",
                        invited
                          ? "bg-accent text-accent-foreground"
                          : "bg-secondary text-secondary-foreground",
                      )}
                    >
                      {invited ? (
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      {invited ? "Invited" : "Invite"}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <GettingThere event={event} />

        <AccessPanel event={event} />

        <section className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Hosted by
          </p>
          <div className="mt-2 flex items-center gap-3">
            <Avatar person={{ name: event.host, avatar: 4 }} />
            <div>
              <p className="font-display text-base font-bold">{event.host}</p>
              <p className="text-xs text-muted-foreground">{event.location}</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4">
          <p className="font-display text-base font-bold">At the door</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Scan the event QR when you arrive to check in and join the live photo wall — works in
            the browser, no download.
          </p>
          <div className="mt-3 flex gap-2">
            <Link
              to="/qr/$id"
              params={{ id: event.id }}
              className="flex h-11 flex-1 items-center justify-center rounded-xl bg-secondary text-sm font-bold text-secondary-foreground"
            >
              Event QR
            </Link>
            <Link
              to="/e/$id"
              params={{ id: event.id }}
              className="flex h-11 flex-1 items-center justify-center rounded-xl bg-gradient-brand text-sm font-bold text-primary-foreground"
            >
              I'm here now
            </Link>
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 border-t border-border bg-background/90 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-xl">
        {going ? (
          <div className="flex gap-2.5">
            {isPaid ? (
              <Link
                to="/ticket/$id"
                params={{ id: event.id }}
                className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-accent font-display text-lg font-bold text-accent-foreground transition-transform active:scale-[0.98]"
              >
                <Ticket className="h-5 w-5" strokeWidth={2.5} /> View ticket
              </Link>
            ) : (
              <Link
                to="/going"
                className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-accent font-display text-lg font-bold text-accent-foreground transition-transform active:scale-[0.98]"
              >
                <Check className="h-5 w-5" strokeWidth={3} /> You're going
              </Link>
            )}
            <button
              onClick={() => toggleGoing(event.id)}
              className="h-14 rounded-2xl border border-border px-4 text-sm font-semibold text-muted-foreground"
            >
              Cancel
            </button>
          </div>
        ) : soldOut ? (
          <button
            onClick={() => toggleWaitlist(event.id)}
            className={cn(
              "flex h-14 w-full items-center justify-center gap-2 rounded-2xl font-display text-lg font-bold transition-all active:scale-[0.98]",
              waitlisted
                ? "border border-accent/50 bg-accent/15 text-accent"
                : "bg-gradient-brand text-primary-foreground shadow-glow",
            )}
          >
            {waitlisted ? (
              <>
                <Check className="h-5 w-5" strokeWidth={3} /> On the waitlist · #
                {waitlistPosition(event.id)}
              </>
            ) : (
              <>
                <Clock className="h-5 w-5" /> Join the waitlist
              </>
            )}
          </button>
        ) : isPaid ? (
          <Link
            to="/checkout/$id"
            params={{ id: event.id }}
            className="flex h-14 w-full items-center justify-center rounded-2xl bg-gradient-brand font-display text-lg font-bold text-primary-foreground shadow-glow transition-transform active:scale-[0.98]"
          >
            Get a ticket · {event.price}
          </Link>
        ) : (
          <button
            onClick={() => toggleGoing(event.id)}
            className="flex h-14 w-full items-center justify-center rounded-2xl bg-gradient-brand font-display text-lg font-bold text-primary-foreground shadow-glow transition-transform active:scale-[0.98]"
          >
            I'm Going · {event.price}
          </button>
        )}
      </div>
    </div>
  );
}

function InfoTile({
  icon: Icon,
  label,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-3">
      <Icon className="h-4 w-4 text-primary" />
      <p className="text-sm font-bold leading-tight">{label}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}
