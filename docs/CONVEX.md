# Convex backend

Convex holds application data, runs the server-side logic and enforces
authorisation. Kinde owns identity; Convex verifies the tokens Kinde issues and
never becomes the auth provider itself.

## Status

The core-loop schema and its queries and mutations exist and are tested. **The
app does not read from Convex yet** — the UI still runs on the in-memory
fixtures in `src/lib/data.ts`. Wiring the two together is the next milestone.

Authentication is not connected either, so `requireUser` currently has no way to
succeed from a browser: every write is reachable only from the CLI or a test
until Kinde lands. See [STATUS.md](STATUS.md).

## Local development

The project is configured against a **local** deployment — it runs on your
machine at `http://127.0.0.1:3210` and holds no data in the cloud.

```sh
bun run convex:dev     # start the deployment and watch for changes
bun run convex:seed    # replace the catalogue with sample data
```

`convex dev` writes `.env.local` with `CONVEX_DEPLOYMENT` and
`VITE_CONVEX_URL`. That file is git-ignored and machine-specific.

To move to a cloud deployment later:

```sh
bunx convex dev --configure existing --dev-deployment cloud
```

## Sample data

`convex/seedData.ts` is **invented**. No event, organiser or person in it is
real. `seed.ts` wipes the catalogue before inserting, so it is safe to re-run,
and refuses to execute against a production deployment.

It exists to exercise the real domain model. The prototype stored
`"Tonight · 7:30pm"` and `"£12"` as display strings and regex-parsed them back
into values; the seed expresses the same catalogue as epoch millis, integer
minor units and real coordinates.

## Layout

| File                     | What it holds                                  |
| ------------------------ | ---------------------------------------------- |
| `schema.ts`              | Tables, indexes and shared validators          |
| `auth.ts`                | `currentUser`, `requireUser`, ownership checks |
| `events.ts`              | Discovery reads and the event roster           |
| `rsvps.ts`               | "I'm Going", check-in, and your own RSVPs      |
| `seed.ts`, `seedData.ts` | Development seed                               |
| `_generated/`            | Convex codegen — committed, never hand-edited  |

## Rules

**Identity comes from the request context, never from an argument.** A `userId`
in `args` is a claim by the caller, not a fact. Every mutation resolves the
caller through `requireUser`, which reads the verified JWT subject. This is the
difference between an app and one where any account can write as any other.

**Discovery answers anonymously.** `listUpcoming`, `getBySlug` and `roster` all
return correct results with no session. Queries that concern the caller —
`rsvps.mine`, `rsvps.myEventIds` — return `null` or `[]` rather than throwing.
An event page must render for someone who is not signed in.

**People are reachable only through attendance.** There is deliberately no query
that lists users. `events.roster` is the single route by which one person
becomes visible to another, and it filters on profile visibility server-side.
Adding a user-listing query would change what the product is.

**Store truth, format at the edge.** Timestamps are epoch millis with a
timezone. Money is integer minor units with a currency. Distance is computed
against the viewer and never stored on an event.

**Declare argument and return validators on every function.** The return
validator is what stops a field added to a handler leaking out of the API
without anyone deciding it should.

## Testing

Backend tests use `convex-test` and run in-memory on the edge runtime — no
deployment needed, so they run in CI.

```sh
bun run test               # everything
bunx vitest run --project convex
```

`tests/convex/helpers.ts` provides `seedEvent`, `seedUser` and `withIdentity`.
`withIdentity` supplies only a `subject`, mirroring exactly what a verified
Kinde JWT gives the server and nothing more.

## Not modelled yet

Messaging, media, plans, ticketing, venues, connections, notifications and
promotion. Adding tables nothing reads would be guessing at relationships
before the loop that uses them exists.
