import { useState } from "react";
import { Ban, Check, ShieldAlert, X } from "lucide-react";
import type { Person } from "@/lib/data";
import { REPORT_REASONS } from "@/lib/social";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export function ReportSheet({
  person,
  open,
  onClose,
}: {
  person: Pick<Person, "id" | "name">;
  open: boolean;
  onClose: () => void;
}) {
  const { blockPerson, reportPerson, blockedIds, addReport } = useApp();
  const [reason, setReason] = useState<string | null>(null);
  const [detail, setDetail] = useState("");
  const [done, setDone] = useState<"reported" | "blocked" | null>(null);
  const blocked = blockedIds.includes(person.id);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-background/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-t-3xl border-t border-border bg-card p-5 pb-8">
        {done ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/15">
              <Check className="h-6 w-6 text-accent" strokeWidth={3} />
            </span>
            <h2 className="font-display text-xl font-extrabold">
              {done === "blocked" ? `${person.name} is blocked` : "Thanks — we're on it"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {done === "blocked"
                ? "They can't message you, see your plans, or appear in your event lists. We never tell them."
                : "Our safety team reviews every report within 24 hours. You can also block them so you stop seeing each other."}
            </p>
            {done === "reported" && !blocked && (
              <button
                onClick={() => {
                  blockPerson(person.id);
                  setDone("blocked");
                }}
                className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-secondary font-display text-sm font-bold"
              >
                <Ban className="h-4 w-4" /> Also block {person.name}
              </button>
            )}
            <button
              onClick={onClose}
              className="h-11 w-full rounded-2xl bg-gradient-brand font-display text-sm font-bold text-primary-foreground"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-primary" />
                <h2 className="font-display text-xl font-extrabold">Report {person.name}</h2>
              </div>
              <button onClick={onClose} aria-label="Close" className="rounded-full p-1 active:bg-secondary">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Reports are confidential. {person.name} is never told who reported them.
            </p>

            <div className="mt-4 flex flex-col gap-1.5">
              {REPORT_REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={cn(
                    "rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition-colors",
                    reason === r ? "border-primary bg-primary/10 text-foreground" : "border-border bg-secondary/40",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>

            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              rows={2}
              placeholder="What happened? (optional, helps us act faster)"
              className="mt-3 w-full rounded-2xl border border-border bg-secondary/40 p-3 text-sm outline-none focus:border-primary"
            />

            <button
              disabled={!reason}
              onClick={() => {
                reportPerson(person.id);
                addReport({
                  id: `${person.id}-${Date.now()}`,
                  targetId: person.id,
                  targetName: person.name,
                  reason: reason!,
                  detail,
                  when: "just now",
                  status: "reviewing",
                });
                setDone("reported");
              }}
              className="mt-4 h-12 w-full rounded-2xl bg-gradient-brand font-display text-base font-bold text-primary-foreground shadow-glow disabled:opacity-40 disabled:shadow-none"
            >
              Send report
            </button>
            {!blocked && (
              <button
                onClick={() => {
                  blockPerson(person.id);
                  setDone("blocked");
                }}
                className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-secondary font-display text-sm font-bold text-destructive"
              >
                <Ban className="h-4 w-4" /> Block without reporting
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
