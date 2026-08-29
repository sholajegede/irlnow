import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  Clock,
  Download,
  Instagram,
  Share2,
  Sparkles,
  Star,
  UserPlus,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { getEvent } from "@irlnow/domain";
import { eventCovers } from "@/lib/covers";
import { buildRecap, expiryLabel } from "@irlnow/domain";
import { RATING_TAGS, type EventRating } from "@irlnow/domain";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/recap/$id")({
  loader: ({ params }) => {
    const event = getEvent(params.id);
    if (!event) throw notFound();
    return { event };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Recap unavailable — IRL NOW" }, { name: "robots", content: "noindex" }],
      };
    }
    const t = `My recap — ${loaderData.event.title}`;
    return {
      meta: [
        { title: t },
        {
          name: "description",
          content: `Hours out, photos taken and people met at ${loaderData.event.title}, ${loaderData.event.location}.`,
        },
        { property: "og:title", content: t },
        {
          property: "og:description",
          content: "A card from a night that actually happened. Made on IRL NOW.",
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: RecapPage,
});

function RecapPage() {
  const { event } = Route.useLoaderData();
  const recap = useMemo(() => buildRecap(event.id), [event.id]);
  const {
    name,
    guestName,
    metRequests,
    outgoingRequests,
    connectedIds,
    sendMetRequest,
    dismissedMetPrompts,
    dismissMetPrompt,
    eventRatings,
    rateEvent,
    markRecapShared,
    sharedRecaps,
  } = useApp();

  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [rating, setRating] = useState(false);

  if (!recap) return null;
  const who = name || guestName || "You";
  const existingRating = eventRatings[event.id];
  const promptDismissed = dismissedMetPrompts.includes(event.id);
  const pending = recap.metPeople.filter(
    (m) => !connectedIds.includes(m.person.id) && !outgoingRequests.includes(m.person.id),
  );

  function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      void navigator.share({ title: `My recap — ${recap!.title}`, url }).catch(() => {});
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(url);
    }
    setCopied(true);
    markRecapShared(event.id);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background pb-32">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border/60 bg-background/85 px-4 py-3 backdrop-blur-xl">
        <Link
          to="/w/$id"
          params={{ id: event.id }}
          aria-label="Back to the wall"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate font-display text-lg font-extrabold leading-tight">Your recap</h1>
          <p className="truncate text-xs text-muted-foreground">{recap.title}</p>
        </div>
      </header>

      <main className="flex flex-col gap-5 p-4">
        {/* The card itself — this is the shareable asset */}
        <section
          aria-label="Shareable recap card"
          className="relative overflow-hidden rounded-[28px] border border-primary/40 bg-card shadow-glow"
        >
          <div className="relative h-56">
            <img
              src={eventCovers[recap.heroCover]}
              alt={recap.title}
              width={1024}
              height={1280}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
            <span className="absolute left-4 top-4 rounded-full bg-background/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-accent backdrop-blur">
              IRL NOW
            </span>
            <div className="absolute inset-x-0 bottom-0 p-4">
              <p className="font-display text-4xl font-extrabold leading-[0.95]">
                {recap.headline}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{recap.subline}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-px bg-border">
            {recap.stats.map((s) => (
              <div key={s.label} className="bg-card p-4">
                <p className="font-display text-3xl font-extrabold text-primary">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 border-t border-border px-4 py-3">
            <Clock className="h-4 w-4 shrink-0 text-accent" />
            <p className="text-xs text-muted-foreground">
              In at {recap.arrived} · out at {recap.left}
            </p>
          </div>

          <div className="flex items-center gap-2 border-t border-border bg-primary/10 px-4 py-3">
            <Sparkles className="h-4 w-4 shrink-0 text-primary" />
            <p className="text-sm font-bold">
              {who}: <span className="text-primary">{recap.badge}</span>
            </p>
          </div>

          <div className="grid grid-cols-3 gap-1 p-3">
            {recap.covers.slice(0, 3).map((c, i) => (
              <img
                key={`${c}-${i}`}
                src={eventCovers[c]}
                alt="Moment from the night"
                loading="lazy"
                width={1024}
                height={1280}
                className="aspect-square w-full rounded-xl object-cover"
              />
            ))}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-2">
          <button
            onClick={share}
            className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-brand font-display text-base font-bold text-primary-foreground shadow-glow transition-transform active:scale-[0.98]"
          >
            <Share2 className="h-4 w-4" /> {copied ? "Link copied" : "Share card"}
          </button>
          <button
            onClick={() => {
              setSaved(true);
              setTimeout(() => setSaved(false), 1800);
            }}
            className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-secondary font-display text-base font-bold text-secondary-foreground"
          >
            {saved ? <Check className="h-4 w-4 text-accent" /> : <Download className="h-4 w-4" />}
            {saved ? "Saved" : "Save image"}
          </button>
        </section>

        <button
          onClick={share}
          className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-card text-sm font-bold"
        >
          <Instagram className="h-4 w-4 text-primary" /> Share to your story
        </button>
        {sharedRecaps.includes(event.id) && (
          <p className="-mt-2 text-center text-xs text-accent">
            Shared. Anyone who opens it sees the wall and can claim their own photos.
          </p>
        )}

        {/* You met N people */}
        {!promptDismissed && pending.length > 0 && (
          <section className="rounded-3xl border border-accent/40 bg-accent/10 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-xl font-extrabold">
                  You met {pending.length} {pending.length === 1 ? "person" : "people"}
                </p>
                <p className="mt-0.5 text-sm text-foreground/85">
                  You're in photos together. Requests from a night out expire after 48 hours — send
                  them while it still means something.
                </p>
              </div>
              <button
                onClick={() => dismissMetPrompt(event.id)}
                aria-label="Dismiss"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-background/70"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {pending.map(({ person, shots }) => (
                <div key={person.id} className="flex items-center gap-3 rounded-2xl bg-card p-3">
                  <Avatar person={person} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-base font-bold">{person.name}</p>
                    <p className="text-xs text-muted-foreground">In {shots} photos with you</p>
                  </div>
                  <button
                    onClick={() => sendMetRequest(person.id)}
                    className="flex h-9 items-center gap-1.5 rounded-xl bg-gradient-brand px-3 text-xs font-bold text-primary-foreground"
                  >
                    <UserPlus className="h-4 w-4" /> Connect
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Sent requests with expiry */}
        {Object.keys(metRequests).length > 0 && (
          <section>
            <h2 className="font-display text-lg font-extrabold">Requests you sent</h2>
            <div className="mt-2 flex flex-col gap-2">
              {Object.entries(metRequests).map(([personId, expiresAt]) => {
                const person = recap.metPeople.find((m) => m.person.id === personId)?.person;
                if (!person) return null;
                return (
                  <div
                    key={personId}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
                  >
                    <Avatar person={person} size="sm" />
                    <p className="flex-1 text-sm font-semibold">{person.name}</p>
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
                      {expiryLabel(expiresAt)}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Rate it */}
        <section className="rounded-3xl border border-border bg-card p-4">
          {existingRating ? (
            <>
              <p className="flex items-center gap-2 font-display text-lg font-extrabold">
                <Check className="h-5 w-5 text-accent" /> Thanks — you rated this{" "}
                {existingRating.stars}/5
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your rating feeds {event.host}'s quality score and what we put in front of you next.
              </p>
              <Link
                to="/organiser/$id"
                params={{ id: event.host.toLowerCase() }}
                className="mt-3 inline-block text-sm font-bold text-primary"
              >
                See {event.host}'s score
              </Link>
            </>
          ) : (
            <>
              <p className="font-display text-lg font-extrabold">How was it, honestly?</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Ratings decide who gets seen. Takes ten seconds.
              </p>
              <button
                onClick={() => setRating(true)}
                className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-secondary font-display text-base font-bold text-secondary-foreground"
              >
                <Star className="h-5 w-5" /> Rate {event.host}
              </button>
            </>
          )}
        </section>

        <div className="grid grid-cols-2 gap-2">
          <Link
            to="/w/$id"
            params={{ id: event.id }}
            className="flex h-11 items-center justify-center rounded-2xl bg-secondary text-sm font-bold"
          >
            Back to the wall
          </Link>
          <Link
            to="/archive"
            className="flex h-11 items-center justify-center rounded-2xl border border-border bg-card text-sm font-bold"
          >
            Your archive
          </Link>
        </div>
      </main>

      {rating && (
        <RatingSheet
          eventId={event.id}
          host={event.host}
          onClose={() => setRating(false)}
          onSubmit={(r) => {
            rateEvent(r);
            setRating(false);
          }}
        />
      )}
    </div>
  );
}

function RatingSheet({
  eventId,
  host,
  onClose,
  onSubmit,
}: {
  eventId: string;
  host: string;
  onClose: () => void;
  onSubmit: (r: EventRating) => void;
}) {
  const [stars, setStars] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [wouldReturn, setWouldReturn] = useState(true);
  const [note, setNote] = useState("");

  return (
    <div className="fixed inset-0 z-[70] flex items-end bg-background/70 backdrop-blur-sm">
      <div className="max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl border-t border-border bg-card p-5 animate-fade-up">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-2xl font-extrabold leading-tight">
            Rate {host}'s event
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setStars(n)} aria-label={`${n} stars`}>
              <Star
                className={cn(
                  "h-9 w-9 transition-transform active:scale-90",
                  n <= stars ? "fill-primary text-primary" : "text-muted-foreground",
                )}
              />
            </button>
          ))}
        </div>

        <p className="mt-5 text-sm font-bold">What stood out?</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {RATING_TAGS.map((t) => (
            <button
              key={t}
              onClick={() =>
                setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
              }
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                tags.includes(t)
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <label className="mt-5 flex items-center justify-between rounded-2xl bg-secondary px-4 py-3">
          <span className="text-sm font-bold">I'd go to another one</span>
          <input
            type="checkbox"
            checked={wouldReturn}
            onChange={(e) => setWouldReturn(e.target.checked)}
            className="h-5 w-5 accent-[hsl(var(--primary))]"
          />
        </label>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Anything the host should know? (only they see this)"
          className="mt-3 w-full rounded-2xl border border-input bg-background p-4 text-sm outline-none focus:border-primary"
        />

        <button
          disabled={stars === 0}
          onClick={() =>
            onSubmit({ eventId, stars, tags, wouldReturn, note: note.trim() || undefined })
          }
          className="mt-4 flex h-13 w-full items-center justify-center rounded-2xl bg-gradient-brand py-4 font-display text-base font-bold text-primary-foreground shadow-glow disabled:opacity-40"
        >
          Submit rating
        </button>
      </div>
    </div>
  );
}
