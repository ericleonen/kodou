import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { fonts, radius, spacing, typography, useColors } from "../theme";
import { useKeyboardHeight } from "../hooks/useKeyboardHeight";

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export type SheetAction = {
  label: string;
  icon: IconName;
  destructive?: boolean;
  onPress: () => void;
};

/** Inline rename shown as the first row; picking it swaps to a text field. */
export type RenameConfig = {
  label?: string;
  icon?: IconName;
  initialValue: string;
  placeholder?: string;
  onSubmit: (value: string) => void;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  actions: SheetAction[];
  rename?: RenameConfig;
};

/**
 * A bottom-sheet menu of actions. When `rename` is provided, a "Rename" row
 * appears first and, when tapped, swaps the sheet into an inline text field
 * so the name can be changed without opening a separate modal.
 */
export default function ActionSheet({ visible, onClose, title, actions, rename }: Props) {
  const c = useColors();
  const styles = useStyles();
  const keyboardHeight = useKeyboardHeight();
  const [mode, setMode] = useState<"menu" | "rename">("menu");
  const [name, setName] = useState(rename?.initialValue ?? "");

  useEffect(() => {
    if (visible) {
      setMode("menu");
      setName(rename?.initialValue ?? "");
    }
  }, [visible, rename?.initialValue]);

  const canSave = name.trim().length > 0;

  function submitRename() {
    if (!canSave || !rename) return;
    rename.onSubmit(name.trim());
    onClose();
  }

  const renaming = mode === "rename" && !!rename;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={renaming ? styles.backdropBottom : styles.backdrop}
        onPress={renaming ? () => setMode("menu") : onClose}
      >
        <Pressable
          style={
            renaming ? [styles.sheetBottom, { marginBottom: keyboardHeight }] : styles.sheet
          }
        >
          {mode === "rename" && rename ? (
            <>
              <Text style={styles.title}>{rename.label ?? "Rename"}</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder={rename.placeholder}
                placeholderTextColor={c.textFaint}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={submitRename}
                maxLength={80}
              />
              <View style={styles.renameActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setMode("menu")}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, !canSave && styles.saveDisabled]}
                  onPress={submitRename}
                  disabled={!canSave}
                  activeOpacity={0.85}
                >
                  <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              {title ? <Text style={styles.sheetTitle}>{title}</Text> : null}
              {rename ? (
                <Row
                  icon={rename.icon ?? "pencil-outline"}
                  label={rename.label ?? "Rename"}
                  onPress={() => setMode("rename")}
                />
              ) : null}
              {actions.map((a, i) => (
                <Row
                  key={i}
                  icon={a.icon}
                  label={a.label}
                  destructive={a.destructive}
                  onPress={() => {
                    onClose();
                    a.onPress();
                  }}
                />
              ))}
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Row({
  icon,
  label,
  destructive,
  onPress,
}: {
  icon: IconName;
  label: string;
  destructive?: boolean;
  onPress: () => void;
}) {
  const c = useColors();
  const styles = useStyles();
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <MaterialCommunityIcons
        name={icon}
        size={22}
        color={destructive ? c.danger : c.textMuted}
      />
      <Text style={[styles.rowText, destructive && { color: c.danger }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function useStyles() {
  const c = useColors();
  return useMemo(() =>
    StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  backdropBottom: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheetBottom: {
    backgroundColor: c.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  sheetTitle: {
    ...typography.label,
    color: c.textMuted,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  rowText: {
    ...typography.body,
    fontFamily: fonts.semibold,
    color: c.text,
  },
  title: {
    ...typography.heading,
    fontSize: 18,
    color: c.text,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.md,
  },
  input: {
    ...typography.body,
    color: c.text,
    backgroundColor: c.surfaceAlt,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.sm,
  },
  renameActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: c.surfaceAlt,
  },
  cancelText: {
    ...typography.body,
    fontFamily: fonts.semibold,
    color: c.textMuted,
  },
  saveBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: c.primary,
  },
  saveDisabled: {
    backgroundColor: c.surfaceAlt,
  },
  saveText: {
    ...typography.body,
    fontFamily: fonts.bold,
    color: "#ffffff",
  },
    }), [c]);
}
