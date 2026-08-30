/* ------------------------------------------------------------------
   Stored truth -> what a person reads.

   The backend stores epoch millis, integer minor units and coordinates,
   deliberately: a timestamp is correct for every viewer, a string like
   "Tonight · 7:30pm" is correct for exactly one, and a distance is only
   correct relative to whoever is looking.

   This is where truth becomes copy. It lives in the domain because both
   clients need the same answers — a price that reads differently on web
   and mobile is a bug nobody notices until a user does.
------------------------------------------------------------------- */

const DAY_MS = 86_400_000;

function timeLabel(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const suffix = hours >= 12 ? "pm" : "am";
  const hour12 = ((hours + 11) % 12) + 1;
  return minutes === 0
    ? `${hour12}${suffix}`
    : `${hour12}:${String(minutes).padStart(2, "0")}${suffix}`;
}

/**
 * "Tonight · 7:30pm", "Tomorrow · 9am", "Sat · 7pm", "12 Sep · 8pm".
 *
 * Relative for the next week because that is the window a person is actually
 * deciding within; absolute after that, where a weekday name stops helping.
 */
export function whenLabel(startsAt: number, now = Date.now()): string {
  const start = new Date(startsAt);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const startOfDay = new Date(startsAt);
  startOfDay.setHours(0, 0, 0, 0);

  const days = Math.round((startOfDay.getTime() - today.getTime()) / DAY_MS);
  const time = timeLabel(start);

  if (days <= 0) return `Tonight · ${time}`;
  if (days === 1) return `Tomorrow · ${time}`;
  if (days < 7) {
    return `${start.toLocaleDateString("en-GB", { weekday: "short" })} · ${time}`;
  }
  return `${start.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · ${time}`;
}

/** "Free" or "£12" — trailing ".00" dropped, because nobody writes it. */
export function priceLabel(priceMinor: number, currency: string): string {
  if (priceMinor === 0) return "Free";
  const symbol =
    currency === "GBP" ? "£" : currency === "USD" ? "$" : currency === "EUR" ? "€" : "";
  const amount = (priceMinor / 100).toFixed(2).replace(/\.00$/, "");
  return `${symbol}${amount}`;
}

/*
 * Distance is computed against the viewer rather than stored on the event:
 * a distance baked into a record is right for one person and wrong for
 * everyone else.
 */
export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Great-circle distance in kilometres between two points.
 *
 * Named for what it takes rather than what it returns, to keep it distinct
 * from `data.distanceKm`, which parses a fixture's distance string.
 */
export function distanceBetween(from: Coordinates, to: Coordinates): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function distanceLabel(km: number): string {
  if (km < 1) return `${Math.round(km * 10) * 100} m`;
  return `${km.toFixed(1)} km`;
}
