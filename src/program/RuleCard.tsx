import { StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "../theme";
import { MOMENTS, RESPONSES, describeMoment, describeResponse } from "./catalog";
import { Rule } from "./types";

/**
 * Renders one rule as a "When … → responses" card. The moment reads as
 * a sentence; each response is shown as an icon chip below it.
 */
export default function RuleCard({ rule }: { rule: Rule }) {
  const moment = MOMENTS[rule.moment.type];
  return (
    <View style={styles.card}>
      <View style={styles.momentRow}>
        <View style={styles.momentIcon}>
          <MaterialCommunityIcons name={moment.icon} size={20} color={colors.primary} />
        </View>
        <Text style={styles.momentText}>{describeMoment(rule)}</Text>
      </View>

      <View style={styles.responses}>
        {rule.responses.map((response, i) => (
          <View key={i} style={styles.chip}>
            <MaterialCommunityIcons
              name={RESPONSES[response.kind].icon}
              size={15}
              color={colors.textMuted}
            />
            <Text style={styles.chipText}>{describeResponse(response)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  momentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  momentIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  momentText: {
    ...typography.body,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
  },
  responses: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingLeft: 34 + spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  chipText: {
    ...typography.label,
    fontWeight: "500",
    color: colors.textMuted,
  },
});
