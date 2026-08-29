import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, CalendarClock, MapPin, MessagesSquare, Ticket as TicketIcon, Undo2 } from "lucide-react";
import { useState } from "react";
import { QrCode } from "@/components/QrCode";
import { AddToCalendar } from "@/components/AddToCalendar";
import { TicketShare } from "@/components/TicketShare";
import { eventCovers, getEvent } from "@/lib/data";
import { useApp } from "@/lib/store";
import { money, ticketCode } from "@/lib/tickets";

export const Route = createFileRoute("/ticket/$id")({
  loader: ({ params }) => {
    const event = getEvent(params.id);
    if (!event) throw notFound();
    return { event };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Ticket unavailable | IRL NOW" }, { name: "robots", content: "noindex" }] };
    }
    const t = `Your ticket — ${loaderData.event.title} | IRL NOW`;
    return {
      meta: [
        { title: t },
        {
          name: "description",
          content: `Door QR, code and details for ${loaderData.event.title}. Show it on the night.`,
        },
        { property: "og:title", content: t },
        { property: "og:description", content: "Your spot is held." },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  component: TicketPage,
});

function TicketPage() {
  const { event } = Route.useLoaderData();
  const { orders, name, refundOrder } = useApp();
  const order = orders[event.id];
  const [refunded, setRefunded] = useState(false);
  const code = order?.code ?? ticketCode(event.id);

  if (refunded) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
        <Undo2 className="h-10 w-10 text-accent" />
        <h1 className="font-display text-2xl font-bold">Refunded</h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          {money(order?.total ?? 0)} is on its way back to your card, booking fee included. Your spot has
          gone to the next person on the waitlist.
        </p>
        <Link to="/going" className="mt-2 text-sm font-bold text-primary">
          Back to your agenda
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background pb-16">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Link
          to="/going"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border"
          aria-label="Back to agenda"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display text-lg font-bold">Your ticket</h1>
      </header>

      <div className="space-y-4 p-4">
        <div className="overflow-hidden rounded-3xl border border-border bg-card">
          <div className="relative h-32">
            <img src={eventCovers[event.cover]} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4">
              <p className="font-display text-xl font-bold leading-tight">{event.title}</p>
              <p className="text-xs text-muted-foreground">{event.host} · {event.area}</p>
            </div>
          </div>

          <div className="flex items-center justify-center border-y border-dashed border-border bg-background/40 py-5">
            <QrCode value={`irlnow.app/t/${event.id}/${code}`} className="h-44 w-44" />
          </div>

          <div className="space-y-3 p-4">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Door code</p>
              <p className="font-display text-2xl font-bold tracking-[0.1em] text-primary">{code}</p>
            </div>
            <Detail icon={CalendarClock} label={event.dateLabel} />
            <Detail icon={MapPin} label={event.location} />
            <Detail icon={TicketIcon} label={`${order?.tierName ?? "Standard entry"} × ${order?.qty ?? 1}`} />
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-sm text-muted-foreground">
                {order ? "Paid" : "Reserved"} {order?.purchasedAt ? `· ${order.purchasedAt}` : ""}
              </span>
              <span className="font-display text-lg font-bold">{money(order?.total ?? 0)}</span>
            </div>
          </div>
        </div>

        {order && Object.keys(order.answers).length > 0 && (
          <section className="space-y-2 rounded-2xl border border-border bg-card p-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
              What you told the host
            </h2>
            {Object.entries(order.answers).map(([k, v]) => (
              <p key={k} className="text-sm text-muted-foreground">
                <span className="text-foreground">{v}</span>
              </p>
            ))}
          </section>
        )}

        <TicketShare event={event} />

        <AddToCalendar eventId={event.id} className="h-12 w-full" />

        <Link
          to="/chat/$id"
          params={{ id: event.id }}
          className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-primary/40 bg-primary/10 font-display font-bold text-primary"
        >
          <MessagesSquare className="h-4 w-4" /> Group chat
        </Link>

        <button
          onClick={() => {
            refundOrder(event.id);
            setRefunded(true);
          }}
          className="h-11 w-full text-sm font-semibold text-muted-foreground"
        >
          Can't make it — refund my ticket
        </button>
      </div>
    </div>
  );
}

function Detail({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span>{label}</span>
    </div>
  );
}
