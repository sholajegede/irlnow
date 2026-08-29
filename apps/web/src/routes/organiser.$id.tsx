import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, BadgeCheck, Star } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { BottomNav } from "@/components/BottomNav";
import { events, getOrganiser, getSeries } from "@irlnow/domain";
import { eventCovers } from "@/lib/covers";
import { organiserQuality } from "@irlnow/domain";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/organiser/$id")({
  loader: ({ params }) => {
    const organiser = getOrganiser(params.id);
    if (!organiser) throw notFound();
    return { organiser };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Organiser not found — IRL NOW" }, { name: "robots", content: "noindex" }],
      };
    }
    const o = loaderData.organiser;
    const title = `${o.name} — organiser on IRL NOW`;
    return {
      meta: [
        { title },
        { name: "description", content: o.blurb },
        { property: "og:title", content: title },
        { property: "og:description", content: o.blurb },
        { property: "og:type", content: "profile" },
      ],
    };
  },
  component: OrganiserPage,
});

function OrganiserPage() {
  const { organiser } = Route.useLoaderData();
  const { eventRatings } = useApp();
  const quality = organiserQuality(organiser.id, Object.values(eventRatings));
  const hosted = events.filter((e) => e.host === organiser.name);
  const series = organiser.seriesId ? getSeries(organiser.seriesId) : undefined;

  return (
    <div className="flex min-h-dvh flex-col pb-24">
      <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur-xl">
        <Link to="/search" className="rounded-full p-1.5 active:bg-secondary">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <p className="font-display text-lg font-extrabold tracking-tight">Organiser</p>
      </header>

      <main className="flex-1 px-4 pt-5">
        <div className="flex items-center gap-4">
          <Avatar person={{ name: organiser.name, avatar: organiser.avatar }} size="lg" />
          <div>
            <h1 className="flex items-center gap-1.5 font-display text-2xl font-extrabold tracking-tight">
              {organiser.name}
              {organiser.verified && <BadgeCheck className="h-5 w-5 text-accent" />}
            </h1>
            <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-accent text-accent" /> {quality.stars}
              </span>
              · {organiser.eventsHosted} events hosted
            </p>
          </div>
        </div>

        <section className="mt-5 rounded-3xl border border-border bg-card p-4">
          <div className="flex items-baseline justify-between">
            <p className="font-display text-lg font-extrabold">Quality score</p>
            <p className="font-display text-3xl font-extrabold text-primary">{quality.score}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            {quality.band} · {quality.reviews} ratings · {Math.round(quality.returnRate * 100)}%
            would go again
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-gradient-brand"
              style={{ width: `${quality.score}%` }}
            />
          </div>
          {quality.highlights.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {quality.highlights.map((h) => (
                <span
                  key={h}
                  className="rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold"
                >
                  {h}
                </span>
              ))}
            </div>
          )}
          <p className="mt-3 text-[11px] text-muted-foreground">
            Scores come from attendees after the event and decide how high events rank in discovery.
          </p>
        </section>

        <p className="pt-4 text-sm leading-relaxed text-foreground/85">{organiser.blurb}</p>

        {series && (
          <Link
            to="/series/$id"
            params={{ id: series.id }}
            className="mt-5 flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
          >
            <img
              src={eventCovers[series.cover]}
              alt={series.name}
              width={160}
              height={200}
              className="h-16 w-14 rounded-xl object-cover"
            />
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-widest text-accent">Series</p>
              <p className="truncate font-display text-base font-bold">{series.name}</p>
              <p className="text-xs text-muted-foreground">
                {series.cadence} · {series.followers} following
              </p>
            </div>
          </Link>
        )}

        <h2 className="pb-2 pt-6 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Upcoming
        </h2>
        <div className="space-y-2">
          {hosted.map((e) => (
            <Link
              key={e.id}
              to="/event/$id"
              params={{ id: e.id }}
              className="flex gap-3 rounded-2xl border border-border bg-card p-3"
            >
              <img
                src={eventCovers[e.cover]}
                alt={e.title}
                width={160}
                height={200}
                loading="lazy"
                className="h-20 w-16 shrink-0 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-base font-bold">{e.title}</p>
                <p className="text-xs text-muted-foreground">
                  {e.dateLabel} · {e.area} · {e.price}
                </p>
                <p className="mt-2 text-xs font-medium text-muted-foreground">
                  {e.goingCount} going
                </p>
              </div>
            </Link>
          ))}
          {hosted.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Nothing on the calendar right now.
            </p>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
