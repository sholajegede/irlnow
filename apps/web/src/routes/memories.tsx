import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  Download,
  Heart,
  MessageCircleHeart,
  UserPlus,
  X,
} from "lucide-react";
import { useState } from "react";
import { Avatar } from "@/components/Avatar";
import { BottomNav } from "@/components/BottomNav";
import { BirthdayNudge } from "@/components/BirthdayNudge";
import { memoryMedia, pastEvent, peopleByIds } from "@irlnow/domain";
import { eventCovers } from "@/lib/covers";
import { MemoryExpiry } from "@/components/MemoryExpiry";
import { peopleWithYou, wallStats } from "@irlnow/domain";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/memories")({
  head: () => ({
    meta: [
      { title: "Memories — IRL NOW" },
      {
        name: "description",
        content:
          "Photos and videos from the nights you actually showed up for, plus the people you met.",
      },
      { property: "og:title", content: "Memories — IRL NOW" },
      {
        property: "og:description",
        content: "Keep the night alive: photos, people and what's next.",
      },
    ],
  }),
  component: MemoriesPage,
});

function MemoriesPage() {
  const [viewer, setViewer] = useState<number | null>(null);
  const [liked, setLiked] = useState<number[]>([1, 4]);
  const [note, setNote] = useState("");
  const [noteSent, setNoteSent] = useState(false);
  const attendees = peopleByIds(pastEvent.going);
  const stats = wallStats(pastEvent.id);
  const withYou = peopleWithYou(pastEvent.id);
  const { connectedIds, toggleConnected } = useApp();

  return (
    <div className="flex min-h-dvh flex-col pb-24">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border/60 bg-background/85 px-4 py-3 backdrop-blur-xl">
        <Link
          to="/going"
          aria-label="Back"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-display text-lg font-extrabold leading-tight">{pastEvent.title}</h1>
          <p className="text-xs text-muted-foreground">Last Saturday · {pastEvent.area}</p>
        </div>
      </header>

      <main className="flex flex-col gap-6 p-4">
        <MemoryExpiry eventId={pastEvent.id} photoCount={stats.total} />
        <section className="rounded-3xl border border-accent/40 bg-accent/10 p-4">
          <p className="font-display text-lg font-extrabold text-accent">That was a good one.</p>
          <p className="mt-1 text-sm text-foreground/85">
            {stats.total} photos from {stats.contributors} people — and you're in {stats.yours} of
            them. The wall stays open for everyone who was there.
          </p>
          <Link
            to="/w/$id"
            params={{ id: pastEvent.id }}
            className="mt-3 flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-brand font-display text-base font-bold text-primary-foreground shadow-glow"
          >
            Open the wall — {stats.yours} of you{" "}
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
        </section>

        <button className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-brand font-display text-base font-bold text-primary-foreground shadow-glow transition-transform active:scale-[0.98]">
          <Camera className="h-5 w-5" /> Add your photos
        </button>

        <section>
          <h2 className="font-display text-xl font-extrabold">The night</h2>
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {memoryMedia.map((m, i) => (
              <button
                key={i}
                onClick={() => setViewer(i)}
                className="relative aspect-square overflow-hidden rounded-xl"
              >
                <img
                  src={eventCovers[m]}
                  alt={`Memory ${i + 1} from ${pastEvent.title}`}
                  loading="lazy"
                  width={1024}
                  height={1280}
                  className="h-full w-full object-cover"
                />
                {liked.includes(i) && (
                  <Heart className="absolute bottom-1.5 right-1.5 h-4 w-4 fill-primary text-primary" />
                )}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl font-extrabold">Who you were with</h2>
          <p className="text-sm text-muted-foreground">People in the same photos as you.</p>
          <div className="mt-3 flex flex-col gap-2">
            {withYou.map(({ person, shots }) => {
              const connected = connectedIds.includes(person.id);
              return (
                <div
                  key={person.id}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
                >
                  <Avatar person={person} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-base font-bold">{person.name}</p>
                    <p className="text-xs text-muted-foreground">In {shots} photos with you</p>
                  </div>
                  <button
                    onClick={() => toggleConnected(person.id)}
                    className={cn(
                      "flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-bold",
                      connected
                        ? "bg-accent/20 text-accent"
                        : "bg-gradient-brand text-primary-foreground",
                    )}
                  >
                    {connected ? <Check className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                    {connected ? "Connected" : "Connect"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl font-extrabold">Who was there</h2>
          <div className="mt-3 flex gap-3 overflow-x-auto no-scrollbar">
            {attendees.map((p) => (
              <Link
                key={p.id}
                to="/person/$id"
                params={{ id: p.id }}
                className="flex w-16 flex-col items-center gap-1.5"
              >
                <Avatar person={p} size="lg" />
                <span className="truncate text-xs font-semibold">{p.name}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-4">
          <h2 className="flex items-center gap-2 font-display text-lg font-extrabold">
            <MessageCircleHeart className="h-5 w-5 text-primary" /> Leave something for{" "}
            {pastEvent.host}
          </h2>
          {noteSent ? (
            <p className="mt-2 text-sm text-accent">Sent — hosts love hearing this.</p>
          ) : (
            <>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Best five courses I've had in ages…"
                rows={3}
                className="mt-3 w-full resize-none rounded-2xl border border-input bg-background p-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
              />
              <button
                onClick={() => note.trim() && setNoteSent(true)}
                className="mt-2 h-11 w-full rounded-xl bg-secondary text-sm font-bold text-secondary-foreground"
              >
                Send note
              </button>
            </>
          )}
        </section>

        <BirthdayNudge />

        <section className="rounded-3xl border border-border bg-card p-4">
          <p className="font-display text-lg font-extrabold">What's next?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            You loved this one. {pastEvent.host} hosts monthly — or host your own.
          </p>
          <div className="mt-3 flex gap-2">
            <Link
              to="/"
              className="flex h-11 flex-1 items-center justify-center rounded-xl bg-secondary text-sm font-bold text-secondary-foreground"
            >
              Find similar
            </Link>
            <Link
              to="/create"
              className="flex h-11 flex-1 items-center justify-center rounded-xl bg-gradient-brand text-sm font-bold text-primary-foreground"
            >
              Host your own
            </Link>
          </div>
        </section>
      </main>

      {viewer !== null && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-background/95 backdrop-blur-xl">
          <div className="flex justify-between p-4">
            <button
              onClick={() => setViewer(null)}
              aria-label="Close viewer"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setLiked((l) =>
                    l.includes(viewer) ? l.filter((x) => x !== viewer) : [...l, viewer],
                  )
                }
                aria-label="Like photo"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary"
              >
                <Heart
                  className={
                    liked.includes(viewer) ? "h-5 w-5 fill-primary text-primary" : "h-5 w-5"
                  }
                />
              </button>
              <button
                aria-label="Download photo"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary"
              >
                <Download className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-center p-4">
            <img
              src={eventCovers[memoryMedia[viewer ?? 0] ?? "supper"]}
              alt={`Memory ${(viewer ?? 0) + 1}`}
              width={1024}
              height={1280}
              className="max-h-full w-full rounded-2xl object-contain"
            />
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  );
}
