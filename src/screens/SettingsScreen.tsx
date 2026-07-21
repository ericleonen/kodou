import { useMemo } from "react";
import { StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import SwipeBackView from "../components/SwipeBackView";
import { useBackHandler } from "../hooks/useBackHandler";
import { radius, spacing, typography, useColors } from "../theme";
import { useSettings } from "../settings/settings";

/** Settings screen, reached from the You tab. Theme toggle for now. */
export default function SettingsScreen({ onBack }: { onBack: () => void }) {
  const c = useColors();
  const styles = useStyles();
  const { theme, setTheme } = useSettings();
  const isDark = theme === "dark";

  useBackHandler(onBack);

  return (
    <SwipeBackView onBack={onBack} style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={onBack} activeOpacity={0.7} hitSlop={8}>
        <MaterialCommunityIcons name="chevron-left" size={22} color={c.textMuted} />
        <Text style={styles.backText}>You</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <MaterialCommunityIcons
              name={isDark ? "weather-night" : "white-balance-sunny"}
              size={20}
              color={c.primary}
            />
            <Text style={styles.rowLabel}>Dark mode</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={(on) => setTheme(on ? "dark" : "light")}
            trackColor={{ true: c.primary, false: c.border }}
            thumbColor="#ffffff"
          />
        </View>
      </View>
    </SwipeBackView>
  );
}

function useStyles() {
  const c = useColors();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: c.background,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg,
        },
        back: {
          flexDirection: "row",
          alignItems: "center",
          marginLeft: -spacing.xs,
          marginBottom: spacing.sm,
        },
        backText: {
          ...typography.label,
          color: c.textMuted,
        },
        title: {
          ...typography.title,
          color: c.text,
          marginBottom: spacing.xl,
        },
        card: {
          backgroundColor: c.surface,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
        },
        row: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: spacing.md,
        },
        rowLeft: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
        },
        rowLabel: {
          ...typography.body,
          color: c.text,
        },
      }),
    [c]
  );
}
