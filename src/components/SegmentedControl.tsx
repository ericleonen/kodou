import { useEffect, useMemo, useState } from "react";
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { fonts, motion, radius, spacing, typography, useColors } from "../theme";
import { haptics } from "../haptics";

type Option<T extends string> = { label: string; value: T };

type Props<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

const PAD = spacing.xs;

/** A segmented control whose selection pill springs to the active option. */
export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: Props<T>) {
  const styles = useStyles();
  const [width, setWidth] = useState(0);
  const count = options.length;
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const segWidth = width > 0 ? (width - PAD * 2) / count : 0;

  const x = useSharedValue(0);
  useEffect(() => {
    x.value = withSpring(index * segWidth, motion.spring);
  }, [index, segWidth, x]);

  const pillStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View
      style={styles.track}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
    >
      {segWidth > 0 ? (
        <Animated.View style={[styles.pill, { width: segWidth }, pillStyle]} />
      ) : null}
      {options.map((option) => {
        const on = option.value === value;
        return (
          <Pressable
            key={option.value}
            style={styles.segment}
            onPress={() => {
              if (!on) {
                haptics.select();
                onChange(option.value);
              }
            }}
          >
            <Text style={[styles.text, on && styles.textOn]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function useStyles() {
  const c = useColors();
  return useMemo(() =>
    StyleSheet.create({
      track: {
        flexDirection: "row",
        backgroundColor: c.surface,
        borderRadius: radius.md,
        padding: PAD,
      },
      pill: {
        position: "absolute",
        top: PAD,
        left: PAD,
        bottom: PAD,
        borderRadius: radius.sm,
        backgroundColor: c.primarySoft,
      },
      segment: {
        flex: 1,
        alignItems: "center",
        paddingVertical: spacing.sm,
        borderRadius: radius.sm,
      },
      text: {
        ...typography.body,
        fontFamily: fonts.semibold,
        color: c.textMuted,
      },
      textOn: {
        color: c.primary,
      },
    }), [c]);
}
