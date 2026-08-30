import { useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { ConvexProvider as BaseProvider, ConvexReactClient } from "convex/react";
import { CONVEX_URL } from "@/config/env";
import { useAuth } from "@/lib/auth/AuthProvider";

/* ------------------------------------------------------------------
   The Convex client.

   Wired to the auth layer so every request carries the current identity
   when there is one — and, importantly, still works when there isn't.
   Discovery queries answer anonymously by design, which is what lets
   someone browse before they have an account.
------------------------------------------------------------------- */

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const { getToken, status } = useAuth();

  // Created once. Recreating the client would drop every open subscription
  // and refetch the whole feed on something as routine as a token refresh.
  const client = useMemo(
    () =>
      new ConvexReactClient(CONVEX_URL, {
        // The socket reconnects on its own after a tunnel drop or a
        // flight-mode toggle, which on mobile happens constantly.
        unsavedChangesWarning: false,
      }),
    [],
  );

  useEffect(() => {
    // Returning null is the anonymous path: Convex treats the request as
    // unauthenticated rather than rejecting it.
    client.setAuth(async ({ forceRefreshToken }) => getToken({ forceRefresh: forceRefreshToken }));
  }, [client, getToken, status]);

  useEffect(() => () => void client.close(), [client]);

  return <BaseProvider client={client}>{children}</BaseProvider>;
}
