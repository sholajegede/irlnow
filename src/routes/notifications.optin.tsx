import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, BellRing, Check, ChevronRight, ShieldCheck, Timer } from "lucide-react";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

const SAMPLES = [
  {
    id: "s1",
    time: "in 2 hours",
    title: "Golden Hour Rooftop Social starts at 18:30",
    body: "9 people going · 12 min walk. Leave by 18:10.",
  },
  {
    id: "s2",
    time: "now",
    title: "Venue change — Golden Hour Rooftop",
    body: "Rain moved us indoors: same building, ground floor bar.",
    urgent: true,
  },
  {
    id: "s3",
    time: "9:12",
    title: "42 photos from last night are up",
    body: "You're in 6 of them. Claim yourself to unblur the wall.",
  },
];

const RETENTIONS = [7, 30, 90] as const;

export const Route = createFileRoute("/notifications/optin")({
  head: () => ({
    meta: [
      { title: "Turn on notifications — IRL NOW" },
      {
        name: "description",
        content:
          "See exactly what IRL NOW would send this device before you turn anything on, and choose how long alerts are kept.",
      },
      { property: "og:title", content: "Turn on notifications — IRL NOW" },
      {
        property: "og:description",
        content: "Preview every alert first, then decide. About four a week, all tied to real plans.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OptInPage,
});

function OptInPage() {
  const navigate = useNavigate();
  const { devicePush, setDevicePush, notifPrefs, updateNotifPrefs } = useApp();
  const [step, setStep] = useState<"preview" | "retention" | "done">(
    devicePush.decidedAt ? "retention" : "preview",
  );
  const [days, setDays] = useState<number>(devicePush.retentionDays);

  const decide = (optedIn: boolean) => {
    setDevicePush({
      optedIn,
      retentionDays: days,
      decidedAt: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    });
    setStep("done");
  };

  return (
    <div className="flex min-h-dvh flex-col pb-10">
      <header className="flex items-center gap-2 px-4 py-3">
        <button
          onClick={() => navigate({ to: "/notifications" })}
          aria-label="Back"
          className="rounded-full p-1.5 active:bg-secondary"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex flex-1 gap-1.5">
          {["preview", "retention", "done"].map((s, i) => (
            <span
              key={s}
              className={cn(
                "h-1 flex-1 rounded-full",
                ["preview", "retention", "done"].indexOf(step) >= i ? "bg-primary" : "bg-secondary",
              )}
            />
          ))}
        </div>
      </header>

      {step === "preview" && (
        <main className="flex-1 space-y-4 px-5 pt-2">
          <h1 className="font-display text-[1.9rem] font-extrabold leading-[1.05]">
            Here's exactly what you'd get.
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            About four a week, and every single one is tied to something real: an event you're going
            to, a host update, or your photos. No streak nags, no "someone liked this".
          </p>

          <div className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(160deg,#241a30,#0d0910)] p-4">
            <p className="text-center text-[11px] uppercase tracking-widest text-white/40">
              Friday 28 August
            </p>
            <p className="text-center font-display text-4xl font-extrabold text-white">18:04</p>
            <div className="mt-3 space-y-2">
              {SAMPLES.map((s) => (
                <div
                  key={s.id}
                  className={cn(
                    "rounded-2xl bg-white/12 p-3 backdrop-blur-xl",
                    s.urgent && "ring-1 ring-primary",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-brand text-[9px] font-extrabold text-primary-foreground">
                      IRL
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                      IRL NOW
                    </span>
                    <span className="ml-auto text-[11px] text-white/50">{s.time}</span>
                  </div>
                  <p className="mt-1 text-sm font-bold leading-snug text-white">{s.title}</p>
                  <p className="text-xs leading-snug text-white/70">{s.body}</p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setStep("retention")}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-brand font-display text-base font-extrabold text-primary-foreground shadow-glow"
          >
            Looks fair — next <ChevronRight className="h-5 w-5" />
          </button>
          <Link
            to="/notifications"
            className="block text-center text-xs font-bold text-muted-foreground"
          >
            Not now
          </Link>
        </main>
      )}

      {step === "retention" && (
        <main className="flex-1 space-y-4 px-5 pt-2">
          <h1 className="font-display text-[1.9rem] font-extrabold leading-[1.05]">
            How long should this device keep them?
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Delivered notifications sit in your notification centre until they age out. This is per
            device — your other devices keep their own setting.
          </p>

          <div className="grid grid-cols-3 gap-2">
            {RETENTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={cn(
                  "rounded-2xl border p-3 text-center",
                  days === d ? "border-primary bg-primary/10" : "border-border bg-card",
                )}
              >
                <span className="block font-display text-xl font-extrabold">{d}</span>
                <span className="block text-[11px] text-muted-foreground">days</span>
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {[
              { k: "eventReminders" as const, t: "Event reminders", s: "Two hours before, once" },
              { k: "walls" as const, t: "Memory walls", s: "When the morning-after photos land" },
              { k: "connections" as const, t: "People you met", s: "Only from events you both went to" },
              { k: "messages" as const, t: "Messages", s: "Group chats and DMs" },
            ].map((row) => (
              <button
                key={row.k}
                onClick={() => updateNotifPrefs({ [row.k]: !notifPrefs[row.k] })}
                className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold">{row.t}</span>
                  <span className="block text-[11px] text-muted-foreground">{row.s}</span>
                </span>
                <span
                  className={cn(
                    "flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 transition-colors",
                    notifPrefs[row.k] ? "bg-primary" : "bg-secondary",
                  )}
                >
                  <span
                    className={cn(
                      "h-5 w-5 rounded-full bg-background transition-transform",
                      notifPrefs[row.k] && "translate-x-5",
                    )}
                  />
                </span>
              </button>
            ))}
          </div>

          <p className="flex items-start gap-2 rounded-2xl border border-border/60 bg-secondary/40 p-3 text-[11px] leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            We never send location, who you're with, or anything from a wall you haven't claimed.
          </p>

          <button
            onClick={() => decide(true)}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-brand font-display text-base font-extrabold text-primary-foreground shadow-glow"
          >
            <BellRing className="h-5 w-5" /> Turn on notifications
          </button>
          <button
            onClick={() => decide(false)}
            className="w-full text-center text-xs font-bold text-muted-foreground"
          >
            Keep them off for now
          </button>
        </main>
      )}

      {step === "done" && (
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-brand shadow-glow">
            {devicePush.optedIn ? (
              <Check className="h-8 w-8 text-primary-foreground" strokeWidth={3} />
            ) : (
              <Timer className="h-8 w-8 text-primary-foreground" />
            )}
          </span>
          <h1 className="font-display text-3xl font-extrabold leading-tight">
            {devicePush.optedIn ? "You're set." : "Nothing will buzz."}
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {devicePush.optedIn
              ? `This device will get about four alerts a week and keep each one for ${devicePush.retentionDays} days.`
              : "You'll still see everything in the app — we just won't push it to this device."}
          </p>
          <Link
            to="/notifications/retention"
            className="mt-2 flex h-13 w-full max-w-xs items-center justify-center rounded-2xl bg-gradient-brand py-3.5 font-display text-base font-bold text-primary-foreground shadow-glow"
          >
            Fine-tune retention
          </Link>
          <Link to="/notifications" className="text-xs font-bold text-primary">
            Back to notifications
          </Link>
        </main>
      )}
    </div>
  );
}
