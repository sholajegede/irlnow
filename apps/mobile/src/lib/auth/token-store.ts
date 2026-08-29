import * as SecureStore from "expo-secure-store";

/* ------------------------------------------------------------------
   Token storage.

   Tokens go in the platform keystore — Keychain on iOS, EncryptedSharedPreferences
   on Android — never AsyncStorage, which is plain text on disk and readable
   on a rooted or jailbroken device.
------------------------------------------------------------------- */

const ACCESS_TOKEN = "irlnow.auth.access";
const REFRESH_TOKEN = "irlnow.auth.refresh";
const EXPIRES_AT = "irlnow.auth.expiresAt";

export interface StoredSession {
  accessToken: string;
  refreshToken: string | null;
  /** Epoch millis. */
  expiresAt: number;
}

/**
 * Secure storage is unavailable on some devices and throws on others.
 * Losing a stored session signs someone out, which is recoverable; crashing
 * on launch is not.
 */
async function safeGet(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function safeSet(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch {
    // A session that cannot be persisted still works for this launch.
  }
}

async function safeDelete(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // Nothing useful to do.
  }
}

export async function readSession(): Promise<StoredSession | null> {
  const [accessToken, refreshToken, expiresAt] = await Promise.all([
    safeGet(ACCESS_TOKEN),
    safeGet(REFRESH_TOKEN),
    safeGet(EXPIRES_AT),
  ]);
  if (!accessToken) return null;

  const expiry = Number(expiresAt);
  return {
    accessToken,
    refreshToken,
    expiresAt: Number.isFinite(expiry) ? expiry : 0,
  };
}

export async function writeSession(session: StoredSession): Promise<void> {
  await Promise.all([
    safeSet(ACCESS_TOKEN, session.accessToken),
    safeSet(EXPIRES_AT, String(session.expiresAt)),
    session.refreshToken ? safeSet(REFRESH_TOKEN, session.refreshToken) : safeDelete(REFRESH_TOKEN),
  ]);
}

export async function clearSession(): Promise<void> {
  await Promise.all([safeDelete(ACCESS_TOKEN), safeDelete(REFRESH_TOKEN), safeDelete(EXPIRES_AT)]);
}

/** Treat a token near expiry as already expired, to avoid a mid-flight 401. */
const EXPIRY_SKEW_MS = 60_000;

export function isExpired(session: StoredSession, now = Date.now()): boolean {
  return session.expiresAt - EXPIRY_SKEW_MS <= now;
}
