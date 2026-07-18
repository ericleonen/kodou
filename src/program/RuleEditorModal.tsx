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
import Dropdown from "../components/Dropdown";
import { colors, radius, spacing, typography } from "../theme";
import { MOMENTS, PACE_UNITS, PROXIMITY_UNITS, RESPONSES } from "./catalog";
import { useStore } from "./store";
import SoundEditorModal from "./SoundEditorModal";
import {
  CriticalMoment,
  MomentType,
  PaceUnit,
  ProximityUnit,
  ResponseKind,
  RuleResponse,
} from "./types";

type ResponseDraft =
  | { kind: "sound"; soundId: string | null }
  | { kind: "vibrate"; times: string };

const DEFAULT_UNIT: Record<MomentType, string> = {
  slowing_down: PACE_UNITS[0],
  almost_done: PROXIMITY_UNITS[1], // "km"
};

type Props = {
  visible: boolean;
  initial: { moment: CriticalMoment; responses: RuleResponse[] } | null;
  onSubmit: (data: { moment: CriticalMoment; responses: RuleResponse[] }) => void;
  onDelete?: () => void;
  onClose: () => void;
};

/** Bottom-sheet editor for a single rule (moment + its responses). */
export default function RuleEditorModal({ visible, initial, onSubmit, onDelete, onClose }: Props) {
  const { sounds } = useStore();

  const [momentType, setMomentType] = useState<MomentType | null>(null);
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState<string>("");
  const [responses, setResponses] = useState<ResponseDraft[]>([]);
  // Which response index (if any) is currently adding a new sound.
  const [soundEditorFor, setSoundEditorFor] = useState<number | null>(null);

  // Seed the form from the rule being edited (or defaults) on open.
  useEffect(() => {
    if (!visible) return;
    if (initial) {
      setMomentType(initial.moment.type);
      setAmount(
        String(
          initial.moment.type === "slowing_down"
            ? initial.moment.threshold
            : initial.moment.amount
        )
      );
      setUnit(initial.moment.unit);
      setResponses(
        initial.responses.map((r) =>
          r.kind === "sound"
            ? { kind: "sound", soundId: r.soundId }
            : { kind: "vibrate", times: String(r.times) }
        )
      );
    } else {
      setMomentType(null);
      setAmount("");
      setUnit("");
      setResponses([{ kind: "sound", soundId: null }]);
    }
  }, [visible, initial]);

  function selectMoment(type: MomentType) {
    setMomentType(type);
    setUnit(DEFAULT_UNIT[type]);
  }

  function setKind(index: number, kind: ResponseKind) {
    setResponses((prev) =>
      prev.map((r, i) =>
        i === index ? (kind === "sound" ? { kind, soundId: null } : { kind, times: "1" }) : r
      )
    );
  }

  function patchResponse(index: number, next: ResponseDraft) {
    setResponses((prev) => prev.map((r, i) => (i === index ? next : r)));
  }

  const amountValid = amount.trim() !== "" && Number(amount) > 0;
  const responsesValid =
    responses.length > 0 &&
    responses.every((r) =>
      r.kind === "sound" ? r.soundId !== null : Number(r.times) >= 1
    );
  const canSave = momentType !== null && amountValid && unit !== "" && responsesValid;

  function save() {
    if (!canSave || momentType === null) return;
    const moment: CriticalMoment =
      momentType === "slowing_down"
        ? { type: "slowing_down", threshold: Number(amount), unit: unit as PaceUnit }
        : { type: "almost_done", amount: Number(amount), unit: unit as ProximityUnit };
    const built: RuleResponse[] = responses.map((r) =>
      r.kind === "sound"
        ? { kind: "sound", soundId: r.soundId as string }
        : { kind: "vibrate", times: Math.round(Number(r.times)) }
    );
    onSubmit({ moment, responses: built });
  }

  const units = momentType === "slowing_down" ? PACE_UNITS : PROXIMITY_UNITS;
  const soundOptions = sounds.map((s) => ({ label: s.name, value: s.id }));

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
            <View style={styles.momentRow}>
              {(Object.keys(MOMENTS) as MomentType[]).map((type) => {
                const on = type === momentType;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[styles.momentChip, on && styles.momentChipOn]}
                    onPress={() => selectMoment(type)}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons
                      name={MOMENTS[type].icon}
                      size={16}
                      color={on ? colors.primary : colors.textMuted}
                    />
                    <Text style={[styles.momentChipText, on && styles.momentChipTextOn]}>
                      {MOMENTS[type].label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {momentType !== null ? (
              <View style={styles.paramBlock}>
                <Text style={styles.paramLead}>
                  {momentType === "slowing_down" ? "Pace drops below" : "Within"}
                </Text>
                <View style={styles.paramRow}>
                  <TextInput
                    style={styles.numberInput}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={colors.textFaint}
                  />
                  <Dropdown
                    style={styles.unitDropdown}
                    value={unit || null}
                    options={units.map((u) => ({ label: u, value: u }))}
                    onSelect={setUnit}
                  />
                </View>
                {momentType === "almost_done" ? (
                  <Text style={styles.paramTrail}>of my goal</Text>
                ) : null}
              </View>
            ) : null}

            <View style={styles.thenHeader}>
              <Text style={styles.section}>Then…</Text>
              <TouchableOpacity
                onPress={() => setResponses((prev) => [...prev, { kind: "sound", soundId: null }])}
                hitSlop={8}
              >
                <Text style={styles.addResponse}>+ Add response</Text>
              </TouchableOpacity>
            </View>

            {responses.map((response, index) => (
              <View key={index} style={styles.responseCard}>
                <View style={styles.kindRow}>
                  {(Object.keys(RESPONSES) as ResponseKind[]).map((kind) => {
                    const on = kind === response.kind;
                    return (
                      <TouchableOpacity
                        key={kind}
                        style={[styles.kindBtn, on && styles.kindBtnOn]}
                        onPress={() => setKind(index, kind)}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons
                          name={RESPONSES[kind].icon}
                          size={16}
                          color={on ? colors.primary : colors.textMuted}
                        />
                        <Text style={[styles.kindText, on && styles.kindTextOn]}>
                          {RESPONSES[kind].label}
                        </Text>
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

                {response.kind === "sound" ? (
                  <Dropdown
                    value={response.soundId}
                    options={soundOptions}
                    placeholder="Choose a soundbite"
                    onSelect={(soundId) => patchResponse(index, { kind: "sound", soundId })}
                    footerAction={{ label: "Add a sound", onPress: () => setSoundEditorFor(index) }}
                  />
                ) : (
                  <View style={styles.vibrateRow}>
                    <Text style={styles.vibrateLead}>Vibrate</Text>
                    <TextInput
                      style={styles.numberInput}
                      value={response.times}
                      onChangeText={(times) => patchResponse(index, { kind: "vibrate", times })}
                      keyboardType="number-pad"
                      placeholder="1"
                      placeholderTextColor={colors.textFaint}
                    />
                    <Text style={styles.vibrateLead}>times</Text>
                  </View>
                )}
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

      <SoundEditorModal
        visible={soundEditorFor !== null}
        onClose={() => setSoundEditorFor(null)}
        onCreated={(sound) => {
          if (soundEditorFor !== null) {
            patchResponse(soundEditorFor, { kind: "sound", soundId: sound.id });
          }
          setSoundEditorFor(null);
        }}
      />
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
    maxHeight: "90%",
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
  momentRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
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
  paramBlock: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  paramLead: {
    ...typography.body,
    color: colors.text,
  },
  paramRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  paramTrail: {
    ...typography.body,
    color: colors.text,
  },
  numberInput: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minWidth: 72,
    textAlign: "center",
  },
  unitDropdown: {
    flex: 1,
  },
  thenHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.xl,
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
  },
  kindTextOn: {
    color: colors.text,
  },
  removeBtn: {
    marginLeft: "auto",
    padding: spacing.xs,
  },
  vibrateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  vibrateLead: {
    ...typography.body,
    color: colors.text,
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
