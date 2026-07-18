import { useEffect, useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { colors, radius } from "../theme";

const THUMB = 24;
const TRACK_HEIGHT = 4;
const ROW_HEIGHT = 40;

type Props = {
  min: number;
  max: number;
  low: number;
  high: number;
  /** Minimum distance (in value units) kept between the two thumbs. */
  minGap?: number;
  onChange: (low: number, high: number) => void;
};

/**
 * A two-thumb range slider for selecting a [low, high] window. Positions
 * are initialized from props on layout and then self-driven, emitting
 * changes via onChange. Remount (via a `key`) to reset to new bounds.
 */
export default function RangeSlider({ min, max, low, high, minGap = 0, onChange }: Props) {
  const [width, setWidth] = useState(0);
  const range = Math.max(max - min, 0.0001);
  const gapPx = (minGap / range) * width;

  const lowX = useSharedValue(0);
  const highX = useSharedValue(0);
  const startLow = useSharedValue(0);
  const startHigh = useSharedValue(0);

  // Initialize thumb positions once the track has been measured.
  useEffect(() => {
    if (width > 0) {
      lowX.value = ((low - min) / range) * width;
      highX.value = ((high - min) / range) * width;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width]);

  function onLayout(e: LayoutChangeEvent) {
    setWidth(e.nativeEvent.layout.width);
  }

  const panLow = Gesture.Pan()
    .onBegin(() => {
      startLow.value = lowX.value;
    })
    .onUpdate((e) => {
      const x = Math.max(0, Math.min(startLow.value + e.translationX, highX.value - gapPx));
      lowX.value = x;
      runOnJS(onChange)(min + (x / width) * range, min + (highX.value / width) * range);
    });

  const panHigh = Gesture.Pan()
    .onBegin(() => {
      startHigh.value = highX.value;
    })
    .onUpdate((e) => {
      const x = Math.min(width, Math.max(startHigh.value + e.translationX, lowX.value + gapPx));
      highX.value = x;
      runOnJS(onChange)(min + (lowX.value / width) * range, min + (x / width) * range);
    });

  const lowThumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: lowX.value - THUMB / 2 }],
  }));
  const highThumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: highX.value - THUMB / 2 }],
  }));
  const activeTrackStyle = useAnimatedStyle(() => ({
    left: lowX.value,
    width: Math.max(0, highX.value - lowX.value),
  }));

  return (
    <View style={styles.outer}>
      <View style={styles.row} onLayout={onLayout}>
        <View style={styles.track} />
        <Animated.View style={[styles.activeTrack, activeTrackStyle]} />
        <GestureDetector gesture={panLow}>
          <Animated.View style={[styles.thumb, lowThumbStyle]} />
        </GestureDetector>
        <GestureDetector gesture={panHigh}>
          <Animated.View style={[styles.thumb, highThumbStyle]} />
        </GestureDetector>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    paddingHorizontal: THUMB / 2,
  },
  row: {
    height: ROW_HEIGHT,
    justifyContent: "center",
  },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
  },
  activeTrack: {
    position: "absolute",
    height: TRACK_HEIGHT,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  thumb: {
    position: "absolute",
    top: (ROW_HEIGHT - THUMB) / 2,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: "#ffffff",
    borderWidth: 3,
    borderColor: colors.primary,
  },
});
