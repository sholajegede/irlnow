import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
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

  // One page = the viewport minus the tab bar, so a card never sits half
  // under the chrome and paging lands exactly on card boundaries.
  const [pageHeight, setPageHeight] = useState(0);

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
    <View style={styles.root} onLayout={(e) => setPageHeight(e.nativeEvent.layout.height)}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <FlatList
          horizontal
          data={FEED_MODES}
          keyExtractor={(m) => m.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          renderItem={({ item }) => {
            const active = item.id === mode;
            return (
              <Pressable
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
          }}
        />
      </View>

      {status === "loading" && pageHeight > 0 ? (
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

      {status === "ready" && rows.length > 0 && pageHeight > 0 ? (
        <FlatList
          ref={listRef}
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
