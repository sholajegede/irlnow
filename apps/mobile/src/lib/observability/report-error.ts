/**
 * Client-side error reporting.
 *
 * Same contract as the web app's module of the same name: a vendor-neutral
 * seam an error-tracking provider plugs into at startup. Until one is
 * configured, errors reach the console and nowhere else.
 */

export interface ErrorContext {
  boundary?: string;
  screen?: string;
  componentStack?: string | undefined;
  [key: string]: unknown;
}

export type ErrorReporter = (error: unknown, context: ErrorContext) => void;

let reporter: ErrorReporter | null = null;

export function setErrorReporter(next: ErrorReporter | null): void {
  reporter = next;
}

export function describeThrown(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function reportError(error: unknown, context: ErrorContext = {}): void {
  if (reporter) {
    try {
      reporter(error, context);
      return;
    } catch {
      // A failing reporter must never mask the error it was asked to report.
    }
  }
  console.error(`[irlnow] ${describeThrown(error)}`, { error, context });
}
