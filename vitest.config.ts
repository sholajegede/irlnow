import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import viteReact from "@vitejs/plugin-react";

const srcAlias = { "@": fileURLToPath(new URL("./src", import.meta.url)) };

/**
 * Two suites with genuinely different runtimes.
 *
 * Convex functions execute on the edge runtime and have no DOM; the app is
 * React and needs one. Running both under a single environment would test one
 * of them somewhere it never actually runs.
 */
export default defineConfig({
  test: {
    projects: [
      {
        // Only the React transform is needed here. The Start and nitro plugins
        // in vite.config.ts build a server bundle and have no place in a test.
        plugins: [viteReact()],
        resolve: { alias: srcAlias },
        test: {
          name: "app",
          globals: true,
          environment: "jsdom",
          setupFiles: ["./tests/setup.ts"],
          include: ["tests/**/*.test.{ts,tsx}"],
          exclude: ["tests/convex/**"],
        },
      },
      {
        resolve: { alias: srcAlias },
        test: {
          name: "convex",
          globals: true,
          environment: "edge-runtime",
          include: ["tests/convex/**/*.test.ts"],
          server: { deps: { inline: ["convex-test"] } },
        },
      },
    ],
    coverage: {
      provider: "v8",
      include: ["src/lib/**", "src/components/**", "src/config/**", "convex/**"],
      exclude: ["src/components/ui/**", "convex/_generated/**"],
    },
  },
});
