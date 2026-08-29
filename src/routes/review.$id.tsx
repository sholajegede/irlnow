import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, Star } from "lucide-react";
import { getEvent } from "@/lib/data";
import { NEGATIVE_TAGS, REVIEW_TAGS, starLabel } from "@/lib/reviews";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/review/$id")({
  head: () => ({
    meta: [
      { title: "Rate the organiser — IRL NOW" },
      {
        name: "description",
        content:
          "Tell us how the night actually went. Ratings decide which organisers get reach on IRL NOW.",
      },
      { property: "og:title", content: "Rate the organiser — IRL NOW" },
      { property: "og:description", content: "Two taps keeps the bad ones off the feed." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReviewPage,
});

function ReviewPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const event = getEvent(id);
  const { addReview, reviews } = useApp();
  const existing = reviews[id];
  const [stars, setStars] = useState(existing?.stars ?? 0);
  const [tags, setTags] = useState<string[]>(existing?.tags ?? []);
  const [note, setNote] = useState(existing?.note ?? "");
  const [anonymous, setAnonymous] = useState(existing?.anonymous ?? true);
  const [done, setDone] = useState(false);

  const pool = stars >= 4 ? REVIEW_TAGS : stars > 0 ? NEGATIVE_TAGS : REVIEW_TAGS;

  if (done) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-8 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/15">
          <Check className="h-8 w-8 text-accent" strokeWidth={3} />
        </span>
        <h1 className="font-display text-2xl font-extrabold">Thanks</h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          {anonymous ? "Sent anonymously." : "Sent with your name."} Organiser ratings update once
          five people have rated, so nobody can tell it was you.
        </p>
        <Link
          to="/w/$id"
          params={{ id }}
          className="mt-3 h-13 rounded-2xl bg-gradient-brand px-6 py-3.5 font-display text-sm font-bold text-primary-foreground shadow-glow"
        >
          See the photos
        </Link>
        <button
          onClick={() => navigate({ to: "/archive" })}
          className="text-xs font-bold text-primary"
        >
          Back to your archive
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col pb-10">
      <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur-xl">
        <Link to="/archive" aria-label="Back" className="rounded-full p-1.5 active:bg-secondary">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <p className="font-display text-lg font-extrabold tracking-tight">How was it?</p>
          <p className="text-xs text-muted-foreground">{event?.title ?? "This event"}</p>
        </div>
      </header>

      <main className="flex-1 space-y-6 px-4 pt-6">
        <section className="rounded-3xl border border-border bg-card p-5 text-center">
          <p className="text-sm text-muted-foreground">
            Rate {event?.host ?? "the organiser"}, not the crowd.
          </p>
          <div className="mt-3 flex justify-center gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setStars(n)} aria-label={`${n} stars`}>
                <Star
                  className={cn(
                    "h-9 w-9",
                    n <= stars ? "fill-primary text-primary" : "text-muted-foreground/40",
                  )}
                />
              </button>
            ))}
          </div>
          <p className="mt-2 h-5 font-display text-sm font-bold text-primary">{starLabel(stars)}</p>
        </section>

        {stars > 0 && (
          <>
            <section>
              <h2 className="mb-2 font-display text-sm font-extrabold uppercase tracking-wider">
                {stars >= 4 ? "What worked?" : "What went wrong?"}
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {pool.map((t) => (
                  <button
                    key={t}
                    onClick={() =>
                      setTags((prev) =>
                        prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
                      )
                    }
                    className={cn(
                      "rounded-full px-3.5 py-2 text-xs font-bold",
                      tags.includes(t)
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </section>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Anything the organiser should know? (optional)"
              className="w-full rounded-2xl border border-border bg-secondary/40 p-4 text-sm outline-none focus:border-primary"
            />

            <button
              onClick={() => setAnonymous((a) => !a)}
              role="switch"
              aria-checked={anonymous}
              className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left"
            >
              <span className="flex-1 text-sm font-bold">Send anonymously</span>
              <span
                className={cn(
                  "flex h-6 w-11 shrink-0 items-center rounded-full p-0.5",
                  anonymous ? "bg-primary" : "bg-secondary",
                )}
              >
                <span
                  className={cn(
                    "h-5 w-5 rounded-full bg-background transition-transform",
                    anonymous && "translate-x-5",
                  )}
                />
              </span>
            </button>

            <button
              onClick={() => {
                addReview({ eventId: id, stars, tags, note, anonymous });
                setDone(true);
              }}
              className="h-14 w-full rounded-2xl bg-gradient-brand font-display font-bold text-primary-foreground shadow-glow"
            >
              Send rating
            </button>
          </>
        )}
      </main>
    </div>
  );
}
