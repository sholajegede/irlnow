/* ------------------------------------------------------------------
   IRL NOW design tokens.

   The web app defines these in OKLCH (apps/web/src/styles.css). React
   Native has no colour-space support, so they are converted to sRGB
   here — the same palette, expressed in the only form the platform
   understands.

   "Event energy — day and night": deep plum-black canvas, electric
   coral primary, lime accent.
------------------------------------------------------------------- */

export const colors = {
  /** Behind the app frame — a shade deeper than the surface. */
  canvas: "#030204",
  background: "#0C0810",
  foreground: "#F6F2F7",

  card: "#18121C",
  popover: "#1C1521",

  /** Coral. Actions that move a person toward going. */
  primary: "#FF525D",
  primaryForeground: "#FCF9FC",
  /** End stop of the brand gradient, used with `primary`. */
  primaryGradientEnd: "#FC65B6",

  secondary: "#241B2A",
  secondaryForeground: "#F6F2F7",

  muted: "#221B27",
  mutedForeground: "#9F93A5",

  /** Lime. Confirmation, liveness, "you're going". */
  accent: "#9BEF66",
  accentForeground: "#0A1508",

  destructive: "#EE343B",

  border: "rgba(255,255,255,0.10)",
  input: "rgba(255,255,255,0.12)",

  /** Scrims over cover photography, so text stays legible on any image. */
  scrimStrong: "rgba(12,8,16,0.96)",
  scrimMid: "rgba(12,8,16,0.45)",
  overlay: "rgba(12,8,16,0.60)",
} as const;

export const gradients = {
  /** The brand gradient: primary → pink. Used on every primary action. */
  brand: [colors.primary, colors.primaryGradientEnd] as const,
  /** Bottom-up fade that makes feed copy readable over a photo. */
  coverFade: ["transparent", colors.scrimMid, colors.scrimStrong] as const,
} as const;

/**
 * Deterministic avatar gradients, indexed by a person's `avatarSeed`.
 *
 * Same eight pairs as the web `.avatar-N` classes, so one person looks like
 * themselves on both platforms.
 */
export const avatarGradients: readonly (readonly [string, string])[] = [
  ["#FF525D", "#D84497"],
  ["#00C1CC", "#396FC8"],
  ["#E6B816", "#449D2E"],
  ["#FE8C2C", "#E64343"],
  ["#B180FC", "#A840A2"],
  ["#4CD2AB", "#0089AB"],
  ["#95E85F", "#009C84"],
  ["#FF637B", "#615ED6"],
];

export function avatarGradient(seed: number): readonly [string, string] {
  return avatarGradients[Math.abs(seed) % avatarGradients.length]!;
}

/** 4pt base scale. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 999,
} as const;

/**
 * Type scale.
 *
 * `display` is Syne on web. Until the font is bundled, the platform's own
 * heaviest system face carries the same role — the weight and tightness are
 * what make the voice, not the family alone.
 */
export const typography = {
  display: {
    hero: { fontSize: 34, lineHeight: 36, fontWeight: "800" },
    title: { fontSize: 28, lineHeight: 31, fontWeight: "800" },
    section: { fontSize: 22, lineHeight: 26, fontWeight: "800" },
    card: { fontSize: 17, lineHeight: 21, fontWeight: "700" },
  },
  body: {
    lg: { fontSize: 16, lineHeight: 23, fontWeight: "500" },
    md: { fontSize: 14, lineHeight: 20, fontWeight: "500" },
    sm: { fontSize: 13, lineHeight: 18, fontWeight: "500" },
    xs: { fontSize: 11, lineHeight: 15, fontWeight: "600" },
  },
  /** Uppercase, wide-tracked labels — the "LONDON · RIGHT NOW" voice. */
  overline: { fontSize: 11, lineHeight: 14, fontWeight: "800", letterSpacing: 1.2 },
} as const;

/** Minimum comfortable touch target. Below this, thumbs miss. */
export const HIT_TARGET = 44;

export const shadows = {
  glow: {
    shadowColor: colors.primary,
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
} as const;
