/* ------------------------------------------------------------------
   The identity contract.

   Everything the app needs to know about who is using it, expressed
   without naming a provider. Screens depend on this; only the Kinde
   implementation behind it knows Kinde exists.

   Two reasons it is shaped this way. Anonymous discovery is a product
   requirement, so `null` is a first-class state rather than an error.
   And a build with no identity provider configured must still run —
   see `isAuthConfigured`.
------------------------------------------------------------------- */

export interface AuthUser {
  /** The provider's stable subject claim. Matches `users.kindeId` in Convex. */
  id: string;
  email: string;
  givenName?: string;
  familyName?: string;
  pictureUrl?: string;
}

export type AuthStatus =
  /** Restoring a stored session. Nothing is known yet. */
  | "loading"
  /** No session. Discovery still works; this is not an error. */
  | "anonymous"
  | "authenticated"
  /** Sign-in was attempted and failed. `error` says why. */
  | "error";

export interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  error: string | null;
  /** False when this build has no identity provider configured. */
  isConfigured: boolean;
}

export interface AuthActions {
  signIn: () => Promise<void>;
  signUp: () => Promise<void>;
  signOut: () => Promise<void>;
  /**
   * A valid access token, refreshing it if needed, or null when anonymous.
   *
   * This is what the Convex client calls before each request, so it must be
   * cheap when the current token is still good.
   */
  getToken: (opts?: { forceRefresh?: boolean }) => Promise<string | null>;
}

export type AuthContextValue = AuthState & AuthActions;
