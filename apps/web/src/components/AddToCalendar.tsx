import { CalendarPlus, Check } from "lucide-react";
import { downloadIcs } from "@/lib/calendar";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

/** Downloads a real .ics so the event lands in Apple/Google/Outlook calendars. */
export function AddToCalendar({ eventId, className }: { eventId: string; className?: string }) {
  const { calendarAdded, markCalendarAdded } = useApp();
  const added = calendarAdded.includes(eventId);

  return (
    <button
      onClick={() => {
        downloadIcs(eventId);
        markCalendarAdded(eventId);
      }}
      className={cn(
        "flex h-11 items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all active:scale-95",
        added ? "bg-accent/15 text-accent" : "bg-secondary text-secondary-foreground",
        className,
      )}
    >
      {added ? <Check className="h-4 w-4" strokeWidth={3} /> : <CalendarPlus className="h-4 w-4" />}
      {added ? "In your calendar" : "Add to calendar"}
    </button>
  );
}
