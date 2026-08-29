import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@/theme/tokens";

interface Props {
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * The empty, error and offline state.
 *
 * One component so every screen fails the same way — a plain sentence about
 * what happened and, wherever possible, a way out. A raw error string is
 * never shown to a person.
 */
export function ScreenMessage({ title, body, actionLabel, onAction }: Props) {
  return (
    <View style={styles.root} accessibilityRole="alert">
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <Text style={styles.actionLabel}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.xxxl,
  },
  title: { ...typography.display.section, color: colors.foreground, textAlign: "center" },
  body: {
    ...typography.body.md,
    color: colors.mutedForeground,
    textAlign: "center",
    maxWidth: 300,
  },
  action: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  actionLabel: { ...typography.body.md, fontWeight: "700", color: colors.primaryForeground },
  pressed: { opacity: 0.85 },
});
