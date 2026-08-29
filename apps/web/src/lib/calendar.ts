import { APP_DOMAIN, absoluteUrl } from "@/config/app";
import { buildIcs, getEvent } from "@irlnow/domain";

/**
 * Download an event as a `.ics` file.
 *
 * Browser-only: the domain builds the calendar text, this hands it to the
 * document. The mobile app shares the same string through the native share
 * sheet instead.
 */
export function downloadIcs(eventId: string): boolean {
  const event = getEvent(eventId);
  if (!event || typeof document === "undefined") return false;

  const ics = buildIcs(event, {
    domain: APP_DOMAIN,
    url: absoluteUrl(`/event/${event.id}`),
  });

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${event.id}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return true;
}
