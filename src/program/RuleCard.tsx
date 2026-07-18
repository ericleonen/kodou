import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "../theme";
import { MOMENTS, RESPONSES, describeMoment, describeResponse } from "./catalog";
import { Rule } from "./types";

/**
 * Renders one rule: the moment as a "When …" sentence, then each
 * response below it marked with an arrow to read as "→ do this".
 */
export default function RuleCard({ rule, onPress }: { rule: Rule; onPress?: () => void }) {
  const moment = MOMENTS[rule.moment.type];
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.momentRow}>
        <MaterialCommunityIcons name={moment.icon} size={22} color={colors.primary} />
        <Text style={styles.momentText}>{describeMoment(rule)}</Text>
      </View>

      <View style={styles.actions}>
        {rule.responses.map((response, i) => (
          <View key={i} style={styles.actionRow}>
            <MaterialCommunityIcons
              name="arrow-right-bottom"
              size={16}
              color={colors.textFaint}
            />
            <MaterialCommunityIcons
              name={RESPONSES[response.kind].icon}
              size={15}
              color={colors.textMuted}
            />
            <Text style={styles.actionText}>{describeResponse(response)}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  momentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  momentText: {
    ...typography.body,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
  },
  actions: {
    gap: spacing.xs,
    // Indent responses under the moment text (icon width + row gap).
    paddingLeft: 22 + spacing.sm,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  actionText: {
    ...typography.body,
    fontSize: 14,
    color: colors.textMuted,
    flex: 1,
  },
});
