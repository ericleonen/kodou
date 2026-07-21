import { useEffect, useMemo, useState } from "react";
import {
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Dropdown from "../components/Dropdown";
import BottomSheetModal from "../components/BottomSheetModal";
import { fonts, useColors, radius, spacing, typography } from "../theme";
import {
  DISTANCE_UNITS,
  MOMENTS,
  PACE_UNITS,
  PROXIMITY_UNITS,
  RESPONSES,
  UNIT_NAMES,
} from "./catalog";
import { useStore } from "./store";
import SoundEditorModal from "./SoundEditorModal";
import {
  CriticalMoment,
  DistanceUnit,
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
  split: "km",
};

const PARAM_LEAD: Record<MomentType, string> = {
  slowing_down: "Pace slower than",
  almost_done: "Within",
  split: "Every",
};

const MAX_VIBRATIONS = 10;

/** The numeric parameter of a moment, regardless of its type. */
function momentValue(moment: CriticalMoment): number {
  switch (moment.type) {
    case "slowing_down":
      return moment.threshold;
    case "almost_done":
      return moment.amount;
    case "split":
      return moment.interval;
  }
}

/** Keeps only a positive decimal: digits and a single dot, no sign. */
function sanitizeDecimal(text: string): string {
  const cleaned = text.replace(/[^0-9.]/g, "");
  const dot = cleaned.indexOf(".");
  if (dot === -1) return cleaned;
  return cleaned.slice(0, dot + 1) + cleaned.slice(dot + 1).replace(/\./g, "");
}

/** Keeps a whole number, capped at `max`; empty stays empty while editing. */
function sanitizeInt(text: string, max: number): string {
  const digits = text.replace(/[^0-9]/g, "");
  if (digits === "") return "";
  return String(Math.min(parseInt(digits, 10), max));
}

type Props = {
  visible: boolean;
  initial: { moment: CriticalMoment; responses: RuleResponse[] } | null;
  onSubmit: (data: { moment: CriticalMoment; responses: RuleResponse[] }) => void;
  onDelete?: () => void;
  onClose: () => void;
};

/** Bottom-sheet editor for a single rule (moment + its responses). */
export default function RuleEditorModal({ visible, initial, onSubmit, onDelete, onClose }: Props) {
  const c = useColors();
  const styles = useStyles();
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
      setAmount(String(momentValue(initial.moment)));
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

  function vibrateValid(times: string) {
    const n = Number(times);
    return times !== "" && Number.isInteger(n) && n >= 1 && n <= MAX_VIBRATIONS;
  }

  const amountValid = amount.trim() !== "" && Number(amount) > 0;
  const responsesValid =
    responses.length > 0 &&
    responses.every((r) => (r.kind === "sound" ? r.soundId !== null : vibrateValid(r.times)));
  const canSave = momentType !== null && amountValid && unit !== "" && responsesValid;

  // Show an error only once the user has typed something invalid.
  const amountError = amount.trim() !== "" && !amountValid;

  function save() {
    if (!canSave || momentType === null) return;
    const value = Number(amount);
    let moment: CriticalMoment;
    if (momentType === "slowing_down") {
      moment = { type: "slowing_down", threshold: value, unit: unit as PaceUnit };
    } else if (momentType === "almost_done") {
      moment = { type: "almost_done", amount: value, unit: unit as ProximityUnit };
    } else {
      moment = { type: "split", interval: value, unit: unit as DistanceUnit };
    }
    const built: RuleResponse[] = responses.map((r) =>
      r.kind === "sound"
        ? { kind: "sound", soundId: r.soundId as string }
        : { kind: "vibrate", times: Math.round(Number(r.times)) }
    );
    onSubmit({ moment, responses: built });
  }

  const units =
    momentType === "slowing_down"
      ? PACE_UNITS
      : momentType === "split"
        ? DISTANCE_UNITS
        : PROXIMITY_UNITS;
  const soundOptions = sounds.map((s) => ({ label: s.name, value: s.id }));

  return (
    <>
      <BottomSheetModal
        visible={visible}
        onClose={onClose}
        sheetStyle={styles.sheet}
        onShow={() => Keyboard.dismiss()}
      >
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
                      color={on ? c.primary : c.textMuted}
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
                <Text style={styles.paramLead}>{PARAM_LEAD[momentType]}</Text>
                <View style={styles.paramRow}>
                  <TextInput
                    style={[styles.numberInput, amountError && styles.inputError]}
                    value={amount}
                    onChangeText={(text) => setAmount(sanitizeDecimal(text))}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={c.textFaint}
                  />
                  <Dropdown
                    style={styles.unitDropdown}
                    value={unit || null}
                    options={units.map((u) => ({ label: u, value: u, description: UNIT_NAMES[u] }))}
                    onSelect={setUnit}
                  />
                </View>
                {momentType === "almost_done" ? (
                  <Text style={styles.paramTrail}>of my goal</Text>
                ) : null}
                {amountError ? (
                  <Text style={styles.errorText}>Enter a number greater than 0.</Text>
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
                          color={on ? c.primary : c.textMuted}
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
                      <MaterialCommunityIcons name="close" size={16} color={c.textMuted} />
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
                      style={[
                        styles.numberInput,
                        response.times !== "" && !vibrateValid(response.times) && styles.inputError,
                      ]}
                      value={response.times}
                      onChangeText={(text) =>
                        patchResponse(index, {
                          kind: "vibrate",
                          times: sanitizeInt(text, MAX_VIBRATIONS),
                        })
                      }
                      keyboardType="number-pad"
                      placeholder="1"
                      placeholderTextColor={c.textFaint}
                    />
                    <Text style={styles.vibrateLead}>times</Text>
                  </View>
                )}
              </View>
            ))}

            {onDelete ? (
              <TouchableOpacity style={styles.deleteBtn} onPress={onDelete} activeOpacity={0.8}>
                <MaterialCommunityIcons name="trash-can-outline" size={18} color={c.danger} />
                <Text style={styles.deleteText}>Delete moment</Text>
              </TouchableOpacity>
            ) : null}
        </ScrollView>
      </BottomSheetModal>

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
    </>
  );
}

