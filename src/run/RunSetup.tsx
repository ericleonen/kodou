import { useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Dropdown from "../components/Dropdown";
import RunMap from "../components/RunMap";
import { useColors, radius, spacing, typography } from "../theme";
import { useStore } from "../program/store";
import {
  DISTANCE_GOAL_UNITS,
  GOAL_UNIT_NAMES,
  GoalKind,
  GoalUnit,
  RunConfig,
  TIME_GOAL_UNITS,
} from "./types";

const NO_PROGRAM = "none";
const DEFAULT_UNIT: Record<GoalKind, GoalUnit> = { distance: "km", time: "min" };

function sanitizeDecimal(text: string): string {
  const cleaned = text.replace(/[^0-9.]/g, "");
  const dot = cleaned.indexOf(".");
  if (dot === -1) return cleaned;
  return cleaned.slice(0, dot + 1) + cleaned.slice(dot + 1).replace(/\./g, "");
}

/** The run setup screen: pick a goal and a program, then start. */
export default function RunSetup({ onStart }: { onStart: (config: RunConfig) => void }) {
  const c = useColors();
  const styles = useStyles();
  const { presets } = useStore();

  const [kind, setKind] = useState<GoalKind>("distance");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState<GoalUnit>("km");
  const [presetId, setPresetId] = useState<string>(NO_PROGRAM);

  const units = kind === "distance" ? DISTANCE_GOAL_UNITS : TIME_GOAL_UNITS;
  const valid = value.trim() !== "" && Number(value) > 0;
  const valueError = value.trim() !== "" && !valid;

  const presetOptions = useMemo(
    () => [
      { label: "No program", value: NO_PROGRAM },
      ...presets.map((p) => ({ label: p.name, value: p.id })),
    ],
    [presets]
  );

  function selectKind(next: GoalKind) {
    setKind(next);
    setUnit(DEFAULT_UNIT[next]);
  }

  function start() {
    if (!valid) return;
    onStart({
      goal: { kind, value: Number(value), unit },
      presetId: presetId === NO_PROGRAM ? null : presetId,
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Run</Text>
      <Text style={styles.subtitle}>Set a goal and choose a program.</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Goal</Text>
        <View style={styles.segmented}>
          <Segment label="Distance" active={kind === "distance"} onPress={() => selectKind("distance")} />
          <Segment label="Time" active={kind === "time"} onPress={() => selectKind("time")} />
        </View>
        <View style={styles.goalRow}>
          <TextInput
            style={[styles.input, valueError && styles.inputError]}
            value={value}
            onChangeText={(t) => setValue(sanitizeDecimal(t))}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={c.textFaint}
          />
          <Dropdown
            style={styles.unitDropdown}
            value={unit}
            options={units.map((u) => ({ label: u, value: u, description: GOAL_UNIT_NAMES[u] }))}
            onSelect={(u) => setUnit(u as GoalUnit)}
          />
        </View>
        {valueError ? (
          <Text style={styles.errorText}>Enter a goal greater than 0.</Text>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Program</Text>
        <Dropdown value={presetId} options={presetOptions} onSelect={setPresetId} />
      </View>

      <View style={styles.mapWrap}>
        <RunMap live style={StyleSheet.absoluteFill} />
      </View>

      <TouchableOpacity
        style={[styles.startButton, !valid && styles.startDisabled]}
        onPress={start}
        disabled={!valid}
        activeOpacity={0.85}
      >
        <Text style={styles.startText}>Start run</Text>
      </TouchableOpacity>
    </View>
  );
}

function Segment({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const styles = useStyles();
  return (
    <TouchableOpacity
      style={[styles.segment, active && styles.segmentActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function useStyles() {
  const c = useColors();
  return useMemo(() =>
    StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  title: {
    ...typography.title,
    color: c.text,
  },
  subtitle: {
    ...typography.body,
    color: c.textMuted,
    marginTop: spacing.xs,
  },
  section: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  label: {
    ...typography.label,
    textTransform: "uppercase",
    color: c.textMuted,
  },
  segmented: {
    flexDirection: "row",
    backgroundColor: c.surface,
    borderRadius: radius.md,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  segment: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  segmentActive: {
    backgroundColor: c.primarySoft,
  },
  segmentText: {
    ...typography.body,
    fontWeight: "600",
    color: c.textMuted,
  },
  segmentTextActive: {
    color: c.primary,
  },
  goalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  input: {
    ...typography.body,
    fontWeight: "700",
    color: c.text,
    backgroundColor: c.surfaceAlt,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minWidth: 96,
    textAlign: "center",
  },
  unitDropdown: {
    flex: 1,
  },
  inputError: {
    borderWidth: 1,
    borderColor: c.danger,
  },
  errorText: {
    ...typography.label,
    fontWeight: "500",
    color: c.danger,
  },
  mapWrap: {
    flex: 1,
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: c.surfaceAlt,
  },
  startButton: {
    backgroundColor: c.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  startDisabled: {
    backgroundColor: c.surfaceAlt,
  },
  startText: {
    ...typography.body,
    fontWeight: "700",
    color: "#ffffff",
    fontSize: 17,
  },
    }), [c]);
}
