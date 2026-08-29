import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { colors, radius, shadows, spacing, typography } from "@/theme/tokens";

/**
 * The end of the feed.
 *
 * This card is the product thesis made literal. IRL NOW runs out on purpose:
 * every other feed is engineered so you never reach the bottom, and reaching
 * the bottom here is the point. Do not replace this with pagination, and do
 * not wire `onEndReached` to fetch more — see docs/MOBILE-ARCHITECTURE.md.
 */
export function FeedEndCard({ height }: { height: number }) {
  const router = useRouter();
  const { width } = useWindowDimensions();

  return (
    <View style={[styles.page, { height, width }]}>
      <View style={styles.badge}>
        <Text style={styles.badgeGlyph}>🚪</Text>
      </View>

      <Text style={styles.heading}>That&apos;s it for now.{"\n"}Go outside.</Text>

      <Text style={styles.body}>
        We don&apos;t do infinite scroll. You&apos;ve seen everything worth leaving the house for —
        pick one and actually go.
      </Text>

      <View style={styles.actions}>
        <Pressable
          onPress={() => router.push("/going")}
          accessibilityRole="button"
          style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
        >
          <Text style={styles.primaryLabel}>What I&apos;m going to</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push("/search")}
          accessibilityRole="button"
          style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryLabel}>Search something specific</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
    paddingHorizontal: spacing.xxxl,
    backgroundColor: colors.background,
  },
  badge: {
    height: 64,
    width: 64,
    borderRadius: radius.xxl,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    ...shadows.glow,
  },
  badgeGlyph: { fontSize: 28 },
  heading: {
    ...typography.display.title,
    color: colors.foreground,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  body: {
    ...typography.body.md,
    color: colors.mutedForeground,
    textAlign: "center",
    maxWidth: 320,
  },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, justifyContent: "center" },
  primary: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    ...shadows.glow,
  },
  primaryLabel: { ...typography.body.md, fontWeight: "700", color: colors.primaryForeground },
  secondary: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.secondary,
  },
  secondaryLabel: { ...typography.body.md, fontWeight: "700", color: colors.foreground },
  pressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
});
