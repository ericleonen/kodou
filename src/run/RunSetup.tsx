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
      <RunMap live style={StyleSheet.absoluteFill} mapPadding={{ top: 300, bottom: 90 }} />

      <View style={styles.overlay} pointerEvents="box-none">
        <View style={styles.panel}>
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

          <Text style={[styles.label, styles.programLabel]}>Program</Text>
          <Dropdown value={presetId} options={presetOptions} onSelect={setPresetId} />
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
    </View>
  );
}

function useStyles() {
  const c = useColors();
  return useMemo(() =>
    StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.surfaceAlt,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  panel: {
    backgroundColor: c.overlay,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  label: {
    ...typography.label,
    textTransform: "uppercase",
    color: c.textMuted,
  },
  programLabel: {
    marginTop: spacing.sm,
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
