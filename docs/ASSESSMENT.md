# Technical assessment of the IRL NOW prototype

*Written against commit `499c0a1`, the unmodified Lovable-generated import.*

## Summary

The prototype is a **single-page React application with no backend**. 61 routes,
~26,000 lines, rendered server-side by TanStack Start but fed entirely from
in-memory mock data. There are no network calls, no persistence of any kind, and
no server functions.

That sounds damning; it isn't. The prototype is unusually good at the thing
prototypes are for. The product thinking is specific, opinionated and largely
correct, and it is expressed in code rather than in a document. **The primary
risk in this migration is destroying that thinking while replacing the
plumbing underneath it.**

## What is genuinely valuable and must survive

### 1. The product thesis is encoded, not decorative

The finite feed is the clearest example. `FEED_CAP = 10` in `src/lib/data.ts`
carries the comment *"The feed is deliberately finite"*, and the Discover route
ends with a card reading **"That's it for now. Go outside."** This is the
anti-social-media positioning implemented as a constraint, not a slogan. It
must not be quietly replaced with infinite scroll during the Convex migration.

### 2. People-first discovery with the right privacy instinct

`src/lib/graph.ts` is the strongest module in the codebase. Its header states
the rule plainly:

> *Everything social in IRL NOW is derived from who said yes to what, never
> from browsing strangers.*

`peopleOut()` enforces this structurally: a person can only surface because they
said yes to something you can also join. This is exactly the privacy posture the
product needs, and it is already load-bearing. Preserve the invariant when the
graph moves to Convex.

### 3. Social proof scales honestly

`goingGraph()` samples a small roster and scales counts to the real headcount
deterministically, producing lines like *"12 people into the same things as
you."* Critically, `myInterests` defaults to `[]`, so an anonymous visitor gets
the neutral *"Maya and 45 others are going"* rather than a personalised claim
the system cannot justify. The anonymous/identified distinction the spec asks
for is already respected.

### 4. Monetisation is modular

`money.ts`, `tickets.ts`, `payments.ts` and `venues.ts` are separated from
product logic. `payments.ts` explicitly models "the shape a real processor
integration would take… so the flows can be swapped for a live PSP later."
Retention-driven upgrade (`retention.ts` — free walls expire at 30 days,
members keep forever) is a coherent, non-predatory conversion trigger.

### 5. The design system is complete and distinctive

`src/styles.css` defines a full OKLCH token set: plum-black canvas, coral
primary, lime accent, Syne display over Plus Jakarta Sans. It includes
accessibility affordances most prototypes skip — `.motion-reduce-all` and
`.contrast-more`, wired to real settings in the store and applied in
`__root.tsx`. Keep the tokens; they are the brand.

### 6. Attendee experience is designed for the no-app case

`/e/$id` is a mobile-web attendee experience reachable by QR with only a first
name. `/x/$id` is a public event page with proper per-event OG tags built from
loader data. `/w/$id` is the post-event wall. The share → attend → memory loop
the spec describes is already laid out.

## What is wrong

### Architecture

| Issue | Detail |
| --- | --- |
| **God store** | `src/lib/store.tsx` is 829 lines: ~80 `useState` hooks and ~90 actions in one context. Every state change re-renders every consumer. It is the single largest obstacle to both correctness and performance. |
| **No persistence** | Nothing is saved. Reloading the page discards onboarding, RSVPs, uploads, plans — everything. |
| **No backend** | Zero `fetch` calls, zero server functions. All data is module-scope constants. |
| **No auth** | `src/lib/auth.ts` is self-described as *"Dummy auth model… No real backend."* Any 6-digit code is accepted; `DEMO_CODE = "204060"` is a hint, not a check. |
| **Business logic in components** | Feed ranking lives inline in `routes/index.tsx` rather than behind the ranking abstraction the spec requires. |
| **No tests** | No test runner, no test files, no CI. |

### Correctness

- **The QR code is decorative.** `components/QrCode.tsx` renders a
  deterministic pseudo-random matrix with valid-looking finder patterns. It
  encodes nothing and cannot be scanned. Every QR surface in the app —
  `/qr/$id`, `/ticket/$id`, door check-in — is therefore non-functional.
  This is the most misleading thing in the codebase: it looks real in a
  screenshot and fails in a venue.
- **Mock data is presented as live data.** Deterministic generators
  (`guestList`, `wallPhotos`, `trafficFor`, `platformStats`) produce confident
  figures with no indication they are synthetic.
- **`peopleByIds` lies to the type system.** It asserts `people.find(...)!` and
  then filters, so an unknown id is silently dropped while the signature claims
  a complete `Person[]`. It does not throw, but a missing person becomes an
  invisible gap in a roster rather than an error anyone notices.

