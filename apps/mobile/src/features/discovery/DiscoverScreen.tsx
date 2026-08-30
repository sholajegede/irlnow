import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ListRenderItemInfo,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FEED_MODES, buildFeed, goingGraph, type FeedMode } from "@irlnow/domain";
import { Flame } from "@/components/icons";
import { ScreenMessage } from "@/components/ScreenMessage";
import { colors, radius, spacing, typography } from "@/theme/tokens";
import { EventFeedCard } from "./EventFeedCard";
import { FeedEndCard } from "./FeedEndCard";
import { useDiscoveryFeed } from "./useDiscoveryFeed";
import type { FeedEvent } from "./types";

type Row = { kind: "event"; event: FeedEvent } | { kind: "end" };

/** Matches the tab bar in app/(tabs)/_layout.tsx. */
const TAB_BAR_HEIGHT = Platform.select({ ios: 84, default: 64 });

/**
 * The front door.
 *
 * One event per screen, swiped vertically — the consumption model people
 * already know, aimed at the opposite outcome. The feed is finite and ends
 * in FeedEndCard, which is a product decision rather than a loading strategy.
 */
export function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<FeedMode>("foryou");
  const listRef = useRef<FlatList<Row>>(null);

  const { events, viewer, status, error, refresh, isRefreshing, toggleGoing, toggleSaved } =
    useDiscoveryFeed();

  // One page is the viewport minus the tab bar, so a card never sits half
  // under the chrome and paging lands exactly on card boundaries.
  //
  // Derived from window dimensions rather than measured with onLayout: a
  // measure costs a frame in which the feed renders nothing, and the first
  // thing someone sees when they open the app should be an event.
  const { height: windowHeight } = useWindowDimensions();
  const pageHeight = windowHeight - insets.bottom - TAB_BAR_HEIGHT;

  const feed = useMemo(
    () => buildFeed(events, mode, viewer.signals),
    [events, mode, viewer.signals],
  );

  const rows = useMemo<Row[]>(() => {
    const items: Row[] = feed.map(({ event }) => ({ kind: "event", event }));
    // The end card only belongs there when something preceded it.
    if (items.length > 0) items.push({ kind: "end" });
    return items;
  }, [feed]);

  const renderRow = useCallback(
    ({ item }: ListRenderItemInfo<Row>) => {
      if (item.kind === "end") return <FeedEndCard height={pageHeight} />;
      const event = item.event;
      return (
        <EventFeedCard
          event={event}
          graph={goingGraph(event.slug, viewer.interests, viewer.metPersonIds)}
          isGoing={viewer.goingSlugs.includes(event.slug)}
          isSaved={viewer.savedSlugs.includes(event.slug)}
          onToggleGoing={toggleGoing}
          onToggleSaved={toggleSaved}
          height={pageHeight}
        />
      );
    },
    [pageHeight, viewer, toggleGoing, toggleSaved],
  );

  const changeMode = useCallback((next: FeedMode) => {
    setMode(next);
    // Switching view should start the new feed at the top, not halfway down
    // wherever the last one was.
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, []);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        {/* Four fixed options — a ScrollView, not a FlatList: there is
            nothing here to virtualise. */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          accessibilityRole="tablist"
        >
          {FEED_MODES.map((item) => {
            const active = item.id === mode;
            return (
              <Pressable
                key={item.id}
                onPress={() => changeMode(item.id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                style={[styles.chip, active && styles.chipActive]}
              >
                {item.id === "trending" ? (
                  <Flame color={active ? colors.background : colors.foreground} size={13} />
                ) : null}
                <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {status === "loading" ? (
        <View style={styles.centre}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Finding what&apos;s on…</Text>
        </View>
      ) : null}

      {status === "error" ? (
        <ScreenMessage
          title="We couldn't load what's on"
          body={error ?? "Check your connection and try again."}
          actionLabel="Try again"
          onAction={refresh}
        />
      ) : null}

      {status === "ready" && rows.length === 0 ? (
        <ScreenMessage
          title="Nothing on in this view"
          body="Try another day — the city is fuller than this."
          actionLabel="Show me everything"
          onAction={() => changeMode("foryou")}
        />
      ) : null}

      {status === "ready" && rows.length > 0 ? (
        <FlatList
          ref={listRef}
          testID="discovery-feed"
          data={rows}
          keyExtractor={(row) => (row.kind === "end" ? "end" : row.event.slug)}
          renderItem={renderRow}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={pageHeight}
          snapToAlignment="start"
          // Every page is exactly one viewport, so the list never has to
          // measure a row to know where it starts.
          getItemLayout={(_, index) => ({
            length: pageHeight,
            offset: pageHeight * index,
            index,
          })}
          // Keep a page either side mounted so a fast swipe never lands on
          // a blank screen, but no more than that.
          initialNumToRender={2}
          maxToRenderPerBatch={2}
          windowSize={3}
          removeClippedSubviews
          // Deliberately no onEndReached. The feed is finite.
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refresh}
              tintColor={colors.primary}
            />
          }
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingBottom: spacing.sm,
  },
  chips: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.overlay,
  },
  chipActive: { backgroundColor: colors.foreground },
  chipLabel: { ...typography.body.xs, color: colors.foreground },
  chipLabelActive: { color: colors.background },
  centre: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md },
  loadingText: { ...typography.body.sm, color: colors.mutedForeground },
});
