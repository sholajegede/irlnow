import { useCallback, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@irlnow/backend/api";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useLocalIntent } from "./useLocalIntent";

/* ------------------------------------------------------------------
   Who is looking, and what they've said yes to.

   The one place that reconciles two sources of intent:

   - Convex, for a signed-in person. Their RSVPs are real, shared and
     visible to other people.
   - The device, for an anonymous visitor. Someone can save events and
     mark interests before an account exists; that intent is theirs and
     must survive until they create one.

   This is what makes anonymous discovery real rather than a demo mode.
------------------------------------------------------------------- */

export interface Viewer {
  /** Whether we know who this is. Gates every personalised claim. */
  isIdentified: boolean;
  interests: string[];
  connectionIds: string[];
  /** People met at past events — currently local-only. */
  metPersonIds: string[];
  goingSlugs: string[];
  savedSlugs: string[];
  toggleGoing: (slug: string) => void;
  toggleSaved: (slug: string) => void;
  /** True when an action needs an account the viewer doesn't have. */
  needsIdentity: boolean;
}

export function useViewer(): Viewer {
  const { user, status } = useAuth();
  const isIdentified = status === "authenticated" && user !== null;

  const local = useLocalIntent();

  // Server state, only when there is someone to ask about.
  const serverGoing = useQuery(
    api.rsvps.myEventIds,
    isIdentified ? { status: "going" as const } : "skip",
  );
  const serverSaved = useQuery(
    api.rsvps.myEventIds,
    isIdentified ? { status: "saved" as const } : "skip",
  );
  const setStatus = useMutation(api.rsvps.setStatus);

  const goingSlugs = useMemo(
    () => (isIdentified ? (serverGoing ?? []).map(String) : local.goingSlugs),
    [isIdentified, serverGoing, local.goingSlugs],
  );
  const savedSlugs = useMemo(
    () => (isIdentified ? (serverSaved ?? []).map(String) : local.savedSlugs),
    [isIdentified, serverSaved, local.savedSlugs],
  );

  const toggleGoing = useCallback(
    (slug: string) => {
      // Anonymous intent stays on the device until there is an account to
      // attach it to. Nobody is stopped mid-gesture to sign up.
      if (!isIdentified) {
        local.toggleGoing(slug);
        return;
      }
      const next = goingSlugs.includes(slug) ? "cancelled" : "going";
      void setStatus({ eventSlug: slug, status: next });
    },
    [isIdentified, local, goingSlugs, setStatus],
  );

  const toggleSaved = useCallback(
    (slug: string) => {
      if (!isIdentified) {
        local.toggleSaved(slug);
        return;
      }
      const next = savedSlugs.includes(slug) ? "cancelled" : "saved";
      void setStatus({ eventSlug: slug, status: next });
    },
    [isIdentified, local, savedSlugs, setStatus],
  );

  return {
    isIdentified,
    interests: isIdentified ? local.interests : local.interests,
    connectionIds: [],
    metPersonIds: [],
    goingSlugs,
    savedSlugs,
    toggleGoing,
    toggleSaved,
    needsIdentity: !isIdentified,
  };
}
