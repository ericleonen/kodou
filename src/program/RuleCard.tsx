import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "../theme";
import { MOMENTS, RESPONSES, describeMoment, describeResponse } from "./catalog";
import { useStore } from "./store";
import { Rule } from "./types";

/**
 * Renders one rule: the moment as a sentence, then each response below it
 * marked with an arrow to read as "→ do this".
 */
export default function RuleCard({
  rule,
  onPress,
  onLongPress,
  highlighted,
}: {
  rule: Rule;
  onPress?: () => void;
  onLongPress?: () => void;
  highlighted?: boolean;
}) {
  const { soundName } = useStore();
  const moment = MOMENTS[rule.moment.type];

  return (
    <TouchableOpacity
      style={[styles.card, highlighted && styles.cardHighlighted]}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={200}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.momentRow}>
        <MaterialCommunityIcons name={moment.icon} size={22} color={colors.primary} />
        <Text style={styles.momentText}>{describeMoment(rule.moment)}</Text>
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
            <Text style={styles.actionText}>
              {describeResponse(
                response,
                response.kind === "sound" ? soundName(response.soundId) : undefined
              )}
            </Text>
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
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  cardHighlighted: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
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
