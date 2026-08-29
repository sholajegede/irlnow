import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, typography } from "@/theme/tokens";

/**
 * A screen that exists in navigation but has no implementation yet.
 *
 * Deliberately plain and honestly labelled. A convincing empty state here
 * would be indistinguishable from a finished feature with no data, and
 * someone would eventually demo it as one.
 */
export function PlaceholderScreen({ title }: { title: string }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.xxxl }]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.note}>Not built yet.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", gap: spacing.sm, backgroundColor: colors.background },
  title: { ...typography.display.section, color: colors.foreground },
  note: { ...typography.body.sm, color: colors.mutedForeground },
});
