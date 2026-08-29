import { useMemo, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  BadgeCheck,
  Camera,
  Clock,
  Download,
  Eye,
  Heart,
  Megaphone,
  MessageCircle,
  QrCode,
  ScanLine,
  Search,
  Send,
  Banknote,
  Users,
} from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { feeFor, money, priceToPence, questionsFor, tiersFor } from "@/lib/tickets";
import { BottomNav } from "@/components/BottomNav";
import {
  eventCovers,
  getEvent,
  guestList,
  hostNotes,
  memoryMedia,
  trafficFor,
  type Guest,
  type GuestStatus,
  type IrlEvent,
} from "@/lib/data";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/host/$id")({
  loader: ({ params }) => {
    const event = getEvent(params.id);
    if (!event) throw notFound();
    return { event };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Event unavailable | IRL NOW" }, { name: "robots", content: "noindex" }],
      };
    }
    const t = `Manage ${loaderData.event.title} | IRL NOW`;
    return {
      meta: [
        { title: t },
        {
          name: "description",
          content: `Guest list, live check-ins, door QR and recap tools for ${loaderData.event.title}.`,
        },
        { property: "og:title", content: t },
        { property: "og:description", content: "Run the whole event from one screen." },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: HostEvent,
});

type Tab = "overview" | "guests" | "money" | "live" | "recap";
const tabs: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "guests", label: "Guests" },
  { id: "money", label: "Money" },
  { id: "live", label: "Live" },
  { id: "recap", label: "Recap" },
];

const statusStyles: Record<GuestStatus, string> = {
  "checked-in": "bg-accent/15 text-accent",
  going: "bg-secondary text-secondary-foreground",
  waitlist: "bg-primary/15 text-primary",
  declined: "bg-muted text-muted-foreground",
};

