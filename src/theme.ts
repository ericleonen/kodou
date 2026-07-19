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
}

export const darkColors: Colors = {
  primary: "#F23645",
  primaryPressed: "#C31F2C",
  primarySoft: "#2A1114",
  background: "#0B0B0F",
  surface: "#16161D",
  surfaceAlt: "#1F1F28",
  border: "#26262F",
  text: "#FFFFFF",
  textMuted: "#8A8A94",
  textFaint: "#5A5A63",
  danger: "#FF6B6B",
  success: "#3DD68C",
};

export const lightColors: Colors = {
  primary: "#E11D2A",
  primaryPressed: "#B01722",
  primarySoft: "#FCE7E9",
  background: "#F6F6F8",
  surface: "#FFFFFF",
  surfaceAlt: "#ECECF1",
  border: "#DEDEE5",
  text: "#15151A",
  textMuted: "#63636E",
  textFaint: "#9A9AA5",
  danger: "#DC2626",
  success: "#16A34A",
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
