import { ReactNode, useEffect, useRef, useState } from "react";
import {
  LayoutChangeEvent,
  Modal,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { motion } from "../theme";
import { useKeyboardHeight } from "../hooks/useKeyboardHeight";

// Off-screen distance used before the sheet's real height is measured.
const HIDDEN = 1000;

/**
 * A bottom sheet that slides up on open and down on close, while only the
 * background shade fades. Stays mounted through the exit animation so the
 * slide-out is actually visible. Tapping the shade closes it.
 */
export default function BottomSheetModal({
  visible,
  onClose,
  children,
  sheetStyle,
  gestureRoot = false,
  onShow,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  sheetStyle?: StyleProp<ViewStyle>;
  /** Wrap in a GestureHandlerRootView (needed for gesture children in a modal). */
  gestureRoot?: boolean;
  /** Fires when the modal is presented. */
  onShow?: () => void;
}) {
  const [mounted, setMounted] = useState(visible);
  const progress = useSharedValue(0); // 0 = hidden (down), 1 = shown (up)
  const sheetH = useSharedValue(HIDDEN);
  const opened = useRef(false);
  const keyboardHeight = useKeyboardHeight();

  useEffect(() => {
    if (visible) {
      setMounted(true);
      // If the height is already known (a reopen), slide up now; on a first
      // open we wait for onSheetLayout so we know exactly how far to travel.
      if (sheetH.value !== HIDDEN) {
        opened.current = true;
        progress.value = withTiming(1, { duration: motion.base });
      } else {
        opened.current = false;
      }
    } else if (mounted) {
      progress.value = withTiming(0, { duration: motion.base }, (finished) => {
        // finished is false if a reopen interrupted the close — keep it mounted.
        if (finished) runOnJS(setMounted)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const sheetAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * sheetH.value }],
  }));

  function onSheetLayout(e: LayoutChangeEvent) {
    sheetH.value = e.nativeEvent.layout.height;
    // Kick the open animation once, now that we know how far to slide.
    if (visible && !opened.current) {
      opened.current = true;
      progress.value = withTiming(1, { duration: motion.base });
    }
  }

  if (!mounted) return null;

  const body = (
    <View style={styles.fill}>
      <Animated.View style={[styles.backdrop, backdropStyle]} pointerEvents="none" />
      <View style={[styles.container, { paddingBottom: keyboardHeight }]}>
        <Animated.View style={[sheetStyle, sheetAnimStyle]} onLayout={onSheetLayout}>
          {children}
        </Animated.View>
      </View>
    </View>
  );

  return (
    <Modal
      visible
      transparent
      animationType="none"
      onRequestClose={onClose}
      onShow={onShow}
      statusBarTranslucent
    >
      {gestureRoot ? <GestureHandlerRootView style={styles.fill}>{body}</GestureHandlerRootView> : body}
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-end",
  },
});
