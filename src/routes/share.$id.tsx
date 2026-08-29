import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Copy, Image as ImageIcon, Share2 } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { displayUrl } from "@/config/app";
import { getEvent, getPerson } from "@/lib/data";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

const LOOKS = [
  { id: "bold", label: "Bold", cls: "bg-gradient-brand text-primary-foreground" },
  { id: "dark", label: "Dark", cls: "bg-card text-foreground border border-border" },
  { id: "lime", label: "Lime", cls: "bg-accent text-accent-foreground" },
] as const;

export const Route = createFileRoute("/share/$id")({
  head: () => ({
    meta: [
      { title: "Make a share card — IRL NOW" },
      {
        name: "description",
        content:
          "Turn what you're going to into a story-shaped card your friends can tap straight through.",
      },
      { property: "og:title", content: "Make a share card — IRL NOW" },
      { property: "og:description", content: "One tap from your story to the door." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SharePage,
});

function SharePage() {
  const { id } = Route.useParams();
  const event = getEvent(id);
  const { name, goingIds } = useApp();
  const [look, setLook] = useState<(typeof LOOKS)[number]["id"]>("bold");
  const [caption, setCaption] = useState(
    event ? `I'm going to ${event.title}. Come.` : "I'm going out. Come.",
  );
  const [copied, setCopied] = useState(false);
  const going = (event?.going ?? []).map(getPerson).filter(Boolean).slice(0, 3);
  const url = displayUrl(`/x/${id}`);
  const style = LOOKS.find((l) => l.id === look)!;

  return (
    <div className="flex min-h-dvh flex-col pb-10">
      <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur-xl">
        <Link to="/event/$id" params={{ id }} aria-label="Back" className="rounded-full p-1.5 active:bg-secondary">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <p className="font-display text-lg font-extrabold tracking-tight">Share card</p>
          <p className="text-xs text-muted-foreground">Story-shaped, tappable</p>
        </div>
      </header>

      <main className="flex-1 space-y-5 px-4 pt-4">
        <div
          className={cn(
            "mx-auto flex aspect-[9/16] w-full max-w-[280px] flex-col justify-between rounded-3xl p-5 shadow-glow",
            style.cls,
          )}
        >
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">IRL NOW</p>
            <p className="mt-6 font-display text-3xl font-extrabold leading-[1.05]">
              {caption || "I'm going out."}
            </p>
          </div>
          <div>
            <div className="flex -space-x-2">
              {going.map((p) => (
                <span key={p!.id} className="rounded-full ring-2 ring-current/20">
                  <Avatar person={p!} size="sm" />
                </span>
              ))}
            </div>
            <p className="mt-3 font-display text-sm font-extrabold">{event?.title ?? "Something tonight"}</p>
            <p className="text-xs opacity-80">
              {event?.dateLabel ?? "Soon"} · {event?.area ?? "Near you"}
            </p>
            <p className="mt-3 text-[10px] font-bold opacity-70">{url}</p>
          </div>
        </div>

        <div className="flex justify-center gap-1.5">
          {LOOKS.map((l) => (
            <button
              key={l.id}
              onClick={() => setLook(l.id)}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-bold",
                look === l.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
              )}
            >
              {l.label}
            </button>
          ))}
        </div>

        <label className="block rounded-2xl border border-border bg-card p-3">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Caption
          </span>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="mt-1 w-full bg-transparent text-sm font-semibold outline-none"
          />
        </label>

        <div className="flex flex-col gap-2">
          <button className="flex h-13 items-center justify-center gap-2 rounded-2xl bg-gradient-brand py-3.5 font-display text-sm font-bold text-primary-foreground shadow-glow">
            <ImageIcon className="h-4 w-4" /> Save to camera roll
          </button>
          <button className="flex h-13 items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3.5 font-display text-sm font-bold">
            <Share2 className="h-4 w-4" /> Share to story
          </button>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(url).catch(() => {});
              setCopied(true);
            }}
            className="flex h-13 items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3.5 font-display text-sm font-bold"
          >
            {copied ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
            {copied ? "Link copied" : "Copy link"}
          </button>
        </div>

        <p className="text-center text-[11px] text-muted-foreground">
          Anyone who taps it lands on the event with {name || "your"} name on it — {goingIds.includes(id) ? "and sees you're going" : "no account needed to look"}.
        </p>
      </main>
    </div>
  );
}
