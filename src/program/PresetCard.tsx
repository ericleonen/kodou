import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { radius, spacing, typography, useColors } from "../theme";
import PressableScale from "../components/PressableScale";
import { haptics } from "../haptics";
import { MOMENTS } from "./catalog";
import { Preset } from "./types";

/**
 * Summary card for a preset in the library list: name, description,
 * rule count, and a preview strip of the moment icons it reacts to.
 */
export default function PresetCard({
  preset,
  onPress,
  onLongPress,
}: {
  preset: Preset;
  onPress: () => void;
  onLongPress?: () => void;
}) {
  const c = useColors();
  const styles = useStyles();
  const count = preset.rules.length;
  return (
    <PressableScale
      style={styles.card}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={200}
      haptic={haptics.select}
    >
      <View style={styles.top}>
        <View style={styles.info}>
          <Text style={styles.name}>{preset.name}</Text>
          {preset.description ? (
            <Text style={styles.description}>{preset.description}</Text>
          ) : null}
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color={c.textFaint} />
      </View>

      <View style={styles.footer}>
        <View style={styles.icons}>
          {preset.rules.slice(0, 5).map((rule) => (
            <MaterialCommunityIcons
              key={rule.id}
              name={MOMENTS[rule.moment.type].icon}
              size={16}
              color={c.textMuted}
            />
          ))}
        </View>
        <Text style={styles.count}>
          {count} {count === 1 ? "moment" : "moments"}
        </Text>
      </View>
    </PressableScale>
  );
}

function useStyles() {
  const c = useColors();
  return useMemo(() =>
    StyleSheet.create({
  card: {
    backgroundColor: c.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  top: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  info: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    ...typography.heading,
    color: c.text,
  },
  description: {
    ...typography.body,
    fontSize: 14,
    color: c.textMuted,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  icons: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  count: {
    ...typography.label,
    color: c.textFaint,
  },
    }), [c]);
}
