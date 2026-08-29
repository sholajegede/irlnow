import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Accessibility,
  ArrowLeft,
  Download,
  Globe,
  LogOut,
  Mail,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — IRL NOW" },
      {
        name: "description",
        content:
          "Account, language and units, accessibility options, data download and account deletion for IRL NOW.",
      },
      { property: "og:title", content: "Settings — IRL NOW" },
      { property: "og:description", content: "Your account, your data, your controls." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const { session, signOut, settings, updateSettings, name, email } = useApp();

  return (
    <div className="flex min-h-dvh flex-col pb-24">
      <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur-xl">
        <Link to="/you" aria-label="Back" className="rounded-full p-1.5 active:bg-secondary">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <p className="font-display text-lg font-extrabold tracking-tight">Settings</p>
      </header>

      <main className="flex-1 space-y-6 px-4 pt-4">
        <section className="rounded-3xl border border-border bg-card p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Account
          </p>
          <p className="mt-1 font-display text-lg font-extrabold">{name || "Guest"}</p>
          <p className="text-xs text-muted-foreground">
            {session ? `${session.handle} · joined ${session.joinedOn}` : email || "Not signed in"}
          </p>
          {session ? (
            <div className="mt-2 flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-bold text-accent">
              <ShieldCheck className="h-3.5 w-3.5" /> Verified · 18+ confirmed
            </div>
          ) : (
            <Link
              to="/auth"
              className="mt-3 flex h-11 items-center justify-center rounded-2xl bg-gradient-brand font-display text-sm font-bold text-primary-foreground"
            >
              Sign in
            </Link>
          )}
        </section>

        <Group icon={Globe} title="Region">
          <Choice
            label="Language"
            value={settings.language}
            options={["English (UK)", "English (US)", "Español", "Français"]}
            onChange={(language) => updateSettings({ language })}
          />
          <Choice
            label="Distance"
            value={settings.units}
            options={["metric", "imperial"]}
            labels={{ metric: "Kilometres", imperial: "Miles" }}
            onChange={(v) => updateSettings({ units: v as "metric" | "imperial" })}
          />
        </Group>

        <Group icon={Accessibility} title="Accessibility">
          <Toggle
            label="Reduce motion"
            hint="Turns off the swipe animations and auto-playing covers."
            value={settings.reducedMotion}
            onChange={(reducedMotion) => updateSettings({ reducedMotion })}
          />
          <Toggle
            label="High contrast"
            hint="Stronger text contrast over event photos."
            value={settings.highContrast}
            onChange={(highContrast) => updateSettings({ highContrast })}
          />
        </Group>

        <Group icon={Mail} title="Email">
          <Toggle
            label="Weekly digest"
            hint="One email a week with what your people are going to."
            value={settings.emailDigest}
            onChange={(emailDigest) => updateSettings({ emailDigest })}
          />
        </Group>

        <section className="flex flex-col gap-2">
          <Link
            to="/safety"
            className="flex h-13 items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 text-sm font-bold"
          >
            <ShieldCheck className="h-4 w-4 text-primary" /> Safety centre
          </Link>
          <button className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 text-left text-sm font-bold">
            <Download className="h-4 w-4 text-primary" /> Download my data
          </button>
          <button
            onClick={() => {
              signOut();
              navigate({ to: "/welcome" });
            }}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 text-left text-sm font-bold"
          >
            <LogOut className="h-4 w-4 text-primary" /> Sign out
          </button>
          <button className="flex items-center gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3.5 text-left text-sm font-bold text-destructive">
            <Trash2 className="h-4 w-4" /> Delete my account
          </button>
          <p className="px-1 text-[11px] leading-relaxed text-muted-foreground">
            Deleting removes your profile, your photos and your face tags within 30 days. Photos
            other people took stay on their walls unless you ask us to remove you from them.
          </p>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}

function Group({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Globe;
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

function Toggle({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      role="switch"
      aria-checked={value}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left"
    >
      <span className="flex-1">
        <span className="block text-sm font-bold">{label}</span>
        <span className="block text-[11px] text-muted-foreground">{hint}</span>
      </span>
      <span
        className={cn(
          "flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors",
          value ? "bg-primary" : "bg-secondary",
        )}
      >
        <span
          className={cn(
            "h-5 w-5 rounded-full bg-background transition-transform",
            value && "translate-x-5",
          )}
        />
      </span>
    </button>
  );
}

function Choice({
  label,
  value,
  options,
  labels,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  labels?: Record<string, string>;
  onChange: (v: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-sm font-bold">{label}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o)}
            className={cn(
              "rounded-full px-3 py-1.5 text-[11px] font-bold",
              value === o
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground",
            )}
          >
            {labels?.[o] ?? o}
          </button>
        ))}
      </div>
    </div>
  );
}
