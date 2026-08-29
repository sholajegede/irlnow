import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import viteReact from "@vitejs/plugin-react";

/**
 * Web app tests.
 *
 * Only the React transform is needed — the Start and nitro plugins in
 * vite.config.ts build a server bundle and have no place in a test run.
 * Convex backend tests live at the repository root, where `convex/` does.
 */
export default defineConfig({
  plugins: [viteReact()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@irlnow/domain": fileURLToPath(
        new URL("../../packages/domain/src/index.ts", import.meta.url),
      ),
    },
  },
  test: {
    name: "web",
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["src/lib/**", "src/components/**", "src/config/**"],
      exclude: ["src/components/ui/**"],
    },
  },
});
