import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Bookmark } from "lucide-react";
import { AvatarStack } from "@/components/Avatar";
import { BottomNav } from "@/components/BottomNav";
import { eventCovers, getEvent, peopleByIds } from "@/lib/data";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/saved")({
  head: () => ({
    meta: [
      { title: "Saved — IRL NOW" },
      {
        name: "description",
        content: "Plans you've bookmarked for later — everything you saved from the feed.",
      },
      { property: "og:title", content: "Saved — IRL NOW" },
      { property: "og:description", content: "The plans you didn't want to lose." },
    ],
  }),
  component: SavedPage,
});

function SavedPage() {
  const { savedIds, toggleSaved } = useApp();
  const saved = savedIds.map(getEvent).filter(Boolean);

  return (
    <div className="flex min-h-dvh flex-col pb-24">
      <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur-xl">
        <Link to="/you" className="rounded-full p-1.5 active:bg-secondary">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <p className="font-display text-lg font-extrabold tracking-tight">Saved</p>
          <p className="text-xs text-muted-foreground">{saved.length} plans on the shortlist</p>
        </div>
      </header>

      <main className="flex-1 space-y-3 px-4 pt-4">
        {saved.map((e) => (
          <div key={e!.id} className="flex gap-3 rounded-2xl border border-border bg-card p-3">
            <Link to="/event/$id" params={{ id: e!.id }} className="shrink-0">
              <img
                src={eventCovers[e!.cover]}
                alt={e!.title}
                width={160}
                height={200}
                loading="lazy"
                className="h-20 w-16 rounded-xl object-cover"
              />
            </Link>
            <div className="min-w-0 flex-1">
              <Link to="/event/$id" params={{ id: e!.id }}>
                <p className="truncate font-display text-base font-bold">{e!.title}</p>
              </Link>
              <p className="text-xs text-muted-foreground">
                {e!.dateLabel} · {e!.area} · {e!.price}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <AvatarStack people={peopleByIds(e!.going)} />
                <span className="text-xs font-medium text-muted-foreground">
                  {e!.goingCount} going
                </span>
              </div>
            </div>
            <button
              onClick={() => toggleSaved(e!.id)}
              aria-label={`Remove ${e!.title} from saved`}
              className="self-start rounded-full bg-secondary p-2"
            >
              <Bookmark className="h-4 w-4 fill-primary text-primary" />
            </button>
          </div>
        ))}

        {saved.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <p className="font-display text-xl font-bold">Nothing saved yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tap the bookmark on any plan to keep it here.
            </p>
            <Link
              to="/"
              className="mt-4 inline-block rounded-full bg-gradient-brand px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-glow"
            >
              Back to Discover
            </Link>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
