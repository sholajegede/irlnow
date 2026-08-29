import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Users } from "lucide-react";
import { PLAN_EMOJIS, PLAN_TEMPLATES, type Plan } from "@irlnow/domain";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/plan/new")({
  head: () => ({
    meta: [
      { title: "Post a plan — IRL NOW" },
      {
        name: "description",
        content:
          "Going somewhere? Say so and bring people. Thirty seconds, no event page, no tickets.",
      },
      { property: "og:title", content: "Post a plan — IRL NOW" },
      { property: "og:description", content: "Going somewhere? Bring people." },
    ],
  }),
  component: NewPlan,
});

const WHENS = ["Today · evening", "Tomorrow · 2:00pm", "Sat · 2:00pm", "Sun · 4:00pm"];
const AUDIENCES: { id: Plan["audience"]; label: string; sub: string }[] = [
  { id: "connections", label: "My connections", sub: "People you've actually met" },
  { id: "attendees", label: "People from my events", sub: "Anyone you've shared an event with" },
  { id: "link", label: "Anyone with the link", sub: "Share it wherever you like" },
];

function NewPlan() {
  const navigate = useNavigate();
  const { addPlan, togglePlanIn } = useApp();
  const [emoji, setEmoji] = useState(PLAN_EMOJIS[0]!);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [when, setWhen] = useState(WHENS[0]!);
  const [place, setPlace] = useState("");
  const [audience, setAudience] = useState<Plan["audience"]>("connections");

  const post = () => {
    const id = `plan-${Date.now()}`;
    addPlan({
      id,
      emoji,
      title: title.trim() || "Going out, come along",
      note: note.trim() || "No plan beyond turning up.",
      byId: "you",
      when,
      place: place.trim() || "London",
      audience,
      inIds: [],
    });
    togglePlanIn(id);
    navigate({ to: "/plan/$id", params: { id } });
  };

  return (
    <div className="flex min-h-dvh flex-col pb-12">
      <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur-xl">
        <Link to="/plans" className="rounded-full p-1.5 active:bg-secondary" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <p className="font-display text-lg font-extrabold tracking-tight">Post a plan</p>
          <p className="text-xs text-muted-foreground">Going somewhere? Bring people.</p>
        </div>
      </header>

      <main className="flex flex-col gap-5 p-4">
        <section>
          <p className="text-sm font-bold">Start from one of these</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {PLAN_TEMPLATES.map((t) => (
              <button
                key={t.title}
                onClick={() => {
                  setEmoji(t.emoji);
                  setTitle(t.title);
                }}
                className={cn(
                  "rounded-full px-3.5 py-2 text-xs font-bold",
                  title === t.title ? "bg-foreground text-background" : "bg-secondary",
                )}
              >
                {t.emoji} {t.title}
              </button>
            ))}
          </div>
        </section>

        <section className="flex gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-muted-foreground">Icon</label>
            <select
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              aria-label="Plan icon"
              className="rounded-2xl border border-border bg-card p-3 text-xl"
            >
              {PLAN_EMOJIS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-xs font-bold text-muted-foreground" htmlFor="plan-title">
              What are you doing?
            </label>
            <input
              id="plan-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Going to the park Saturday at 2"
              className="rounded-2xl border border-border bg-card p-3 text-sm outline-none focus:border-primary"
            />
          </div>
        </section>

        <section className="flex flex-col gap-1">
          <label className="text-xs font-bold text-muted-foreground" htmlFor="plan-note">
            Anything else? (optional)
          </label>
          <textarea
            id="plan-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Bringing a speaker and too much bread. Come whenever."
            className="rounded-2xl border border-border bg-card p-3 text-sm outline-none focus:border-primary"
          />
        </section>

        <section>
          <p className="text-sm font-bold">When</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {WHENS.map((w) => (
              <button
                key={w}
                onClick={() => setWhen(w)}
                className={cn(
                  "rounded-full px-3.5 py-2 text-xs font-bold",
                  when === w ? "bg-foreground text-background" : "bg-secondary",
                )}
              >
                {w}
              </button>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-1">
          <label className="text-xs font-bold text-muted-foreground" htmlFor="plan-place">
            Where
          </label>
          <input
            id="plan-place"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder="London Fields, E8"
            className="rounded-2xl border border-border bg-card p-3 text-sm outline-none focus:border-primary"
          />
        </section>

        <section>
          <p className="flex items-center gap-1.5 text-sm font-bold">
            <Users className="h-4 w-4 text-primary" /> Who can see it
          </p>
          <div className="mt-2 flex flex-col gap-2">
            {AUDIENCES.map((a) => (
              <button
                key={a.id}
                onClick={() => setAudience(a.id)}
                className={cn(
                  "rounded-2xl border p-3 text-left",
                  audience === a.id ? "border-primary bg-primary/10" : "border-border bg-card",
                )}
              >
                <p className="text-sm font-bold">{a.label}</p>
                <p className="text-xs text-muted-foreground">{a.sub}</p>
              </button>
            ))}
          </div>
        </section>

        <button
          onClick={post}
          className="rounded-2xl bg-gradient-brand py-3.5 font-display font-bold text-primary-foreground shadow-glow"
        >
          Post the plan
        </button>
      </main>
    </div>
  );
}
