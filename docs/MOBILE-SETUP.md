# Mobile development setup

The mobile app lives in `apps/mobile` and is the primary consumer product.

## Prerequisites

| Tool                          | Why                           |
| ----------------------------- | ----------------------------- |
| [Bun](https://bun.sh) 1.2+    | Workspace install and scripts |
| Xcode 15+ with an iOS runtime | iOS Simulator                 |
| Android Studio with SDK 35+   | Android Emulator              |
| Watchman _(optional)_         | Faster file watching on macOS |

## First run

```sh
bun install
cp apps/mobile/.env.example apps/mobile/.env

bun run convex:dev     # terminal 1 — backend at 127.0.0.1:3210
bun run convex:seed    # once, to load the sample catalogue
bun run dev:mobile     # terminal 2 — Metro
```

Then press `i` for the iOS Simulator or `a` for the Android Emulator.

## iOS Simulator

Xcode ships the simulator, but a fresh install often points the command-line
tools at the standalone CLT bundle, which has no runtimes. Check with:

```sh
xcode-select -p
```

If it prints `/Library/Developer/CommandLineTools`, repoint it and accept the
licence:

```sh
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -license accept
```

Then install a runtime — Xcode → Settings → Components → iOS Simulator — or:

```sh
xcodebuild -downloadPlatform iOS
```

Verify:

```sh
xcrun simctl list devices available | grep iPhone
```

## Android Emulator

Install Android Studio, then through its SDK Manager add **Android SDK
Platform 35**, **Platform-Tools** and a **system image** (Google APIs, arm64
on Apple silicon). Create a device in Device Manager — a Pixel 7 profile is a
good default.

Add the SDK to your shell profile:

```sh
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator"
```

Verify:

```sh
adb devices
emulator -list-avds
```

## Physical devices

Install **Expo Go** and scan the QR code from `bun run dev:mobile`. Both
devices must be on the same network.

A phone cannot reach `127.0.0.1`, so a local Convex deployment is unreachable
from one. Either point `EXPO_PUBLIC_CONVEX_URL` at your machine's LAN address,
or use a cloud deployment:

```sh
bunx convex dev --configure existing --dev-deployment cloud
```

## Development builds

Expo Go covers most of the app, but anything needing a custom native module
does not run in it. Build a development client when you reach camera, QR
scanning or push notifications:

```sh
cd apps/mobile
bunx expo prebuild            # generate ios/ and android/ (both git-ignored)
bunx expo run:ios             # or run:android
```

`prebuild` output is generated, never edited by hand — native config belongs
in `app.config.ts` so it survives a regeneration.

## Production builds

Via EAS. Requires an Expo account and `EAS_PROJECT_ID` in the environment.

```sh
bunx eas build --platform ios --profile production
bunx eas build --platform android --profile production
bunx eas submit --platform ios
```

Not yet configured: there is no `eas.json` and no project id, because neither
exists until an Expo account is connected.

## Commands

| Command                                 | What it does                    |
| --------------------------------------- | ------------------------------- |
| `bun run dev:mobile`                    | Start Metro                     |
| `bun --filter @irlnow/mobile ios`       | Metro + iOS Simulator           |
| `bun --filter @irlnow/mobile android`   | Metro + Android Emulator        |
| `bun --filter @irlnow/mobile test`      | Jest                            |
| `bun --filter @irlnow/mobile typecheck` | TypeScript                      |
| `bunx expo export --platform ios`       | Bundle without a simulator      |
| `bunx expo install --check`             | Verify versions against the SDK |

`expo export` is the fastest way to know the app still builds, and is what CI
runs — it catches missing modules and incompatible native packages without
needing a device.

## Environment

See `apps/mobile/.env.example`. `EXPO_PUBLIC_*` values are embedded in the
binary and readable from it: client identifiers and public URLs only, never a
secret. Secrets belong in Convex.

## Troubleshooting

**Metro resolves two copies of React.** Every workspace must agree on the
exact version Expo pins. `metro.config.js` also forces `react` and
`react-native` to the hoisted copy. Two copies break hooks in ways that
surface as unrelated runtime errors.

**A native module is missing after adding a dependency.** Expo Go only
contains the modules in the SDK. Anything else needs a development build.

**Stale bundle after changing config.** `bunx expo start --clear`.

**Version drift.** `bunx expo install --check` reports every package that does
not match the SDK. TypeScript is intentionally pinned to the repo-wide 5.x and
will always be listed.
