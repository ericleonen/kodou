import { ReactNode } from "react";
import {
  GestureResponderEvent,
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { motion } from "../theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, "style"> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** How far to scale down while pressed. */
  scaleTo?: number;
  /** Optional haptic fired on press (e.g. haptics.select). */
  haptic?: () => void;
};

/**
 * A Pressable that springs down slightly while held — the tactile press
 * feedback that makes taps feel native. Drop-in for TouchableOpacity.
 */
export default function PressableScale({
  children,
  style,
  scaleTo = 0.97,
  haptic,
  onPressIn,
  onPressOut,
  onPress,
  ...rest
}: Props) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      style={[style, animatedStyle]}
      onPressIn={(e: GestureResponderEvent) => {
        scale.value = withTiming(scaleTo, { duration: motion.fast });
        onPressIn?.(e);
      }}
      onPressOut={(e: GestureResponderEvent) => {
        scale.value = withTiming(1, { duration: motion.fast });
        onPressOut?.(e);
      }}
      onPress={(e: GestureResponderEvent) => {
        haptic?.();
        onPress?.(e);
      }}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
