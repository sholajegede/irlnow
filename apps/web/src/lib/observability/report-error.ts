/**
 * Client-side error reporting.
 *
 * React does not rethrow boundary-caught errors to `window.onerror` in
 * production, so anything an error boundary catches is invisible unless it is
 * forwarded explicitly. `reportError` is that forwarding point.
 *
 * There is deliberately no vendor here. `setErrorReporter` is the seam an
 * error-tracking provider plugs into at app startup; until one is configured,
 * errors go to the console and nowhere else.
 */

export interface ErrorContext {
  /** Where the error surfaced — e.g. "root_error_boundary". */
  boundary?: string;
  /** Route path at the time of the failure. */
  route?: string;
  [key: string]: unknown;
}

export type ErrorReporter = (error: unknown, context: ErrorContext) => void;

let reporter: ErrorReporter | null = null;

/** Install the error-tracking provider. Call once, during app startup. */
export function setErrorReporter(next: ErrorReporter | null): void {
  reporter = next;
}

/**
 * Describe an unknown throw well enough to be actionable in a log.
 *
 * Loaders and server functions commonly throw a raw `Response`, whose
 * `String()` form is the useless "[object Response]" — pull the status and URL
 * out instead.
 */
export function describeThrown(error: unknown): string {
  if (error instanceof Response) {
    return `Response ${error.status}${error.url ? ` at ${error.url}` : ""}`;
  }
  if (error instanceof Error) return error.message;
  return String(error);
}

export function reportError(error: unknown, context: ErrorContext = {}): void {
  const enriched: ErrorContext = {
    ...(typeof window !== "undefined" && { route: window.location.pathname }),
    ...context,
  };

  if (reporter) {
    try {
      reporter(error, enriched);
      return;
    } catch {
      // A failing reporter must never mask the error it was asked to report.
    }
  }

  console.error(`[irlnow] ${describeThrown(error)}`, { error, context: enriched });
}
