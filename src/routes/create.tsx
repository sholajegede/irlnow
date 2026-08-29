import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Cake,
  Check,
  Copy,
  Disc3,
  PartyPopper,
  QrCode,
  Sofa,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { useEffect, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { eventCovers, type CoverKey } from "@/lib/data";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Create an event — IRL NOW" },
      {
        name: "description",
        content:
          "Turn an idea into a real plan: birthday, dinner, party or meetup. Publish, share a QR and invite your people.",
      },
      { property: "og:title", content: "Create an event — IRL NOW" },
      { property: "og:description", content: "Bring your people together in a few taps." },
    ],
  }),
  component: CreatePage,
});

const eventTypes = [
  { id: "birthday", label: "Birthday", Icon: Cake, cover: "rooftop" },
  { id: "dinner", label: "Dinner", Icon: UtensilsCrossed, cover: "supper" },
  { id: "party", label: "Party", Icon: Disc3, cover: "rooftop" },
  { id: "meetup", label: "Meetup", Icon: Users, cover: "games" },
  { id: "networking", label: "Networking", Icon: Briefcase, cover: "gallery" },
  { id: "hangout", label: "Hangout", Icon: Sofa, cover: "games" },
] as const;

const covers: CoverKey[] = ["rooftop", "supper", "games", "gallery", "streetfood", "jazz"];

type Step = 0 | 1 | 2 | 3 | 4 | 5;
const labels = ["Type", "Basics", "Where", "Look", "Guests", "Live"];

