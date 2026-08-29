import { defineConfig } from "vitest/config";

/**
 * Domain tests.
 *
 * No environment beyond plain JavaScript — if a test here needs a DOM or a
 * React renderer, the code under test has stopped being domain logic.
 */
export default defineConfig({
  test: {
    name: "domain",
    globals: true,
    include: ["tests/**/*.test.ts"],
    coverage: { provider: "v8", include: ["src/**"] },
  },
});
