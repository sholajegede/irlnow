import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Ban, Eye, Lock, ShieldCheck } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { BottomNav } from "@/components/BottomNav";
import { getPerson } from "@irlnow/domain";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy & safety — IRL NOW" },
      {
        name: "description",
        content:
          "Control who can see your plans, who can message you, whether you appear in event photos, and manage blocked people.",
      },
      { property: "og:title", content: "Privacy & safety — IRL NOW" },
      {
        property: "og:description",
        content: "You decide who sees your plans and who can reach you.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const {
    privacy,
    updatePrivacy,
    notifPrefs,
    updateNotifPrefs,
    blockedIds,
    unblockPerson,
    reportedIds,
  } = useApp();

  return (
    <div className="flex min-h-dvh flex-col pb-24">
      <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur-xl">
        <Link to="/you" aria-label="Back" className="rounded-full p-1.5 active:bg-secondary">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <p className="font-display text-lg font-extrabold tracking-tight">Privacy & safety</p>
          <p className="text-xs text-muted-foreground">Meeting strangers should feel safe</p>
        </div>
      </header>

      <main className="flex-1 space-y-6 px-4 pt-4">
        <div className="flex items-start gap-3 rounded-2xl border border-accent/30 bg-accent/10 p-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
          <p className="text-xs leading-relaxed">
            Your email, phone number and exact location are never shown to anyone. Nobody can
            message you until you both agree to connect.
          </p>
        </div>

        <Section icon={Eye} title="Who can see you">
          <Segmented
            label="Your profile is visible to"
            value={privacy.profileVisibility}
            onChange={(v) =>
              updatePrivacy({ profileVisibility: v as typeof privacy.profileVisibility })
            }
            options={[
              { value: "attendees", label: "People at my events" },
              { value: "connections", label: "Connections" },
              { value: "private", label: "Nobody" },
            ]}
          />
          <Toggle
            label="Show me on 'who's going'"
            hint="Turn off and you'll attend without appearing in the guest list."
            value={privacy.showGoing}
            onChange={(v) => updatePrivacy({ showGoing: v })}
          />
          <Toggle
            label="Let me be tagged in event photos"
            hint="Off means you're never matched to faces on an event wall."
            value={privacy.appearInPhotos}
            onChange={(v) => updatePrivacy({ appearInPhotos: v })}
          />
          <Toggle
            label="Approve tags before they appear"
            hint="Photos of you stay blurred to others until you say yes."
            value={privacy.tagApproval}
            onChange={(v) => updatePrivacy({ tagApproval: v })}
          />
          <Toggle
            label="Hide me from search"
            hint="People can only find you through an event you both went to."
            value={privacy.hideFromSearch}
            onChange={(v) => updatePrivacy({ hideFromSearch: v })}
          />
          <Segmented
            label="Location shown to others"
            value={privacy.locationPrecision}
            onChange={(v) =>
              updatePrivacy({ locationPrecision: v as typeof privacy.locationPrecision })
            }
            options={[
              { value: "exact", label: "Exact" },
              { value: "area", label: "Area only" },
              { value: "city", label: "City only" },
            ]}
          />
        </Section>

        <Section icon={Lock} title="Who can reach you">
          <Segmented
            label="Messages allowed from"
            value={privacy.allowMessagesFrom}
            onChange={(v) =>
              updatePrivacy({ allowMessagesFrom: v as typeof privacy.allowMessagesFrom })
            }
            options={[
              { value: "attendees", label: "Event chats + connections" },
              { value: "connections", label: "Connections only" },
              { value: "nobody", label: "Nobody" },
            ]}
          />
        </Section>

        <Section icon={ShieldCheck} title="Notifications">
          <Toggle
            label="Event reminders"
            value={notifPrefs.eventReminders}
            onChange={(v) => updateNotifPrefs({ eventReminders: v })}
          />
          <Toggle
            label="Morning-after walls"
            value={notifPrefs.walls}
            onChange={(v) => updateNotifPrefs({ walls: v })}
          />
          <Toggle
            label="Connection requests"
            value={notifPrefs.connections}
            onChange={(v) => updateNotifPrefs({ connections: v })}
          />
          <Toggle
            label="Messages"
            value={notifPrefs.messages}
            onChange={(v) => updateNotifPrefs({ messages: v })}
          />
          <Toggle
            label="Hosting suggestions"
            hint="Occasional nudges, like planning your birthday."
            value={notifPrefs.suggestions}
            onChange={(v) => updateNotifPrefs({ suggestions: v })}
          />
          <Toggle
            label="Birthday prompts"
            value={privacy.showBirthdayNudges}
            onChange={(v) => updatePrivacy({ showBirthdayNudges: v })}
          />
          <Toggle
            label="Quiet hours"
            hint="Nothing buzzes between 11pm and 8am, except a host cancelling."
            value={notifPrefs.quietHours}
            onChange={(v) => updateNotifPrefs({ quietHours: v })}
          />
        </Section>

        <Section icon={Ban} title="Blocked people">
          {blockedIds.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              You haven't blocked anyone.
            </p>
          ) : (
            <div className="space-y-2">
              {blockedIds.map((id) => {
                const person = getPerson(id);
                if (!person) return null;
                return (
                  <div
                    key={id}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
                  >
                    <Avatar person={person} />
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-sm font-bold">{person.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Can't message you or see your plans
                      </p>
                    </div>
                    <button
                      onClick={() => unblockPerson(id)}
                      className="h-9 rounded-xl bg-secondary px-3.5 font-display text-xs font-bold"
                    >
                      Unblock
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          {reportedIds.length > 0 && (
            <p className="text-center text-xs text-muted-foreground">
              {reportedIds.length} report{reportedIds.length > 1 ? "s" : ""} under review by our
              safety team.
            </p>
          )}
        </Section>

        <p className="pb-4 text-center text-xs leading-relaxed text-muted-foreground">
          At an event and something's wrong? Tap the shield on any profile or message to report it.
          We respond within 24 hours.
        </p>
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
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="flex items-center gap-2 pb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Toggle({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      role="switch"
      aria-checked={value}
      className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 text-left"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span>}
      </span>
      <span
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          value ? "bg-gradient-brand" : "bg-secondary",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-foreground transition-transform",
            value ? "translate-x-5.5" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}

function Segmented({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <p className="pb-2 text-sm font-semibold">{label}</p>
      <div className="flex flex-col gap-1.5">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-xl px-3.5 py-2.5 text-left text-xs font-semibold transition-colors",
              value === o.value
                ? "bg-primary/15 text-foreground ring-1 ring-primary"
                : "bg-secondary/50 text-muted-foreground",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
