import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Camera,
  Check,
  Download,
  Heart,
  ImagePlus,
  MapPin,
  MessageCircleHeart,
  PartyPopper,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { eventCovers, getEvent, peopleByIds, type CoverKey } from "@/lib/data";
import { useApp, type GuestUpload } from "@/lib/store";

export const Route = createFileRoute("/e/$id")({
  head: () => ({
    meta: [
      { title: "You're here — IRL NOW event experience" },
      {
        name: "description",
        content:
          "Scan in, share your photos and see the night build in real time. No app download needed.",
      },
      { property: "og:title", content: "You're here — IRL NOW event experience" },
      {
        property: "og:description",
        content: "Join the live event wall, add your photos and keep the memories after.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AttendeeExperience,
});

type Stage = "welcome" | "identity" | "live" | "recap";

const seedMedia: CoverKey[] = ["rooftop", "jazz", "gallery", "streetfood", "games", "climb"];

function AttendeeExperience() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const event = getEvent(id);
  const { guestName, guestEmail, uploads, setGuest, checkIn, addUploads, checkedInIds } = useApp();

  const [stage, setStage] = useState<Stage>(() => (guestName ? "live" : "welcome"));
  const [nameInput, setNameInput] = useState(guestName);
  const [emailInput, setEmailInput] = useState(guestEmail);
  const [uploading, setUploading] = useState<{ label: string; pct: number }[]>([]);
  const [viewer, setViewer] = useState<number | null>(null);
  const [liked, setLiked] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [noteSent, setNoteSent] = useState(false);
  const [emailSaved, setEmailSaved] = useState(false);

  const mine = event ? (uploads[event.id] ?? []) : [];
  const wall = useMemo<GuestUpload[]>(
    () => [
      ...mine,
      ...seedMedia.map((cover, i) => ({
        id: `seed-${i}`,
        cover,
        by: ["Maya", "Marcus", "Nina", "Priya", "Freya", "Dev"][i]!,
        justNow: false,
      })),
    ],
    [mine],
  );

  useEffect(() => {
    if (!uploading.length) return;
    const t = setInterval(() => {
      setUploading((prev) => {
        const next = prev.map((u) => ({
          ...u,
          pct: Math.min(100, u.pct + 18 + Math.random() * 18),
        }));
        return next.every((u) => u.pct >= 100) ? [] : next;
      });
    }, 320);
    return () => clearInterval(t);
  }, [uploading.length]);

  if (!event) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6 text-center">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Event link not found</h1>
          <Link to="/" className="mt-4 inline-block text-sm font-bold text-primary">
            Go to Discover
          </Link>
        </div>
      </div>
    );
  }

  const attendees = peopleByIds(event.going);
  const isCheckedIn = checkedInIds.includes(event.id);

  const handleUpload = () => {
    const picks: CoverKey[] = ["supper", "rooftop", "jazz"];
    const count = 2 + Math.floor(Math.random() * 2);
    const chosen = picks.slice(0, count);
    setUploading(chosen.map((c, i) => ({ label: `IMG_${4820 + i}.jpg`, pct: 6 })));
    setTimeout(() => {
      addUploads(
        event.id,
        chosen.map((cover, i) => ({
          id: `me-${Date.now()}-${i}`,
          cover,
          by: guestName || nameInput || "You",
          justNow: true,
        })),
      );
    }, 1400);
  };

  return (
    <div className="flex min-h-dvh flex-col">
      {stage === "welcome" && (
        <section className="relative flex min-h-dvh flex-col justify-end">
          <img
            src={eventCovers[event.cover]}
            alt={`${event.title} cover`}
            width={1024}
            height={1280}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/20" />
          <div className="relative z-10 flex flex-col gap-4 p-6 pb-10">
            <span className="w-fit rounded-full bg-accent/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent">
              You're at this event
            </span>
            <h1 className="font-display text-4xl font-extrabold leading-[1.05]">{event.title}</h1>
            <p className="text-sm text-foreground/85">
              Hosted by {event.host} · {event.dateLabel}
            </p>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" /> {event.location}
            </p>
            <div className="rounded-3xl border border-border bg-card/80 p-4 backdrop-blur">
              <p className="font-display text-lg font-extrabold">The night lives here</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add your photos, see everyone else's as they land, and keep it all after you leave.
                No app, no account.
              </p>
            </div>
            <button
              onClick={() => setStage(guestName ? "live" : "identity")}
              className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-brand font-display text-base font-bold text-primary-foreground shadow-glow transition-transform active:scale-[0.98]"
            >
              Join the event <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </section>
      )}

      {stage === "identity" && (
        <section className="flex min-h-dvh flex-col justify-center gap-5 p-6">
          <Sparkles className="h-8 w-8 text-primary" />
          <h1 className="font-display text-3xl font-extrabold leading-tight">
            What should we call you?
          </h1>
          <p className="text-sm text-muted-foreground">
            First name only — it just labels the photos you add so the host knows who's who.
          </p>
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="First name"
            autoFocus
            className="h-14 rounded-2xl border border-input bg-card px-4 text-base outline-none placeholder:text-muted-foreground focus:border-primary"
          />
          <div>
            <input
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Email (optional)"
              type="email"
              className="h-14 w-full rounded-2xl border border-input bg-card px-4 text-base outline-none placeholder:text-muted-foreground focus:border-primary"
            />
            <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
              Only used to send you the photos from tonight. Never shown to other guests.
            </p>
          </div>
          <button
            disabled={!nameInput.trim()}
            onClick={() => {
              setGuest({ name: nameInput.trim(), email: emailInput.trim() });
              checkIn(event.id);
              setStage("live");
            }}
            className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-brand font-display text-base font-bold text-primary-foreground shadow-glow transition-transform active:scale-[0.98] disabled:opacity-40"
          >
            Check in <Check className="h-5 w-5" />
          </button>
        </section>
      )}

      {stage === "live" && (
        <>
          <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 px-4 py-3 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h1 className="truncate font-display text-lg font-extrabold leading-tight">
                  {event.title}
                </h1>
                <p className="flex items-center gap-1.5 text-xs text-accent">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" /> Live now ·{" "}
                  {wall.length} photos
                </p>
              </div>
              {isCheckedIn && (
                <span className="shrink-0 rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent">
                  Checked in
                </span>
              )}
            </div>
          </header>

          <main className="flex flex-col gap-6 p-4 pb-12">
            <button
              onClick={handleUpload}
              className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-brand font-display text-base font-bold text-primary-foreground shadow-glow transition-transform active:scale-[0.98]"
            >
              <Camera className="h-5 w-5" /> Add your photos & videos
            </button>

            {uploading.length > 0 && (
              <section className="rounded-3xl border border-border bg-card p-4">
                <p className="flex items-center gap-2 text-sm font-bold">
                  <ImagePlus className="h-4 w-4 text-primary" /> Uploading {uploading.length} files
                </p>
                <div className="mt-3 flex flex-col gap-2.5">
                  {uploading.map((u) => (
                    <div key={u.label}>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{u.label}</span>
                        <span>{Math.round(u.pct)}%</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-gradient-brand transition-all"
                          style={{ width: `${u.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="font-display text-xl font-extrabold">Live event wall</h2>
              <div className="mt-3 grid grid-cols-3 gap-1.5">
                {wall.map((m, i) => (
                  <button
                    key={m.id}
                    onClick={() => setViewer(i)}
                    className="relative aspect-square overflow-hidden rounded-xl"
                  >
                    <img
                      src={eventCovers[m.cover as CoverKey]}
                      alt={`Photo by ${m.by} at ${event.title}`}
                      loading="lazy"
                      width={1024}
                      height={1280}
                      className="h-full w-full object-cover"
                    />
                    {m.justNow && (
                      <span className="absolute left-1 top-1 rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-bold text-accent-foreground">
                        New
                      </span>
                    )}
                    {liked.includes(m.id) && (
                      <Heart className="absolute bottom-1.5 right-1.5 h-4 w-4 fill-primary text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h2 className="flex items-center gap-2 font-display text-xl font-extrabold">
                <Users className="h-5 w-5 text-primary" /> Who's here
              </h2>
              <p className="text-xs text-muted-foreground">
                {event.goingCount} checked in · only first names are shown
              </p>
              <div className="mt-3 flex gap-3 overflow-x-auto no-scrollbar">
                {attendees.map((p) => (
                  <div key={p.id} className="flex w-16 flex-col items-center gap-1.5">
                    <Avatar person={p} size="lg" />
                    <span className="truncate text-xs font-semibold">{p.name}</span>
                  </div>
                ))}
                <div className="flex w-16 flex-col items-center gap-1.5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-xs font-bold">
                    +{Math.max(0, event.goingCount - attendees.length)}
                  </div>
                  <span className="text-xs text-muted-foreground">more</span>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-border bg-card p-4">
              <h2 className="flex items-center gap-2 font-display text-lg font-extrabold">
                <MessageCircleHeart className="h-5 w-5 text-primary" /> Leave something for{" "}
                {event.host}
              </h2>
              {noteSent ? (
                <p className="mt-2 text-sm text-accent">
                  Sent — {event.host} will see it after the event.
                </p>
              ) : (
                <>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder="Thanks for putting this on…"
                    className="mt-3 w-full resize-none rounded-2xl border border-input bg-background p-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
                  />
                  <button
                    onClick={() => note.trim() && setNoteSent(true)}
                    className="mt-2 h-11 w-full rounded-xl bg-secondary text-sm font-bold text-secondary-foreground"
                  >
                    Send to host
                  </button>
                </>
              )}
            </section>

            <button
              onClick={() => setStage("recap")}
              className="h-12 rounded-2xl border border-border text-sm font-bold text-muted-foreground"
            >
              Event finished? See the recap
            </button>
          </main>
        </>
      )}

      {stage === "recap" && (
        <section className="flex flex-col gap-6 p-6 pb-12">
          <PartyPopper className="h-9 w-9 text-primary" />
          <div>
            <h1 className="font-display text-3xl font-extrabold leading-tight">
              That's a wrap, {guestName || "friend"}.
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {wall.length} photos, {event.goingCount} people, one very good night at {event.title}.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {wall.slice(0, 6).map((m) => (
              <img
                key={m.id}
                src={eventCovers[m.cover as CoverKey]}
                alt={`Recap photo by ${m.by}`}
                loading="lazy"
                width={1024}
                height={1280}
                className="aspect-square w-full rounded-xl object-cover"
              />
            ))}
          </div>

          <Link
            to="/w/$id"
            params={{ id: event.id }}
            className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-brand font-display text-lg font-bold text-primary-foreground shadow-glow"
          >
            See the morning-after wall
          </Link>

          <section className="rounded-3xl border border-accent/40 bg-accent/10 p-4">
            <p className="font-display text-lg font-extrabold text-accent">Get the photos</p>
            <p className="mt-1 text-sm text-foreground/85">
              People keep uploading for 48 hours. Drop your email and we'll tell you when new ones
              land.
            </p>
            {emailSaved ? (
              <p className="mt-3 text-sm font-bold text-accent">
                Done — check your inbox tomorrow.
              </p>
            ) : (
              <div className="mt-3 flex gap-2">
                <input
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="you@email.com"
                  type="email"
                  className="h-12 flex-1 rounded-xl border border-input bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
                />
                <button
                  onClick={() => {
                    if (!emailInput.trim()) return;
                    setGuest({ name: guestName || nameInput || "Guest", email: emailInput.trim() });
                    setEmailSaved(true);
                  }}
                  className="h-12 rounded-xl bg-gradient-brand px-4 text-sm font-bold text-primary-foreground"
                >
                  Notify me
                </button>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-border bg-card p-4">
            <p className="font-display text-lg font-extrabold">Your turn to host?</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Birthday, dinner, kickabout — same wall, same QR, five minutes to set up.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setStage("live")}
                className="h-11 flex-1 rounded-xl bg-secondary text-sm font-bold text-secondary-foreground"
              >
                Back to the wall
              </button>
              <button
                onClick={() => navigate({ to: "/create" })}
                className="h-11 flex-1 rounded-xl bg-gradient-brand text-sm font-bold text-primary-foreground"
              >
                Create an event
              </button>
            </div>
          </section>

          <Link to="/" className="text-center text-sm font-bold text-primary">
            Explore more things to do in London
          </Link>
        </section>
      )}

      {viewer !== null && wall[viewer] && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-background/95 backdrop-blur-xl">
          <div className="flex items-center justify-between p-4">
            <span className="text-sm font-semibold">Added by {wall[viewer]!.by}</span>
            <button onClick={() => setViewer(null)} aria-label="Close viewer">
              <X className="h-6 w-6" />
            </button>
          </div>
          <img
            src={eventCovers[wall[viewer]!.cover as CoverKey]}
            alt={`Photo by ${wall[viewer]!.by}`}
            width={1024}
            height={1280}
            className="max-h-[70dvh] w-full object-contain"
          />
          <div className="mt-auto flex justify-center gap-3 p-6">
            <button
              onClick={() =>
                setLiked((prev) =>
                  prev.includes(wall[viewer]!.id)
                    ? prev.filter((x) => x !== wall[viewer]!.id)
                    : [...prev, wall[viewer]!.id],
                )
              }
              className="flex h-12 items-center gap-2 rounded-xl bg-secondary px-5 text-sm font-bold"
            >
              <Heart
                className={
                  liked.includes(wall[viewer]!.id) ? "h-5 w-5 fill-primary text-primary" : "h-5 w-5"
                }
              />
              Like
            </button>
            <button className="flex h-12 items-center gap-2 rounded-xl bg-secondary px-5 text-sm font-bold">
              <Download className="h-5 w-5" /> Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
