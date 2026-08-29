import { useState } from "react";
import { useApp } from "@/lib/store";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Check,
  Flag,
  Image,
  MapPin,
  ShieldAlert,
  Trash2,
  User,
  X,
} from "lucide-react";
import { Avatar } from "@/components/Avatar";
import {
  cityRows,
  moderationQueue,
  platformStats,
  verificationQueue,
  verifiedOrganisers,
  type ModerationItem,
} from "@irlnow/domain";
import { REVENUE_MIX } from "@irlnow/domain";
import { money } from "@irlnow/domain";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Platform admin — IRL NOW" },
      {
        name: "description",
        content:
          "Internal operations: moderation queue, organiser verification, city scene density and trust metrics.",
      },
      { property: "og:title", content: "Platform admin — IRL NOW" },
      { property: "og:description", content: "Keep the nights safe and the scenes dense." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Tab = "pulse" | "moderation" | "organisers" | "cities";
const tabs: { id: Tab; label: string }[] = [
  { id: "pulse", label: "Pulse" },
  { id: "moderation", label: "Queue" },
  { id: "organisers", label: "Organisers" },
  { id: "cities", label: "Cities" },
];

const kindIcon = { event: Flag, person: User, photo: Image } as const;
const severityStyle = {
  high: "bg-primary/15 text-primary",
  medium: "bg-accent/15 text-accent",
  low: "bg-secondary text-muted-foreground",
} as const;

function AdminPage() {
  const { reports } = useApp();
  const [tab, setTab] = useState<Tab>("pulse");
  const [resolved, setResolved] = useState<Record<string, "removed" | "kept">>({});
  const [decided, setDecided] = useState<Record<string, "approved" | "rejected">>({});

  const open = moderationQueue.filter((m) => !resolved[m.id]);

  return (
    <div className="min-h-dvh bg-background pb-16">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link
            to="/you"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1">
            <h1 className="font-display text-lg font-bold">Platform admin</h1>
            <p className="text-xs text-muted-foreground">Internal · trust, safety and growth</p>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-bold text-primary">
            <ShieldAlert className="h-3 w-3" /> {open.length} open
          </span>
        </div>
        <div className="flex gap-1 px-4 pb-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex-1 rounded-xl px-2 py-2 text-xs font-bold transition-colors",
                tab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <div className="space-y-5 p-4">
        {tab === "pulse" && (
          <>
            <div className="grid grid-cols-2 gap-2.5">
              {platformStats.map((s) => (
                <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
                  <p className="font-display text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p
                    className={cn(
                      "mt-1 text-[11px] font-bold",
                      s.good ? "text-accent" : "text-primary",
                    )}
                  >
                    {s.delta} vs last week
                  </p>
                </div>
              ))}
            </div>
            <section className="space-y-2.5 rounded-2xl border border-border bg-card p-4">
              <h2 className="font-display font-bold">What we watch</h2>
              <p className="text-sm text-muted-foreground">
                Show-up rate is the health metric — not signups, not scroll time. If people say
                they're going and don't turn up, the product is failing quietly.
              </p>
              <div className="space-y-2 pt-1">
                <Meter label="Show-up rate" value={78} target="Target 75%" good />
                <Meter label="Walls claimed within 24h" value={64} target="Target 60%" good />
                <Meter
                  label="Second event within 30 days"
                  value={41}
                  target="Target 50%"
                  good={false}
                />
              </div>
            </section>
            <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
              <div className="flex items-baseline justify-between">
                <h2 className="font-display font-bold">Revenue mix</h2>
                <p className="font-display text-lg font-extrabold">
                  {money(REVENUE_MIX.reduce((a, r) => a + r.amount, 0))}
                  <span className="ml-1 text-xs font-bold text-muted-foreground">this quarter</span>
                </p>
              </div>
              <div className="flex h-2.5 overflow-hidden rounded-full bg-secondary">
                {REVENUE_MIX.map((r, i) => (
                  <div
                    key={r.id}
                    style={{ width: `${r.share * 100}%` }}
                    className={cn(i % 2 === 0 ? "bg-primary" : "bg-accent", i > 1 && "opacity-60")}
                  />
                ))}
              </div>
              <div className="space-y-1.5">
                {REVENUE_MIX.map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{r.label}</span>
                    <span className="font-bold">
                      {money(r.amount)}{" "}
                      <span className="text-xs text-muted-foreground">
                        {Math.round(r.share * 100)}%
                      </span>
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Venues paying for attendance is the biggest line — the demand engine, not the
                ticketing tax.
              </p>
            </section>
          </>
        )}

        {tab === "moderation" && (
          <>
            <div className="flex items-start gap-2.5 rounded-2xl border border-primary/30 bg-primary/10 p-4">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-sm text-muted-foreground">
                High severity is reviewed within one hour. Removing an event notifies everyone going
                and refunds every ticket automatically.
              </p>
            </div>
            {reports.length > 0 && (
              <section className="space-y-2 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
                <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-destructive">
                  User reports ({reports.length})
                </h2>
                {reports.map((r) => (
                  <div key={r.id} className="rounded-xl bg-card p-3">
                    <p className="text-sm font-bold">{r.targetName}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {r.reason} · {r.when} · {r.status}
                    </p>
                    {r.detail && <p className="mt-1 text-xs">{r.detail}</p>}
                  </div>
                ))}
              </section>
            )}
            {moderationQueue.map((m) => (
              <ModerationCard
                key={m.id}
                item={m}
                decision={resolved[m.id]}
                onDecide={(d) => setResolved((prev) => ({ ...prev, [m.id]: d }))}
              />
            ))}
          </>
        )}

        {tab === "organisers" && (
          <>
            <section className="space-y-2.5">
              <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Waiting on verification
              </h2>
              {verificationQueue.map((v) => {
                const d = decided[v.id];
                return (
                  <div key={v.id} className="rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-center gap-3">
                      <Avatar person={{ name: v.name, avatar: v.avatar }} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="font-display font-bold">{v.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {v.events} events · {v.showRate}% show-up · {v.rating}★
                        </p>
                      </div>
                    </div>
                    <p className="mt-2.5 text-sm text-muted-foreground">{v.note}</p>
                    {d ? (
                      <p
                        className={cn(
                          "mt-3 rounded-xl px-3 py-2 text-sm font-semibold",
                          d === "approved"
                            ? "bg-accent/15 text-accent"
                            : "bg-secondary text-muted-foreground",
                        )}
                      >
                        {d === "approved"
                          ? "Verified — badge is live"
                          : "Rejected — organiser notified"}
                      </p>
                    ) : (
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => setDecided((p) => ({ ...p, [v.id]: "approved" }))}
                          className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-brand font-display text-sm font-bold text-primary-foreground"
                        >
                          <BadgeCheck className="h-4 w-4" /> Verify
                        </button>
                        <button
                          onClick={() => setDecided((p) => ({ ...p, [v.id]: "rejected" }))}
                          className="h-11 flex-1 rounded-xl border border-border text-sm font-semibold text-muted-foreground"
                        >
                          Not yet
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </section>

            <section className="space-y-2.5">
              <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Verified organisers
              </h2>
              {verifiedOrganisers.map((o) => (
                <Link
                  key={o.id}
                  to="/organiser/$id"
                  params={{ id: o.id }}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
                >
                  <Avatar person={{ name: o.name, avatar: o.avatar }} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1 font-semibold">
                      {o.name} <BadgeCheck className="h-3.5 w-3.5 text-accent" />
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {o.eventsHosted} events · {o.rating}★
                    </p>
                  </div>
                </Link>
              ))}
            </section>
          </>
        )}

        {tab === "cities" && (
          <>
            <p className="text-sm text-muted-foreground">
              We only open a city once a scene is dense enough that someone can find something worth
              leaving the house for on any given night.
            </p>
            {cityRows.map((c) => (
              <div key={c.city} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-1.5 font-display font-bold">
                    <MapPin className="h-4 w-4 text-primary" /> {c.city}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {c.events} events · {c.guests.toLocaleString()} guests
                  </span>
                </div>
                <Meter
                  label="Scene density"
                  value={c.density}
                  target={c.density >= 60 ? "Healthy" : "Needs seeding"}
                  good={c.density >= 60}
                />
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function ModerationCard({
  item,
  decision,
  onDecide,
}: {
  item: ModerationItem;
  decision?: "removed" | "kept" | undefined;
  onDecide: (d: "removed" | "kept") => void;
}) {
  const Icon = kindIcon[item.kind];
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display font-bold leading-tight">{item.subject}</p>
          <p className="text-xs text-primary">{item.reason}</p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-1 text-[11px] font-bold",
            severityStyle[item.severity],
          )}
        >
          {item.severity}
        </span>
      </div>
      <p className="mt-2.5 text-sm text-muted-foreground">{item.detail}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">
        {item.reports} report{item.reports === 1 ? "" : "s"} · {item.age} old
      </p>
      {decision ? (
        <p
          className={cn(
            "mt-3 rounded-xl px-3 py-2 text-sm font-semibold",
            decision === "removed" ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent",
          )}
        >
          {decision === "removed"
            ? "Removed · everyone notified and refunded"
            : "Kept up · reporters told why"}
        </p>
      ) : (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => onDecide("removed")}
            className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary/15 text-sm font-bold text-primary"
          >
            <Trash2 className="h-4 w-4" /> Remove
          </button>
          <button
            onClick={() => onDecide("kept")}
            className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground"
          >
            <Check className="h-4 w-4" /> Keep up
          </button>
          <button
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-border text-muted-foreground"
            aria-label="Skip for now"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function Meter({
  label,
  value,
  target,
  good,
}: {
  label: string;
  value: number;
  target: string;
  good: boolean;
}) {
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("font-bold", good ? "text-accent" : "text-primary")}>
          {value}% · {target}
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className={cn("h-full rounded-full", good ? "bg-accent" : "bg-primary")}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
