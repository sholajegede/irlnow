import { useCallback, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@irlnow/backend/api";
import { FEED_CAP, type ViewerSignals } from "@irlnow/domain";
import { useViewer } from "@/features/viewer/useViewer";
import { useViewerLocation } from "@/hooks/useViewerLocation";
import { toFeedEvent, trendingThreshold, type PublicEventShape } from "./format";
import type { FeedEvent } from "./types";

export type FeedStatus = "loading" | "ready" | "error";

export interface DiscoveryFeed {
  events: FeedEvent[];
  viewer: {
    signals: ViewerSignals;
    interests: string[];
    metPersonIds: string[];
    goingSlugs: string[];
    savedSlugs: string[];
  };
  status: FeedStatus;
  error: string | null;
  isRefreshing: boolean;
  refresh: () => void;
  toggleGoing: (slug: string) => void;
  toggleSaved: (slug: string) => void;
}

/**
 * Everything the feed needs, in one hook.
 *
 * Convex supplies the catalogue over a live subscription, so a new event or
 * a changing headcount arrives without a refetch. Ranking stays on the
 * client, in `@irlnow/domain`, because it needs the viewer's interests and
 * connections and there must be exactly one implementation of it.
 */
export function useDiscoveryFeed(): DiscoveryFeed {
  const viewer = useViewer();
  const location = useViewerLocation();
  const [isRefreshing, setRefreshing] = useState(false);

  // Asking for FEED_CAP * 2 leaves the ranking something to choose between
  // while keeping the payload small. The cap itself is applied after ranking.
  const raw = useQuery(api.events.listUpcoming, { limit: FEED_CAP * 2 }) as
    PublicEventShape[] | undefined;

  const events = useMemo<FeedEvent[]>(() => {
    if (!raw) return [];
    const trendingAt = trendingThreshold(raw);
    return raw.map((event) => toFeedEvent(event, { viewer: location.coords, trendingAt }));
  }, [raw, location.coords]);

  /**
   * What the ranking engine is allowed to know.
   *
   * `identified` gates every personalised claim. An anonymous visitor sees
   * social proof but is never told we know their taste — the rule is
   * enforced inside the domain, and this is where it is fed.
   */
  const signals = useMemo<ViewerSignals>(
    () => ({
      identified: viewer.isIdentified,
      interests: viewer.interests,
      connectionIds: viewer.connectionIds,
      goingIds: viewer.goingSlugs,
      savedIds: viewer.savedSlugs,
    }),
    [
      viewer.isIdentified,
      viewer.interests,
      viewer.connectionIds,
      viewer.goingSlugs,
      viewer.savedSlugs,
    ],
  );

  const refresh = useCallback(() => {
    // Convex keeps a live subscription, so there is nothing to refetch —
    // pulling down is a gesture people expect, and this acknowledges it
    // rather than pretending to reload.
    setRefreshing(true);
    const timer = setTimeout(() => setRefreshing(false), 450);
    return () => clearTimeout(timer);
  }, []);

  const status: FeedStatus = raw === undefined ? "loading" : "ready";

  return {
    events,
    viewer: {
      signals,
      interests: viewer.interests,
      metPersonIds: viewer.metPersonIds,
      goingSlugs: viewer.goingSlugs,
      savedSlugs: viewer.savedSlugs,
    },
    status,
    error: null,
    isRefreshing,
    refresh,
    toggleGoing: viewer.toggleGoing,
    toggleSaved: viewer.toggleSaved,
  };
}