function useStyles() {
  const c = useColors();
  return useMemo(() =>
    StyleSheet.create({
  sheet: {
    maxHeight: "90%",
    backgroundColor: c.surface,
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
    color: c.text,
  },
  cancel: {
    ...typography.body,
    color: c.textMuted,
  },
  saveBtn: {
    ...typography.body,
    fontFamily: fonts.bold,
    color: c.primary,
  },
  disabled: {
    color: c.textFaint,
  },
  section: {
    ...typography.label,
    textTransform: "uppercase",
    color: c.textMuted,
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
    borderColor: c.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  momentChipOn: {
    borderColor: c.primary,
    backgroundColor: c.primarySoft,
  },
  momentChipText: {
    ...typography.label,
    fontFamily: fonts.medium,
    color: c.textMuted,
  },
  momentChipTextOn: {
    color: c.text,
  },
  paramBlock: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  paramLead: {
    ...typography.body,
    color: c.text,
  },
  paramRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  paramTrail: {
    ...typography.body,
    color: c.text,
  },
  numberInput: {
    ...typography.body,
    fontFamily: fonts.bold,
    color: c.text,
    backgroundColor: c.background,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minWidth: 72,
    textAlign: "center",
  },
  inputError: {
    borderColor: c.danger,
  },
  errorText: {
    ...typography.label,
    fontFamily: fonts.medium,
    color: c.danger,
    marginTop: spacing.xs,
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
    color: c.primary,
    marginBottom: spacing.sm,
  },
  responseCard: {
    backgroundColor: c.surfaceAlt,
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
    backgroundColor: c.primarySoft,
  },
  kindText: {
    ...typography.label,
    fontFamily: fonts.medium,
    color: c.textMuted,
  },
  kindTextOn: {
    color: c.text,
  },
  removeBtn: {
    marginLeft: "auto",
    padding: spacing.xs,
  },
  vibrateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  vibrateLead: {
    ...typography.body,
    color: c.text,
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
    fontFamily: fonts.semibold,
    color: c.danger,
  },
    }), [c]);
}
