import type { CoverKey } from "@irlnow/domain";
/**
 * Cover images for the web bundle.
 *
 * The domain names covers as `CoverKey` strings; this is where those names
 * become Vite-resolved URLs. The mobile app has its own equivalent.
 */
import rooftop from "@/assets/event-rooftop.jpg";
import jazz from "@/assets/event-jazz.jpg";
import supper from "@/assets/event-supper.jpg";
import run from "@/assets/event-run.jpg";
import gallery from "@/assets/event-gallery.jpg";
import streetfood from "@/assets/event-streetfood.jpg";
import climb from "@/assets/event-climb.jpg";
import games from "@/assets/event-games.jpg";
import market from "@/assets/event-market.jpg";

export const eventCovers: Record<CoverKey, string> = {
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
