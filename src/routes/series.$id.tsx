import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Bell, BellRing, Calendar, ChevronRight, History, Users } from "lucide-react";
import { eventCovers, getSeries } from "@/lib/data";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/series/$id")({
  loader: ({ params }) => {
    const series = getSeries(params.id);
    if (!series) throw notFound();
    return { series };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Series unavailable — IRL NOW" }, { name: "robots", content: "noindex" }] };
    }
    const { series } = loaderData;
    return {
      meta: [
        { title: `${series.name} — IRL NOW` },
        { name: "description", content: series.blurb },
        { property: "og:title", content: `${series.name} — IRL NOW` },
        { property: "og:description", content: series.blurb },
      ],
    };
  },
  component: SeriesPage,
});

function SeriesPage() {
  const { series } = Route.useLoaderData();
  const { followedSeriesIds, toggleFollowSeries } = useApp();
  const following = followedSeriesIds.includes(series.id);
  const upcoming = series.editions.filter((e) => e.status === "upcoming");
  const past = series.editions.filter((e) => e.status === "past");

  return (
    <div className="flex min-h-dvh flex-col pb-10">
      <div className="relative h-64 w-full">
        <img
          src={eventCovers[series.cover]}
          alt={series.name}
          width={1024}
          height={1280}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-fade" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
          <Link
            to="/"
            aria-label="Back"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-background/60 backdrop-blur"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-5">
          <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-secondary-foreground">
            Series · {series.cadence}
          </span>
          <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight tracking-tight">
            {series.name}
          </h1>
        </div>
      </div>

      <div className="flex flex-col gap-6 p-5">
        <div>
          <p className="text-[15px] leading-relaxed text-foreground/90">{series.blurb}</p>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="h-4 w-4 text-primary" /> Hosted by {series.host} · {series.followers} followers
          </p>
        </div>

        <button
          onClick={() => toggleFollowSeries(series.id)}
          className={cn(
            "flex h-13 w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-display text-lg font-bold transition-all active:scale-[0.98]",
            following
              ? "border border-accent/50 bg-accent/15 text-accent"
              : "bg-gradient-brand text-primary-foreground shadow-glow",
          )}
        >
          {following ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
          {following ? "Following · you'll hear first" : "Follow the series"}
        </button>

        <section className="flex flex-col gap-3">
          <h2 className="flex items-center gap-2 font-display text-xl font-extrabold">
            <Calendar className="h-5 w-5 text-primary" /> Upcoming editions
          </h2>
          {upcoming.map((ed) => {
            const inner = (
              <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{ed.label}</p>
                  <p className="text-xs text-muted-foreground">{ed.goingCount} going</p>
                </div>
                {ed.eventId && <ChevronRight className="h-5 w-5 text-muted-foreground" />}
              </div>
            );
            return ed.eventId ? (
              <Link key={ed.id} to="/event/$id" params={{ id: ed.eventId }}>
                {inner}
              </Link>
            ) : (
              <div key={ed.id} className="opacity-80">
                {inner}
              </div>
            );
          })}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="flex items-center gap-2 font-display text-xl font-extrabold">
            <History className="h-5 w-5 text-muted-foreground" /> Past editions
          </h2>
          {past.map((ed) => (
            <div
              key={ed.id}
              className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/50 p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground/70">{ed.label}</p>
                <p className="text-xs text-muted-foreground">{ed.goingCount} showed up</p>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
