import { ReactNode } from "react";
import { StyleProp, ViewStyle } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { motion } from "../theme";

/**
 * Fades + slides its children up into place on mount. Used for primary
 * actions so they arrive with a little motion rather than snapping in.
 */
export default function SlideIn({
  children,
  delay = 0,
  style,
}: {
  children: ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Animated.View
      entering={FadeInDown.duration(motion.slow).delay(delay)}
      style={style}
    >
      {children}
    </Animated.View>
  );
}
