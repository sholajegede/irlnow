import Constants from "expo-constants";

/* ------------------------------------------------------------------
   Runtime configuration.

   Values come from app.json's `extra` block, populated from the
   environment at build time. Read through this module rather than
   touching Constants directly, so there is one place that knows what
   configuration exists and what happens when it is missing.

   Nothing here is secret. Anything shipped in a binary can be read out
   of it — client ids and public URLs only. Secrets live in Convex.
------------------------------------------------------------------- */

interface Extra {
  convexUrl?: string;
  appOrigin?: string;
  kindeDomain?: string;
  kindeClientId?: string;
}

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

function required(value: string | undefined, name: string): string {
  if (!value) {
    // Failing at startup with the variable's name beats a screen of empty
    // data and a network error nobody can trace back to configuration.
    throw new Error(
      `Missing ${name}. Copy apps/mobile/.env.example to apps/mobile/.env and fill it in.`,
    );
  }
  return value;
}

/** Convex deployment this build talks to. */
export const CONVEX_URL = required(extra.convexUrl, "EXPO_PUBLIC_CONVEX_URL");

/** Public web origin — share links, and the page a QR code resolves to. */
export const APP_ORIGIN = (extra.appOrigin ?? "https://irlnow.app").replace(/\/+$/, "");

/**
 * Kinde configuration.
 *
 * Optional on purpose: the app must run, and anonymous discovery must work,
 * on a build with no identity provider configured. `isAuthConfigured` is what
 * the auth layer checks before offering to sign anyone in.
 */
export const KINDE_DOMAIN = extra.kindeDomain ?? "";
export const KINDE_CLIENT_ID = extra.kindeClientId ?? "";
export const isAuthConfigured = Boolean(KINDE_DOMAIN && KINDE_CLIENT_ID);

/** The city IRL NOW currently operates in. */
export const DEFAULT_CITY = "London";

export function absoluteUrl(path: string): string {
  return `${APP_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}
