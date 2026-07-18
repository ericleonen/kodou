import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, spacing, typography } from "../theme";

export type TabKey = "program" | "run" | "you";

type TabDef = {
  key: TabKey;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
};

export const TABS: TabDef[] = [
  { key: "program", label: "Program", icon: "tune-vertical" },
  { key: "run", label: "Run", icon: "run" },
  { key: "you", label: "You", icon: "account" },
];

type Props = {
  active: TabKey;
  onChange: (key: TabKey) => void;
};

export default function TabBar({ active, onChange }: Props) {
  return (
    <View style={styles.bar}>
      {TABS.map((tab) => {
        const focused = tab.key === active;
        const tint = focused ? colors.primary : colors.textMuted;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => onChange(tab.key)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={tab.label}
          >
            <MaterialCommunityIcons name={tab.icon} size={26} color={tint} />
            <Text style={[styles.label, { color: tint }]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    // Extra bottom padding keeps the labels clear of the gesture bar.
    paddingBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    gap: spacing.xs,
  },
  label: {
    ...typography.label,
  },
});
