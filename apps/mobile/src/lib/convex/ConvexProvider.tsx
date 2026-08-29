import { useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { ConvexProvider as BaseProvider, ConvexReactClient } from "convex/react";
import { CONVEX_URL } from "@/config/env";
import { useAuth } from "@/lib/auth/AuthProvider";

/* ------------------------------------------------------------------
   The Convex client.

   Wired to the auth layer so every request carries the current identity
   when there is one — and, importantly, still works when there isn't.
   Discovery queries answer anonymously by design.
------------------------------------------------------------------- */

function createClient(): ConvexReactClient {
  return new ConvexReactClient(CONVEX_URL, {
    // The socket reconnects on its own after a tunnel drop or a flight-mode
    // toggle, which on mobile happens constantly.
    unsavedChangesWarning: false,
  });
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const { getToken, status } = useAuth();

  const client = useMemo(() => {
    const instance = createClient();
    instance.setAuth(async ({ forceRefreshToken }) => {
      // Returning null is the anonymous path. Convex treats the request as
      // unauthenticated rather than rejecting it.
      return await getToken({ forceRefresh: forceRefreshToken });
    });
    return instance;
    // The client is created once. `getToken` reads the live session from a
    // ref, so it does not need to be a dependency — recreating the client
    // would drop every open subscription.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-assert auth when the session changes, so queries re-run as the
  // identity behind them changes.
  useMemo(() => {
    client.setAuth(async ({ forceRefreshToken }) => getToken({ forceRefresh: forceRefreshToken }));
  }, [client, getToken, status]);

  return <BaseProvider client={client}>{children}</BaseProvider>;
}
