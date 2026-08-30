/**
 * Jest setup.
 *
 * @testing-library/react-native registers its own matchers (`toBeOnTheScreen`
 * and friends) from v12.4 onward, so there is nothing to import for those.
 */

/* eslint-disable @typescript-eslint/no-require-imports --
   jest.mock factories are hoisted above imports, so require is the only
   form available inside them. */

// Reanimated ships a Jest mock; without it every animated component throws
// on mount.
jest.mock("react-native-reanimated", () => require("react-native-reanimated/mock"));

// Haptics reach for native modules that do not exist under Jest. Stubbing
// them keeps the tests about behaviour rather than about the platform.
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
}));

// AsyncStorage is a native module. The package ships a Jest mock for exactly
// this; without it, importing it throws at module load.
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// SecureStore is backed by the Keychain, which no test environment has.
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: "whenUnlockedThisDeviceOnly",
}));

/* eslint-enable @typescript-eslint/no-require-imports */
