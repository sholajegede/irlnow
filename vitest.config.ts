import { defineConfig } from "vitest/config";

/**
 * Convex backend tests.
 *
 * They live at the repository root because `convex/` does — it is shared by
 * every client, not owned by one. Each app runs its own suite from its own
 * directory. Convex functions execute on the edge runtime, so that is where
 * they are tested.
 */
export default defineConfig({
  test: {
    name: "convex",
    globals: true,
    environment: "edge-runtime",
    include: ["tests/convex/**/*.test.ts"],
    server: { deps: { inline: ["convex-test"] } },
  },
});