function CreatePage() {
  const { addCreatedEvent, templateDraft, clearTemplateDraft } = useApp();
  const [step, setStep] = useState<Step>(0);
  const [type, setType] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("19:30");
  const [location, setLocation] = useState("");
  const [cover, setCover] = useState<CoverKey>("rooftop");
  const [isPublic, setIsPublic] = useState(true);
  const [capacity, setCapacity] = useState(30);
  const [price, setPrice] = useState("Free");
  const [copied, setCopied] = useState(false);
  const [fromTemplate, setFromTemplate] = useState<string | null>(null);

  useEffect(() => {
    if (!templateDraft) return;
    setType(templateDraft.type);
    setTitle(templateDraft.title);
    setDescription(templateDraft.description);
    setTime(templateDraft.time);
    setLocation(templateDraft.location);
    setCover(templateDraft.cover);
    setCapacity(templateDraft.capacity);
    setPrice(templateDraft.price);
    setFromTemplate(templateDraft.name);
    setStep(1);
    clearTemplateDraft();
  }, [templateDraft, clearTemplateDraft]);

  const valid: Record<Step, boolean> = {
    0: !!type,
    1: title.trim().length > 2 && !!date,
    2: location.trim().length > 2,
    3: true,
    4: true,
    5: true,
  };

  const publish = () => {
    addCreatedEvent({
      id: title.toLowerCase().replace(/\s+/g, "-"),
      title,
      type,
      date,
      time,
      location,
      cover,
      isPublic,
      capacity,
      price,
    });
    setStep(5);
  };

  return (
    <div className="flex min-h-dvh flex-col pb-24">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          {step > 0 && step < 5 ? (
            <button
              onClick={() => setStep((s) => (s - 1) as Step)}
              aria-label="Back"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          ) : (
            <Link
              to="/"
              aria-label="Home"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
          )}
          <h1 className="font-display text-lg font-extrabold">
            {step === 5 ? "You're live" : "Create"}
          </h1>
          {fromTemplate && step < 5 && (
            <span className="ml-auto truncate rounded-full bg-accent/15 px-2.5 py-1 text-[10px] font-extrabold uppercase text-accent">
              From {fromTemplate}
            </span>
          )}
        </div>
        {step < 5 && (
          <div className="mt-3 flex gap-1.5">
            {labels.slice(0, 5).map((l, i) => (
              <div
                key={l}
                className={cn("h-1 flex-1 rounded-full", i <= step ? "bg-primary" : "bg-muted")}
              />
            ))}
          </div>
        )}
      </header>

      <main className="flex flex-1 flex-col gap-5 p-4">
        {step === 0 && (
          <div className="flex flex-col gap-5 animate-fade-up">
            <div>
              <h2 className="font-display text-2xl font-extrabold">
                What are you bringing people together for?
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Pick a starting point — you can change everything later.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {eventTypes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setType(t.label);
                    setCover(t.cover as CoverKey);
                  }}
                  className={cn(
                    "flex h-24 flex-col items-start justify-between rounded-3xl border p-4 text-left transition-all active:scale-[0.97]",
                    type === t.label ? "border-primary bg-primary/15" : "border-border bg-card",
                  )}
                >
                  <t.Icon className="h-6 w-6 text-primary" />
                  <span className="font-display font-bold">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4 animate-fade-up">
            <h2 className="font-display text-2xl font-extrabold">The basics</h2>
            <Field label="Event title">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`My ${type.toLowerCase()}`}
                className="h-12 w-full rounded-xl border border-input bg-card px-4 font-semibold outline-none focus:border-primary"
              />
            </Field>
            <Field label="Description">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="What should people expect?"
                className="w-full resize-none rounded-xl border border-input bg-card p-3 text-sm outline-none focus:border-primary"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-12 w-full rounded-xl border border-input bg-card px-3 text-sm font-semibold outline-none focus:border-primary"
                />
              </Field>
              <Field label="Time">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="h-12 w-full rounded-xl border border-input bg-card px-3 text-sm font-semibold outline-none focus:border-primary"
                />
              </Field>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4 animate-fade-up">
            <h2 className="font-display text-2xl font-extrabold">Where's it happening?</h2>
            <Field label="Venue or address">
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. The Parallax, Shoreditch"
                className="h-12 w-full rounded-xl border border-input bg-card px-4 font-semibold outline-none focus:border-primary"
              />
            </Field>
            <div className="relative h-44 overflow-hidden rounded-3xl border border-border bg-secondary">
              <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] [background-size:28px_28px]" />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <div className="mx-auto h-4 w-4 rounded-full bg-primary shadow-glow" />
                <p className="mt-2 text-xs font-semibold text-muted-foreground">
                  {location || "Drop your pin"}
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4 animate-fade-up">
            <h2 className="font-display text-2xl font-extrabold">Give it a face</h2>
            <div className="grid grid-cols-3 gap-2">
              {covers.map((c) => (
                <button
                  key={c}
                  onClick={() => setCover(c)}
                  className={cn(
                    "relative aspect-[3/4] overflow-hidden rounded-2xl border-2 transition-all",
                    cover === c ? "border-primary" : "border-transparent",
                  )}
                >
                  <img
                    src={eventCovers[c]}
                    alt={`Cover option ${c}`}
                    loading="lazy"
                    width={1024}
                    height={1280}
                    className="h-full w-full object-cover"
                  />
                  {cover === c && (
                    <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                      <Check className="h-3.5 w-3.5 text-primary-foreground" strokeWidth={3} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-4 animate-fade-up">
            <h2 className="font-display text-2xl font-extrabold">Guests & tickets</h2>
            <div className="flex gap-2">
              {[true, false].map((v) => (
                <button
                  key={String(v)}
                  onClick={() => setIsPublic(v)}
                  className={cn(
                    "flex-1 rounded-2xl border p-4 text-left transition-all active:scale-[0.97]",
                    isPublic === v ? "border-primary bg-primary/15" : "border-border bg-card",
                  )}
                >
                  <p className="font-display font-bold">{v ? "Public" : "Private"}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {v ? "Shows in Discover" : "Invite link only"}
                  </p>
                </button>
              ))}
            </div>
            <Field label={`Capacity — ${capacity} people`}>
              <input
                type="range"
                min={5}
                max={200}
                step={5}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full accent-[var(--primary)]"
              />
            </Field>
            <Field label="Price">
              <div className="flex gap-2">
                {["Free", "£10", "£20", "£35"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPrice(p)}
                    className={cn(
                      "h-11 flex-1 rounded-xl text-sm font-bold transition-all active:scale-95",
                      price === p
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground",
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </Field>

            <div className="mt-2 overflow-hidden rounded-3xl border border-border bg-card">
              <p className="border-b border-border px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Attendee preview
              </p>
              <div className="relative h-40">
                <img
                  src={eventCovers[cover]}
                  alt="Event cover preview"
                  loading="lazy"
                  width={1024}
                  height={1280}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-fade" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <h3 className="font-display text-xl font-extrabold">{title || "Your event"}</h3>
                  <p className="text-xs text-foreground/85">
                    {date || "Date TBC"} · {time} · {location || "Location TBC"} · {price}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="flex flex-col items-center gap-5 py-6 text-center animate-fade-up">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-brand shadow-glow animate-pop">
              <PartyPopper className="h-9 w-9 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-display text-3xl font-extrabold">{title} is live</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {isPublic ? "It's in Discover now." : "Private — share the link with your people."}{" "}
                Capacity {capacity}.
              </p>
            </div>

            <div className="flex flex-col items-center gap-3 rounded-3xl border border-border bg-card p-6">
              <div className="grid h-36 w-36 grid-cols-8 gap-0.5 rounded-xl bg-foreground p-2">
                {Array.from({ length: 64 }).map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "rounded-[1px]",
                      (i * 7 + (i % 5)) % 3 === 0 ? "bg-background" : "bg-foreground",
                    )}
                  />
                ))}
              </div>
              <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <QrCode className="h-3.5 w-3.5" /> Guests scan this to check in & share photos
              </p>
            </div>

            <button
              onClick={() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1800);
              }}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-secondary font-bold text-secondary-foreground"
            >
              {copied ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
              {copied ? "Link copied" : "Copy invite link"}
            </button>
            <Link
              to="/you"
              className="flex h-14 w-full items-center justify-center rounded-2xl bg-gradient-brand font-display text-lg font-bold text-primary-foreground shadow-glow"
            >
              Go to event dashboard
            </Link>
          </div>
        )}
      </main>

      {step < 5 && (
        <div className="sticky bottom-24 px-4">
          <button
            disabled={!valid[step]}
            onClick={() => (step === 4 ? publish() : setStep((s) => (s + 1) as Step))}
            className={cn(
              "flex h-14 w-full items-center justify-center gap-2 rounded-2xl font-display text-lg font-bold transition-all active:scale-[0.98]",
              valid[step]
                ? "bg-gradient-brand text-primary-foreground shadow-glow"
                : "bg-muted text-muted-foreground",
            )}
          >
            {step === 4 ? "Publish event" : "Continue"}{" "}
            <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </div>
      )}
      <BottomNav />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
