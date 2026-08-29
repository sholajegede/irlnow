import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Copy, Share2, UserPlus, X } from "lucide-react";
import { CHANNELS, inviteLink, referralCode, type InviteChannel } from "@/lib/invite";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

/**
 * The actual viral mechanism: an invite is always attached to a real thing
 * you said yes to, and we track what happens to it.
 */
export function InviteSheet({
  open,
  onClose,
  context,
  contextLabel,
}: {
  open: boolean;
  onClose: () => void;
  context: string;
  contextLabel: string;
}) {
  const { name, logInvite, invites } = useApp();
  const [sent, setSent] = useState<InviteChannel[]>([]);
  const [copied, setCopied] = useState(false);
  const code = referralCode(name);
  const link = inviteLink(code, context);
  const already = invites.filter((i) => i.context === context).length;

  if (!open) return null;

  function send(channel: InviteChannel) {
    logInvite({
      id: `${context}-${channel}-${Date.now()}`,
      context,
      contextLabel,
      channel,
      when: "just now",
    });
    setSent((prev) => (prev.includes(channel) ? prev : [...prev, channel]));
    if (channel === "copy") {
      navigator.clipboard?.writeText(link).catch(() => {});
      setCopied(true);
    }
  }

  const total = already + sent.length;
  const toGo = Math.max(0, 3 - total);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-background/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-t-3xl border-t border-border bg-card p-5 pb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-extrabold">Bring people</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 active:bg-secondary"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{contextLabel}</p>

        <div className="mt-4 rounded-2xl border border-border bg-secondary/40 p-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Your link
          </p>
          <div className="mt-1 flex items-center gap-2">
            <p className="flex-1 truncate font-mono text-xs">{link}</p>
            <button
              onClick={() => send("copy")}
              className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-[11px] font-bold"
            >
              {copied ? <Check className="h-3 w-3 text-accent" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-1.5">
          {CHANNELS.filter((c) => c.id !== "copy").map((c) => {
            const done = sent.includes(c.id);
            return (
              <button
                key={c.id}
                onClick={() => send(c.id)}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border px-4 py-3 text-left",
                  done ? "border-accent/40 bg-accent/10" : "border-border bg-secondary/40",
                )}
              >
                <Share2 className={cn("h-4 w-4", done ? "text-accent" : "text-primary")} />
                <span className="flex-1">
                  <span className="block text-sm font-bold">{c.label}</span>
                  <span className="block text-[11px] text-muted-foreground">{c.blurb}</span>
                </span>
                {done && <Check className="h-4 w-4 text-accent" strokeWidth={3} />}
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/10 p-3 text-center">
          <p className="text-xs font-bold">
            {toGo > 0
              ? `Invite ${toGo} more and your next month of IRL NOW+ is free`
              : "Nice — that's a free month of IRL NOW+ unlocked"}
          </p>
          <Link
            to="/invite"
            onClick={onClose}
            className="mt-1 inline-block text-[11px] font-bold text-primary"
          >
            Track your invites
          </Link>
        </div>
      </div>
    </div>
  );
}
