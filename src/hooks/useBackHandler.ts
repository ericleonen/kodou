import { useEffect } from "react";
import { BackHandler } from "react-native";

/**
 * Runs `onBack` when the Android hardware/gesture back is pressed, and
 * stops it from bubbling (which would otherwise exit the app). Handlers
 * fire most-recently-mounted first, so a nested screen intercepts back
 * before its parent. No-op on iOS, which has no hardware back.
 */
export function useBackHandler(onBack: () => void) {
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onBack();
      return true;
    });
    return () => sub.remove();
  }, [onBack]);
}
