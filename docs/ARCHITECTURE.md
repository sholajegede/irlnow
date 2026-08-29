# Architecture

Target shape of the IRL NOW platform, and the reasoning behind the decisions
that are hard to reverse later.

## Ecosystem

```
                    ┌──────────────┐
                    │   Convex     │  data, realtime, server logic
                    └──────┬───────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
      ┌─────┴─────┐  ┌─────┴─────┐  ┌─────┴──────┐
      │    Web    │  │  Mobile   │  │  Object    │
      │  TanStack │  │   Expo    │  │  storage   │
      │   Start   │  │    RN     │  │  (media)   │
      └─────┬─────┘  └─────┬─────┘  └────────────┘
            │              │
            └──────┬───────┘
                   │
             ┌─────┴─────┐
             │   Kinde   │  identity
             └───────────┘
```

**Shared** — TypeScript domain types, validation schemas, ranking and other
pure domain logic, API contracts.
**Not shared** — UI components. Web and mobile get presentation designed for
each platform; forcing a shared component layer produces something that fits
neither.

## Layering

```
routes/        Routing, page composition, data binding.       No business rules.
components/    Presentation. Props in, events out.            No business rules.
lib/<domain>/  Domain logic: ranking, graph, money, tickets.  Pure, testable.
config/        Environment-derived configuration.
convex/        Schema, queries, mutations, authorisation.     (planned)
```

The rule that matters: **business logic does not live in components.** The
prototype violates this in exactly one important place — feed ranking is inline
in `routes/index.tsx` — and that is on the fix list.

## Decisions

### Web stays on TanStack Start

The original spec named Next.js. The prototype is TanStack Start, and this
migration keeps it.

TanStack Start already provides everything the web surface needs: SSR, file-based
routing, server functions, streaming, and per-route `head()` — which the public
event page `/x/$id` already uses to emit real per-event Open Graph tags from
loader data. There is no capability gap to close.

Porting 61 routes to the App Router would consume the whole budget and produce
no product progress, against an explicit instruction not to rewrite blindly.
The work that matters — domain model, Convex schema, Kinde integration, ranking
— is framework-independent, so this decision stays cheap to reverse. If Next.js
becomes a requirement, port after that work exists, not before.

### Convex for data, Kinde for identity

Kinde owns identity: sign-in, sessions, tokens, account deletion. Convex owns
application data and realtime. Convex verifies Kinde-issued JWTs; it does not
become the auth provider.

Realtime earns its place on the live event wall, RSVP counts, check-ins, chat
and notifications — surfaces where a stale number is a visibly wrong number.
Everywhere else, prefer plain queries: a subscription per component is a
performance problem waiting to happen.

### Anonymous discovery is the default path

Authentication is never the front door. A visitor must reach an event, see who
is going and understand why it might be worth their evening before anything
asks who they are.

This is an architectural constraint, not a UX preference: every discovery query
must be answerable without an identity, and every personalised claim must
degrade to an honest non-personalised one. The prototype's `goingGraph()`
already does this correctly by defaulting `myInterests` to `[]`, and that
property must survive the move to Convex.

### Media never enters the database

Convex stores metadata, ownership and relationships. Binary media goes to object
storage. Upload, processing, failure and deletion are explicit states, not
implied by a URL's presence.

### The social graph derives from attendance

From `lib/graph.ts`:

> _Everything social in IRL NOW is derived from who said yes to what, never
> from browsing strangers._

A person surfaces because they said yes to something you can also join. There is
no stranger-browsing surface, and adding one would change what the product is.
Enforce it server-side once there is a server: a client that asks for people
outside that relation should get nothing back.

## Domain model direction

The prototype's types are shaped for display. Storage types need to be shaped
for truth, with formatting done at the edge:

| Prototype                       | Target                                                            |
| ------------------------------- | ----------------------------------------------------------------- |
| `dateLabel: "Tonight · 7:30pm"` | `startsAt: number` (epoch ms) + `timezone`, formatted for display |
| `price: "£12"`                  | `priceMinor: number` + `currency: "GBP"`                          |
| `distance: "1.2 km"`            | Computed per viewer from coordinates; never stored on the event   |
| `when: "tonight" \| "weekend"`  | Derived from `startsAt` at query time                             |
| `going: string[]`               | An `rsvps` relation with status, timestamps and ownership         |

Explicit status enums over scattered booleans; stable typed IDs over bare
strings.

## Performance constraints

- The discovery feed and event walls paginate. The finite feed is a product
  decision, not a data-loading strategy — the People and Memories surfaces
  still need real pagination.
- One realtime subscription per _screen_, not per component.
- `store.tsx` at 829 lines re-renders every consumer on every change. Splitting
  it into feature-scoped contexts behind the existing `useApp` surface is the
  single highest-value performance change available, and it does not require
  touching route code.
- Images ship at the size they are displayed. The prototype already sets
  `width`, `height` and `loading="lazy"` on feed images; keep that.

## Security posture

- Authorisation is enforced server-side, in Convex, always. Client-side role
  checks are a UI convenience and nothing more.
- `/admin` and `/host/*` are currently unprotected. They must be gated before
  any deployment reachable by the public.
- No secret ever carries a `VITE_` prefix. See [ENVIRONMENT.md](ENVIRONMENT.md).
- Location is exposed at the precision the user chose. `PrivacySettings`
  already models this; the server must honour it rather than trusting the
  client to filter.
