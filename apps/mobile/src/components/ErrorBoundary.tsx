import { Component, type ErrorInfo, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { reportError } from "@/lib/observability/report-error";
import { colors, radius, spacing, typography } from "@/theme/tokens";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * The last line before a white screen.
 *
 * React Native has no equivalent of a browser reload, so an unhandled render
 * error leaves the app dead until it is force-quit. This catches it, reports
 * it, and offers a way back.
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    reportError(error, {
      boundary: "root",
      componentStack: info.componentStack ?? undefined,
    });
  }

  private reset = () => this.setState({ error: null });

  override render(): ReactNode {
    if (!this.state.error) return this.props.children;

    return (
      <View style={styles.root} accessibilityRole="alert">
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.body}>
          That&apos;s on us, not you. Try again — and if it keeps happening, close the app and
          reopen it.
        </Text>
        <Pressable
          onPress={this.reset}
          accessibilityRole="button"
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <Text style={styles.actionLabel}>Try again</Text>
        </Pressable>
      </View>
    );
  }
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
