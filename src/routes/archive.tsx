import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Camera, Share2, Sparkles, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { eventCovers, pastEvent } from "@/lib/data";
import { MemoryExpiry } from "@/components/MemoryExpiry";
import { memoryArchive, yearInReview } from "@/lib/recap";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/archive")({
  head: () => ({
    meta: [
      { title: "Your memory archive — IRL NOW" },
      {
        name: "description",
        content: "Every event you actually turned up to, month by month, with the photos and people from each one.",
      },
      { property: "og:title", content: "Your memory archive — IRL NOW" },
      { property: "og:description", content: "A year of turning up, in one timeline." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ArchivePage,
});

function ArchivePage() {
  const { goingIds, checkedInIds, claimedWallIds, name } = useApp();
  const [copied, setCopied] = useState(false);

  const attendedIds = useMemo(
    () => Array.from(new Set([pastEvent.id, ...checkedInIds, ...claimedWallIds, ...goingIds])),
    [checkedInIds, claimedWallIds, goingIds],
  );
  const entries = useMemo(() => memoryArchive(attendedIds), [attendedIds]);
  const year = useMemo(() => yearInReview(attendedIds), [attendedIds]);

  return (
    <div className="flex min-h-dvh flex-col pb-24">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border/60 bg-background/85 px-4 py-3 backdrop-blur-xl">
        <Link to="/you" aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-display text-lg font-extrabold leading-tight">Memory archive</h1>
          <p className="text-xs text-muted-foreground">Everywhere you actually turned up</p>
        </div>
      </header>

      <main className="flex flex-col gap-6 p-4">
        {/* Year in review */}
        <section className="overflow-hidden rounded-3xl border border-primary/40 bg-card">
          <div className="bg-gradient-brand px-4 py-3">
            <p className="font-display text-lg font-extrabold text-primary-foreground">
              {name ? `${name}'s` : "Your"} year so far
            </p>
          </div>
          <div className="grid grid-cols-2 gap-px bg-border">
            {[
              { v: year.nightsOut, l: "times you went out" },
              { v: year.hours + "h", l: "spent out of the house" },
              { v: year.peopleMet, l: "people met" },
              { v: year.photos, l: "photos you're in" },
            ].map((s) => (
              <div key={s.l} className="bg-card p-4">
                <p className="font-display text-3xl font-extrabold text-primary">{s.v}</p>
                <p className="text-xs text-muted-foreground">{s.l}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-1 p-4 text-sm">
            <p>
              Your thing was <span className="font-bold text-accent">{year.topCategory}</span>
            </p>
            <p>
              Your patch was <span className="font-bold text-accent">{year.topArea}</span>
            </p>
            <p>
              You kept going back to <span className="font-bold text-accent">{year.topOrganiser}</span>
            </p>
          </div>
          <button
            onClick={() => {
              if (typeof navigator !== "undefined" && navigator.clipboard) {
                void navigator.clipboard.writeText(window.location.href);
              }
              setCopied(true);
              setTimeout(() => setCopied(false), 1600);
            }}
            className="flex h-12 w-full items-center justify-center gap-2 border-t border-border text-sm font-bold text-primary"
          >
            <Share2 className="h-4 w-4" /> {copied ? "Link copied" : "Share your year"}
          </button>
        </section>

        {/* Timeline */}
        <section>
          <h2 className="font-display text-xl font-extrabold">The timeline</h2>
          <div className="mt-3 flex flex-col">
            {entries.map((entry, i) => (
              <div key={entry.event.id} className="flex gap-3">
                <div className="flex w-10 shrink-0 flex-col items-center">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                  {i < entries.length - 1 && <span className="w-px flex-1 bg-border" />}
                </div>
                <div className="flex-1 pb-5">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    {entry.monthLabel}
                  </p>
                  <Link
                    to="/recap/$id"
                    params={{ id: entry.event.id }}
                    className="mt-1.5 flex gap-3 rounded-2xl border border-border bg-card p-3"
                  >
                    <img
                      src={eventCovers[entry.cover]}
                      alt={entry.event.title}
                      loading="lazy"
                      width={1024}
                      height={1280}
                      className="h-16 w-16 shrink-0 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-base font-extrabold">{entry.event.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{entry.event.location}</p>
                      <div className="mt-1.5 flex gap-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Camera className="h-3 w-3" /> {entry.photos}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {entry.met} met
                        </span>
                        <span className="flex items-center gap-1 font-bold text-primary">
                          <Sparkles className="h-3 w-3" /> Recap
                        </span>
                        <MemoryExpiry eventId={entry.event.id} photoCount={entry.photos} compact />
                      </div>
                      <Link
                        to="/review/$id"
                        params={{ id: entry.event.id }}
                        className="mt-1.5 inline-block text-[11px] font-bold text-primary"
                      >
                        Rate the organiser
                      </Link>
                    </div>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
