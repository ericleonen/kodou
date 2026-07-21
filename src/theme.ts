import { createContext, useContext } from "react";

/**
 * Kodou design tokens.
 *
 * Kodou means "heartbeat", so the palette is built around a warm,
 * energetic red. There are dark and light variants with the same keys;
 * components read the active one via `useColors()` so the whole app can
 * switch themes at runtime. Spacing, radii, and type are theme-agnostic.
 */

export interface Colors {
  primary: string;
  primaryPressed: string;
  primarySoft: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  textFaint: string;
  danger: string;
  success: string;
  /** Translucent panel background for floating overlays (e.g. over a map). */
  overlay: string;
}

export const darkColors: Colors = {
  primary: "#F23645",
  primaryPressed: "#C31F2C",
  primarySoft: "#3A171C",
  background: "#0B0B0F",
  surface: "#1E1E27",
  surfaceAlt: "#2C2C38",
  border: "#3C3C4A",
  text: "#FFFFFF",
  textMuted: "#9C9CA8",
  textFaint: "#70707C",
  danger: "#FF6B6B",
  success: "#3DD68C",
  overlay: "rgba(18,18,24,0.88)",
};

export const lightColors: Colors = {
  primary: "#E11D2A",
  primaryPressed: "#B01722",
  primarySoft: "#FCDCDF",
  background: "#E9E9EE",
  surface: "#FFFFFF",
  surfaceAlt: "#DEDEE6",
  border: "#C6C6D2",
  text: "#15151A",
  textMuted: "#5A5A66",
  textFaint: "#8E8E9C",
  danger: "#DC2626",
  success: "#16A34A",
  overlay: "rgba(255,255,255,0.93)",
};

export type ColorScheme = "light" | "dark";

/** Default (dark) palette. Used as a fallback until the provider mounts. */
export const colors = darkColors;

const ColorsContext = createContext<Colors>(darkColors);
export const ColorsProvider = ColorsContext.Provider;

/** The active theme palette. */
export function useColors(): Colors {
  return useContext(ColorsContext);
}

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/** Sharper than before: cards read as md, chips/CTAs as pill. */
export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
} as const;

/** Shared timings + spring so motion across the app feels like one system. */
export const motion = {
  fast: 150,
  base: 220,
  slow: 320,
  spring: { damping: 18, stiffness: 220, mass: 0.9 },
} as const;

/**
 * Font families. Text is Inter; big numbers/titles use Barlow Semi
 * Condensed for a tighter, sportier stat look. Custom fonts don't respond
 * to `fontWeight`, so each weight is its own family and styles set
 * `fontFamily` directly (see the `fonts` token) instead of a weight.
 */
export const fonts = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
  extrabold: "Inter_800ExtraBold",
  display: "BarlowSemiCondensed_700Bold",
  displayHeavy: "BarlowSemiCondensed_800ExtraBold",
} as const;

export const typography = {
  /** Oversized stat numbers (pace, distance) — condensed + heavy. */
  display: { fontSize: 48, fontFamily: fonts.displayHeavy, letterSpacing: 0.5 },
  title: { fontSize: 30, fontFamily: fonts.extrabold, letterSpacing: 0.2 },
  heading: { fontSize: 20, fontFamily: fonts.bold, letterSpacing: 0.1 },
  body: { fontSize: 16, fontFamily: fonts.regular },
  bodyStrong: { fontSize: 16, fontFamily: fonts.semibold },
  label: { fontSize: 13, fontFamily: fonts.semibold, letterSpacing: 0.3 },
  caption: { fontSize: 12, fontFamily: fonts.medium, letterSpacing: 0.2 },
};
