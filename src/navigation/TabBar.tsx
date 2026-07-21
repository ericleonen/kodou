import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { spacing, typography, useColors } from "../theme";
import { haptics } from "../haptics";
import { TabParamList } from "./types";

type TabKey = keyof TabParamList;

type TabDef = { label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap };

const TAB_DEFS: Record<TabKey, TabDef> = {
  program: { label: "Program", icon: "tune-vertical" },
  run: { label: "Run", icon: "run" },
  you: { label: "You", icon: "account" },
};

/** Custom bottom tab bar driven by React Navigation's tab state. */
export default function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const styles = useStyles();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
      {state.routes.map((route, index) => {
        const def = TAB_DEFS[route.name as TabKey];
        const focused = state.index === index;
        const tint = focused ? c.primary : c.textMuted;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            haptics.select();
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tab}
            onPress={onPress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={def.label}
          >
            <MaterialCommunityIcons name={def.icon} size={26} color={tint} />
            <Text style={[styles.label, { color: tint }]}>{def.label}</Text>
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
