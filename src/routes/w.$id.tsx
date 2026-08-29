import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  Download,
  Heart,
  Lock,
  Share2,
  Sparkles,
  Tag,
  UserPlus,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { eventCovers, getEvent } from "@/lib/data";
import { downloadPacks, tagSuggestions } from "@/lib/recap";
import { MemoryExpiry } from "@/components/MemoryExpiry";
import { peopleWithYou, relativeTime, wallPhotos, wallStats } from "@/lib/wall";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/w/$id")({
  loader: ({ params }) => {
    const event = getEvent(params.id);
    if (!event) throw notFound();
    return { event };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Wall unavailable — IRL NOW" }, { name: "robots", content: "noindex" }],
      };
    }
    const t = `${loaderData.event.title} — the morning after`;
    return {
      meta: [
        { title: t },
        {
          name: "description",
          content: `Photos from ${loaderData.event.title} at ${loaderData.event.location}. Find yourself, grab your shots, and see who you were with.`,
        },
        { property: "og:title", content: t },
        {
          property: "og:description",
          content: "Everyone who was there. Every photo. No account needed to look.",
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: WallPage,
});

function WallPage() {
  const { event } = Route.useLoaderData();
  const {
    claimedWallIds,
    claimWall,
    connectedIds,
    toggleConnected,
    guestName,
    confirmedTags,
    skippedTags,
    confirmTag,
    skipTag,
    downloadedPacks,
    markPackDownloaded,
  } = useApp();
  const claimed = claimedWallIds.includes(event.id);

  const photos = useMemo(() => wallPhotos(event.id), [event.id]);
  const stats = useMemo(() => wallStats(event.id), [event.id]);
  const withYou = useMemo(() => peopleWithYou(event.id), [event.id]);
  const packs = useMemo(() => downloadPacks(event.id), [event.id]);

  const [tab, setTab] = useState<"all" | "you">("all");
  const [viewer, setViewer] = useState<number | null>(null);
  const [liked, setLiked] = useState<string[]>([]);
  const [gate, setGate] = useState(false);
  const [copied, setCopied] = useState(false);

  const suggestions = useMemo(
    () => tagSuggestions(event.id, confirmedTags, skippedTags),
    [event.id, confirmedTags, skippedTags],
  );

  const shown = tab === "you" ? photos.filter((p) => p.youIn) : photos;
  const openPhoto = viewer !== null ? shown[viewer] : undefined;

  function requestDownload() {
    if (!claimed) setGate(true);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background pb-36">
      {/* Hero */}
      <header className="relative h-64 w-full overflow-hidden">
        <img
          src={eventCovers[event.cover]}
          alt={event.title}
          width={1024}
          height={1280}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/10" />
        <div className="absolute inset-x-0 bottom-0 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
            The morning after
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold leading-[1.05]">
            {event.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {event.location} · hosted by {event.host}
          </p>
        </div>
      </header>

      <main className="flex flex-col gap-6 px-4 pt-5">
        <MemoryExpiry eventId={event.id} photoCount={stats.total} />

        {/* Stat strip */}
        <section className="grid grid-cols-3 gap-2">
          {[
            { n: stats.total, l: "photos" },
            { n: stats.contributors, l: "people posted" },
            { n: stats.yours, l: "with you in" },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl border border-border bg-card p-3 text-center">
              <p className="font-display text-2xl font-extrabold">{s.n}</p>
              <p className="text-[11px] text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </section>

        {/* The hook */}
        {!claimed ? (
          <section className="rounded-3xl border border-primary/40 bg-primary/10 p-4">
            <p className="flex items-center gap-2 font-display text-lg font-extrabold text-primary">
              <Sparkles className="h-5 w-5" /> You're in {stats.yours} photos
            </p>
            <p className="mt-1 text-sm text-foreground/85">
              Look at everything for free. To download your full-res shots and see who you were
              with, just tell us who you are.
            </p>
            <button
              onClick={() => setGate(true)}
              className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-brand font-display text-base font-bold text-primary-foreground shadow-glow transition-transform active:scale-[0.98]"
            >
              Get my {stats.yours} photos <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </section>
        ) : (
          <section className="rounded-3xl border border-accent/40 bg-accent/10 p-4">
            <p className="flex items-center gap-2 font-display text-lg font-extrabold text-accent">
              <Check className="h-5 w-5" /> Unlocked, {guestName || "you"}
            </p>
            <p className="mt-1 text-sm text-foreground/85">
              {stats.yours} full-res photos are yours. We emailed you the album link too.
            </p>
            <Link
              to="/recap/$id"
              params={{ id: event.id }}
              className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-brand font-display text-base font-bold text-primary-foreground shadow-glow"
            >
              <Sparkles className="h-5 w-5" /> See your recap card
            </Link>
          </section>
        )}

        {/* Who was I with */}
        {claimed && withYou.length > 0 && (
          <section>
            <h2 className="font-display text-xl font-extrabold">Who you were with</h2>
            <p className="text-sm text-muted-foreground">
              Same photos, same night. Connect if you actually spoke.
            </p>
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
                        "flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-bold transition-colors",
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
        )}

        {/* Download packs */}
        {claimed && (
          <section>
            <h2 className="font-display text-xl font-extrabold">Download packs</h2>
            <p className="text-sm text-muted-foreground">Full resolution, zipped, no watermark.</p>
            <div className="mt-3 flex flex-col gap-2">
              {packs.map((pack) => {
                const key = `${event.id}:${pack.id}`;
                const done = downloadedPacks.includes(key);
                return (
                  <div
                    key={pack.id}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-base font-bold">{pack.label}</p>
                      <p className="text-xs text-muted-foreground">{pack.description}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {pack.count} photos · {pack.sizeMb} MB
                      </p>
                    </div>
                    <button
                      onClick={() => markPackDownloaded(key)}
                      className={cn(
                        "flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-bold",
                        done
                          ? "bg-accent/20 text-accent"
                          : "bg-secondary text-secondary-foreground",
                      )}
                    >
                      {done ? <Check className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                      {done ? "Saved" : "Get"}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Tagging suggestions */}
        {claimed && suggestions.length > 0 && (
          <section>
            <h2 className="flex items-center gap-2 font-display text-xl font-extrabold">
              <Tag className="h-5 w-5 text-accent" /> Is this who we think it is?
            </h2>
            <p className="text-sm text-muted-foreground">
              Confirm a face and they get sent their photos too. Skip if you're not sure.
            </p>
            <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
              {suggestions.map((s) => {
                const key = `${s.photoId}:${s.person.id}`;
                return (
                  <div
                    key={key}
                    className="w-40 shrink-0 overflow-hidden rounded-2xl border border-border bg-card"
                  >
                    <img
                      src={eventCovers[s.cover]}
                      alt="Suggested tag"
                      loading="lazy"
                      width={1024}
                      height={1280}
                      className="h-28 w-full object-cover"
                    />
                    <div className="p-2.5">
                      <div className="flex items-center gap-2">
                        <Avatar person={s.person} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold">{s.person.name}</p>
                          <p className="text-[10px] text-muted-foreground">{s.confidence}% match</p>
                        </div>
                      </div>
                      <div className="mt-2 flex gap-1.5">
                        <button
                          onClick={() => confirmTag(key)}
                          className="flex h-8 flex-1 items-center justify-center rounded-lg bg-gradient-brand text-xs font-bold text-primary-foreground"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => skipTag(key)}
                          className="flex h-8 flex-1 items-center justify-center rounded-lg bg-secondary text-xs font-bold"
                        >
                          Skip
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {confirmedTags.length > 0 && (
              <p className="mt-2 text-xs text-accent">
                {confirmedTags.length} tagged — we'll let them know their photos are here.
              </p>
            )}
          </section>
        )}

        {/* Tabs */}
        <section>
          <div className="flex gap-2">
            {(["all", "you"] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  setViewer(null);
                }}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-bold transition-colors",
                  tab === t
                    ? "bg-foreground text-background"
                    : "bg-secondary text-secondary-foreground",
                )}
              >
                {t === "all" ? `All ${stats.total}` : `You (${stats.yours})`}
              </button>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {shown.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setViewer(i)}
                className="relative aspect-square overflow-hidden rounded-xl"
              >
                <img
                  src={eventCovers[p.cover]}
                  alt={`Photo from ${event.title}`}
                  loading="lazy"
                  width={1024}
                  height={1280}
                  className="h-full w-full object-cover"
                />
                {p.youIn && (
                  <span className="absolute left-1.5 top-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary-foreground">
                    You
                  </span>
                )}
                {!claimed && (
                  <span className="absolute bottom-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-background/70">
                    <Lock className="h-3 w-3" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-4">
          <p className="font-display text-lg font-extrabold">Your night, your turn</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Walls like this come free with every event you host on IRL NOW.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => {
                if (typeof navigator !== "undefined" && navigator.clipboard) {
                  void navigator.clipboard.writeText(window.location.href);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1600);
                }
              }}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-secondary text-sm font-bold text-secondary-foreground"
            >
              <Share2 className="h-4 w-4" /> {copied ? "Link copied" : "Share the wall"}
            </button>
            <Link
              to="/create"
              className="flex h-11 flex-1 items-center justify-center rounded-xl bg-gradient-brand text-sm font-bold text-primary-foreground"
            >
              Host your own
            </Link>
          </div>
        </section>
      </main>

      {/* Sticky claim bar */}
      {!claimed && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-background/90 p-4 backdrop-blur-xl">
          <button
            onClick={() => setGate(true)}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-brand font-display text-lg font-bold text-primary-foreground shadow-glow"
          >
            <Download className="h-5 w-5" /> Get your {stats.yours} photos
          </button>
        </div>
      )}

      {/* Photo viewer */}
      {openPhoto && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-background/95 backdrop-blur-xl">
          <div className="flex items-center justify-between p-4">
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
                    l.includes(openPhoto.id)
                      ? l.filter((x) => x !== openPhoto.id)
                      : [...l, openPhoto.id],
                  )
                }
                aria-label="Like photo"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary"
              >
                <Heart
                  className={cn(
                    "h-5 w-5",
                    liked.includes(openPhoto.id) && "fill-primary text-primary",
                  )}
                />
              </button>
              <button
                onClick={requestDownload}
                aria-label="Download photo"
                className={cn(
                  "flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-bold",
                  claimed
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary text-secondary-foreground",
                )}
              >
                {claimed ? <Download className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                {claimed ? "Save" : "Unlock"}
              </button>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-center px-4">
            <img
              src={eventCovers[openPhoto.cover]}
              alt="Event photo"
              width={1024}
              height={1280}
              className="max-h-full w-full rounded-2xl object-contain"
            />
          </div>
          <div className="p-4 text-center text-xs text-muted-foreground">
            {openPhoto.youIn ? "You're in this one · " : ""}
            {relativeTime(openPhoto.minsAgo)} · {openPhoto.likes} likes
          </div>
        </div>
      )}

      {gate && (
        <IdentityGate
          eventId={event.id}
          count={stats.yours}
          onClose={() => setGate(false)}
          onDone={claimWall}
        />
      )}
    </div>
  );
}

function IdentityGate({
  eventId,
  count,
  onClose,
  onDone,
}: {
  eventId: string;
  count: number;
  onClose: () => void;
  onDone: (eventId: string, identity: { name: string; email: string }) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const valid = name.trim().length > 1 && email.includes("@");

  return (
    <div className="fixed inset-0 z-[70] flex items-end bg-background/70 backdrop-blur-sm">
      <div className="w-full rounded-t-3xl border-t border-border bg-card p-5 animate-fade-up">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
        <h2 className="font-display text-2xl font-extrabold leading-tight">
          {count} photos of you, ready to go
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Name and email only — so we know which face is yours and where to send the album. No
          password, no feed.
        </p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="First name"
          className="mt-4 h-12 w-full rounded-2xl border border-input bg-background px-4 text-base outline-none focus:border-primary"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="you@email.com"
          className="mt-2 h-12 w-full rounded-2xl border border-input bg-background px-4 text-base outline-none focus:border-primary"
        />
        <button
          disabled={!valid}
          onClick={() => {
            onDone(eventId, { name: name.trim(), email: email.trim() });
            onClose();
          }}
          className={cn(
            "mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl font-display text-lg font-bold transition-all active:scale-[0.98]",
            valid
              ? "bg-gradient-brand text-primary-foreground shadow-glow"
              : "bg-muted text-muted-foreground",
          )}
        >
          Unlock my photos
        </button>
        <button
          onClick={onClose}
          className="mt-2 h-11 w-full text-sm font-semibold text-muted-foreground"
        >
          Keep browsing
        </button>
      </div>
    </div>
  );
}
