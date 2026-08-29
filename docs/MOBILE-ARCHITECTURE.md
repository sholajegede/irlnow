# Mobile architecture and the web/mobile split

Decided before implementation, from the repository as it actually stands
(commit `0b62156`), not from a template.

## The shape

```
        apps/mobile              apps/web
     Expo · React Native      TanStack Start
     PRIMARY CONSUMER         public pages, SEO,
     iOS + Android            host/venue/admin
            \                      /
             \                    /
              packages/domain
        types · ranking · graph · money
        tickets · access — pure, no platform
                    |
                  convex
        data · realtime · authorisation
                    |
                  Kinde
                 identity
```

**Shared:** domain types, feed ranking, the social graph, money and ticket
maths, access rules, validation. All pure TypeScript, no React, no DOM, no
React Native.

**Not shared:** UI. A component that satisfies both a mouse and a thumb
satisfies neither. Web and mobile each get presentation built for their own
input model, over identical domain logic.

## Why a monorepo rather than a second repository

The domain logic is the product. `ranking.ts`, `graph.ts` and `tickets.ts`
encode decisions — the finite feed, attendance-derived people discovery,
platform fees — that must not drift between the two clients. Two repositories
means two copies of those rules and, eventually, two different products.

The audit found this is cheap to do: of 29 modules under `src/lib`, only four
touch a platform (`data.ts` imports JPEGs, `attend.ts` uses `document` for
`.ics` download, `use-live-thread.ts` and `persistent-state.ts` are React).
Everything else is already portable.

## The web/mobile split

Validated by reading all 61 routes. 26 render the consumer app shell
(`BottomNav`); those are the mobile product. The rest are entry points,
full-screen flows, or operator tooling.

### Mobile — the consumer product

Discovery and the loop it feeds: discover, event detail, people, going,
saved, search, map, plans, connections, messages, event chat, notifications,
memories, archive, recap, profile, settings, invite, safety, membership,
wallet, the attendee experience (`/e/$id`), the event wall (`/w/$id`),
tickets and QR check-in, and event creation.

Mobile is where the product's native advantages live: camera at the event,
QR at the door, push when the wall fills, location for what's nearby, share
sheet for invites.

### Web — where the browser is genuinely better

| Surface                            | Why it stays on web                                                          |
| ---------------------------------- | ---------------------------------------------------------------------------- |
| `/x/$id` public event page         | SEO and link unfurls. An app cannot be crawled.                              |
| `/w/$id` shared wall, `/share/$id` | Opens for someone with no app installed.                                     |
| `/e/$id` QR landing                | A guest at the door must not be made to install anything first.              |
| `/host/*` organiser workspace      | Guest lists, payouts, analytics, bulk messaging — keyboard and a big screen. |
| `/venue/*` venue portal            | Same: a venue manager is at a desk.                                          |
| `/admin`                           | Operator tooling. Never ships in a consumer binary.                          |
| `/checkout/$id`                    | Card entry stays in the browser until a payment provider is chosen.          |

The overlap is deliberate. An event exists as a public web page _and_ a native
screen, because a share link must open for a stranger with no app, and the same
event must feel native to someone who has one.

### Combined for mobile

The web prototype has three separate inboxes (`/messages`, `/inbox`,
`/notifications`) and two memory surfaces (`/memories`, `/archive`). On a
five-tab mobile app those become one Inbox with segments and one Memories
screen with a time filter. Modal-shaped routes — `/invite`, `/share/$id`,
`/qr/$id`, `/review/$id`, `/plan/new` — become sheets, not screens.

## Navigation

Five tabs, chosen so the discovery feed keeps the centre of gravity:

```
Discover        the finite feed — the front door
People          who is out, derived from attendance
Going       ●   your agenda: tickets, QR, event chat
Create      +   event or plan
You             profile, memories, settings
```

Everything else is pushed onto a stack from these, or presented as a sheet.

## Product constraints that survive the port

These are not implementation details; they are what the product _is_. Each is
already enforced in code and will be enforced in the mobile app too:

- **`FEED_CAP = 10`, ending in "That's it for now. Go outside."** The feed runs
  out on purpose. It must never become an infinite list, and `onEndReached`
  must never fetch more.
- **People surface only through attendance.** There is no user-listing query
  and there will be no stranger-browsing screen.
- **Anonymous users get honest copy.** No claim that implies we know someone we
  do not. Enforced by `PERSONALISABLE_REASONS` in the ranking engine.
- **Privacy filtering happens on the server.** The mobile client is no more
  trusted than the web one.
- **Real QR codes, real timestamps, integer minor units, server-enforced
  capacity.**

## Anonymous first

The app opens on the feed, not a login wall. A visitor browses events, reads
detail and sees social proof with no account. Identity is requested at the
point it buys something specific — "see who you might vibe with" — and unlocks
progressively from there.

Architecturally: every Convex read behind an anonymous surface must answer with
no session, and the mobile client must hold a usable state with no token.
`convex/events.ts` already satisfies this.

## Native capabilities and their fallbacks

| Capability    | Used for                      | Denied / unavailable             |
| ------------- | ----------------------------- | -------------------------------- |
| Camera        | Photos at the event           | Fall back to library picker      |
| Photo library | Adding to the wall            | Explain, offer Settings          |
| QR scanning   | Check-in at the door          | Manual code entry                |
| Push          | Wall updates, event reminders | In-app inbox still works         |
| Location      | Distance and what's nearby    | Fall back to city-level (London) |
| Deep links    | Share links open in-app       | Web page handles the same URL    |
| Share sheet   | Invites                       | Copy link                        |

No capability is a hard requirement to use the app. Each degrades to something
that still works.

## Staging the migration

The mobile app is built against Convex from the first screen — it never grows a
fixture layer of its own. The web app keeps its fixtures until each surface is
moved, so the two are never blocked on each other.

`packages/domain` is extracted first, so both clients share one copy of the
rules from the beginning rather than being reconciled later.
