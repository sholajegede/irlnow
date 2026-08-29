import type { ImageSourcePropType } from "react-native";
import type { CoverKey } from "@irlnow/domain";

/* ------------------------------------------------------------------
   Cover images for the native bundle.

   The domain names covers as `CoverKey` strings and owns no files; this
   is where those names become Metro-resolved assets. apps/web has the
   same module over Vite-resolved URLs.

   These are the sample catalogue's images. Once media upload exists,
   an event carries its own cover URL and `coverSource` falls back to
   this set only for seeded data — which is why it takes a string and
   degrades rather than throwing on an unknown key.
------------------------------------------------------------------- */

const COVERS: Record<CoverKey, ImageSourcePropType> = {
  rooftop: require("../../assets/covers/event-rooftop.jpg"),
  jazz: require("../../assets/covers/event-jazz.jpg"),
  supper: require("../../assets/covers/event-supper.jpg"),
  run: require("../../assets/covers/event-run.jpg"),
  gallery: require("../../assets/covers/event-gallery.jpg"),
  streetfood: require("../../assets/covers/event-streetfood.jpg"),
  climb: require("../../assets/covers/event-climb.jpg"),
  games: require("../../assets/covers/event-games.jpg"),
  market: require("../../assets/covers/event-market.jpg"),
};

const FALLBACK = COVERS.rooftop;

/**
 * The image for a cover key, or a remote URL when the event carries one.
 *
 * Never throws: a missing cover should show a plain photograph, not break
 * the feed someone is mid-swipe through.
 */
export function coverSource(key: string): ImageSourcePropType {
  if (key.startsWith("http")) return { uri: key };
  return COVERS[key as CoverKey] ?? FALLBACK;
}
