import { useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import Dropdown from "../components/Dropdown";
import RunMap from "../components/RunMap";
import PressableScale from "../components/PressableScale";
import SegmentedControl from "../components/SegmentedControl";
import SlideIn from "../components/SlideIn";
import { haptics } from "../haptics";
import { fonts, useColors, radius, spacing, typography } from "../theme";
import { useStore } from "../program/store";
import { useSettings } from "../settings/settings";
import {
  DISTANCE_GOAL_UNITS,
  GOAL_UNIT_NAMES,
  GoalKind,
  GoalUnit,
  RunConfig,
  TIME_GOAL_UNITS,
} from "./types";

const NO_PROGRAM = "none";

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
  const settings = useSettings();

  const [kind, setKind] = useState<GoalKind>("distance");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState<GoalUnit>(settings.distanceUnit);
  const [presetId, setPresetId] = useState<string>(settings.defaultPresetId ?? NO_PROGRAM);

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
    setUnit(next === "distance" ? settings.distanceUnit : settings.timeUnit);
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
      <View style={[styles.section, styles.firstSection]}>
        <Text style={styles.label}>Goal</Text>
        <SegmentedControl
          value={kind}
          onChange={selectKind}
          options={[
            { label: "Distance", value: "distance" },
            { label: "Time", value: "time" },
          ]}
        />
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

      <SlideIn>
        <PressableScale
          style={[styles.startButton, !valid && styles.startDisabled]}
          onPress={start}
          disabled={!valid}
          haptic={haptics.medium}
        >
          <Text style={styles.startText}>Start run</Text>
        </PressableScale>
      </SlideIn>
    </View>
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
    paddingBottom: spacing.xl,
  },
  section: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  firstSection: {
    marginTop: spacing.sm,
  },
  label: {
    ...typography.label,
    textTransform: "uppercase",
    color: c.textMuted,
  },
  goalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  input: {
    ...typography.body,
    fontFamily: fonts.bold,
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
    fontFamily: fonts.medium,
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
  },
  startDisabled: {
    backgroundColor: c.surfaceAlt,
  },
  startText: {
    ...typography.body,
    fontFamily: fonts.bold,
    color: "#ffffff",
    fontSize: 17,
  },
    }), [c]);
}
