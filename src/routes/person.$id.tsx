import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { ConnectButton } from "@/components/ConnectButton";
import { ReportSheet } from "@/components/ReportSheet";
import { Avatar } from "@/components/Avatar";
import { events, getPerson, interests as allInterests } from "@/lib/data";
import { useApp, useConnectionState } from "@/lib/store";

export const Route = createFileRoute("/person/$id")({
  loader: ({ params }) => {
    const person = getPerson(params.id);
    if (!person) throw notFound();
    return { person };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Profile unavailable — IRL NOW" }, { name: "robots", content: "noindex" }],
      };
    }
    const { person } = loaderData;
    return {
      meta: [
        { title: `${person.name} — IRL NOW` },
        { name: "description", content: person.bio },
        { property: "og:title", content: `${person.name} on IRL NOW` },
        { property: "og:description", content: person.bio },
      ],
    };
  },
  component: PersonProfile,
});

function PersonProfile() {
  const { person } = Route.useLoaderData();
  const { blockedIds } = useApp();
  const state = useConnectionState(person.id);
  const connected = state === "connected";
  const [reporting, setReporting] = useState(false);
  const blocked = blockedIds.includes(person.id);
  const theirEvents = events.filter((e) => e.going.includes(person.id));

  return (
    <div className="flex min-h-dvh flex-col pb-10">
      <div className="flex items-center justify-between p-4">
        <Link
          to="/connections"
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <button
          onClick={() => setReporting(true)}
          aria-label="Report or block"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground"
        >
          <ShieldAlert className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-col items-center gap-3 px-6 text-center">
        <Avatar person={person} size="xl" />
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">{person.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{person.bio}</p>
        </div>
        <div className="rounded-full bg-accent/15 px-4 py-1.5 text-xs font-bold text-accent">
          {person.reason}
        </div>
        {person.goingSolo && (
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
            🙋 Going solo — open to meeting people
          </span>
        )}
        <div className="mt-2 w-full">
          <ConnectButton person={person} />
        </div>
        {connected && (
          <p className="text-xs text-muted-foreground">
            You're connected — messages are open. Say hi, or plan something together.
          </p>
        )}
        {state === "requested" && (
          <p className="text-xs text-muted-foreground">
            Request sent. {person.name} decides — nobody can message you without agreeing first.
          </p>
        )}
        {state === "incoming" && (
          <p className="text-xs text-muted-foreground">
            {person.name} asked to connect after an event you were both at.
          </p>
        )}
        {blocked && (
          <p className="text-xs text-destructive">
            You blocked {person.name}. Unblock them from Privacy & safety.
          </p>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-6 px-5">
        <section>
          <h2 className="font-display text-lg font-extrabold">Into</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {person.interests.map((i) => {
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
          </div>
        </section>

        <section>
          <h2 className="font-display text-lg font-extrabold">Going to</h2>
          <div className="mt-2 flex flex-col gap-2">
            {theirEvents.map((e) => (
              <Link
                key={e.id}
                to="/event/$id"
                params={{ id: e.id }}
                className="flex items-center justify-between rounded-2xl border border-border bg-card p-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{e.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.dateLabel} · {e.area}
                  </p>
                </div>
              </Link>
            ))}
            {theirEvents.length === 0 && (
              <p className="text-sm text-muted-foreground">No public plans right now.</p>
            )}
          </div>
        </section>

        <p className="text-center text-xs text-muted-foreground">
          {person.mutuals > 0
            ? `${person.mutuals} mutual connections`
            : "No mutual connections yet"}{" "}
          · Contact details are never shown
        </p>
      </div>
      <ReportSheet person={person} open={reporting} onClose={() => setReporting(false)} />
    </div>
  );
}
