import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "../theme";
import { MOMENTS, RESPONSES } from "./catalog";
import { CriticalMoment, MomentType, ResponseKind, RuleResponse } from "./types";

const MOMENT_ENTRIES = Object.entries(MOMENTS) as [MomentType, (typeof MOMENTS)[MomentType]][];
const KIND_ENTRIES = Object.keys(RESPONSES) as ResponseKind[];

const KIND_PLACEHOLDER: Record<ResponseKind, string> = {
  sound: "Soundbite name",
  speak: "Phrase to speak",
  vibrate: "Pattern, e.g. twice",
};

type Props = {
  visible: boolean;
  /** The rule being edited, or null when creating a new one. */
  initial: { moment: CriticalMoment; responses: RuleResponse[] } | null;
  onSubmit: (data: { moment: CriticalMoment; responses: RuleResponse[] }) => void;
  onDelete?: () => void;
  onClose: () => void;
};

/** Bottom-sheet editor for a single rule (moment + its responses). */
export default function RuleEditorModal({ visible, initial, onSubmit, onDelete, onClose }: Props) {
  const [momentType, setMomentType] = useState<MomentType | null>(null);
  const [detail, setDetail] = useState("");
  const [responses, setResponses] = useState<RuleResponse[]>([]);

  // Seed the form from the rule being edited (or defaults) on open.
  useEffect(() => {
    if (!visible) return;
    setMomentType(initial?.moment.type ?? null);
    setDetail(initial?.moment.detail ?? "");
    setResponses(initial?.responses ?? [{ kind: "sound", value: "" }]);
  }, [visible, initial]);

  const canSave =
    momentType !== null &&
    responses.length > 0 &&
    responses.every((r) => r.value.trim().length > 0);

  function setResponse(index: number, next: Partial<RuleResponse>) {
    setResponses((prev) => prev.map((r, i) => (i === index ? { ...r, ...next } : r)));
  }

  function save() {
    if (!canSave || momentType === null) return;
    onSubmit({
      moment: { type: momentType, detail: detail.trim() || undefined },
      responses: responses.map((r) => ({ ...r, value: r.value.trim() })),
    });
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
            <Text style={styles.title}>{initial ? "Edit moment" : "Add moment"}</Text>
            <TouchableOpacity onPress={save} disabled={!canSave} hitSlop={8}>
              <Text style={[styles.saveBtn, !canSave && styles.disabled]}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.section}>When…</Text>
            <View style={styles.momentGrid}>
              {MOMENT_ENTRIES.map(([type, meta]) => {
                const selected = type === momentType;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[styles.momentChip, selected && styles.momentChipOn]}
                    onPress={() => setMomentType(type)}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons
                      name={meta.icon}
                      size={16}
                      color={selected ? colors.primary : colors.textMuted}
                    />
                    <Text style={[styles.momentChipText, selected && styles.momentChipTextOn]}>
                      {meta.phrase}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TextInput
              style={styles.input}
              value={detail}
              onChangeText={setDetail}
              placeholder="Add a detail (optional), e.g. by 30 sec/km"
              placeholderTextColor={colors.textFaint}
            />

            <View style={styles.thenHeader}>
              <Text style={styles.section}>Then…</Text>
              <TouchableOpacity
                onPress={() => setResponses((prev) => [...prev, { kind: "sound", value: "" }])}
                hitSlop={8}
              >
                <Text style={styles.addResponse}>+ Add response</Text>
              </TouchableOpacity>
            </View>

            {responses.map((response, index) => (
              <View key={index} style={styles.responseCard}>
                <View style={styles.kindRow}>
                  {KIND_ENTRIES.map((kind) => {
                    const on = kind === response.kind;
                    return (
                      <TouchableOpacity
                        key={kind}
                        style={[styles.kindBtn, on && styles.kindBtnOn]}
                        onPress={() => setResponse(index, { kind })}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons
                          name={RESPONSES[kind].icon}
                          size={16}
                          color={on ? colors.primary : colors.textMuted}
                        />
                        <Text style={[styles.kindText, on && styles.kindTextOn]}>{kind}</Text>
                      </TouchableOpacity>
                    );
                  })}
                  {responses.length > 1 ? (
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => setResponses((prev) => prev.filter((_, i) => i !== index))}
                      hitSlop={8}
                    >
                      <MaterialCommunityIcons name="close" size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  ) : null}
                </View>
                <TextInput
                  style={styles.input}
                  value={response.value}
                  onChangeText={(text) => setResponse(index, { value: text })}
                  placeholder={KIND_PLACEHOLDER[response.kind]}
                  placeholderTextColor={colors.textFaint}
                />
              </View>
            ))}

            {onDelete ? (
              <TouchableOpacity style={styles.deleteBtn} onPress={onDelete} activeOpacity={0.8}>
                <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.danger} />
                <Text style={styles.deleteText}>Delete moment</Text>
              </TouchableOpacity>
            ) : null}
          </ScrollView>
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
    maxHeight: "88%",
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
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
  saveBtn: {
    ...typography.body,
    fontWeight: "700",
    color: colors.primary,
  },
  disabled: {
    color: colors.textFaint,
  },
  section: {
    ...typography.label,
    textTransform: "uppercase",
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  momentGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  momentChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  momentChipOn: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  momentChipText: {
    ...typography.label,
    fontWeight: "500",
    color: colors.textMuted,
  },
  momentChipTextOn: {
    color: colors.text,
  },
  input: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  thenHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.lg,
  },
  addResponse: {
    ...typography.label,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  responseCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  kindRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  kindBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  kindBtnOn: {
    backgroundColor: colors.primarySoft,
  },
  kindText: {
    ...typography.label,
    fontWeight: "500",
    color: colors.textMuted,
    textTransform: "capitalize",
  },
  kindTextOn: {
    color: colors.text,
  },
  removeBtn: {
    marginLeft: "auto",
    padding: spacing.xs,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  deleteText: {
    ...typography.body,
    fontWeight: "600",
    color: colors.danger,
  },
});
