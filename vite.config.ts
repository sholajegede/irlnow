import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

/**
 * Build target for `vite build`.
 *
 * Defaults to a self-hosted Node server (`.output/server/index.mjs`), which runs
 * anywhere a container does. Override with NITRO_PRESET to deploy elsewhere —
 * e.g. `cloudflare-module`, `vercel`, `netlify`. See nitro.build/deploy.
 */
const serverPreset = process.env["NITRO_PRESET"] ?? "node-server";

export default defineConfig(({ command }) => ({
  server: {
    port: Number(process.env["PORT"] ?? 8080),
    host: true,
  },

  resolve: {
    // `@/*` -> `src/*`, read from tsconfig.json so the alias has one source of truth.
    tsconfigPaths: true,
    // A second copy of React or the query client breaks hooks and the cache.
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },

  css: { transformer: "lightningcss" },

  plugins: [
    tailwindcss(),
    tanstackStart({
      // Route the bundled server entry through src/server.ts, which wraps SSR
      // failures in a readable error page instead of a raw stack trace.
      server: { entry: "server" },
      // Server-only modules must never reach the client bundle.
      importProtection: {
        behavior: "error",
        client: { files: ["**/server/**"], specifiers: ["server-only"] },
      },
    }),
    // Nitro produces the deployable server bundle; it has no role in `vite dev`.
    ...(command === "build" ? [nitro({ preset: serverPreset })] : []),
    viteReact(),
  ],
}));
