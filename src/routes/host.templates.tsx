import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CalendarPlus, Check, Copy, Repeat, Trash2, Users } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { eventCovers } from "@/lib/data";
import {
  cadences,
  myTemplates,
  nextDates,
  starterTemplates,
  type Cadence,
  type HostTemplate,
} from "@/lib/hosting";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/host/templates")({
  head: () => ({
    meta: [
      { title: "Run it again — event templates | IRL NOW" },
      {
        name: "description",
        content:
          "Turn a night that worked into a repeatable format: reuse the details, pick a cadence and publish the next four dates in one go.",
      },
      { property: "og:title", content: "Run it again — event templates" },
      { property: "og:description", content: "The second event should take two minutes, not twenty." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TemplatesPage,
});

function TemplatesPage() {
  const navigate = useNavigate();
  const { savedTemplates, useTemplate, removeTemplate, scheduleRepeats, repeatSchedules } = useApp();
  const [open, setOpen] = useState<string | null>(null);
  const [cadence, setCadence] = useState<Cadence>("monthly");

  const mine = myTemplates();
  const all: { section: string; items: HostTemplate[] }[] = [
    { section: "From your events", items: mine },
    ...(savedTemplates.length ? [{ section: "Saved by you", items: savedTemplates }] : []),
    { section: "Start from a format", items: starterTemplates },
  ];

  const dates = nextDates(cadence);

  return (
    <div className="flex min-h-dvh flex-col pb-24">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border/60 bg-background/85 px-4 py-3 backdrop-blur-xl">
        <Link to="/host" aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display text-lg font-extrabold">Run it again</h1>
      </header>

      <main className="flex flex-col gap-6 p-4">
        <p className="text-sm text-muted-foreground">
          The events that build a following are the ones that come back. Reuse a format, pick how often, and
          the next dates go up together — people can follow the whole series instead of catching one night.
        </p>

        {all.map((group) => (
          <section key={group.section} className="flex flex-col gap-3">
            <h2 className="font-display text-xl font-extrabold">{group.section}</h2>
            {group.items.map((t) => {
              const scheduled = repeatSchedules[t.id] ?? [];
              const isOpen = open === t.id;
              return (
                <article key={t.id} className="overflow-hidden rounded-3xl border border-border bg-card">
                  <div className="flex gap-3 p-3">
                    <img
                      src={eventCovers[t.cover]}
                      alt={t.name}
                      loading="lazy"
                      width={1024}
                      height={1280}
                      className="h-20 w-20 shrink-0 rounded-2xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-lg font-extrabold leading-tight">{t.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.time} · {t.location} · {t.price}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Users className="h-3 w-3" /> up to {t.capacity} · {t.origin}
                      </p>
                    </div>
                  </div>

                  {scheduled.length > 0 && (
                    <div className="mx-3 mb-3 rounded-2xl bg-accent/10 p-3">
                      <p className="text-xs font-bold text-accent">
                        {scheduled.length} dates published · following opens today
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{scheduled.join(" · ")}</p>
                    </div>
                  )}

                  {isOpen && (
                    <div className="mx-3 mb-3 rounded-2xl bg-secondary p-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        How often
                      </p>
                      <div className="mt-2 flex gap-1.5">
                        {cadences.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => setCadence(c.id)}
                            className={cn(
                              "flex-1 rounded-xl px-2 py-2 text-xs font-bold",
                              cadence === c.id
                                ? "bg-gradient-brand text-primary-foreground"
                                : "bg-background text-muted-foreground",
                            )}
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">
                        Publishing {dates.map((d) => d.label).join(" · ")}
                      </p>
                      <button
                        onClick={() => {
                          scheduleRepeats(t.id, dates.map((d) => d.label));
                          setOpen(null);
                        }}
                        className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-brand text-sm font-bold text-primary-foreground shadow-glow"
                      >
                        <Check className="h-4 w-4" /> Publish {dates.length} dates
                      </button>
                    </div>
                  )}

                  <div className="flex gap-2 border-t border-border p-3">
                    <button
                      onClick={() => {
                        useTemplate(t);
                        navigate({ to: "/create" });
                      }}
                      className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-brand text-xs font-bold text-primary-foreground"
                    >
                      <Copy className="h-3.5 w-3.5" /> Use this
                    </button>
                    <button
                      onClick={() => setOpen(isOpen ? null : t.id)}
                      className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-secondary text-xs font-bold text-secondary-foreground"
                    >
                      <Repeat className="h-3.5 w-3.5" /> Make it a series
                    </button>
                    {savedTemplates.some((s) => s.id === t.id) && (
                      <button
                        onClick={() => removeTemplate(t.id)}
                        aria-label={`Delete ${t.name}`}
                        className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-muted-foreground"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        ))}

        <Link
          to="/create"
          className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-secondary font-display text-sm font-bold text-secondary-foreground"
        >
          <CalendarPlus className="h-4 w-4" /> Start from scratch instead
        </Link>
      </main>
      <BottomNav />
    </div>
  );
}
