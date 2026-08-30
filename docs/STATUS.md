# Implementation status

What is actually real, and what only looks real. Kept honest and current so
nobody demos a mock believing it is a feature.

**Legend** — ✅ real · 🟡 partial · 🔴 mocked, non-functional

_Last updated: after the mobile foundation landed. The repository is now a
monorepo: `apps/mobile` (Expo, the primary consumer product), `apps/web`
(public pages, share surfaces, host/venue/admin), `packages/domain` (shared
rules) and `convex` (backend)._

_The web tables below describe `apps/web`, which still runs on fixtures. The
mobile app reads from Convex from its first screen._

## Mobile app (`apps/mobile`)

| Area                       | State | Notes                                                                             |
| -------------------------- | ----- | --------------------------------------------------------------------------------- |
| Expo foundation            | ✅    | SDK 57, RN 0.86, expo-router, TypeScript strict. iOS and Android both bundle.     |
| Navigation                 | ✅    | Five tabs + stack. Deep-link scheme and universal links declared.                 |
| Design system              | ✅    | Web's OKLCH palette converted to sRGB; same avatar gradients.                     |
| Discovery feed             | 🟡    | Built, reads Convex, ranks through `@irlnow/domain`. Not yet run on a simulator.  |
| Finite feed                | ✅    | `FeedEndCard`, no `onEndReached`. Covered by tests.                               |
| Anonymous discovery        | ✅    | Architectural: null tokens, local intent, no login wall.                          |
| Kinde auth                 | 🔴    | Fully wired (OAuth + PKCE, keystore tokens) but **inert — no tenant configured**. |
| Every other screen         | 🔴    | Renders an explicit "Not built yet".                                              |
| Camera / QR / push / media | 🔴    | Permissions declared in `app.config.ts`; no implementation.                       |
| Simulator verification     | 🔴    | Never run on a device or simulator — see "Not verified" below.                    |
| Tests                      | 🟡    | 17 tests over the feed card and the finite-feed end card.                         |

## Not verified

The mobile app has **never been run on a simulator, emulator or device.** The
machine it was built on has no iOS runtime installed and no Android SDK at all.

What that does and does not mean:

- Verified: both platforms bundle through Metro, the shared domain is present
  in the Hermes output, TypeScript is clean, and the components render and
  behave correctly under `jest-expo`.
- Not verified: layout on a real screen, gesture and scroll feel, the paging
  FlatList under a fast swipe, safe-area insets on a notched device, image
  decode performance, and anything touching a native module.

`docs/MOBILE-SETUP.md` has the setup steps for both simulators.

## Platform (`apps/web`)

| Area                | State | Notes                                                                                                                                      |
| ------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Build & dev tooling | ✅    | Standalone Vite + TanStack Start. No Lovable dependency.                                                                                   |
| Production bundle   | ✅    | `bun run build` → `.output/`, served by `bun run start`. Verified.                                                                         |
| Deploy target       | ✅    | Node server by default; `NITRO_PRESET` for Cloudflare/Vercel/Netlify.                                                                      |
| Configuration       | ✅    | `src/config/app.ts`, `VITE_APP_ORIGIN`.                                                                                                    |
| Error reporting     | 🟡    | Vendor-neutral seam exists; no provider wired, so errors reach the console only.                                                           |
| Persistence         | 🟡    | Local-only. Identity, RSVPs, saves, plans and settings survive a reload; media, messages and orders do not.                                |
| Backend             | 🟡    | Convex core-loop schema, queries and mutations exist and are tested. No client reads from them yet.                                        |
| Authentication      | 🔴    | `src/lib/auth.ts` accepts any 6-digit code. Kinde planned.                                                                                 |
| Authorisation       | 🟡    | Enforced server-side in Convex and covered by tests. Web routes `/admin` and `/host/*` remain unprotected.                                 |
| Tests               | 🟡    | 132 tests over two runtimes: QR encoding, feed ranking, access, persistence, and Convex auth/privacy/capacity. Most UI surfaces uncovered. |

## Product surfaces

