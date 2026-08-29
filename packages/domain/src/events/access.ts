import type { IrlEvent } from "../data";

/* ------------------------------------------------------------------
   Event accessibility.

   Access information is *declared by the host* or it does not exist.
   Nothing here may be inferred, guessed or derived, because every value
   is something a person makes a travel decision on: a wrong "yes" strands
   someone at a step, and a wrong "no" tells them not to come at all.

   "Unknown" is an honest, useful answer. Inventing one is not.
------------------------------------------------------------------- */

/** A host's answer about one facility. Anything unanswered stays unknown. */
export type AccessAnswer = "yes" | "no" | "unknown";

export interface EventAccess {
  stepFree: AccessAnswer;
  accessibleToilet: AccessAnswer;
  seating: AccessAnswer;
  quietSpace: AccessAnswer;
  hearingLoop: AccessAnswer;
  brightEnoughToLipRead: AccessAnswer;
  /** Free-text detail from the host, e.g. which door to use. */
  note?: string;
}

export interface AccessItem {
  id: keyof Omit<EventAccess, "note">;
  label: string;
  answer: AccessAnswer;
}

const FACILITIES: { id: AccessItem["id"]; label: string }[] = [
  { id: "stepFree", label: "Step-free access" },
  { id: "accessibleToilet", label: "Accessible toilet" },
  { id: "seating", label: "Seating available" },
  { id: "quietSpace", label: "Quiet space" },
  { id: "hearingLoop", label: "Hearing loop" },
  { id: "brightEnoughToLipRead", label: "Bright enough to lip-read" },
];

export const UNKNOWN_ACCESS: EventAccess = {
  stepFree: "unknown",
  accessibleToilet: "unknown",
  seating: "unknown",
  quietSpace: "unknown",
  hearingLoop: "unknown",
  brightEnoughToLipRead: "unknown",
};

export function accessFor(event: IrlEvent): EventAccess {
  return event.access ?? UNKNOWN_ACCESS;
}

export function accessChecklist(event: IrlEvent): AccessItem[] {
  const access = accessFor(event);
  return FACILITIES.map(({ id, label }) => ({ id, label, answer: access[id] }));
}

/** True when the host has answered nothing at all. */
export function hasDeclaredAccess(event: IrlEvent): boolean {
  return accessChecklist(event).some((item) => item.answer !== "unknown");
}

/**
 * Whether the event is likely to be loud.
 *
 * Inferred from the event's own category rather than invented, and phrased as
 * an expectation — nobody is stranded by a wrong guess about volume.
 */
export function expectsLoudMusic(event: IrlEvent): boolean {
  return event.category === "Nightlife" || event.interests.includes("music");
}
