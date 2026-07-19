import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { spacing, typography, useColors } from "../theme";

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
  const insets = useSafeAreaInsets();
  const c = useColors();
  const styles = useStyles();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
      {TABS.map((tab) => {
        const focused = tab.key === active;
        const tint = focused ? c.primary : c.textMuted;
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

function useStyles() {
  const c = useColors();
  return useMemo(
    () =>
      StyleSheet.create({
        bar: {
          flexDirection: "row",
          backgroundColor: c.surface,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: c.border,
          paddingTop: spacing.sm,
        },
        tab: {
          flex: 1,
          alignItems: "center",
          gap: spacing.xs,
        },
        label: {
          ...typography.label,
        },
      }),
    [c]
  );
}
