/**
 * Mobile tests.
 *
 * jest-expo, not plain jest: it supplies the React Native preset, the asset
 * transformer and the platform mocks, so components are tested in something
 * close to the runtime they actually ship into.
 */
module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  testMatch: ["<rootDir>/tests/**/*.test.{ts,tsx}"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@irlnow/domain$": "<rootDir>/../../packages/domain/src/index.ts",
    "^@irlnow/backend/api$": "<rootDir>/tests/mocks/convex-api.ts",
    // lucide ships .mjs for the "react-native" condition, which jest-expo's
    // transform does not cover. Its CJS build is identical.
    "^lucide-react-native$":
      "<rootDir>/../../node_modules/lucide-react-native/dist/cjs/lucide-react-native.js",
  },
  // Transform everything, including node_modules.
  //
  // Most of the React Native ecosystem ships untranspiled ESM source for
  // Metro, and in a workspace those packages are hoisted to the repo root.
  // Maintaining an allowlist meant chasing a new transitive dependency every
  // time one was added; transforming everything is a few seconds slower and
  // simply correct.
  transformIgnorePatterns: [],
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/**/*.d.ts"],
};
