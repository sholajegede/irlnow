import { useCallback, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

/* ------------------------------------------------------------------
   Intent held on the device, before there is an account.

   Someone can browse, save events and pick interests without signing
   up — that is the product's front door. What they choose is theirs,
   and must survive closing the app, so it is stored locally until
   there is an account to attach it to.

   AsyncStorage, not SecureStore: none of this is sensitive, and
   SecureStore has a small value-size limit meant for tokens.
------------------------------------------------------------------- */

const KEY = "irlnow:v1:localIntent";

interface LocalIntent {
  goingSlugs: string[];
  savedSlugs: string[];
  interests: string[];
  /** Whether the person has been through the interests step. */
  onboarded: boolean;
}

const EMPTY: LocalIntent = {
  goingSlugs: [],
  savedSlugs: [],
  interests: [],
  onboarded: false,
};

function isLocalIntent(value: unknown): value is LocalIntent {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    Array.isArray(v["goingSlugs"]) &&
    Array.isArray(v["savedSlugs"]) &&
    Array.isArray(v["interests"])
  );
}

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export interface LocalIntentApi extends LocalIntent {
  toggleGoing: (slug: string) => void;
  toggleSaved: (slug: string) => void;
  setInterests: (interests: string[]) => void;
  markOnboarded: () => void;
  /** Everything the device is holding, for handoff once an account exists. */
  drain: () => LocalIntent;
  clear: () => void;
}

export function useLocalIntent(): LocalIntentApi {
  const [state, setState] = useState<LocalIntent>(EMPTY);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        const parsed: unknown = raw ? JSON.parse(raw) : null;
        // Stored data may have been written by an older build; validate it
        // rather than letting a stale shape reach the UI.
        if (!cancelled && isLocalIntent(parsed)) {
          setState({ ...EMPTY, ...parsed });
        }
      } catch {
        // A corrupt or unreadable value falls back to empty. Losing local
        // intent is recoverable; failing to launch is not.
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // Skip the first pass, which would write EMPTY over stored data before
    // hydration has had a chance to read it.
    if (!hydrated) return;
    void AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {
      // Storage full or unavailable. The session still works.
    });
  }, [state, hydrated]);

  const toggleGoing = useCallback((slug: string) => {
    setState((prev) => ({ ...prev, goingSlugs: toggle(prev.goingSlugs, slug) }));
  }, []);

  const toggleSaved = useCallback((slug: string) => {
    setState((prev) => ({ ...prev, savedSlugs: toggle(prev.savedSlugs, slug) }));
  }, []);

  const setInterests = useCallback((interests: string[]) => {
    setState((prev) => ({ ...prev, interests }));
  }, []);

  const markOnboarded = useCallback(() => {
    setState((prev) => ({ ...prev, onboarded: true }));
  }, []);

  const drain = useCallback(() => state, [state]);

  const clear = useCallback(() => {
    setState(EMPTY);
    void AsyncStorage.removeItem(KEY).catch(() => {});
  }, []);

  return useMemo(
    () => ({
      ...state,
      toggleGoing,
      toggleSaved,
      setInterests,
      markOnboarded,
      drain,
      clear,
    }),
    [state, toggleGoing, toggleSaved, setInterests, markOnboarded, drain, clear],
  );
}
