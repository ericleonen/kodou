import * as Haptics from "expo-haptics";

/**
 * Thin wrapper over expo-haptics. Every call is fire-and-forget and
 * swallows errors (haptics are unsupported on some devices/simulators).
 */
export const haptics = {
  /** Light tick for selection changes (toggles, tabs, segments). */
  select: () => void Haptics.selectionAsync().catch(() => {}),
  light: () => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}),
  medium: () => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}),
  success: () =>
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),
  warning: () =>
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {}),
};
