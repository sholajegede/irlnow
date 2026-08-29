import { useLocalSearchParams } from "expo-router";
import { PlaceholderScreen } from "@/components/PlaceholderScreen";

/**
 * Event detail — the screen the feed pushes to.
 *
 * Not built yet. The route exists so the feed's navigation is real rather
 * than dead, and so deep links resolve somewhere honest.
 */
export default function EventScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return <PlaceholderScreen title={slug ?? "Event"} />;
}
