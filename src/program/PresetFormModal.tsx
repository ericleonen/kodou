import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import BottomSheetModal from "../components/BottomSheetModal";
import { fonts, radius, spacing, typography, useColors } from "../theme";

type Props = {
  visible: boolean;
  onSubmit: (name: string, description?: string) => void;
  onClose: () => void;
};

/** Modal for naming a brand-new preset. */
export default function PresetFormModal({ visible, onSubmit, onClose }: Props) {
  const c = useColors();
  const styles = useStyles();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Reset fields each time the modal opens.
  useEffect(() => {
    if (visible) {
      setName("");
      setDescription("");
    }
  }, [visible]);

  const canSave = name.trim().length > 0;

  function save() {
    if (!canSave) return;
    onSubmit(name.trim(), description.trim() || undefined);
  }

  return (
    <BottomSheetModal visible={visible} onClose={onClose} sheetStyle={styles.sheet}>
      <View style={styles.header}>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.title}>New preset</Text>
            <TouchableOpacity onPress={save} disabled={!canSave} hitSlop={8}>
              <Text style={[styles.save, !canSave && styles.saveDisabled]}>Save</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Tempo Run"
            placeholderTextColor={c.textFaint}
            autoFocus
            returnKeyType="next"
          />

          <Text style={styles.label}>Description (optional)</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="What is this preset for?"
            placeholderTextColor={c.textFaint}
          />
    </BottomSheetModal>
  );
}

function useStyles() {
  const c = useColors();
  return useMemo(() =>
    StyleSheet.create({
  sheet: {
    backgroundColor: c.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  title: {
    ...typography.heading,
    fontSize: 18,
    color: c.text,
  },
  cancel: {
    ...typography.body,
    color: c.textMuted,
  },
  save: {
    ...typography.body,
    fontFamily: fonts.bold,
    color: c.primary,
  },
  saveDisabled: {
    color: c.textFaint,
  },
  label: {
    ...typography.label,
    color: c.textMuted,
    marginTop: spacing.sm,
  },
  input: {
    ...typography.body,
    color: c.text,
    backgroundColor: c.surfaceAlt,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
    }), [c]);
}
