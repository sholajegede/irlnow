import type { ExpoConfig } from "expo/config";

/**
 * Expo configuration.
 *
 * A .ts config rather than app.json so environment variables reach `extra`
 * at build time — the values the app reads through src/config/env.ts.
 */
const config: ExpoConfig = {
  name: "IRL NOW",
  slug: "irlnow",
  scheme: "irlnow",
  version: "0.1.0",
  orientation: "portrait",
  userInterfaceStyle: "dark",
  // The app is designed dark. A light-mode device must not wash it out.
  backgroundColor: "#0C0810",
  primaryColor: "#FF525D",

  icon: "./assets/icon.png",
  ios: {
    supportsTablet: false,
    bundleIdentifier: "app.irlnow.mobile",
    infoPlist: {
      // Every string says what the person gets, not what the app wants.
      NSCameraUsageDescription:
        "Take photos and videos at events you're at, so everyone there gets the memories.",
      NSPhotoLibraryUsageDescription: "Add photos from your library to an event wall.",
      NSPhotoLibraryAddUsageDescription: "Save photos from an event wall to your library.",
      NSLocationWhenInUseUsageDescription: "Show what's happening near you and how far away it is.",
      NSMicrophoneUsageDescription: "Record video with sound at events.",
      // Share links must open in the app rather than bouncing to Safari.
      ITSAppUsesNonExemptEncryption: false,
    },
    associatedDomains: ["applinks:irlnow.app"],
  },

  android: {
    package: "app.irlnow.mobile",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#0C0810",
    },
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [{ scheme: "https", host: "irlnow.app" }],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },

  web: { bundler: "metro", output: "single" },

  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/splash-icon.png",
        resizeMode: "contain",
        backgroundColor: "#0C0810",
      },
    ],
    "expo-secure-store",
    [
      "expo-image-picker",
      {
        photosPermission: "Add photos from your library to an event wall.",
        cameraPermission: "Take photos and videos at events you're at.",
      },
    ],
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission:
          "Show what's happening near you and how far away it is.",
      },
    ],
    ["expo-camera", { cameraPermission: "Scan the QR code at the door to check in." }],
  ],

  experiments: { typedRoutes: true },

  extra: {
    convexUrl: process.env["EXPO_PUBLIC_CONVEX_URL"],
    appOrigin: process.env["EXPO_PUBLIC_APP_ORIGIN"],
    kindeDomain: process.env["EXPO_PUBLIC_KINDE_DOMAIN"],
    kindeClientId: process.env["EXPO_PUBLIC_KINDE_CLIENT_ID"],
    eas: { projectId: process.env["EAS_PROJECT_ID"] },
  },
};

export default config;
