import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { AuthProvider, useAuthReady } from "@/lib/auth/AuthProvider";
import { ConvexClientProvider } from "@/lib/convex/ConvexProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { colors } from "@/theme/tokens";

// Held until the stored session has been checked, so nobody sees a signed-out
// frame flash before their own account loads.
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <AuthProvider>
            <ConvexClientProvider>
              <StatusBar style="light" />
              <AppStack />
            </ConvexClientProvider>
          </AuthProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppStack() {
  const ready = useAuthReady();

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        // Native push, not a fade — the stack should feel like the platform.
        animation: "slide_from_right",
      }}
    >
      {/* The tab bar is the app. Discovery is the front door, not a login wall. */}
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="event/[slug]" options={{ animation: "slide_from_bottom" }} />
      <Stack.Screen
        name="onboarding"
        options={{ presentation: "modal", animation: "slide_from_bottom" }}
      />
      <Stack.Screen name="+not-found" options={{ title: "Not found" }} />
    </Stack>
  );
}
