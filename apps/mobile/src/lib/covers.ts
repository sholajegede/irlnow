import type { ImageSource } from "expo-image";
import type { CoverKey } from "@irlnow/domain";

import climb from "../../assets/covers/event-climb.jpg";
import gallery from "../../assets/covers/event-gallery.jpg";
import games from "../../assets/covers/event-games.jpg";
import jazz from "../../assets/covers/event-jazz.jpg";
import market from "../../assets/covers/event-market.jpg";
import rooftop from "../../assets/covers/event-rooftop.jpg";
import run from "../../assets/covers/event-run.jpg";
import streetfood from "../../assets/covers/event-streetfood.jpg";
import supper from "../../assets/covers/event-supper.jpg";

/* ------------------------------------------------------------------
   Cover images for the native bundle.

   The domain names covers as `CoverKey` strings and owns no files; this
   is where those names become Metro-resolved assets. apps/web has the
   same module over Vite-resolved URLs.

   These are the sample catalogue's images. Once media upload exists an
   event carries its own cover URL, which is why `coverSource` takes a
   plain string, handles a URL, and degrades rather than throwing.
------------------------------------------------------------------- */

const COVERS: Record<CoverKey, number> = {
  rooftop,
  jazz,
  supper,
  run,
  gallery,
  streetfood,
  climb,
  games,
  market,
};

/**
 * The image for a cover key, or a remote URL when the event carries one.
 *
 * Never throws: a missing cover should show a plain photograph, not break
 * the feed someone is mid-swipe through.
 */
export function coverSource(key: string): ImageSource | number {
  if (key.startsWith("http")) return { uri: key };
  return COVERS[key as CoverKey] ?? rooftop;
}
