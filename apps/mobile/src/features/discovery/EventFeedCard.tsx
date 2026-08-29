import { memo, useCallback } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import type { GoingGraph } from "@irlnow/domain";
import { AvatarStack } from "@/components/Avatar";
import { Bookmark, Check, MapPin, Users } from "@/components/icons";
import { coverSource } from "@/lib/covers";
import { colors, gradients, radius, shadows, spacing, typography } from "@/theme/tokens";
import type { FeedEvent } from "./types";

interface Props {
  event: FeedEvent;
  graph: GoingGraph;
  isGoing: boolean;
  isSaved: boolean;
  onToggleGoing: (slug: string) => void;
  onToggleSaved: (slug: string) => void;
  /** Height of one page, so the card fills the viewport exactly. */
  height: number;
}

/**
 * One full-bleed event, sized to exactly one screen.
 *
 * The web card is a snap-scroll article; this is its native counterpart —
 * a page in a paging FlatList. The hierarchy is the same and deliberate:
 * the photograph sells the night, but the *people* block is what makes
 * someone tap. The event is context; the people are the reason to care.
 */
function EventFeedCardImpl({
  event,
  graph,
  isGoing,
  isSaved,
  onToggleGoing,
  onToggleSaved,
  height,
}: Props) {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const openEvent = useCallback(() => {
    router.push(`/event/${event.slug}`);
  }, [router, event.slug]);

  const toggleGoing = useCallback(() => {
    // A confirming tap deserves to be felt. This is the moment a plan
    // becomes real, and it is the app's most important interaction.
    void Haptics.impactAsync(
      isGoing ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium,
    );
    onToggleGoing(event.slug);
  }, [isGoing, onToggleGoing, event.slug]);

  const toggleSaved = useCallback(() => {
    void Haptics.selectionAsync();
    onToggleSaved(event.slug);
  }, [onToggleSaved, event.slug]);

  return (
    <View style={[styles.page, { height, width }]}>
      <Image
        source={coverSource(event.coverKey)}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        // A blurhash placeholder means the card never flashes empty while
        // someone swipes quickly through the feed.
        placeholder={{ blurhash: "L36RM4}?0000~qxu9F9F00xu?bIU" }}
        transition={220}
        accessibilityIgnoresInvertColors
        accessible
        accessibilityLabel={`${event.title}, ${event.areaLabel}`}
      />
      <LinearGradient colors={[...gradients.coverFade]} style={StyleSheet.absoluteFill} />

      <View style={styles.content}>
        <View style={styles.pills}>
          <View style={[styles.pill, styles.pillPrimary]}>
            <Text style={styles.pillPrimaryText}>{event.category.toUpperCase()}</Text>
          </View>
          {event.isTrending ? (
            <View style={[styles.pill, styles.pillAccent]}>
              <Text style={styles.pillAccentText}>TRENDING</Text>
            </View>
          ) : null}
        </View>

        <Pressable onPress={openEvent} accessibilityRole="button">
          <Text style={styles.title} numberOfLines={3}>
            {event.title}
          </Text>
        </Pressable>

        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <MapPin color={colors.primary} size={14} />
            <Text style={styles.metaText}>{event.areaLabel}</Text>
          </View>
          <Text style={styles.metaText}>{event.whenLabel}</Text>
          <View style={styles.priceChip}>
            <Text style={styles.priceText}>{event.priceLabel}</Text>
          </View>
          {event.spotsLeft !== null && event.spotsLeft > 0 && event.spotsLeft <= 12 ? (
            <Text style={styles.scarcity}>{event.spotsLeft} spots left</Text>
          ) : null}
        </View>

        {/* People are the reason to care — the event is the context. */}
        <Pressable style={styles.social} onPress={openEvent} accessibilityRole="button">
          <AvatarStack people={graph.roster.map((p) => ({ name: p.name, seed: p.avatar }))} />
          <View style={styles.socialCopy}>
            <Text style={styles.socialHeadline} numberOfLines={2}>
              {graph.headline}
            </Text>
            <Text style={styles.socialSubline} numberOfLines={1}>
              {graph.subline}
            </Text>
          </View>
        </Pressable>

        <View style={styles.actions}>
          <Pressable
            onPress={toggleGoing}
            accessibilityRole="button"
            accessibilityState={{ selected: isGoing }}
            accessibilityLabel={isGoing ? "You're going. Tap to cancel." : "I'm going"}
            style={({ pressed }) => [
              styles.goingButton,
              isGoing ? styles.goingButtonOn : styles.goingButtonOff,
              pressed && styles.pressed,
            ]}
          >
            {isGoing ? <Check color={colors.accentForeground} size={20} strokeWidth={3} /> : null}
            <Text style={[styles.goingLabel, isGoing && styles.goingLabelOn]}>
              {isGoing ? "You're going" : "I'm Going"}
            </Text>
          </Pressable>

          <Pressable
            onPress={toggleSaved}
            accessibilityRole="button"
            accessibilityState={{ selected: isSaved }}
            accessibilityLabel={isSaved ? "Remove from saved" : "Save for later"}
            style={({ pressed }) => [
              styles.iconButton,
              isSaved && styles.iconButtonOn,
              pressed && styles.pressed,
            ]}
          >
            <Bookmark
              color={isSaved ? colors.primary : colors.foreground}
              size={20}
              fill={isSaved ? colors.primary : "transparent"}
            />
          </Pressable>

          <Pressable
            onPress={openEvent}
            accessibilityRole="button"
            accessibilityLabel="Event details and who's going"
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            <Users color={colors.foreground} size={20} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/**
 * Memoised on the values that actually change per card.
 *
 * Without this, toggling "going" on one card re-renders every mounted page
 * in the feed, and the swipe visibly stutters on mid-range Android.
 */
export const EventFeedCard = memo(EventFeedCardImpl, (prev, next) => {
  return (
    prev.event.slug === next.event.slug &&
    prev.isGoing === next.isGoing &&
    prev.isSaved === next.isSaved &&
    prev.height === next.height &&
    prev.graph.headline === next.graph.headline &&
    prev.event.spotsLeft === next.event.spotsLeft
  );
});

const styles = StyleSheet.create({
  page: { backgroundColor: colors.background },
  content: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  pills: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  pill: { paddingHorizontal: spacing.md, paddingVertical: 5, borderRadius: radius.pill },
  pillPrimary: { backgroundColor: colors.primary },
  pillPrimaryText: { ...typography.overline, color: colors.primaryForeground },
  pillAccent: { backgroundColor: colors.accent },
  pillAccentText: { ...typography.overline, color: colors.accentForeground },
  title: { ...typography.display.hero, color: colors.foreground, letterSpacing: -0.5 },
  meta: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing.md },
  metaItem: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  metaText: { ...typography.body.md, color: colors.foreground, opacity: 0.85 },
  priceChip: {
    backgroundColor: colors.overlay,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  priceText: { ...typography.body.xs, color: colors.foreground },
  scarcity: { ...typography.body.xs, color: colors.accent },
  social: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.overlay,
  },
  socialCopy: { flex: 1, gap: 2 },
  socialHeadline: { ...typography.display.card, color: colors.foreground },
  socialSubline: { ...typography.body.xs, color: colors.mutedForeground },
  actions: { flexDirection: "row", gap: spacing.md, marginTop: spacing.xs },
  goingButton: {
    flex: 1,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.xl,
  },
  goingButtonOff: { backgroundColor: colors.primary, ...shadows.glow },
  goingButtonOn: { backgroundColor: colors.accent },
  goingLabel: { ...typography.display.card, fontSize: 16, color: colors.primaryForeground },
  goingLabelOn: { color: colors.accentForeground },
  iconButton: {
    height: 52,
    width: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.overlay,
  },
  iconButtonOn: { borderColor: colors.primary, backgroundColor: "rgba(255,82,93,0.18)" },
  pressed: { transform: [{ scale: 0.97 }], opacity: 0.9 },
});
