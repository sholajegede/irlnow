/* ------------------------------------------------------------------
   Memory retention.
   Free accounts keep an event wall for 30 days. Members keep it forever.
   Expiry is the conversion trigger for IRL NOW+ — never a separate plan.
------------------------------------------------------------------- */

export const FREE_RETENTION_DAYS = 30;

function hash(s: string): number {
  return s.split("").reduce((a, c) => (a * 33 + c.charCodeAt(0)) >>> 0, 7);
}

export interface Retention {
  /** true when this wall never expires (member) */
  kept: boolean;
  /** days since the event happened */
  ageDays: number;
  /** days until the wall is deleted for free accounts */
  daysLeft: number;
  /** 0..1 — how far through the free window this wall is */
  progress: number;
  /** urgent enough to interrupt the user */
  urgent: boolean;
  /** already gone for free accounts */
  expired: boolean;
  label: string;
}

/** Deterministic age per event so the demo is stable across reloads. */
export function wallAgeDays(eventId: string): number {
  return hash(eventId) % FREE_RETENTION_DAYS;
}

export function retentionFor(eventId: string, isMember: boolean): Retention {
  const ageDays = wallAgeDays(eventId);
  const daysLeft = Math.max(0, FREE_RETENTION_DAYS - ageDays);
  const progress = Math.min(1, ageDays / FREE_RETENTION_DAYS);
  const expired = !isMember && daysLeft === 0;
  return {
    kept: isMember,
    ageDays,
    daysLeft,
    progress,
    urgent: !isMember && daysLeft <= 7,
    expired,
    label: isMember
      ? "Kept forever with IRL NOW+"
      : expired
        ? "This wall has expired"
        : daysLeft === 1
          ? "Disappears tomorrow"
          : `Disappears in ${daysLeft} days`,
  };
}

/** Copy for the upgrade prompt, scaled to how much is actually at stake. */
export function retentionPitch(photoCount: number, daysLeft: number): string {
  if (daysLeft <= 0)
    return `${photoCount} photos are gone from free accounts — restore them with IRL NOW+.`;
  if (daysLeft <= 7)
    return `${photoCount} photos disappear in ${daysLeft} day${daysLeft === 1 ? "" : "s"}. Keep them with IRL NOW+.`;
  return `Free walls are kept for ${FREE_RETENTION_DAYS} days. Members keep every photo forever.`;
}
