import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@/theme/tokens";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not found" }} />
      <View style={styles.root}>
        <Text style={styles.title}>We couldn&apos;t find that</Text>
        <Text style={styles.body}>
          The link may have expired, or the event may have been taken down.
        </Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkLabel}>See what&apos;s on</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.xxxl,
    backgroundColor: colors.background,
  },
  title: { ...typography.display.section, color: colors.foreground, textAlign: "center" },
  body: {
    ...typography.body.md,
    color: colors.mutedForeground,
    textAlign: "center",
    maxWidth: 300,
  },
  link: { marginTop: spacing.sm },
  linkLabel: { ...typography.body.md, fontWeight: "700", color: colors.primary },
});
