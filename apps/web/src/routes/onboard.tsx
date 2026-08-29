import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Loader2, MapPin, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AvatarStack } from "@/components/Avatar";
import { events, interests, peopleByIds, type IrlEvent } from "@irlnow/domain";
import { eventCovers } from "@/lib/covers";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboard")({
  head: () => ({
    meta: [
      { title: "Get started — IRL NOW" },
      {
        name: "description",
        content: "Tell us what you're into and see the people and plans made for you.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OnboardPage,
});

const cities = ["London", "Manchester", "Bristol", "Brighton"];

type Step = "splash" | "city" | "name" | "email" | "interests" | "processing" | "reveal";
const stepOrder: Step[] = ["splash", "city", "name", "email", "interests", "processing", "reveal"];

function OnboardPage() {
  const navigate = useNavigate();
  const { completeOnboarding } = useApp();
  const [step, setStep] = useState<Step>("splash");
  const [city, setCity] = useState("London");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [picked, setPicked] = useState<string[]>([]);

  const stepIndex = stepOrder.indexOf(step);

  const matches = useMemo<IrlEvent[]>(() => {
    if (!picked.length) return events.slice(0, 4);
    return [...events]
      .sort((a, b) => Number(picked.includes(b.category)) - Number(picked.includes(a.category)))
      .slice(0, 4);
  }, [picked]);

  useEffect(() => {
    if (step !== "processing") return;
    const t = setTimeout(() => setStep("reveal"), 2200);
    return () => clearTimeout(t);
  }, [step]);

  const finish = () => {
    completeOnboarding({ name: name || "You", email, city, interests: picked });
    navigate({ to: "/" });
  };

  const canContinue =
    step === "city"
      ? !!city
      : step === "name"
        ? name.trim().length >= 2
        : step === "email"
          ? /.+@.+\..+/.test(email)
          : step === "interests"
            ? picked.length >= 3
            : true;

  const next = () => {
    const i = stepOrder.indexOf(step);
    if (i < stepOrder.length - 1) setStep(stepOrder[i + 1]!);
  };
  const back = () => {
    const i = stepOrder.indexOf(step);
    if (i > 0) setStep(stepOrder[i - 1]!);
    else navigate({ to: "/" });
  };

  return (
    <div className="flex min-h-dvh flex-col">
      {step !== "splash" && step !== "processing" && step !== "reveal" && (
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            onClick={back}
            aria-label="Back"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex flex-1 gap-1.5">
            {stepOrder.slice(1, 5).map((s, i) => (
              <div
                key={s}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  i < stepIndex ? "bg-primary" : "bg-muted",
                )}
              />
            ))}
          </div>
        </div>
      )}

      {step === "splash" && (
        <div className="relative flex flex-1 flex-col justify-end overflow-hidden">
          <img
            src={eventCovers.rooftop}
            alt="Friends on a rooftop at golden hour"
            width={1024}
            height={1280}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-fade" />
          <div className="relative flex flex-col gap-4 p-6 pb-10 animate-fade-up">
            <h1 className="font-display text-5xl font-extrabold leading-[0.95] tracking-tight">
              IRL<span className="text-primary">·</span>NOW
            </h1>
            <p className="max-w-xs text-lg font-medium text-foreground/90">
              Less feed. More life. Find things to do and people worth doing them with — then
              actually go.
            </p>
            <button
              onClick={next}
              className="mt-2 flex h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-brand font-display text-lg font-bold text-primary-foreground shadow-glow transition-transform active:scale-[0.98]"
            >
              Get me out there <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
            </button>
            <p className="text-center text-xs text-muted-foreground">
              2 minutes · no endless scrolling, promise
            </p>
          </div>
        </div>
      )}

      {step === "city" && (
        <div className="flex flex-1 flex-col gap-6 p-6 animate-fade-up">
          <div>
            <h2 className="font-display text-3xl font-extrabold tracking-tight">
              Where's your scene?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick a city — no GPS permission needed. You can change it anytime.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {cities.map((c) => (
              <button
                key={c}
                onClick={() => setCity(c)}
                className={cn(
                  "flex h-28 flex-col items-start justify-between rounded-3xl border p-4 text-left transition-all active:scale-[0.97]",
                  city === c ? "border-primary bg-primary/15" : "border-border bg-card",
                )}
              >
                <MapPin
                  className={cn("h-5 w-5", city === c ? "text-primary" : "text-muted-foreground")}
                />
                <span className="font-display text-lg font-bold">{c}</span>
              </button>
            ))}
          </div>
          <ContinueButton disabled={!canContinue} onClick={next} label={`Continue in ${city}`} />
        </div>
      )}

      {step === "name" && (
        <div className="flex flex-1 flex-col gap-6 p-6 animate-fade-up">
          <div>
            <h2 className="font-display text-3xl font-extrabold tracking-tight">
              What should people call you?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              First name only. It's how hosts greet you and how you show up on "who's going".
            </p>
          </div>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your first name"
            className="h-14 rounded-2xl border border-input bg-card px-5 text-lg font-semibold outline-none placeholder:text-muted-foreground focus:border-primary"
          />
          <ContinueButton disabled={!canContinue} onClick={next} label="That's me" />
        </div>
      )}

      {step === "email" && (
        <div className="flex flex-1 flex-col gap-6 p-6 animate-fade-up">
          <div>
            <h2 className="font-display text-3xl font-extrabold tracking-tight">
              Where do we send the good stuff?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Event updates, your photos the morning after, and account continuity. No spam —
              event-driven only.
            </p>
          </div>
          <input
            autoFocus
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="h-14 rounded-2xl border border-input bg-card px-5 text-lg font-semibold outline-none placeholder:text-muted-foreground focus:border-primary"
          />
          <ContinueButton disabled={!canContinue} onClick={next} label="Continue" />
        </div>
      )}

      {step === "interests" && (
        <div className="flex flex-1 flex-col gap-6 p-6 animate-fade-up">
          <div>
            <h2 className="font-display text-3xl font-extrabold tracking-tight">
              What pulls you out of the house?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick at least 3 — this is how we find your people, not just events.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {interests.map((i) => {
              const on = picked.includes(i.id);
              return (
                <button
                  key={i.id}
                  onClick={() =>
                    setPicked((p) => (on ? p.filter((x) => x !== i.id) : [...p, i.id]))
                  }
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold transition-all active:scale-95",
                    on
                      ? "border-primary bg-primary text-primary-foreground shadow-glow"
                      : "border-border bg-card text-foreground",
                  )}
                >
                  <span>{i.emoji}</span> {i.label}
                  {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                </button>
              );
            })}
          </div>
          <div className="mt-auto">
            <ContinueButton
              disabled={!canContinue}
              onClick={next}
              label={picked.length >= 3 ? `Show me my ${city}` : `Pick ${3 - picked.length} more`}
            />
          </div>
        </div>
      )}

      {step === "processing" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <Sparkles className="absolute -right-3 -top-3 h-5 w-5 text-accent animate-pulse-soft" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-extrabold">Finding your kind of plan…</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Matching {picked.length} interests against what's on in {city}.
            </p>
          </div>
        </div>
      )}

      {step === "reveal" && (
        <div className="flex flex-1 flex-col gap-6 p-6 animate-fade-up">
          <div className="pt-4 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              Your personalised reveal
            </p>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight">
              {name || "Hey"}, this is your week in {city}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You'll meet people at these — not before them.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {matches.map((e, i) => (
              <div
                key={e.id}
                className="overflow-hidden rounded-3xl border border-border bg-card text-left animate-pop"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <img
                  src={eventCovers[e.cover]}
                  alt={e.title}
                  className="h-24 w-full object-cover"
                  loading="lazy"
                />
                <div className="p-3">
                  <p className="font-display text-sm font-bold leading-tight">{e.title}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {e.when} · {e.area}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <AvatarStack people={peopleByIds(["maya", "josh", "priya"])} />
            84 people going out in {city} right now
          </div>
          <div className="mt-auto">
            <button
              onClick={finish}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-brand font-display text-lg font-bold text-primary-foreground shadow-glow transition-transform active:scale-[0.98]"
            >
              Start discovering <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ContinueButton({
  disabled,
  onClick,
  label,
}: {
  disabled?: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <div className="mt-auto">
      <button
        disabled={disabled}
        onClick={onClick}
        className={cn(
          "flex h-14 w-full items-center justify-center gap-2 rounded-2xl font-display text-lg font-bold transition-all active:scale-[0.98]",
          disabled
            ? "bg-muted text-muted-foreground"
            : "bg-gradient-brand text-primary-foreground shadow-glow",
        )}
      >
        {label} <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
      </button>
    </div>
  );
}
