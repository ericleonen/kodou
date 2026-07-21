import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";
import { fonts, spacing, typography, useColors } from "../theme";

/**
 * Full-screen 3-2-1 countdown shown before tracking starts. Tapping
 * anywhere cancels; reaching zero calls onDone.
 */
export default function Countdown({
  seconds = 3,
  onDone,
  onCancel,
}: {
  seconds?: number;
  onDone: () => void;
  onCancel: () => void;
}) {
  const styles = useStyles();
  const [n, setN] = useState(seconds);

  useEffect(() => {
    if (n <= 0) {
      const t = setTimeout(onDone, 450);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setN((v) => v - 1), 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  return (
    <Pressable style={styles.overlay} onPress={onCancel}>
      <Animated.Text key={n} entering={ZoomIn.duration(220)} style={styles.number}>
        {n > 0 ? String(n) : "GO"}
      </Animated.Text>
      <View style={styles.hintWrap}>
        <Text style={styles.hint}>Tap to cancel</Text>
      </View>
    </Pressable>
  );
}

function useStyles() {
  const c = useColors();
  return useMemo(() =>
    StyleSheet.create({
      overlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: c.background,
      },
      number: {
        fontFamily: fonts.displayHeavy,
        fontSize: 160,
        color: c.primary,
      },
      hintWrap: {
        position: "absolute",
        bottom: spacing.xxl,
      },
      hint: {
        ...typography.label,
        textTransform: "uppercase",
        color: c.textMuted,
      },
    }), [c]);
}
