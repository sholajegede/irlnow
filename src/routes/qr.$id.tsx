import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Copy, QrCode as QrIcon, Share2, Smartphone } from "lucide-react";
import { useState } from "react";
import { QrCode } from "@/components/QrCode";
import { getEvent } from "@/lib/data";

export const Route = createFileRoute("/qr/$id")({
  head: () => ({
    meta: [
      { title: "Event QR — IRL NOW" },
      {
        name: "description",
        content: "Share this QR at the door so guests can check in and add photos without an app.",
      },
      { property: "og:title", content: "Event QR — IRL NOW" },
      { property: "og:description", content: "One scan gets guests into the live event wall." },
    ],
  }),
  component: EventQrPage,
});

function EventQrPage() {
  const { id } = Route.useParams();
  const event = getEvent(id);
  const [copied, setCopied] = useState(false);
  const link = `irlnow.app/e/${id}`;

  if (!event) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6 text-center">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Event not found</h1>
          <Link to="/" className="mt-4 inline-block text-sm font-bold text-primary">
            Go to Discover
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
        <Link
          to="/event/$id"
          params={{ id }}
          aria-label="Back to event"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display text-lg font-extrabold">Event QR</h1>
      </header>

      <main className="flex flex-col gap-6 p-6">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-accent">
            <QrIcon className="h-4 w-4" /> Door code
          </p>
          <h2 className="mt-1 font-display text-2xl font-extrabold leading-tight">{event.title}</h2>
          <p className="text-sm text-muted-foreground">
            {event.dateLabel} · {event.location}
          </p>
        </div>

        <div className="mx-auto w-full max-w-[280px]">
          <QrCode value={link} />
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Guests scan, add their first name and they're in the live wall — no download, no account.
        </p>

        <div className="flex gap-2">
          <button
            onClick={() => {
              navigator.clipboard?.writeText(`https://${link}`).catch(() => {});
              setCopied(true);
              setTimeout(() => setCopied(false), 1600);
            }}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-secondary text-sm font-bold text-secondary-foreground"
          >
            <Copy className="h-4 w-4" /> {copied ? "Copied" : "Copy link"}
          </button>
          <button className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-secondary text-sm font-bold text-secondary-foreground">
            <Share2 className="h-4 w-4" /> Share
          </button>
        </div>

        <Link
          to="/e/$id"
          params={{ id }}
          className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-brand font-display text-base font-bold text-primary-foreground shadow-glow transition-transform active:scale-[0.98]"
        >
          <Smartphone className="h-5 w-5" /> Preview the guest experience
        </Link>
      </main>
    </div>
  );
}
