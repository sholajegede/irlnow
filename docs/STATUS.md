# Implementation status

What is actually real, and what only looks real. Kept honest and current so
nobody demos a mock believing it is a feature.

**Legend** — ✅ real · 🟡 partial · 🔴 mocked, non-functional

_Last updated: after the QR fix and test setup. The application is still
entirely front-end: there is no backend, no persistence and no authentication._

## Platform

| Area                | State | Notes                                                                                                        |
| ------------------- | ----- | ------------------------------------------------------------------------------------------------------------ |
| Build & dev tooling | ✅    | Standalone Vite + TanStack Start. No Lovable dependency.                                                     |
| Production bundle   | ✅    | `bun run build` → `.output/`, served by `bun run start`. Verified.                                           |
| Deploy target       | ✅    | Node server by default; `NITRO_PRESET` for Cloudflare/Vercel/Netlify.                                        |
| Configuration       | ✅    | `src/config/app.ts`, `VITE_APP_ORIGIN`.                                                                      |
| Error reporting     | 🟡    | Vendor-neutral seam exists; no provider wired, so errors reach the console only.                             |
| Persistence         | 🟡    | Local-only. Identity, RSVPs, saves, plans and settings survive a reload; media, messages and orders do not.  |
| Backend             | 🔴    | Not started. Convex planned.                                                                                 |
| Authentication      | 🔴    | `src/lib/auth.ts` accepts any 6-digit code. Kinde planned.                                                   |
| Authorisation       | 🔴    | None. `/admin` and `/host/*` are reachable by anyone.                                                        |
| Tests               | 🟡    | Vitest + Testing Library. 72 tests: QR encoding, feed ranking, access, persistence. Most surfaces uncovered. |

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
