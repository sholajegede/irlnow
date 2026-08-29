/** Post-event reviews: attendee rates the organiser, organiser flags no-shows. */

export interface OrganiserReview {
  eventId: string;
  stars: number;
  tags: string[];
  note: string;
  anonymous: boolean;
}

export const REVIEW_TAGS = [
  "Started on time",
  "Warm welcome",
  "Easy to find",
  "Good crowd",
  "As described",
  "Would go again",
];

export const NEGATIVE_TAGS = ["Started late", "Overcrowded", "Not as described", "Felt unsafe"];

export const NO_SHOW_REASONS = [
  "Never arrived",
  "Cancelled last minute",
  "Arrived after the door closed",
];

export function starLabel(stars: number): string {
  return ["", "Rough", "Okay", "Good", "Great", "One of the best"][stars] ?? "";
}

/** How a no-show flag affects an attendee's standing (shown to hosts, never public). */
export function standingFrom(noShows: number): { label: string; tone: "good" | "warn" | "bad" } {
  if (noShows === 0) return { label: "Always shows up", tone: "good" };
  if (noShows === 1) return { label: "1 no-show this year", tone: "warn" };
  return { label: `${noShows} no-shows — limited to free events`, tone: "bad" };
}
