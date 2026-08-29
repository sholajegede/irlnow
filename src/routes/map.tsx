import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Locate, Users } from "lucide-react";
import { AvatarStack } from "@/components/Avatar";
import { BottomNav } from "@/components/BottomNav";
import { eventCoords, eventCovers, events, peopleByIds } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Map — what's on near you | IRL NOW" },
      {
        name: "description",
        content:
          "See tonight's events plotted across London — Shoreditch, Soho, Peckham, Hackney and more.",
      },
      { property: "og:title", content: "Map — what's on near you | IRL NOW" },
      { property: "og:description", content: "Tonight's plans, plotted across the city." },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const [selectedId, setSelectedId] = useState(events[0]!.id);
  const selected = events.find((e) => e.id === selectedId)!;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur-xl">
        <Link to="/" className="rounded-full p-1.5 active:bg-secondary">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <p className="font-display text-lg font-extrabold tracking-tight">Map</p>
          <p className="text-xs text-muted-foreground">{events.length} plans across London</p>
        </div>
      </header>

      <div className="relative flex-1 overflow-hidden bg-secondary/40">
        {/* Stylised city canvas */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute left-0 right-0 top-[46%] h-14 -rotate-6 bg-primary/15 blur-[2px]" />
          {[18, 34, 50, 66, 82].map((t) => (
            <div key={t} className="absolute inset-x-0 h-px bg-border" style={{ top: `${t}%` }} />
          ))}
          {[20, 40, 60, 80].map((l) => (
            <div key={l} className="absolute inset-y-0 w-px bg-border" style={{ left: `${l}%` }} />
          ))}
        </div>

        <div className="relative h-[52dvh]">
          <span className="absolute left-[50%] top-[50%] flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center">
            <span className="absolute h-8 w-8 animate-pulse-soft rounded-full bg-accent/25" />
            <span className="h-3 w-3 rounded-full border-2 border-background bg-accent" />
          </span>

          {events.map((e) => {
            const c = eventCoords(e);
            const active = e.id === selectedId;
            return (
              <button
                key={e.id}
                onClick={() => setSelectedId(e.id)}
                style={{ left: `${c.x}%`, top: `${c.y}%` }}
                className={cn(
                  "absolute -translate-x-1/2 -translate-y-1/2 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-glow transition-all",
                  active
                    ? "z-20 scale-110 bg-primary text-primary-foreground"
                    : "z-10 bg-card text-foreground",
                )}
              >
                {e.price === "Free" ? "Free" : e.price.replace("Pay as you eat", "£")}
              </button>
            );
          })}

          <p className="absolute bottom-2 left-3 flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
            <Locate className="h-3 w-3 text-accent" /> You're near Shoreditch
          </p>
        </div>
      </div>

      <div className="border-t border-border bg-background p-4 pb-24">
        <Link
          to="/event/$id"
          params={{ id: selected.id }}
          className="flex gap-3 rounded-2xl border border-border bg-card p-3 active:scale-[0.99]"
        >
          <img
            src={eventCovers[selected.cover]}
            alt={selected.title}
            width={160}
            height={200}
            className="h-20 w-16 shrink-0 rounded-xl object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-base font-bold">{selected.title}</p>
            <p className="text-xs text-muted-foreground">
              {selected.dateLabel} · {selected.location}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <AvatarStack people={peopleByIds(selected.going)} />
              <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Users className="h-3 w-3" /> {selected.goingCount} going · {selected.distance}
              </span>
            </div>
          </div>
        </Link>
      </div>
      <BottomNav />
    </div>
  );
}
