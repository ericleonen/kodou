import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { colors, radius, spacing, typography } from "../theme";

type Props = {
  visible: boolean;
  onSubmit: (name: string, description?: string) => void;
  onClose: () => void;
};

/** Modal for naming a brand-new preset. */
export default function PresetFormModal({ visible, onSubmit, onClose }: Props) {
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
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.sheet}>
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
            placeholderTextColor={colors.textFaint}
            autoFocus
            returnKeyType="next"
          />

          <Text style={styles.label}>Description (optional)</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="What is this preset for?"
            placeholderTextColor={colors.textFaint}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    backgroundColor: colors.surface,
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
    color: colors.text,
  },
  cancel: {
    ...typography.body,
    color: colors.textMuted,
  },
  save: {
    ...typography.body,
    fontWeight: "700",
    color: colors.primary,
  },
  saveDisabled: {
    color: colors.textFaint,
  },
  label: {
    ...typography.label,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  input: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
});
