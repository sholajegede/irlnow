# Environment variables

Copy `.env.example` to `.env` for local development. `.env` is git-ignored;
`.env.example` is committed and must never contain a real value.

## The `VITE_` rule

Vite inlines every `VITE_`-prefixed variable into the client bundle. **Anything
with that prefix is public** — visible to anyone who opens devtools. It is not
a secret store, and no amount of build configuration makes it one.

Secrets belong in the deployment environment, read only from server-only
modules (`*.server.ts`, or files under `src/server/`, which the build's import
protection keeps out of the client bundle).

## Current variables

### `VITE_APP_ORIGIN`

**Public. Required in production; defaults to `https://irlnow.app`.**

The origin this deployment is served from, without a trailing slash.

Used by `src/config/app.ts` to build share links, invite links, QR payloads,
`.ics` calendar UIDs and Open Graph URLs. Getting it wrong produces share links
pointing at the wrong host — the failure is silent, so set it per environment.

```sh
# local
VITE_APP_ORIGIN=http://localhost:8080
# production
VITE_APP_ORIGIN=https://irlnow.app
```

## Build-time variables

### `NITRO_PRESET`

**Build only. Optional; defaults to `node-server`.**

Selects the deployment target for `bun run build`. `node-server` emits
`.output/server/index.mjs`, runnable with `bun run start` and deployable to any
container host. Other useful values: `cloudflare-module`, `vercel`, `netlify`.

### `PORT`

**Optional; defaults to `8080`.** Port for the dev server and the built server.

## Planned

Not yet wired. Listed so the split between public and secret is settled before
the integrations land.

| Variable                  | Scope      | Purpose                              |
| ------------------------- | ---------- | ------------------------------------ |
| `VITE_CONVEX_URL`         | Public     | Convex deployment URL for the client |
| `CONVEX_DEPLOY_KEY`       | **Secret** | Convex deploys from CI               |
| `VITE_KINDE_DOMAIN`       | Public     | Kinde issuer domain                  |
| `VITE_KINDE_CLIENT_ID`    | Public     | Kinde SPA client id                  |
| `VITE_KINDE_REDIRECT_URI` | Public     | Post-login callback                  |
| `KINDE_CLIENT_SECRET`     | **Secret** | Server-side token exchange           |

## Checklist for a new variable

1. Does it need to reach the browser? If not, no `VITE_` prefix.
2. Is it a secret? Then it must not have a `VITE_` prefix, under any argument.
3. Add it to `.env.example` with a placeholder and a comment.
4. Document it here.
5. Read it through `src/config/`, not scattered `import.meta.env` lookups.
