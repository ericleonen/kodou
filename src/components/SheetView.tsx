import { ReactNode, useEffect } from "react";
import { StyleProp, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { motion } from "../theme";

/**
 * A bottom sheet that slides up when shown. Uses a plain animated transform
 * (not a Reanimated layout `entering` animation), which — unlike the layout
 * animation — keeps its subtree interactive even when nothing re-renders
 * inside the modal.
 */
export default function SheetView({
  visible,
  style,
  children,
}: {
  visible: boolean;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const y = useSharedValue(24);

  useEffect(() => {
    y.value = withTiming(visible ? 0 : 24, { duration: motion.base });
  }, [visible, y]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
