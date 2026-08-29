import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Ban, FileWarning, LifeBuoy, MapPin, PhoneCall, ShieldCheck, UserCheck } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { BottomNav } from "@/components/BottomNav";
import { EmptyState } from "@/components/EmptyState";
import { getPerson } from "@/lib/data";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/safety")({
  head: () => ({
    meta: [
      { title: "Safety centre — IRL NOW" },
      {
        name: "description",
        content:
          "Blocked people, your reports, share-my-location with a friend, and what to do if something feels off at an event.",
      },
      { property: "og:title", content: "Safety centre — IRL NOW" },
      { property: "og:description", content: "Meeting people should never feel risky." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SafetyPage,
});

function SafetyPage() {
  const { blockedIds, unblockPerson, reports } = useApp();
  const blocked = blockedIds.map(getPerson).filter(Boolean);

  return (
    <div className="flex min-h-dvh flex-col pb-24">
      <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur-xl">
        <Link to="/you" aria-label="Back" className="rounded-full p-1.5 active:bg-secondary">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <p className="font-display text-lg font-extrabold tracking-tight">Safety centre</p>
          <p className="text-xs text-muted-foreground">Everything in one place</p>
        </div>
      </header>

      <main className="flex-1 space-y-6 px-4 pt-4">
        <section className="rounded-3xl border border-destructive/40 bg-destructive/10 p-4">
          <div className="flex items-center gap-2">
            <LifeBuoy className="h-5 w-5 text-destructive" />
            <h2 className="font-display text-base font-extrabold">Feeling unsafe right now?</h2>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Leave first, sort it out after. These work without telling anyone at the event.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-destructive font-display text-sm font-bold text-destructive-foreground">
              <PhoneCall className="h-4 w-4" /> Call 999
            </button>
            <button className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-card font-display text-sm font-bold">
              <MapPin className="h-4 w-4" /> Share my location
            </button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Sharing sends your live location to a connection you pick, for two hours.
          </p>
        </section>

        <Section icon={UserCheck} title="Before you go">
          <Rule text="Tell one person where you're going — the share sheet on any event does this in a tap." />
          <Rule text="Meet in the venue, not outside it. Every listing shows the exact door." />
          <Rule text="Nobody can message you until you both agree to connect." />
          <Rule text="Organisers only ever see your first name and your ticket." />
        </Section>

        <Section icon={Ban} title={`Blocked people (${blocked.length})`}>
          {blocked.length === 0 ? (
            <p className="px-1 py-2 text-xs text-muted-foreground">
              You haven't blocked anyone. Blocking is silent — they're never told.
            </p>
          ) : (
            blocked.map((p) => (
              <div key={p!.id} className="flex items-center gap-3 rounded-2xl bg-secondary/40 p-3">
                <Avatar person={p!} size="sm" />
                <div className="flex-1">
                  <p className="text-sm font-bold">{p!.name}</p>
                  <p className="text-[11px] text-muted-foreground">Can't see you or message you</p>
                </div>
                <button
                  onClick={() => unblockPerson(p!.id)}
                  className="rounded-full bg-secondary px-3 py-1.5 text-[11px] font-bold"
                >
                  Unblock
                </button>
              </div>
            ))
          )}
        </Section>

        <Section icon={FileWarning} title={`Your reports (${reports.length})`}>
          {reports.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No reports"
              body="If someone makes you uncomfortable, report them from their profile. It's confidential and we review within 24 hours."
              className="py-6"
            />
          ) : (
            reports.map((r) => (
              <div key={r.id} className="rounded-2xl bg-secondary/40 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold">{r.targetName}</p>
                  <span
                    className={
                      r.status === "actioned"
                        ? "rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent"
                        : "rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground"
                    }
                  >
                    {r.status === "actioned" ? "Actioned" : "Reviewing"}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {r.reason} · {r.when}
                </p>
                {r.detail && <p className="mt-1 text-xs leading-relaxed">{r.detail}</p>}
              </div>
            ))
          )}
        </Section>

        <Link
          to="/privacy"
          className="flex h-14 items-center justify-center rounded-2xl border border-border bg-card font-display text-sm font-bold"
        >
          Privacy controls
        </Link>
      </main>
      <BottomNav />
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Ban;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="font-display text-sm font-extrabold uppercase tracking-wider">{title}</h2>
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

function Rule({ text }: { text: string }) {
  return (
    <p className="rounded-2xl bg-secondary/40 px-4 py-3 text-xs leading-relaxed">{text}</p>
  );
}
