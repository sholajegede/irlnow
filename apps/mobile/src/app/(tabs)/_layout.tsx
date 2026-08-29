import { Tabs } from "expo-router";
import { Platform, StyleSheet, View } from "react-native";
import { CalendarCheck, Compass, Plus, UserRound, Users } from "@/components/icons";
import { colors, radius, shadows } from "@/theme/tokens";

/**
 * Five destinations, chosen so discovery keeps the centre of gravity.
 *
 * The web prototype has 26 app-shell routes; flattening those into a tab bar
 * would bury the feed. Everything else is pushed onto a stack from here, or
 * presented as a sheet. See docs/MOBILE-ARCHITECTURE.md.
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: styles.bar,
        tabBarLabelStyle: styles.label,
        // The feed is edge-to-edge photography; the bar must sit over it
        // without a hard seam.
        tabBarBackground: () => <View style={styles.barBackground} />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Discover",
          tabBarIcon: ({ color }) => <Compass color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="people"
        options={{
          title: "People",
          tabBarIcon: ({ color }) => <Users color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="going"
        options={{
          title: "Going",
          tabBarIcon: ({ color }) => <CalendarCheck color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
          // Raised and brand-coloured: turning an attendee into a host is a
          // growth loop, not a buried menu item.
          tabBarIcon: () => (
            <View style={styles.fab}>
              <Plus color={colors.primaryForeground} size={22} strokeWidth={2.5} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="you"
        options={{
          title: "You",
          tabBarIcon: ({ color }) => <UserRound color={color} size={22} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    backgroundColor: "transparent",
    elevation: 0,
    height: Platform.select({ ios: 84, default: 64 }),
    paddingTop: 8,
  },
  barBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    opacity: 0.94,
  },
  label: { fontSize: 10, fontWeight: "600" },
  fab: {
    height: 38,
    width: 38,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    ...shadows.glow,
  },
});
