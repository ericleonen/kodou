import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { radius, spacing, typography, useColors } from "../theme";

export type DropdownOption = { label: string; value: string; description?: string };

type Props = {
  value: string | null;
  options: DropdownOption[];
  placeholder?: string;
  onSelect: (value: string) => void;
  /** Optional action pinned to the bottom of the list, e.g. "Add a sound". */
  footerAction?: { label: string; onPress: () => void };
  style?: object;
};

/** A tap-to-open select built from core primitives (no native picker). */
export default function Dropdown({
  value,
  options,
  placeholder = "Select",
  onSelect,
  footerAction,
  style,
}: Props) {
  const c = useColors();
  const styles = useStyles();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <>
      <TouchableOpacity
        style={[styles.control, style]}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.value, !selected && styles.placeholder]} numberOfLines={1}>
          {selected?.label ?? placeholder}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={18} color={c.textMuted} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.menu}>
            {options.map((option) => {
              const on = option.value === value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={styles.row}
                  onPress={() => {
                    onSelect(option.value);
                    setOpen(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.rowLabels}>
                    <Text style={[styles.rowText, on && styles.rowTextOn]}>{option.label}</Text>
                    {option.description ? (
                      <Text style={styles.rowDesc}>{option.description}</Text>
                    ) : null}
                  </View>
                  {on ? (
                    <MaterialCommunityIcons name="check" size={18} color={c.primary} />
                  ) : null}
                </TouchableOpacity>
              );
            })}

            {footerAction ? (
              <TouchableOpacity
                style={[styles.row, styles.footer]}
                onPress={() => {
                  setOpen(false);
                  footerAction.onPress();
                }}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="plus" size={18} color={c.primary} />
                <Text style={styles.footerText}>{footerAction.label}</Text>
              </TouchableOpacity>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function useStyles() {
  const c = useColors();
  return useMemo(() =>
    StyleSheet.create({
  control: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.xs,
    backgroundColor: c.surfaceAlt,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  value: {
    ...typography.body,
    color: c.text,
    flexShrink: 1,
  },
  placeholder: {
    color: c.textFaint,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: spacing.xl,
  },
  menu: {
    backgroundColor: c.surfaceAlt,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.border,
  },
  rowLabels: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.sm,
    flexShrink: 1,
  },
  rowText: {
    ...typography.body,
    fontWeight: "700",
    color: c.text,
  },
  rowTextOn: {
    color: c.primary,
  },
  rowDesc: {
    ...typography.label,
    fontWeight: "500",
    color: c.textMuted,
    flexShrink: 1,
  },
  footer: {
    justifyContent: "flex-start",
    borderBottomWidth: 0,
  },
  footerText: {
    ...typography.body,
    fontWeight: "600",
    color: c.primary,
  },
    }), [c]);
}
