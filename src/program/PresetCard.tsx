import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "../theme";
import { MOMENTS } from "./catalog";
import { Preset } from "./types";

/**
 * Summary card for a preset in the library list: name, description,
 * rule count, and a preview strip of the moment icons it reacts to.
 */
export default function PresetCard({ preset, onPress }: { preset: Preset; onPress: () => void }) {
  const count = preset.rules.length;
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.top}>
        <View style={styles.info}>
          <Text style={styles.name}>{preset.name}</Text>
          {preset.description ? (
            <Text style={styles.description}>{preset.description}</Text>
          ) : null}
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textFaint} />
      </View>

      <View style={styles.footer}>
        <View style={styles.icons}>
          {preset.rules.slice(0, 5).map((rule) => (
            <MaterialCommunityIcons
              key={rule.id}
              name={MOMENTS[rule.moment.type].icon}
              size={16}
              color={colors.textMuted}
            />
          ))}
        </View>
        <Text style={styles.count}>
          {count} {count === 1 ? "moment" : "moments"}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
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
    color: colors.text,
  },
  description: {
    ...typography.body,
    fontSize: 14,
    color: colors.textMuted,
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
    color: colors.textFaint,
  },
});