| Surface                        | State | Notes                                                                                                                  |
| ------------------------------ | ----- | ---------------------------------------------------------------------------------------------------------------------- |
| Discovery feed                 | 🟡    | Renders and filters correctly, from 10 hardcoded events. Ranking is inline in the route.                               |
| Finite feed ("Go outside")     | ✅    | Deliberate product constraint, `FEED_CAP = 10`. Preserve.                                                              |
| Event detail                   | 🟡    | Complete UI over mock data.                                                                                            |
| Public event page `/x/$id`     | ✅    | Real per-event OG/meta from loader data. Correct for sharing today.                                                    |
| People discovery               | 🟡    | `graph.ts` logic is sound; the roster is 10 fixed people.                                                              |
| "I'm Going"                    | 🟡    | Survives a reload on the same device. Not on the server, so not shared or visible to anyone else.                      |
| Onboarding / interests         | 🟡    | Persists locally, so nobody is asked twice. Not on the server.                                                         |
| Anonymous → identified         | ✅    | Correctly modelled: anonymous users get non-personalised copy.                                                         |
| Plans                          | 🟡    | Create, join and vote work in memory. Three seeded plans.                                                              |
| Messaging                      | 🔴    | `use-live-thread.ts` simulates the other person with timers and a canned reply pool.                                   |
| Notifications                  | 🔴    | `buildNotifications()` fabricates a list. No delivery, no push.                                                        |
| Event wall / media             | 🔴    | `wallPhotos()` generates fake photos from event-cover assets. No upload, no storage.                                   |
| Face tagging / "you appear in" | 🔴    | `youIn` is a hash of the photo index. No recognition of any kind.                                                      |
| **QR codes**                   | ✅    | Real, scannable codes via `qrcode.react`. Verified by decoding the rendered SVG in tests.                              |
| Check-in / door mode           | 🔴    | Codes now scan to a real URL, but the landing page has no backend to check anyone in against. Guest list is generated. |
| Ticketing & checkout           | 🔴    | Tiers, fees and orders compute correctly, but no card is charged. Labelled in-app.                                     |
| Payments                       | 🔴    | `payments.ts` models a PSP's shape. Nothing leaves the device.                                                         |
| Membership (IRL NOW+)          | 🔴    | Join and cancel mutate memory. No billing.                                                                             |
| Boosts / promotion             | 🔴    | Reach and ROI figures are formulas over invented constants.                                                            |
| Venue capacity drops           | 🔴    | Claim and publish mutate memory.                                                                                       |
| Host workspace                 | 🟡    | Rich UI; guest lists, traffic and payouts are generated from event-id hashes.                                          |
| Admin                          | 🔴    | Moderation queue, platform stats and city rows are hardcoded. Unprotected.                                             |
| Safety: report & block         | 🟡    | Records to memory. No moderation pipeline behind it.                                                                   |
| Privacy settings               | 🟡    | Stored and read by the UI; not enforced anywhere, because there is no server.                                          |
| Accessibility settings         | ✅    | Reduced motion and high contrast are real, applied at the root.                                                        |
| Event access details           | 🟡    | Model is honest (host-declared or unknown). No host has declared any yet, and there is no UI to declare them.          |

## Convex backend

| Piece                                               | State | Notes                                                                    |
| --------------------------------------------------- | ----- | ------------------------------------------------------------------------ |
| Schema (users, profiles, organisers, events, rsvps) | ✅    | Deployed locally, 11 indexes. Real timestamps and integer minor units.   |
| Discovery queries                                   | ✅    | `listUpcoming`, `getBySlug` — both answer anonymously.                   |
| Event roster                                        | ✅    | Server-side visibility filtering, viewer excluded.                       |
| "I'm Going" / check-in                              | ✅    | Capacity enforced server-side; overflow waitlists rather than oversells. |
| Development seed                                    | ✅    | Sample data, refuses to run against production.                          |
| Deployment                                          | 🟡    | Local only (`127.0.0.1:3210`). No cloud deployment provisioned.          |
| App wired to Convex                                 | 🔴    | The UI still reads `src/lib/data.ts`.                                    |
| Kinde authentication                                | 🔴    | Not started, so no browser client can pass `requireUser`.                |

## Fixed

- **Accessibility claims** — `accessInfo()` derived step-free access, accessible
  toilets and hearing loops from a hash of the event id and rendered them as
  ticks and crosses. Replaced with `lib/events/access.ts`: answers come from the
  host or read "not answered". No event declares any yet, so the panel currently
  invites the guest to ask the host.
- **Travel specifics** — named tube lines, cab fares, cycle-dock distances and
  last-train times were invented per event. Journey times are now labelled
  estimates derived from distance alone; the unsourceable specifics are gone.

## Known-misleading data

These generate confident, specific, entirely invented output. Each needs either
a real source or a visible "sample data" treatment before any external demo.

- `guestList()` / `trafficFor()` — synthetic attendees and funnel figures.
- `platformStats`, `cityRows`, `REVENUE_MIX` — invented business metrics.
- `wallPhotos()` — synthetic photos, contributors and face tags.
- `inviteStats()` — fixed 72% / 41% / 24% conversion rates.
- `waitlistOdds()` — invented probability of getting in.
