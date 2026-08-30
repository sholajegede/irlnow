import { act, render as rntlRender } from "@testing-library/react-native";
import type { ReactElement } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

/**
 * Insets for a notched phone.
 *
 * Supplied explicitly rather than mocking `useSafeAreaInsets`, so screens are
 * tested against a real provider with realistic values — a top inset is the
 * difference between the mode chips sitting under the notch and below it.
 */
const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

/**
 * Render a screen and let its startup effects settle.
 *
 * Screens read persisted state asynchronously — local intent from
 * AsyncStorage, a session from SecureStore — and those resolve after the
 * synchronous render. Flushing here keeps the resulting state updates inside
 * `act`, so tests see the settled screen rather than its first frame.
 */
export async function renderScreen(ui: ReactElement) {
  const utils = rntlRender(<SafeAreaProvider initialMetrics={METRICS}>{ui}</SafeAreaProvider>);
  await act(async () => {});
  return utils;
}
