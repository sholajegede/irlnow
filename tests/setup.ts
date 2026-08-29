import { afterEach } from "vitest";

// Convex function tests run on the edge runtime, which has no DOM. Loading the
// DOM matchers there would throw before any test ran.
if (typeof document !== "undefined") {
  await import("@testing-library/jest-dom/vitest");
  const { cleanup } = await import("@testing-library/react");
  afterEach(cleanup);
}
