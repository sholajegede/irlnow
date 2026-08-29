import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Copy, Gift, Trophy, UserPlus } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { EmptyState } from "@/components/EmptyState";
import { InviteSheet } from "@/components/InviteSheet";
import { CHANNELS, REWARD_STEPS, inviteLink, inviteStats, referralCode } from "@/lib/invite";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/invite")({
  head: () => ({
    meta: [
      { title: "Invite friends — IRL NOW" },
      {
        name: "description",
        content:
          "Share your invite link, see who opened it, who joined and who actually went out — and unlock IRL NOW+ for free.",
      },
      { property: "og:title", content: "Invite friends — IRL NOW" },
      { property: "og:description", content: "Going out is better with the people you already know." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InvitePage,
});

function InvitePage() {
  const { name, invites } = useApp();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const code = referralCode(name);
  const link = inviteLink(code);
  const stats = inviteStats(invites.length);
  const joined = stats.joined;

  return (
    <div className="flex min-h-dvh flex-col pb-24">
      <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur-xl">
        <Link to="/you" aria-label="Back" className="rounded-full p-1.5 active:bg-secondary">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <p className="font-display text-lg font-extrabold tracking-tight">Invite friends</p>
          <p className="text-xs text-muted-foreground">The app only works if your people are on it</p>
        </div>
      </header>

      <main className="flex-1 space-y-6 px-4 pt-4">
        <section className="rounded-3xl bg-gradient-brand p-5 text-primary-foreground shadow-glow">
          <Gift className="h-7 w-7" />
          <h1 className="mt-2 font-display text-2xl font-extrabold leading-tight">
            Three friends = a free month
          </h1>
          <p className="mt-1 text-sm opacity-90">
            When three people you invite actually go to something, your next month of IRL NOW+ is on us.
          </p>
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-background/20 p-3">
            <p className="flex-1 truncate font-mono text-xs">{link}</p>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(link).catch(() => {});
                setCopied(true);
              }}
              className="flex items-center gap-1 rounded-full bg-background/30 px-3 py-1.5 text-[11px] font-bold"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-background font-display text-sm font-bold text-foreground"
          >
            <UserPlus className="h-4 w-4" /> Send invites
          </button>
        </section>

        <section className="grid grid-cols-4 gap-2">
          <Stat value={invites.length} label="Sent" />
          <Stat value={stats.opened} label="Opened" />
          <Stat value={stats.joined} label="Joined" />
          <Stat value={stats.wentOut} label="Went out" accent />
        </section>

        <section>
          <h2 className="mb-2 flex items-center gap-2 font-display text-sm font-extrabold uppercase tracking-wider">
            <Trophy className="h-4 w-4 text-primary" /> Rewards
          </h2>
          <div className="flex flex-col gap-2">
            {REWARD_STEPS.map((s) => {
              const done = joined >= s.at;
              return (
                <div
                  key={s.at}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border p-3",
                    done ? "border-accent/40 bg-accent/10" : "border-border bg-card",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl font-display text-sm font-extrabold",
                      done ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {done ? <Check className="h-4 w-4" strokeWidth={3} /> : s.at}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-bold">{s.label}</p>
                    <p className="text-[11px] text-muted-foreground">{s.reward}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="mb-2 font-display text-sm font-extrabold uppercase tracking-wider">Your invites</h2>
          {invites.length === 0 ? (
            <EmptyState
              icon={UserPlus}
              title="Nothing sent yet"
              body="Invites work best attached to a real plan — share from an event you're already going to."
              action="Find something on"
              actionTo="/"
              className="py-8"
            />
          ) : (
            <div className="flex flex-col gap-2">
              {invites.map((i) => (
                <div key={i.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-[10px] font-bold uppercase">
                    {CHANNELS.find((c) => c.id === i.channel)?.label.slice(0, 2)}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-bold">{i.contextLabel}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {CHANNELS.find((c) => c.id === i.channel)?.label} · {i.when}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <InviteSheet
        open={open}
        onClose={() => setOpen(false)}
        context="app"
        contextLabel="Join me on IRL NOW"
      />
      <BottomNav />
    </div>
  );
}

function Stat({ value, label, accent }: { value: number; label: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-2.5 text-center">
      <p className={cn("font-display text-xl font-extrabold", accent && "text-accent")}>{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}
