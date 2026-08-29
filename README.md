# IRL NOW

Social discovery for the real world. IRL NOW shows you what's happening near
you, who's going, and gets you out of the house — starting in London.

The product answers four questions, in order:

> **What's happening? · Who's going? · Who might I vibe with? · Should I go?**

## Repository layout

This repository currently holds the **web application**, which is the
development and private-testing surface. A React Native + Expo mobile app will
join it once the core loop and backend are validated; both will share the same
backend, identity provider and domain types.

```
src/
  config/          Environment-derived app configuration
  components/      Product components
  components/ui/   shadcn/ui primitives
  lib/             Domain logic (events, people, plans, tickets, money, …)
  lib/observability/  Error capture and reporting
  routes/          File-based routes (TanStack Start)
  styles.css       Design system tokens
```

## Getting started

Requires [Bun](https://bun.sh) 1.2+ (or Node 22+ with npm).

```sh
bun install
cp .env.example .env
bun run dev
```

The app runs at http://localhost:8080.

## Commands

| Command | What it does |
| --- | --- |
| `bun run dev` | Start the dev server with HMR |
| `bun run build` | Production build into `.output/` |
| `bun run start` | Run the built server bundle |
| `bun run typecheck` | TypeScript, no emit |
| `bun run lint` | ESLint |
| `bun run format` | Prettier, write |
| `bun run check` | Typecheck + lint — run before every commit |

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

- [`docs/ASSESSMENT.md`](docs/ASSESSMENT.md) — what the prototype does today, and its gaps
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — target architecture and the decisions behind it
- [`docs/ENVIRONMENT.md`](docs/ENVIRONMENT.md) — environment variables
- [`docs/STATUS.md`](docs/STATUS.md) — what is real, what is still mocked

## Stack

- **Web** — TanStack Start (React 19, SSR, file-based routing)
- **Styling** — Tailwind CSS v4, shadcn/ui, Syne + Plus Jakarta Sans
- **Language** — TypeScript, strict
- **Mobile** *(planned)* — React Native + Expo
- **Backend** *(planned)* — Convex
- **Identity** *(planned)* — Kinde
