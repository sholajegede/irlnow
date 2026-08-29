import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { KINDE_CLIENT_ID, KINDE_DOMAIN } from "@/config/env";
import type { AuthUser } from "./types";
import type { StoredSession } from "./token-store";

/* ------------------------------------------------------------------
   Kinde, over OAuth 2.0 + PKCE.

   PKCE rather than a client secret: a secret shipped in an app binary
   is not a secret. The auth code is exchanged directly from the device
   and bound to a verifier only this device holds.

   Nothing above this file knows the provider is Kinde — see ./types.
------------------------------------------------------------------- */

/** Ends the browser session cleanly if the app is backgrounded mid-flow. */
WebBrowser.maybeCompleteAuthSession();

const SCOPES = ["openid", "profile", "email", "offline"];

function discovery(): AuthSession.DiscoveryDocument {
  return {
    authorizationEndpoint: `${KINDE_DOMAIN}/oauth2/auth`,
    tokenEndpoint: `${KINDE_DOMAIN}/oauth2/token`,
    userInfoEndpoint: `${KINDE_DOMAIN}/oauth2/v2/user_profile`,
    endSessionEndpoint: `${KINDE_DOMAIN}/logout`,
  };
}

/**
 * Where Kinde sends the browser back to.
 *
 * `irlnow://` in a build, an Expo proxy URL in Expo Go. This exact string
 * must be registered as an allowed callback URL in the Kinde dashboard, or
 * the redirect fails with an opaque provider error.
 */
export function redirectUri(): string {
  return AuthSession.makeRedirectUri({ scheme: "irlnow", path: "auth/callback" });
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  id_token?: string;
}

function toSession(token: TokenResponse): StoredSession {
  return {
    accessToken: token.access_token,
    refreshToken: token.refresh_token ?? null,
    // Default to an hour when the provider omits it; a wrong-but-short
    // expiry causes a refresh, while a wrong-but-long one causes a 401.
    expiresAt: Date.now() + (token.expires_in ?? 3600) * 1000,
  };
}

export type AuthIntent = "login" | "registration";

/**
 * Run the browser sign-in flow.
 *
 * Returns null when the person backs out — a cancelled sign-in is a normal
 * outcome, not an error to surface.
 */
export async function authorize(intent: AuthIntent): Promise<StoredSession | null> {
  const request = new AuthSession.AuthRequest({
    clientId: KINDE_CLIENT_ID,
    scopes: SCOPES,
    redirectUri: redirectUri(),
    usePKCE: true,
    extraParams: { start_page: intent },
  });

  const result = await request.promptAsync(discovery());
  if (result.type !== "success" || !result.params["code"]) return null;

  const token = (await AuthSession.exchangeCodeAsync(
    {
      clientId: KINDE_CLIENT_ID,
      code: result.params["code"],
      redirectUri: redirectUri(),
      extraParams: request.codeVerifier ? { code_verifier: request.codeVerifier } : {},
    },
    discovery(),
  )) as unknown as TokenResponse;

  return toSession(token);
}

/** Exchange a refresh token for a new access token. */
export async function refresh(refreshToken: string): Promise<StoredSession | null> {
  try {
    const token = (await AuthSession.refreshAsync(
      { clientId: KINDE_CLIENT_ID, refreshToken },
      discovery(),
    )) as unknown as TokenResponse;
    return toSession(token);
  } catch {
    // A rejected refresh means the session is genuinely over — the person
    // signs in again rather than seeing an error they cannot act on.
    return null;
  }
}

export async function fetchProfile(accessToken: string): Promise<AuthUser | null> {
  try {
    const response = await fetch(`${KINDE_DOMAIN}/oauth2/v2/user_profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return null;

    const profile = (await response.json()) as {
      id?: string;
      sub?: string;
      email?: string;
      given_name?: string;
      family_name?: string;
      picture?: string;
    };

    const id = profile.sub ?? profile.id;
    if (!id || !profile.email) return null;

    return {
      id,
      email: profile.email,
      ...(profile.given_name && { givenName: profile.given_name }),
      ...(profile.family_name && { familyName: profile.family_name }),
      ...(profile.picture && { pictureUrl: profile.picture }),
    };
  } catch {
    return null;
  }
}

/** End the session at the provider, not only on this device. */
export async function endSession(): Promise<void> {
  try {
    await WebBrowser.openAuthSessionAsync(
      `${KINDE_DOMAIN}/logout?redirect=${encodeURIComponent(redirectUri())}`,
      redirectUri(),
    );
  } catch {
    // The local session is cleared regardless; a failed provider logout
    // must not leave someone stuck signed in on the device.
  }
}
