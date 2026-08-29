import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bell,
  Bookmark,
  Crown,
  Gift,
  LifeBuoy,
  ChevronRight,
  HelpCircle,
  History,
  Images,
  LayoutDashboard,
  MessageCircle,
  Settings,
  Shield,
  ShieldAlert,
  Sparkles,
  Store,
  Users,
  Wallet,
} from "lucide-react";
import { StreakCard } from "@/components/StreakCard";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { Avatar } from "@/components/Avatar";
import { events, interests as allInterests, people } from "@/lib/data";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/you")({
  head: () => ({
    meta: [
      { title: "Your profile — IRL NOW" },
      {
        name: "description",
        content:
          "Your interests, upcoming plans, connections, memories and privacy controls in one place.",
      },
      { property: "og:title", content: "Your profile — IRL NOW" },
      { property: "og:description", content: "Interests, plans, connections and memories." },
    ],
  }),
  component: YouPage,
});

function YouPage() {
  const {
    name,
    onboarded,
    interests,
    goingIds,
    connectedIds,
    createdEvents,
    city,
    savedIds,
    incomingRequests,
    myPlans,
    session,
  } = useApp();
  const going = events.filter((e) => goingIds.includes(e.id));
  const connections = people.filter((p) => connectedIds.includes(p.id));

  if (!onboarded) {
    return (
      <div className="flex min-h-dvh flex-col pb-24">
        <AppHeader title="You" />
        <div className="mt-20 flex flex-col items-center gap-3 px-8 text-center">
          <Sparkles className="h-10 w-10 text-primary" />
          <h2 className="font-display text-2xl font-extrabold">Make it yours</h2>
          <p className="text-sm text-muted-foreground">
            Tell us what you're into and we'll show you people and plans that actually fit.
          </p>
          <Link
            to="/onboard"
            className="mt-3 rounded-2xl bg-gradient-brand px-6 py-3.5 font-display font-bold text-primary-foreground shadow-glow"
          >
            Set up your profile
          </Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col pb-24">
      <AppHeader title="You" />
      <main className="flex flex-col gap-6 p-4">
        <section className="flex items-center gap-4">
          <Avatar person={{ name, avatar: 3 }} size="xl" />
          <div>
            <h1 className="font-display text-2xl font-extrabold">{name}</h1>
            <p className="text-sm text-muted-foreground">{city}</p>
            <Link to="/onboard" className="mt-1 inline-block text-xs font-bold text-primary">
              Edit profile
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-3 gap-2">
          <Stat value={going.length} label="Going" />
          <Stat value={connections.length} label="Connections" />
          <Stat value={createdEvents.length} label="Hosting" />
        </section>

        <StreakCard />

        <section>
          <h2 className="font-display text-lg font-extrabold">Your interests</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {interests.map((i) => {
              const meta = allInterests.find((x) => x.id === i);
              return (
                <span
                  key={i}
                  className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold"
                >
                  {meta?.emoji} {meta?.label}
                </span>
              );
            })}
            {interests.length === 0 && (
              <p className="text-sm text-muted-foreground">No interests picked yet.</p>
            )}
          </div>
        </section>

        {createdEvents.length > 0 && (
          <section>
            <h2 className="font-display text-lg font-extrabold">Events you're hosting</h2>
            <div className="mt-2 flex flex-col gap-2">
              {createdEvents.map((e) => (
                <div key={e.id} className="rounded-2xl border border-border bg-card p-4">
                  <p className="font-display font-bold">{e.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.date} · {e.time} · {e.location}
                  </p>
                  <p className="mt-2 text-xs text-accent">
                    0 of {e.capacity} guests · {e.isPublic ? "Public" : "Private"} · {e.price}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="flex flex-col gap-1.5">
          <Row
            to="/wallet"
            icon={Wallet}
            label="Wallet & receipts"
            hint="Cards, tickets, refunds"
          />
          <Row to="/membership" icon={Crown} label="IRL NOW+" hint="Early access, no fees" />
          <Row
            to="/plans"
            icon={Users}
            label="Plans"
            hint={myPlans.length ? `${myPlans.length} yours` : "Bring people"}
          />
          <Row to="/host" icon={LayoutDashboard} label="Organiser workspace" hint="2 events" />
          <Row to="/venue" icon={Store} label="Venue portal" hint="Fill empty capacity" />
          <Row to="/admin" icon={ShieldAlert} label="Platform admin" hint="Internal" />
          <Row
            to="/connections"
            icon={Users}
            label="Connections"
            hint={
              incomingRequests.length
                ? `${incomingRequests.length} requests`
                : `${connections.length} people`
            }
          />
          <Row to="/messages" icon={MessageCircle} label="Messages" hint="Chats & DMs" />
          <Row to="/notifications" icon={Bell} label="Notifications" hint="Events & people only" />
          <Row to="/saved" icon={Bookmark} label="Saved" hint={`${savedIds.length} plans`} />
          <Row to="/memories" icon={Images} label="My memories" hint="9 photos" />
          <Row
            to="/archive"
            icon={History}
            label="Memory archive"
            hint="Your year, month by month"
          />

          <Row to="/invite" icon={Gift} label="Invite friends" hint="3 friends = a free month" />
          <Row to="/safety" icon={LifeBuoy} label="Safety centre" hint="Blocks, reports, help" />
          <Row to="/privacy" icon={Shield} label="Privacy & safety" hint="Who sees you" />
          <Row
            to="/settings"
            icon={Settings}
            label="Account settings"
            hint={session ? session.handle : "Not signed in"}
          />
          <RowStatic icon={HelpCircle} label="Help & support" />
        </section>
      </main>
      <BottomNav />
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 text-center">
      <p className="font-display text-2xl font-extrabold">{value}</p>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

type IconType = React.ComponentType<{ className?: string }>;

function Row({
  to,
  icon: Icon,
  label,
  hint,
}: {
  to: string;
  icon: IconType;
  label: string;
  hint?: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5"
    >
      <Icon className="h-4 w-4 text-primary" />
      <span className="flex-1 text-sm font-semibold">{label}</span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}

function RowStatic({ icon: Icon, label, hint }: { icon: IconType; label: string; hint?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5">
      <Icon className="h-4 w-4 text-primary" />
      <span className="flex-1 text-sm font-semibold">{label}</span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}
