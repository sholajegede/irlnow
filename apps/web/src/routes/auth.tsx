import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Apple, Cake, Check, Chrome, Mail, Phone, ShieldCheck } from "lucide-react";
import {
  DEMO_CODE,
  ageFrom,
  formatPhone,
  isAdult,
  isValidHandle,
  todayLabel,
  type AuthMethod,
} from "@/lib/auth";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Create your account — IRL NOW" },
      {
        name: "description",
        content:
          "Sign in with your phone or email, confirm your code and your age, and start seeing who's going out near you.",
      },
      { property: "og:title", content: "Create your account — IRL NOW" },
      { property: "og:description", content: "Phone or email. Takes about twenty seconds." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

type Step = "method" | "handle" | "code" | "age" | "done";

function AuthPage() {
  const navigate = useNavigate();
  const { signIn, onboarded } = useApp();
  const [step, setStep] = useState<Step>("method");
  const [method, setMethod] = useState<AuthMethod>("phone");
  const [handle, setHandle] = useState("");
  const [code, setCode] = useState("");
  const [dob, setDob] = useState("");
  const [error, setError] = useState<string | null>(null);

  const age = ageFrom(dob);

  function pick(m: AuthMethod) {
    setMethod(m);
    if (m === "apple" || m === "google") {
      setHandle(m === "apple" ? "you@icloud.com" : "you@gmail.com");
      setStep("age");
    } else {
      setHandle("");
      setStep("handle");
    }
  }

  function finish() {
    signIn({
      method,
      handle,
      verified: true,
      ageConfirmed: true,
      joinedOn: todayLabel(),
    });
    setStep("done");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center gap-2 px-4 py-3">
        {step === "method" ? (
          <Link to="/welcome" aria-label="Back" className="rounded-full p-1.5 active:bg-secondary">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        ) : step !== "done" ? (
          <button
            aria-label="Back"
            onClick={() =>
              setStep(
                step === "age"
                  ? method === "apple" || method === "google"
                    ? "method"
                    : "code"
                  : step === "code"
                    ? "handle"
                    : "method",
              )
            }
            className="rounded-full p-1.5 active:bg-secondary"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        ) : null}
        <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">
          IRL NOW
        </p>
      </header>

      <main className="flex flex-1 flex-col px-5 pt-6">
        {step === "method" && (
          <>
            <h1 className="font-display text-3xl font-extrabold leading-tight">
              Get in.
              <br />
              <span className="text-primary">See who's out tonight.</span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We only ever show your first name and your photo. Never your number.
            </p>
            <div className="mt-8 flex flex-col gap-2.5">
              <Big icon={Phone} label="Continue with phone" onClick={() => pick("phone")} primary />
              <Big icon={Mail} label="Continue with email" onClick={() => pick("email")} />
              <Big icon={Apple} label="Continue with Apple" onClick={() => pick("apple")} />
              <Big icon={Chrome} label="Continue with Google" onClick={() => pick("google")} />
            </div>
            <p className="mt-6 text-center text-[11px] leading-relaxed text-muted-foreground">
              By continuing you agree to our community rules. You must be 18 or over to use IRL NOW.
            </p>
          </>
        )}

        {step === "handle" && (
          <>
            <h1 className="font-display text-2xl font-extrabold">
              {method === "phone" ? "What's your number?" : "What's your email?"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We'll send a six digit code. It's only used to keep your account yours.
            </p>
            <input
              autoFocus
              inputMode={method === "phone" ? "tel" : "email"}
              value={handle}
              onChange={(e) => {
                setError(null);
                setHandle(method === "phone" ? formatPhone(e.target.value) : e.target.value);
              }}
              placeholder={method === "phone" ? "07700 900 123" : "you@email.com"}
              className="mt-6 h-14 w-full rounded-2xl border border-border bg-secondary/40 px-4 font-display text-lg font-bold outline-none focus:border-primary"
            />
            {error && <p className="mt-2 text-xs font-bold text-destructive">{error}</p>}
            <button
              onClick={() =>
                isValidHandle(method, handle)
                  ? setStep("code")
                  : setError(
                      method === "phone"
                        ? "That number looks too short."
                        : "Check that email address.",
                    )
              }
              className="mt-4 h-14 w-full rounded-2xl bg-gradient-brand font-display font-bold text-primary-foreground shadow-glow"
            >
              Send code
            </button>
          </>
        )}

        {step === "code" && (
          <>
            <h1 className="font-display text-2xl font-extrabold">Enter your code</h1>
            <p className="mt-2 text-sm text-muted-foreground">Sent to {handle}.</p>
            <input
              autoFocus
              inputMode="numeric"
              value={code}
              onChange={(e) => {
                setError(null);
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
              }}
              placeholder="••••••"
              className="mt-6 h-16 w-full rounded-2xl border border-border bg-secondary/40 px-4 text-center font-display text-3xl font-extrabold tracking-[0.4em] outline-none focus:border-primary"
            />
            {error && <p className="mt-2 text-xs font-bold text-destructive">{error}</p>}
            <button
              onClick={() => setCode(DEMO_CODE)}
              className="mt-3 text-xs font-bold text-primary"
            >
              Demo code: {DEMO_CODE} — tap to fill
            </button>
            <button
              onClick={() => (code.length === 6 ? setStep("age") : setError("Six digits, please."))}
              className="mt-4 h-14 w-full rounded-2xl bg-gradient-brand font-display font-bold text-primary-foreground shadow-glow"
            >
              Verify
            </button>
          </>
        )}

        {step === "age" && (
          <>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary">
              <Cake className="h-6 w-6 text-primary" />
            </span>
            <h1 className="mt-4 font-display text-2xl font-extrabold">When were you born?</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              IRL NOW is 18+. Your date of birth is never shown — only your birthday month, and only
              if you turn that on.
            </p>
            <input
              type="date"
              value={dob}
              onChange={(e) => {
                setError(null);
                setDob(e.target.value);
              }}
              className="mt-6 h-14 w-full rounded-2xl border border-border bg-secondary/40 px-4 font-display text-lg font-bold outline-none focus:border-primary"
            />
            {age !== null && (
              <p className="mt-2 text-xs font-semibold text-muted-foreground">You're {age}.</p>
            )}
            {error && <p className="mt-2 text-xs font-bold text-destructive">{error}</p>}
            <button
              onClick={() =>
                isAdult(dob) ? finish() : setError("You need to be 18 or over to use IRL NOW.")
              }
              className="mt-4 h-14 w-full rounded-2xl bg-gradient-brand font-display font-bold text-primary-foreground shadow-glow"
            >
              Confirm and continue
            </button>
          </>
        )}

        {step === "done" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 pb-24 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/15">
              <Check className="h-8 w-8 text-accent" strokeWidth={3} />
            </span>
            <h1 className="font-display text-2xl font-extrabold">You're in</h1>
            <p className="max-w-xs text-sm text-muted-foreground">
              Signed in as {handle}. Verified and 18+.
            </p>
            <div className="mt-2 flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5">
              <ShieldCheck className="h-4 w-4 text-accent" />
              <span className="text-[11px] font-bold">Account verified</span>
            </div>
            <button
              onClick={() => navigate({ to: onboarded ? "/" : "/onboard" })}
              className="mt-4 h-14 w-full max-w-xs rounded-2xl bg-gradient-brand font-display font-bold text-primary-foreground shadow-glow"
            >
              {onboarded ? "Go to tonight" : "Set up your profile"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function Big({
  icon: Icon,
  label,
  onClick,
  primary,
}: {
  icon: typeof Phone;
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex h-14 items-center gap-3 rounded-2xl px-5 font-display font-bold",
        primary
          ? "bg-gradient-brand text-primary-foreground shadow-glow"
          : "border border-border bg-secondary/40",
      )}
    >
      <Icon className="h-5 w-5" />
      {label}
    </button>
  );
}
