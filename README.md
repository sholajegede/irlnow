# IRL NOW

Social discovery for the real world. IRL NOW shows you what's happening near
you, who's going, and gets you out of the house — starting in London.

The product answers four questions, in order:

> **What's happening? · Who's going? · Who might I vibe with? · Should I go?**

## Repository layout

A monorepo. The **mobile app is the primary consumer product**; the web app
carries the surfaces a browser does better — public event pages, share links,
SEO, and the host, venue and admin workspaces.

```
apps/mobile        Expo + React Native — iOS and Android
apps/web           TanStack Start — public pages, host, venue, admin
packages/domain    Product rules shared by both clients
convex             Backend: schema, functions, authorisation
tests/convex       Backend tests
```

## Getting started

Requires [Bun](https://bun.sh) 1.2+.

```sh
bun install
cp .env.example .env

bun run convex:dev     # backend
bun run convex:seed    # sample catalogue
bun run dev:web        # web at http://localhost:8080
bun run dev:mobile     # Metro; press i or a
```

Mobile needs an iOS or Android toolchain — see
[`docs/MOBILE-SETUP.md`](docs/MOBILE-SETUP.md).

## Commands

| Command             | What it does                               |
| ------------------- | ------------------------------------------ |
| `bun run dev`       | Start the dev server with HMR              |
| `bun run build`     | Production build into `.output/`           |
| `bun run start`     | Run the built server bundle                |
| `bun run typecheck` | TypeScript, no emit                        |
| `bun run lint`      | ESLint                                     |
| `bun run format`    | Prettier, write                            |
| `bun run check`     | Typecheck + lint — run before every commit |

## Environment

Copy `.env.example` to `.env` and fill it in. Only `VITE_`-prefixed variables
reach the browser; treat every one of them as public. Secrets belong in
server-only modules and the deployment environment, never in `VITE_*`.

See [`docs/ENVIRONMENT.md`](docs/ENVIRONMENT.md) for the full list.

## Deployment

`bun run build` produces a self-hosted Node server at
`.output/server/index.mjs`, runnable with `bun run start`. To target a
different platform, set `NITRO_PRESET` at build time:

```sh
NITRO_PRESET=cloudflare-module bun run build
NITRO_PRESET=vercel            bun run build
```

## Documentation

- [`docs/MOBILE-ARCHITECTURE.md`](docs/MOBILE-ARCHITECTURE.md) — the mobile/web split and why
- [`docs/MOBILE-SETUP.md`](docs/MOBILE-SETUP.md) — simulators, emulators, devices, builds
- [`docs/ASSESSMENT.md`](docs/ASSESSMENT.md) — what the prototype does today, and its gaps
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — target architecture and the decisions behind it
- [`docs/CONVEX.md`](docs/CONVEX.md) — backend schema, rules and local setup
- [`docs/ENVIRONMENT.md`](docs/ENVIRONMENT.md) — environment variables
- [`docs/STATUS.md`](docs/STATUS.md) — what is real, what is still mocked

## Stack

- **Web** — TanStack Start (React 19, SSR, file-based routing)
- **Styling** — Tailwind CSS v4, shadcn/ui, Syne + Plus Jakarta Sans
- **Language** — TypeScript, strict
- **Mobile** _(planned)_ — React Native + Expo
- **Backend** _(planned)_ — Convex
- **Identity** _(planned)_ — Kinde
