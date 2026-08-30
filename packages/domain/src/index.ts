/**
 * The product rules, shared by every IRL NOW client.
 *
 * Pure TypeScript: no React, no DOM, no React Native, no bundler. Anything
 * that needs a platform — an image URL, a download, storage — belongs in the
 * app that has one.
 *
 * The decisions that make IRL NOW what it is live here rather than in a
 * client, so the two clients cannot drift into two different products:
 * the finite feed, attendance-derived people discovery, honest copy for
 * anonymous visitors, host-declared access, and the money and ticket maths.
 */

/* Catalogue, domain types and lookups. */
export * from "./data";

/* Turning stored values into the strings a person reads. */
export * from "./format";

/* Discovery: explainable, deterministic feed ranking. */
export * from "./discovery/ranking";

/* The social graph — derived from who said yes to what, never stranger-browsing. */
export * from "./graph";

/* Attending: calendar building, travel estimates, waitlist holds, transfers. */
export * from "./attend";

/* Access details, host-declared or honestly unknown. */
export * from "./events/access";

/* Money, tickets, fees, payouts. */
export * from "./tickets";
export * from "./money";
export * from "./payments";

/* Plans — lighter than an event, easier to say yes to. */
export * from "./plans";

/* Event social surfaces. */
export * from "./social";
export * from "./live";
export * from "./inbox";

/* Memories: the wall, recaps, retention. */
export * from "./wall";
export * from "./recap";
export * from "./retention";

/* Hosting and organiser quality. */
export * from "./hosting";
export * from "./ratings";
export * from "./reviews";

/* Venues and capacity drops. */
export * from "./venues";

/* Going-out habit. */
export * from "./streaks";
