import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Camera, MapPin, QrCode, Sparkles, Users } from "lucide-react";
import { AvatarStack } from "@/components/Avatar";
import { eventCovers, events, peopleByIds } from "@/lib/data";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "IRL NOW — What's on in London, and who's going" },
      {
        name: "description",
        content:
          "IRL NOW shows you a handful of real things happening near you in London, who's going, and how to get in. No infinite feed. No account needed to look.",
      },
      { property: "og:title", content: "IRL NOW — What's on in London, and who's going" },
      {
        property: "og:description",
        content:
          "A finite feed of real-world plans, the people going, and the photo wall the morning after. Get into real life.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WelcomePage,
});

const steps = [
  { icon: Sparkles, title: "See what's on", body: "Ten real plans in your city, day and night. Then the feed stops and tells you to go outside." },
  { icon: Users, title: "See who's going", body: "Shared interests, mutual friends, people going solo. Confidence before you commit." },
  { icon: QrCode, title: "Scan in at the door", body: "No app download, no ticket app. Just your first name and you're in." },
  { icon: Camera, title: "Wake up to the memories", body: "Every photo from everyone who was there, waiting for you the morning after." },
];

function WelcomePage() {
  const tonight = events.slice(0, 3);
  const hero = events[0]!;

  return (
    <div className="min-h-dvh bg-background pb-16">
      <header className="flex items-center justify-between px-5 py-4">
        <span className="font-display text-lg font-extrabold tracking-tight">
          IRL<span className="text-primary">·</span>NOW
        </span>
        <Link
          to="/auth"
          className="rounded-full border border-border px-4 py-1.5 text-xs font-bold text-foreground"
        >
          Open the app
        </Link>
      </header>

      <section className="relative mx-4 overflow-hidden rounded-3xl">
        <img
          src={eventCovers[hero.cover]}
          alt={`${hero.title} in ${hero.area}`}
          width={1024}
          height={1280}
          className="h-[68vh] w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-fade" />
        <div className="absolute inset-x-0 bottom-0 space-y-4 p-6">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-accent">
            <MapPin className="h-3.5 w-3.5" /> London · right now
          </p>
          <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight">
            Something is happening right now. You're just not there yet.
          </h1>
          <p className="text-sm font-medium text-foreground/85">
            IRL NOW is a social app with one job: get you out of the house and into a room with
            people. Finite feed, real plans, real faces.
          </p>
          <Link
            to="/auth"
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-brand py-4 font-display text-base font-bold text-primary-foreground shadow-glow active:scale-[0.98]"
          >
            See what's on in London <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="text-center text-xs text-muted-foreground">
            No account needed to look around.
          </p>
        </div>
      </section>

      <section className="px-5 pt-10">
        <h2 className="font-display text-2xl font-extrabold tracking-tight">Happening soon</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A preview — the full list is in the app.
        </p>
        <div className="mt-4 space-y-3">
          {tonight.map((e) => (
            <Link
              key={e.id}
              to="/x/$id"
              params={{ id: e.id }}
              className="flex gap-3 rounded-2xl border border-border bg-card p-3 active:scale-[0.99]"
            >
              <img
                src={eventCovers[e.cover]}
                alt={e.title}
                width={160}
                height={200}
                loading="lazy"
                className="h-20 w-16 shrink-0 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-base font-bold">{e.title}</p>
                <p className="text-xs text-muted-foreground">
                  {e.dateLabel} · {e.area} · {e.price}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <AvatarStack people={peopleByIds(e.going)} />
                  <span className="text-xs font-medium text-muted-foreground">
                    {e.goingCount} going
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-5 pt-10">
        <h2 className="font-display text-2xl font-extrabold tracking-tight">How it works</h2>
        <div className="mt-4 space-y-3">
          {steps.map((s, i) => (
            <div key={s.title} className="flex gap-3 rounded-2xl border border-border bg-card p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary">
                <s.icon className="h-4.5 w-4.5 text-primary" />
              </span>
              <div>
                <p className="font-display text-base font-bold">
                  <span className="text-muted-foreground">{i + 1}. </span>
                  {s.title}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-5 mt-10 rounded-3xl border border-border bg-card p-6 text-center">
        <p className="font-display text-2xl font-extrabold leading-tight tracking-tight">
          Anti-social-media social media.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          There is no endless scroll here. When you reach the end of the feed, the app tells you to
          put the phone down and go.
        </p>
        <Link
          to="/auth"
          className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-gradient-brand py-3.5 font-display text-base font-bold text-primary-foreground shadow-glow active:scale-[0.98]"
        >
          Get started — 30 seconds <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <footer className="px-5 pt-10 text-center text-xs text-muted-foreground">
        IRL NOW · London first · Get into real life.
      </footer>
    </div>
  );
}
