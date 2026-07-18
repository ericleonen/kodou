/**
 * Kodou design tokens.
 *
 * Kodou means "heartbeat", so the palette is built around a warm,
 * energetic red on a near-black surface. Screens should pull colors,
 * spacing, and radii from here rather than hard-coding values, so the
 * theme can evolve (or gain a light variant) in one place.
 */

export const colors = {
  // Brand — the Kodou red and its supporting shades.
  primary: "#F23645",
  primaryPressed: "#C31F2C",
  primarySoft: "#2A1114", // tinted surface for red-on-dark accents

  // Surfaces, from the page background upward.
  background: "#0B0B0F",
  surface: "#16161D",
  surfaceAlt: "#1F1F28",
  border: "#26262F",

  // Text.
  text: "#FFFFFF",
  textMuted: "#8A8A94",
  textFaint: "#5A5A63",

  // Feedback.
  danger: "#FF6B6B",
  success: "#3DD68C",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

export const typography = {
  title: { fontSize: 34, fontWeight: "800" as const, letterSpacing: 0.5 },
  heading: { fontSize: 22, fontWeight: "700" as const },
  body: { fontSize: 16, fontWeight: "400" as const },
  label: { fontSize: 13, fontWeight: "600" as const, letterSpacing: 0.3 },
};

export const theme = { colors, spacing, radius, typography };
export type Theme = typeof theme;
