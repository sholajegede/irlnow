import { useEffect, useState } from "react";
import * as Location from "expo-location";
import { DEFAULT_LOCATION } from "@/features/discovery/format";

/* ------------------------------------------------------------------
   Where the viewer is.

   Location is a convenience, never a requirement. The feed works
   without it — events simply show their area instead of a distance,
   and the proximity signal scores zero rather than penalising anything.

   Permission is requested lazily, when a screen actually wants distance,
   rather than in a wall of prompts at first launch.
------------------------------------------------------------------- */

export interface ViewerLocation {
  coords: { lat: number; lng: number } | null;
  /** True while the permission prompt or fix is outstanding. */
  isResolving: boolean;
  /** Set when the person declined. The UI should stop asking. */
  isDenied: boolean;
}

export function useViewerLocation(options: { enabled?: boolean } = {}): ViewerLocation {
  const enabled = options.enabled ?? true;
  const [coords, setCoords] = useState<ViewerLocation["coords"]>(null);
  const [isResolving, setResolving] = useState(false);
  const [isDenied, setDenied] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    void (async () => {
      setResolving(true);
      try {
        const existing = await Location.getForegroundPermissionsAsync();
        // Only prompt when the person has not already answered. Re-asking
        // after a refusal is how apps get uninstalled.
        const granted = existing.granted
          ? existing
          : existing.canAskAgain
            ? await Location.requestForegroundPermissionsAsync()
            : existing;

        if (cancelled) return;
        if (!granted.granted) {
          setDenied(true);
          return;
        }

        // Balanced accuracy: a street-level fix is plenty for "1.2 km away",
        // and high accuracy costs battery and time for no visible benefit.
        const position = await Location.getLastKnownPositionAsync({});
        const fix =
          position ??
          (await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          }));

        if (!cancelled) {
          setCoords({ lat: fix.coords.latitude, lng: fix.coords.longitude });
        }
      } catch {
        // A failed fix is not an error worth showing anyone — the feed
        // falls back to city-level and carries on.
        if (!cancelled) setDenied(true);
      } finally {
        if (!cancelled) setResolving(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { coords, isResolving, isDenied };
}

/** The city centre, for copy that needs somewhere to stand when there's no fix. */
export { DEFAULT_LOCATION };
