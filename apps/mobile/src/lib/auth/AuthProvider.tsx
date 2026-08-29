import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { isAuthConfigured } from "@/config/env";
import { authorize, endSession, fetchProfile, refresh } from "./kinde";
import { clearSession, isExpired, readSession, writeSession } from "./token-store";
import type { AuthContextValue, AuthUser } from "./types";
import type { StoredSession } from "./token-store";

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Holds the session and hands tokens to the Convex client.
 *
 * Anonymous is a resting state, not a failure. The app renders the whole
 * discovery experience with `user === null`, and only surfaces sign-in where
 * identity actually buys the person something.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");
  const [error, setError] = useState<string | null>(null);

  /**
   * The live session, held in a ref as well as state.
   *
   * `getToken` is called from the Convex client on every request and must
   * read the current value without re-subscribing to React state.
   */
  const session = useRef<StoredSession | null>(null);

  const applySession = useCallback(async (next: StoredSession | null) => {
    session.current = next;
    if (!next) {
      await clearSession();
      setUser(null);
      setStatus("anonymous");
      return;
    }
    await writeSession(next);
    const profile = await fetchProfile(next.accessToken);
    setUser(profile);
    setStatus(profile ? "authenticated" : "anonymous");
  }, []);

  // Restore a stored session at launch. Someone who signed in last week
  // should not be asked again.
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (!isAuthConfigured) {
        setStatus("anonymous");
        return;
      }
      const stored = await readSession();
      if (cancelled) return;

      if (!stored) {
        setStatus("anonymous");
        return;
      }
      if (!isExpired(stored)) {
        session.current = stored;
        const profile = await fetchProfile(stored.accessToken);
        if (cancelled) return;
        setUser(profile);
        setStatus(profile ? "authenticated" : "anonymous");
        return;
      }
      const renewed = stored.refreshToken ? await refresh(stored.refreshToken) : null;
      if (cancelled) return;
      await applySession(renewed);
    })();

    return () => {
      cancelled = true;
    };
  }, [applySession]);

  const start = useCallback(
    async (intent: "login" | "registration") => {
      if (!isAuthConfigured) {
        setError("Sign-in isn't available in this build.");
        setStatus("error");
        return;
      }
      setError(null);
      try {
        const next = await authorize(intent);
        // Null means the person dismissed the browser. Returning them to
        // where they were is the correct outcome, not an error banner.
        if (!next) {
          setStatus(user ? "authenticated" : "anonymous");
          return;
        }
        await applySession(next);
      } catch {
        setError("We couldn't sign you in. Try again in a moment.");
        setStatus("error");
      }
    },
    [applySession, user],
  );

  const signOut = useCallback(async () => {
    await endSession();
    await applySession(null);
  }, [applySession]);

  /**
   * A usable access token, or null.
   *
   * Called before every authenticated Convex request, so the common path —
   * a token that is still valid — does no work.
   */
  const getToken = useCallback<AuthContextValue["getToken"]>(
    async (opts) => {
      const current = session.current;
      if (!current) return null;

      if (!opts?.forceRefresh && !isExpired(current)) return current.accessToken;
      if (!current.refreshToken) {
        await applySession(null);
        return null;
      }

      const renewed = await refresh(current.refreshToken);
      await applySession(renewed);
      return renewed?.accessToken ?? null;
    },
    [applySession],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      error,
      isConfigured: isAuthConfigured,
      signIn: () => start("login"),
      signUp: () => start("registration"),
      signOut,
      getToken,
    }),
    [status, user, error, start, signOut, getToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>");
  return value;
}

/** True once the session is known, either way. Gate splash on this, not on a user. */
export function useAuthReady(): boolean {
  return useAuth().status !== "loading";
}
