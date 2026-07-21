import * as Haptics from "expo-haptics";

// Toggled by the Settings "Haptics" preference via setHapticsEnabled.
let enabled = true;

/** Enable or disable all haptic feedback app-wide. */
export function setHapticsEnabled(next: boolean) {
  enabled = next;
}

/**
 * Thin wrapper over expo-haptics. Every call is fire-and-forget, respects
 * the haptics preference, and swallows errors (haptics are unsupported on
 * some devices/simulators).
 */
export const haptics = {
  /** Light tick for selection changes (toggles, tabs, segments). */
  select: () => enabled && void Haptics.selectionAsync().catch(() => {}),
  light: () => enabled && void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}),
  medium: () => enabled && void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}),
  success: () =>
    enabled && void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),
  warning: () =>
    enabled && void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {}),
};
