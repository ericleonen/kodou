import { ReactNode } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";

const EDGE = 40; // px from the left edge where the swipe must begin
const THRESHOLD = 70; // px of horizontal travel to count as a back swipe

/**
 * Wraps a screen so a left-edge swipe to the right invokes `onBack` — the
 * iOS-style back gesture. On Android the system back gesture arrives as a
 * hardware-back event instead, handled separately by `useBackHandler`.
 *
 * The gesture only claims touches within `EDGE` of the left edge (via
 * hitSlop) so interactive children like maps and lists are unaffected.
 */
export default function SwipeBackView({
  onBack,
  children,
  style,
}: {
  onBack: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const pan = Gesture.Pan()
    .hitSlop({ left: 0, width: EDGE })
    .activeOffsetX(12)
    .failOffsetY([-14, 14])
    .onEnd((e) => {
      if (e.translationX > THRESHOLD && e.velocityX > 0) {
        runOnJS(onBack)();
      }
    });

  return (
    <GestureDetector gesture={pan}>
      <View style={[styles.fill, style]}>{children}</View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
