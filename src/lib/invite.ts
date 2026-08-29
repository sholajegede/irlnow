/** Referral + invite mechanics (dummy). Every invite is tied to a thing you're going to. */

export type InviteChannel = "whatsapp" | "message" | "instagram" | "copy" | "email";

export interface InviteRecord {
  id: string;
  /** "event:rooftop" | "plan:p1" | "app" */
  context: string;
  contextLabel: string;
  channel: InviteChannel;
  when: string;
}

export const CHANNELS: { id: InviteChannel; label: string; blurb: string }[] = [
  { id: "whatsapp", label: "WhatsApp", blurb: "Where your group chat already is" },
  { id: "message", label: "Messages", blurb: "One-to-one, highest accept rate" },
  { id: "instagram", label: "Instagram", blurb: "Story sticker with the cover" },
  { id: "email", label: "Email", blurb: "For the older crowd" },
  { id: "copy", label: "Copy link", blurb: "Paste anywhere" },
];

export function referralCode(name: string): string {
  const base = (name || "you").replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 4) || "IRL";
  return `${base}-NOW`;
}

export function inviteLink(code: string, context = "app"): string {
  const path = context === "app" ? "" : `/${context.replace(":", "/")}`;
  return `irl-now.lovable.app${path}?i=${code}`;
}

/** Deterministic "how your invites are doing" numbers so the screen feels alive. */
export function inviteStats(sent: number) {
  const opened = Math.round(sent * 0.72);
  const joined = Math.round(sent * 0.41);
  const wentOut = Math.round(sent * 0.24);
  return { opened, joined, wentOut };
}

export const REWARD_STEPS = [
  { at: 1, label: "First invite", reward: "Your invite link unlocked" },
  { at: 3, label: "3 friends joined", reward: "One month of IRL NOW+ free" },
  { at: 5, label: "5 friends joined", reward: "Early access to drops in your area" },
  { at: 10, label: "10 friends joined", reward: "Founding member badge on your profile" },
];
