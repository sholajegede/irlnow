# Implementation status

What is actually real, and what only looks real. Kept honest and current so
nobody demos a mock believing it is a feature.

**Legend** — ✅ real · 🟡 partial · 🔴 mocked, non-functional

*Last updated: after the de-Lovable migration. The application is still
entirely front-end: there is no backend, no persistence and no authentication.*

## Platform

| Area | State | Notes |
| --- | --- | --- |
| Build & dev tooling | ✅ | Standalone Vite + TanStack Start. No Lovable dependency. |
| Production bundle | ✅ | `bun run build` → `.output/`, served by `bun run start`. Verified. |
| Deploy target | ✅ | Node server by default; `NITRO_PRESET` for Cloudflare/Vercel/Netlify. |
| Configuration | ✅ | `src/config/app.ts`, `VITE_APP_ORIGIN`. |
| Error reporting | 🟡 | Vendor-neutral seam exists; no provider wired, so errors reach the console only. |
| Persistence | 🔴 | Nothing survives a page reload. |
| Backend | 🔴 | Not started. Convex planned. |
| Authentication | 🔴 | `src/lib/auth.ts` accepts any 6-digit code. Kinde planned. |
| Authorisation | 🔴 | None. `/admin` and `/host/*` are reachable by anyone. |
| Tests | 🔴 | No runner, no tests, no CI. |

## Product surfaces

| Surface | State | Notes |
| --- | --- | --- |
| Discovery feed | 🟡 | Renders and filters correctly, from 10 hardcoded events. Ranking is inline in the route. |
| Finite feed ("Go outside") | ✅ | Deliberate product constraint, `FEED_CAP = 10`. Preserve. |
| Event detail | 🟡 | Complete UI over mock data. |
| Public event page `/x/$id` | ✅ | Real per-event OG/meta from loader data. Correct for sharing today. |
| People discovery | 🟡 | `graph.ts` logic is sound; the roster is 10 fixed people. |
| "I'm Going" | 🟡 | Toggles in-memory state; lost on reload. |
| Onboarding / interests | 🟡 | Collects name, email, city, interests into memory only. |
| Anonymous → identified | ✅ | Correctly modelled: anonymous users get non-personalised copy. |
| Plans | 🟡 | Create, join and vote work in memory. Three seeded plans. |
| Messaging | 🔴 | `use-live-thread.ts` simulates the other person with timers and a canned reply pool. |
| Notifications | 🔴 | `buildNotifications()` fabricates a list. No delivery, no push. |
| Event wall / media | 🔴 | `wallPhotos()` generates fake photos from event-cover assets. No upload, no storage. |
| Face tagging / "you appear in" | 🔴 | `youIn` is a hash of the photo index. No recognition of any kind. |
| **QR codes** | 🔴 | **`components/QrCode.tsx` is a decorative matrix. It encodes nothing and cannot be scanned.** Affects `/qr/$id`, `/ticket/$id` and door check-in. |
| Check-in / door mode | 🔴 | UI works against a generated guest list. No scanning. |
| Ticketing & checkout | 🔴 | Tiers, fees and orders compute correctly, but no card is charged. Labelled in-app. |
| Payments | 🔴 | `payments.ts` models a PSP's shape. Nothing leaves the device. |
| Membership (IRL NOW+) | 🔴 | Join and cancel mutate memory. No billing. |
| Boosts / promotion | 🔴 | Reach and ROI figures are formulas over invented constants. |
| Venue capacity drops | 🔴 | Claim and publish mutate memory. |
| Host workspace | 🟡 | Rich UI; guest lists, traffic and payouts are generated from event-id hashes. |
| Admin | 🔴 | Moderation queue, platform stats and city rows are hardcoded. Unprotected. |
| Safety: report & block | 🟡 | Records to memory. No moderation pipeline behind it. |
| Privacy settings | 🟡 | Stored and read by the UI; not enforced anywhere, because there is no server. |
| Accessibility settings | ✅ | Reduced motion and high contrast are real, applied at the root. |

## Known-misleading data

These generate confident, specific, entirely invented output. Each needs either
a real source or a visible "sample data" treatment before any external demo.

- `accessInfo()` — **fabricates step-free access, accessible toilets and
  hearing loops from a hash of the event id.** Highest-priority removal: a
  wrong access claim can strand someone at a venue door.
- `guestList()` / `trafficFor()` — synthetic attendees and funnel figures.
- `platformStats`, `cityRows`, `REVENUE_MIX` — invented business metrics.
- `wallPhotos()` — synthetic photos, contributors and face tags.
- `travelOptions()` / `lastTransport()` — invented tube lines, fares and
  last-train times.
- `inviteStats()` — fixed 72% / 41% / 24% conversion rates.
- `waitlistOdds()` — invented probability of getting in.
