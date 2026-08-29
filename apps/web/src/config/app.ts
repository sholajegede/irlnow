/**
 * Application configuration, read from the environment at build time.
 *
 * Only `VITE_`-prefixed variables exist here: everything in this module is
 * bundled into the client and is therefore public. Secrets belong in
 * server-only modules, never here.
 */

/** Where this deployment is served from, without a trailing slash. */
export const APP_ORIGIN: string = (
  import.meta.env["VITE_APP_ORIGIN"] ?? "https://irlnow.app"
).replace(/\/+$/, "");

/** The origin with the scheme stripped — how a link is shown to a person. */
export const APP_DOMAIN: string = APP_ORIGIN.replace(/^https?:\/\//, "");

/** The city IRL NOW is currently operating in. */
export const DEFAULT_CITY = "London";

/** Absolute URL for a path, for share sheets, QR codes and OG tags. */
export function absoluteUrl(path: string): string {
  return `${APP_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}

/** The same URL as `absoluteUrl`, minus the scheme, for display in the UI. */
export function displayUrl(path: string): string {
  return `${APP_DOMAIN}${path.startsWith("/") ? path : `/${path}`}`;
}
