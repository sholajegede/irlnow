import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, MapPin, Ticket, Users } from "lucide-react";
import { AvatarStack } from "@/components/Avatar";
import { getEvent, peopleByIds } from "@irlnow/domain";
import { eventCovers } from "@/lib/covers";

export const Route = createFileRoute("/x/$id")({
  loader: ({ params }) => {
    const event = getEvent(params.id);
    if (!event) throw notFound();
    return { event };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Event not found — IRL NOW" }, { name: "robots", content: "noindex" }],
      };
    }
    const e = loaderData.event;
    const title = `${e.title} — ${e.dateLabel}, ${e.area} | IRL NOW`;
    const description =
      `${e.description} ${e.goingCount} people going. ${e.price} · ${e.location}.`.slice(0, 158);
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: PublicEventPage,
});

function PublicEventPage() {
  const { event } = Route.useLoaderData();
  const faces = peopleByIds(event.going);
  const soldOut = event.spotsLeft === 0;

  return (
    <div className="min-h-dvh bg-background pb-10">
      <header className="flex items-center justify-between px-5 py-4">
        <Link to="/welcome" className="font-display text-lg font-extrabold tracking-tight">
          IRL<span className="text-primary">·</span>NOW
        </Link>
        <span className="text-xs font-medium text-muted-foreground">Shared with you</span>
      </header>

      <div className="relative mx-4 overflow-hidden rounded-3xl">
        <img
          src={eventCovers[event.cover]}
          alt={`${event.title} — ${event.location}`}
          width={1024}
          height={1280}
          className="h-[54vh] w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-fade" />
        <div className="absolute inset-x-0 bottom-0 space-y-2 p-5">
          <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary-foreground">
            {event.category}
          </span>
          <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight">
            {event.title}
          </h1>
          <p className="text-sm font-medium text-foreground/85">Hosted by {event.host}</p>
        </div>
      </div>

      <div className="space-y-3 px-5 pt-5">
        <Row icon={CalendarDays} label={event.dateLabel} />
        <Row icon={MapPin} label={`${event.location} · ${event.distance} away`} />
        <Row icon={Ticket} label={event.price} />
        <Row
          icon={Users}
          label={soldOut ? `${event.goingCount} going · sold out` : `${event.goingCount} going`}
        />
      </div>

      <p className="px-5 pt-5 text-sm leading-relaxed text-foreground/85">{event.description}</p>

      <div className="mx-5 mt-6 rounded-2xl border border-border bg-card p-4">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Who's going
        </p>
        <div className="mt-3 flex items-center gap-3">
          <AvatarStack people={faces} />
          <p className="text-sm font-medium">
            {faces.map((p) => p.name).join(", ")} and {event.goingCount - faces.length} others
          </p>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Open IRL NOW to see shared interests, who's going solo and who you already know.
        </p>
      </div>

      <div className="sticky bottom-0 mt-8 border-t border-border bg-background/90 px-5 py-4 backdrop-blur-xl">
        <Link
          to="/onboard"
          className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-brand py-4 font-display text-base font-bold text-primary-foreground shadow-glow active:scale-[0.98]"
        >
          {soldOut ? "Join the waitlist" : "I'm going"} <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          to="/welcome"
          className="mt-2 block text-center text-xs font-semibold text-muted-foreground"
        >
          What is IRL NOW?
        </Link>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label }: { icon: typeof MapPin; label: string }) {
  return (
    <p className="flex items-center gap-2.5 text-sm font-medium">
      <Icon className="h-4 w-4 shrink-0 text-primary" /> {label}
    </p>
  );
}