### Data model

Domain types are shaped for display rather than storage:

- `dateLabel: "Tonight · 7:30pm"` is a **string**, with `attend.ts` reverse-
  parsing it back into a `Date` via regex. Events need real timestamps.
- `price: "£12"` / `"Pay as you eat"` is a **string**, re-parsed by
  `priceToPence()`. Money needs integer minor units plus a currency.
- `distance: "1.2 km"` is a **string**, and is precomputed per event rather
  than relative to the viewer — it cannot be correct for more than one user.
- `when: "tonight" | "weekend"` cannot survive a real calendar.
- Relationships are string-id arrays in one blob; there is no ownership model
  and no authorisation boundary anywhere.

### Security and privacy

No authorisation exists, because nothing is server-side yet. Worth naming
before it becomes a real gap: `/admin` and `/host/*` are reachable by anyone,
`PrivacySettings` in the store is honoured only by the UI that reads it, and
`accessInfo()` fabricates step-free-access and hearing-loop claims from a hash
of the event id. **Fabricated accessibility data is a safety issue, not a
cosmetic one**, and must not reach real users.

## Lovable coupling found (all removed in `d81c766`)

| Artifact | Resolution |
| --- | --- |
| `@lovable.dev/vite-tanstack-config` | Replaced with an explicit `vite.config.ts` |
| `src/lib/lovable-error-reporting.ts` (`window.__lovableEvents`) | Replaced with `src/lib/observability/report-error.ts` |
| `irl-now.lovable.app` in `invite.ts`, `share.$id.tsx` | Replaced with `VITE_APP_ORIGIN` via `src/config/app.ts` |
| `bunfig.toml` release-age allowlist for `@lovable.dev/*` | Removed |
| `AGENTS.md` (Lovable sync warning) | Deleted |
| `README.md` (Lovable onboarding) | Rewritten |
| `package.json` name `tanstack_start_ts` | Renamed `irlnow-web` |
| Cloudflare-module build preset | Defaults to `node-server`, `NITRO_PRESET` overrides |

Verified standalone: `bun install && bun run build && bun run start` produces
and serves a working bundle with no Lovable package present.

## Route inventory

61 routes, assessed against the target architecture:

**Keep as routes** — `/`, `/welcome`, `/onboard`, `/auth`, `/you`, `/search`,
`/people`, `/going`, `/saved`, `/create`, `/event/$id`, `/e/$id`, `/x/$id`,
`/w/$id`, `/series/$id`, `/plans`, `/plan/$id`, `/messages`, `/chat/$id`,
`/dm/$id`, `/person/$id`, `/notifications`, `/settings`, `/host/*`, `/venue/*`,
`/admin`, `/memories`, `/recap/$id`.

**Better as sheets/modals on mobile** — `/invite`, `/share/$id`, `/qr/$id`,
`/review/$id`, `/plan/new`, `/host/boost/$id`, `/host/message/$id`.
The prototype already ships `vaul` drawers and Radix dialogs for this.

**Consolidation candidates** — `/inbox` and `/messages` and `/notifications`
are three inboxes; `/archive` and `/memories` overlap; `/keep/$id` and
`/membership` are the same purchase from two entry points.

**Web-only** — `/x/$id`, `/w/$id`, `/e/$id` (QR landing), `/admin`,
`/venue/*`. These are the SEO, share-target and operator surfaces and should
stay on web even after the mobile app ships.

## Recommended build order

1. **Domain model** — real `Date`, integer money, computed distance, typed IDs.
   Everything downstream depends on getting this right first.
2. **Split the store** — feature-scoped contexts behind the existing `useApp`
   surface, so route code does not churn.
3. **Convex schema and queries** — events, people, RSVPs first; that is the
   core loop.
4. **Kinde authentication** — with anonymous discovery preserved as the default
   path. Do not gate the front door.
5. **Ranking abstraction** — lift feed logic out of `routes/index.tsx`.
6. **Real QR** — encode actual URLs; replace the decorative matrix.
7. **Tests** — starting with the graph invariant and the ranking rules.
8. **Media pipeline** — object storage, Convex holds metadata only.
9. **Mobile** — once the loop is validated on web.

## One decision to confirm

The spec names **Next.js** for web (§31). The prototype is **TanStack Start**,
which already provides SSR, file routing, server functions, streaming and
per-route head management — every web requirement in §33. Porting 61 routes to
the App Router would consume the entire budget and deliver no product progress,
so this migration keeps TanStack Start.

Nothing in the plan above depends on that choice: the domain model, Convex
schema, Kinde integration and ranking logic are all framework-independent. If
Next.js is required for another reason, the port is cheaper after this work,
not before it.
