import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

/* ------------------------------------------------------------------
   Client-side persistence for pre-backend state.

   This is deliberately not a cache for server data — once Convex owns a
   value, it should not also live here. What belongs here is state that is
   genuinely local to a device and a session: what an anonymous visitor has
   saved before they sign up, how far through onboarding they are, and their
   accessibility preferences.
------------------------------------------------------------------- */

const NAMESPACE = "irlnow";

/**
 * Bumped when persisted shapes change incompatibly.
 *
 * The version is part of every key, so old data is simply never read again
 * rather than needing a migration or risking a crash on a stale shape.
 */
const VERSION = 1;

function storageKey(key: string): string {
  return `${NAMESPACE}:v${VERSION}:${key}`;
}

/**
 * localStorage, or null when it is unavailable.
 *
 * Absent during SSR, and throwing on access in a Safari private window or when
 * a browser is set to block site data — so every use is guarded.
 */
function getStore(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function readPersisted<T>(key: string, isValid: (value: unknown) => value is T): T | null {
  const store = getStore();
  if (!store) return null;
  try {
    const raw = store.getItem(storageKey(key));
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    // Persisted data is untrusted: it may be stale, hand-edited, or written by
    // an older build. Validate before it reaches application state.
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writePersisted(key: string, value: unknown): void {
  const store = getStore();
  if (!store) return;
  try {
    store.setItem(storageKey(key), JSON.stringify(value));
  } catch {
    // Quota exceeded or storage blocked. Losing persistence is acceptable;
    // breaking the interaction the user is mid-way through is not.
  }
}

export function clearPersisted(): void {
  const store = getStore();
  if (!store) return;
  try {
    const prefix = `${NAMESPACE}:`;
    for (const key of Object.keys(store)) {
      if (key.startsWith(prefix)) store.removeItem(key);
    }
  } catch {
    // Nothing useful to do if storage is unavailable.
  }
}

/**
 * `useState` that survives a reload.
 *
 * Rendering starts from `initial` on both server and client, and the persisted
 * value is applied in an effect. Reading storage during the initial render
 * would produce markup the server could not have produced, and React would
 * discard the tree with a hydration error — a brief flash is the cheaper
 * trade.
 */
export function usePersistentState<T>(
  key: string,
  initial: T,
  isValid: (value: unknown) => value is T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(initial);
  const hydrated = useRef(false);

  useEffect(() => {
    const stored = readPersisted(key, isValid);
    if (stored !== null) setValue(stored);
    hydrated.current = true;
    // `key` identifies the slot for the lifetime of the component; `isValid`
    // is a stable module-level guard. Re-running this would clobber state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    // Skip the first pass, which would otherwise overwrite stored data with
    // `initial` before hydration has had a chance to read it.
    if (!hydrated.current) return;
    writePersisted(key, value);
  }, [key, value]);

  const set = useCallback<Dispatch<SetStateAction<T>>>((next) => setValue(next), []);

  return [value, set];
}

/**
 * `usePersistentState` for a settings-shaped object.
 *
 * A stored object written by an older build can be missing keys that the
 * current build reads unconditionally, which surfaces as `undefined` deep in a
 * component rather than as a storage problem. Merging over `defaults` on read
 * means a new setting always has a value, and only recognised keys survive.
 */
export function usePersistentObject<T extends object>(
  key: string,
  defaults: T,
): [T, Dispatch<SetStateAction<T>>] {
  const isMergeable = useCallback(
    (value: unknown): value is T => {
      if (!isRecord(value)) return false;
      return Object.keys(value).some((k) => k in defaults);
    },
    [defaults],
  );

  const [value, setValue] = usePersistentState<T>(key, defaults, isMergeable);

  const merged = useMemo<T>(() => {
    const result = { ...defaults };
    for (const k of Object.keys(defaults) as (keyof T)[]) {
      if (value[k] !== undefined) result[k] = value[k];
    }
    return result;
  }, [defaults, value]);

  return [merged, setValue];
}

/* ---------------- Validators ---------------- */

export function isString(value: unknown): value is string {
  return typeof value === "string";
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

/** Objects only, so a persisted `null` or array never lands in a record slot. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isArrayOfObjects<T>(): (value: unknown) => value is T[] {
  return (value): value is T[] => Array.isArray(value) && value.every(isRecord);
}

/**
 * A keyed map of `T`.
 *
 * Only the outer shape is checked. Values are structurally trusted, on the
 * basis that this app wrote them: the guard exists to reject a stale or
 * corrupt shape, not to re-validate every field.
 */
export function isRecordOf<T>(): (value: unknown) => value is Record<string, T> {
  return (value): value is Record<string, T> => isRecord(value);
}