function HostEvent() {
  const { event } = Route.useLoaderData();
  const { uploads } = useApp();
  const [tab, setTab] = useState<Tab>("overview");
  const [query, setQuery] = useState("");
  const [manual, setManual] = useState<string[]>([]);
  const [broadcast, setBroadcast] = useState("");
  const [sent, setSent] = useState(false);

  const guests = useMemo(() => guestList(event.id, Math.min(event.goingCount, 40)), [event.id]);
  const checkedIn = guests.filter((g) => g.status === "checked-in").length + manual.length;
  const waitlist = guests.filter((g) => g.status === "waitlist");
  const traffic = trafficFor(event.id);
  const guestUploads = uploads[event.id] ?? [];
  const wall = [...guestUploads.map((u) => u.cover), ...memoryMedia].slice(0, 9);

  const attended = Math.round(event.goingCount * (checkedIn / guests.length));

  const filtered = guests.filter((g) => g.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="flex min-h-dvh flex-col pb-24">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link
            to="/host"
            aria-label="Back to workspace"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate font-display text-lg font-extrabold leading-tight">
              {event.title}
            </h1>
            <p className="text-xs text-muted-foreground">
              {event.dateLabel} · {event.area}
            </p>
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto px-3 pb-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "h-9 shrink-0 rounded-full px-4 text-xs font-bold transition-colors",
                tab === t.id
                  ? "bg-gradient-brand text-primary-foreground"
                  : "bg-secondary text-secondary-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="flex flex-col gap-5 p-4">
        {tab === "overview" && (
          <>
            <div className="grid grid-cols-3 gap-2">
              <Metric icon={BadgeCheck} value={String(checkedIn)} label="Checked in" accent />
              <Metric icon={Users} value={String(event.goingCount)} label="Going" />
              <Metric icon={Clock} value={String(waitlist.length)} label="Waitlist" />
            </div>

            <section className="rounded-3xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-extrabold">Capacity</h2>
                <p className="text-xs text-muted-foreground">{event.goingCount} / 120</p>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-brand"
                  style={{ width: `${Math.min(100, (event.goingCount / 120) * 100)}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Filling faster than {Math.round(60 + event.goingCount / 4)}% of events in{" "}
                {event.area}.
              </p>
            </section>

            <section className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-5">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                <h2 className="font-display text-lg font-extrabold">Where guests came from</h2>
              </div>
              {traffic.map((row) => (
                <div key={row.label} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold">{row.label}</span>
                    <span className="text-muted-foreground">
                      {row.views.toLocaleString()} views · {row.going} going
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${(row.going / 60) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </section>

            <section className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-5">
              <div className="flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-primary" />
                <h2 className="font-display text-lg font-extrabold">Message everyone going</h2>
              </div>
              <textarea
                value={broadcast}
                onChange={(e) => {
                  setBroadcast(e.target.value);
                  setSent(false);
                }}
                rows={3}
                placeholder="Doors move to 7pm — come early, the sunset is the whole point."
                className="w-full resize-none rounded-2xl border border-border bg-secondary p-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
              />
              <button
                onClick={() => broadcast.trim() && setSent(true)}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-brand text-sm font-bold text-primary-foreground disabled:opacity-40"
                disabled={!broadcast.trim()}
              >
                <Send className="h-4 w-4" />{" "}
                {sent ? "Sent to all guests" : `Send to ${event.goingCount} guests`}
              </button>
            </section>

            <Link
              to="/door/$id"
              params={{ id: event.id }}
              className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-brand font-display text-base font-extrabold text-primary-foreground shadow-glow"
            >
              <ScanLine className="h-5 w-5" /> Open door mode
            </Link>

            <Link
              to="/host/message/$id"
              params={{ id: event.id }}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-secondary text-sm font-bold"
            >
              Message everyone going
            </Link>

            <Link
              to="/host/edit/$id"
              params={{ id: event.id }}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-card text-sm font-bold"
            >
              Edit, message or cancel
            </Link>

            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/qr/$id"
                params={{ id: event.id }}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-secondary text-sm font-bold text-secondary-foreground"
              >
                <QrCode className="h-4 w-4" /> Door QR
              </Link>
              <Link
                to="/e/$id"
                params={{ id: event.id }}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-secondary text-sm font-bold text-secondary-foreground"
              >
                <Eye className="h-4 w-4" /> Guest view
              </Link>
            </div>
          </>
        )}

        {tab === "guests" && (
          <>
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search the guest list"
                className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {checkedIn} checked in · {filtered.length} shown. Tap a guest to check them in at the
              door.
            </p>
            <div className="flex flex-col gap-2">
              {filtered.map((g) => (
                <GuestRow
                  key={g.id}
                  guest={g}
                  manual={manual.includes(g.id)}
                  onToggle={() =>
                    setManual((prev) =>
                      prev.includes(g.id) ? prev.filter((x) => x !== g.id) : [...prev, g.id],
                    )
                  }
                />
              ))}
            </div>
            <button className="flex h-11 items-center justify-center gap-2 rounded-xl bg-secondary text-sm font-bold text-secondary-foreground">
              <Download className="h-4 w-4" /> Export guest list
            </button>
          </>
        )}

        {tab === "live" && (
          <>
            <div className="flex items-center gap-2 rounded-2xl border border-accent/40 bg-accent/10 p-4">
              <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
              <p className="text-sm font-semibold">
                Live now · {checkedIn} in the room · {wall.length} photos on the wall
              </p>
            </div>

            <section>
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-primary" />
                <h2 className="font-display text-lg font-extrabold">Event wall</h2>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-1.5">
                {wall.map((cover, i) => (
                  <img
                    key={`${cover}-${i}`}
                    src={eventCovers[cover as keyof typeof eventCovers]}
                    alt={`Guest photo ${i + 1} from ${event.title}`}
                    loading="lazy"
                    width={1024}
                    height={1280}
                    className="aspect-square w-full rounded-xl object-cover"
                  />
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Guests upload straight from the door QR — no app, no account. Hide anything you
                don't want on the wall.
              </p>
            </section>

            <section className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary" />
                <h2 className="font-display text-lg font-extrabold">Notes left for you</h2>
              </div>
              {hostNotes.map((n) => (
                <div key={n.id} className="flex gap-3 rounded-2xl border border-border bg-card p-4">
                  <Avatar person={{ name: n.from, avatar: n.avatar }} size="sm" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold">
                      {n.from} <span className="font-normal text-muted-foreground">· {n.time}</span>
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{n.text}</p>
                  </div>
                </div>
              ))}
            </section>
          </>
        )}

        {tab === "money" && (
          <MoneyTab event={event} sold={Math.max(6, Math.round(event.goingCount * 0.6))} />
        )}

        {tab === "recap" && (
          <>
            <section className="rounded-3xl border border-border bg-gradient-brand/10 p-5 text-center">
              <Heart className="mx-auto h-8 w-8 text-primary" />
              <h2 className="mt-2 font-display text-2xl font-extrabold">That one landed</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {attended} people showed up, stayed an average of 2h 40m, and{" "}
                {Math.round(attended * 0.42)} made a new connection they kept.
              </p>
            </section>

            <div className="grid grid-cols-2 gap-2">
              <Metric
                icon={BadgeCheck}
                value={`${Math.round((checkedIn / guests.length) * 100)}%`}
                label="Turnout"
                accent
              />
              <Metric icon={Camera} value={String(wall.length * 4)} label="Photos shared" />
              <Metric
                icon={Users}
                value={String(Math.round(attended * 0.42))}
                label="New connections"
              />
              <Metric icon={Heart} value="4.8" label="Guest rating" />
            </div>

            <section className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-5">
              <h2 className="font-display text-lg font-extrabold">Do this next time</h2>
              <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                <li>· 38% of guests arrived in the first 20 minutes — open the bar earlier.</li>
                <li>· Solo attendees rated the event highest. Keep the welcome table.</li>
                <li>· 62 people saved but didn't come. A nudge 3 hours before converts ~1 in 5.</li>
              </ul>
              <Link
                to="/memories"
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-brand text-sm font-bold text-primary-foreground"
              >
                Send the recap to guests
              </Link>
            </section>
          </>
        )}
      </main>
      <BottomNav />
    </div>
  );
}

function GuestRow({
  guest,
  manual,
  onToggle,
}: {
  guest: Guest;
  manual: boolean;
  onToggle: () => void;
}) {
  const status: GuestStatus = manual ? "checked-in" : guest.status;
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition-transform active:scale-[0.99]"
    >
      <Avatar person={{ name: guest.name, avatar: guest.avatar }} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">
          {guest.name}
          {guest.plusOnes > 0 && <span className="text-muted-foreground"> +{guest.plusOnes}</span>}
        </p>
        <p className="text-[11px] text-muted-foreground">via {guest.source}</p>
      </div>
      <span
        className={cn(
          "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
          statusStyles[status],
        )}
      >
        {status === "checked-in" ? "In" : status}
      </span>
    </button>
  );
}

function Metric({
  icon: Icon,
  value,
  label,
  accent,
}: {
  icon: typeof Users;
  value: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 text-center">
      <Icon className={cn("mx-auto h-4 w-4", accent ? "text-accent" : "text-primary")} />
      <p className="mt-1 font-display text-xl font-extrabold leading-none">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function MoneyTab({ event, sold }: { event: IrlEvent; sold: number }) {
  const price = priceToPence(event.price);
  const tiers = tiersFor(event);
  const gross = sold * price;
  const fees = feeFor(gross);

  if (price === 0) {
    return (
      <section className="rounded-3xl border border-border bg-card p-5 text-center">
        <Banknote className="mx-auto h-8 w-8 text-accent" />
        <h2 className="mt-2 font-display text-xl font-extrabold">This one's free</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Free events cost you nothing. If you start charging, it's 5% + 40p a ticket and the money
          lands three working days after the event.
        </p>
        <Link
          to="/host/payouts"
          className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-secondary px-5 text-sm font-bold"
        >
          See payouts & fees
        </Link>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-3xl border border-accent/30 bg-accent/10 p-5">
        <p className="text-[11px] font-bold uppercase tracking-widest text-accent">
          You'll receive
        </p>
        <p className="mt-1 font-display text-4xl font-extrabold">{money(gross - fees)}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {sold} tickets · {money(gross)} taken · {money(fees)} fees
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-lg font-extrabold">Ticket tiers</h2>
        {tiers.map((t) => {
          const share = t.id === "standard" ? 0.7 : t.id === "plus-one" ? 0.22 : 0.08;
          const count = Math.max(1, Math.round(sold * share));
          return (
            <div key={t.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="font-display font-bold">{t.name}</p>
                <p className="font-display font-bold text-accent">{money(t.price)}</p>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{t.blurb}</p>
              <p className="mt-2 text-xs font-semibold">
                {count} sold · {t.left} left
              </p>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-gradient-brand"
                  style={{ width: `${share * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </section>

      <section className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4">
        <h2 className="font-display font-bold">What guests told you</h2>
        {questionsFor(event).map((q, i) => (
          <div key={q.id} className="rounded-xl bg-secondary px-3 py-2.5">
            <p className="text-xs font-bold">{q.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {q.options
                ? q.options
                    .map(
                      (o, j) =>
                        `${o} ${Math.max(1, Math.round((sold * (j === 0 ? 0.5 : 0.25)) / (i + 1)))}`,
                    )
                    .join(" · ")
                : `${Math.round(sold * 0.3)} people left a note — read them before you shop`}
            </p>
          </div>
        ))}
      </section>

      <Link
        to="/host/payouts"
        className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-secondary font-display font-bold"
      >
        <Banknote className="h-4 w-4" /> Payouts & fees
      </Link>
    </div>
  );
}
