import { ReactNode, useMemo } from "react";
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Dropdown from "../components/Dropdown";
import SegmentedControl from "../components/SegmentedControl";
import { fonts, radius, spacing, typography, useColors } from "../theme";
import { useSettings } from "../settings/settings";
import { useStore } from "../program/store";
import { useRuns } from "../run/runsStore";
import { DISTANCE_GOAL_UNITS, GOAL_UNIT_NAMES, TIME_GOAL_UNITS } from "../run/types";

const NO_PROGRAM = "none";

/** Settings: appearance, units, run behavior, audio, and clear-all. */
export default function SettingsScreen() {
  const c = useColors();
  const styles = useStyles();
  const navigation = useNavigation();
  const s = useSettings();
  const { presets, clearAll } = useStore();
  const { clearRuns } = useRuns();

  const measurement = s.distanceUnit === "mi" ? "imperial" : "metric";

  function confirmClearAll() {
    Alert.alert(
      "Clear all data?",
      "This permanently deletes every run, preset, and sound. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear everything",
          style: "destructive",
          onPress: () => {
            clearRuns();
            clearAll();
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()} activeOpacity={0.7} hitSlop={8}>
        <MaterialCommunityIcons name="chevron-left" size={22} color={c.textMuted} />
        <Text style={styles.backText}>You</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Settings</Text>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Section label="Appearance">
          <View style={styles.rowStack}>
            <Text style={styles.rowLabel}>Theme</Text>
            <SegmentedControl
              value={s.theme}
              onChange={(theme) => s.update({ theme })}
              options={[
                { label: "Light", value: "light" },
                { label: "Dark", value: "dark" },
                { label: "System", value: "system" },
              ]}
            />
          </View>
        </Section>

        <Section label="Units">
          <View style={styles.rowStack}>
            <Text style={styles.rowLabel}>Measurement</Text>
            <SegmentedControl
              value={measurement}
              onChange={(m) =>
                m === "imperial"
                  ? s.update({ distanceUnit: "mi", paceUnit: "mi" })
                  : s.update({ distanceUnit: "km", paceUnit: "km" })
              }
              options={[
                { label: "Metric", value: "metric" },
                { label: "Imperial", value: "imperial" },
              ]}
            />
          </View>
          <Divider />
          <UnitRow
            label="Distance"
            value={s.distanceUnit}
            options={DISTANCE_GOAL_UNITS.map((u) => ({ label: u, value: u, description: GOAL_UNIT_NAMES[u] }))}
            onSelect={(v) => s.update({ distanceUnit: v as typeof s.distanceUnit })}
          />
          <Divider />
          <UnitRow
            label="Pace"
            value={s.paceUnit}
            options={[
              { label: "min/mi", value: "mi", description: "minutes per mile" },
              { label: "min/km", value: "km", description: "minutes per kilometer" },
            ]}
            onSelect={(v) => s.update({ paceUnit: v as typeof s.paceUnit })}
          />
          <Divider />
          <UnitRow
            label="Time"
            value={s.timeUnit}
            options={TIME_GOAL_UNITS.map((u) => ({ label: u, value: u, description: GOAL_UNIT_NAMES[u] }))}
            onSelect={(v) => s.update({ timeUnit: v as typeof s.timeUnit })}
          />
        </Section>

        <Section label="Runs">
          <UnitRow
            label="Default program"
            value={s.defaultPresetId ?? NO_PROGRAM}
            options={[
              { label: "No program", value: NO_PROGRAM },
              ...presets.map((p) => ({ label: p.name, value: p.id })),
            ]}
            onSelect={(v) => s.update({ defaultPresetId: v === NO_PROGRAM ? null : v })}
          />
          <Divider />
          <ToggleRow
            label="Start countdown"
            hint="3-2-1 before tracking begins"
            value={s.startCountdown}
            onValueChange={(startCountdown) => s.update({ startCountdown })}
          />
          <Divider />
          <ToggleRow
            label="Auto-pause"
            hint="Pause when you stop moving"
            value={s.autoPause}
            onValueChange={(autoPause) => s.update({ autoPause })}
          />
          <Divider />
          <ToggleRow
            label="Keep screen awake"
            value={s.keepAwake}
            onValueChange={(keepAwake) => s.update({ keepAwake })}
          />
        </Section>

        <Section label="Audio & feedback">
          <UnitRow
            label="Cue volume"
            value={String(s.cueVolume)}
            options={[
              { label: "100%", value: "1" },
              { label: "75%", value: "0.75" },
              { label: "50%", value: "0.5" },
              { label: "25%", value: "0.25" },
            ]}
            onSelect={(v) => s.update({ cueVolume: Number(v) })}
          />
          <Divider />
          <ToggleRow
            label="Lower other audio"
            hint="Quiet music when cues play"
            value={s.duckAudio}
            onValueChange={(duckAudio) => s.update({ duckAudio })}
          />
          <Divider />
          <ToggleRow
            label="Haptics"
            value={s.haptics}
            onValueChange={(haptics) => s.update({ haptics })}
          />
        </Section>

        <Text style={styles.sectionLabel}>Data</Text>
        <TouchableOpacity style={styles.clearButton} onPress={confirmClearAll} activeOpacity={0.7}>
          <MaterialCommunityIcons name="trash-can-outline" size={18} color={c.danger} />
          <Text style={styles.clearText}>Clear all data</Text>
        </TouchableOpacity>
        <Text style={styles.clearHint}>Deletes every run, preset, and sound on this device.</Text>
      </ScrollView>
    </View>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  const styles = useStyles();
  return (
    <>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.card}>{children}</View>
    </>
  );
}

function Divider() {
  const styles = useStyles();
  return <View style={styles.divider} />;
}

function ToggleRow({
  label,
  hint,
  value,
  onValueChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  const c = useColors();
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <View style={styles.rowLabelWrap}>
        <Text style={styles.rowLabel}>{label}</Text>
        {hint ? <Text style={styles.rowHint}>{hint}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: c.primary, false: c.border }}
        thumbColor="#ffffff"
      />
    </View>
  );
}

function UnitRow({
  label,
  value,
  options,
  onSelect,
}: {
  label: string;
  value: string;
  options: { label: string; value: string; description?: string }[];
  onSelect: (value: string) => void;
}) {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Dropdown style={styles.unitDropdown} value={value} options={options} onSelect={onSelect} />
    </View>
  );
}

function useStyles() {
  const c = useColors();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: c.background,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg,
        },
        back: {
          flexDirection: "row",
          alignItems: "center",
          marginLeft: -spacing.xs,
          marginBottom: spacing.sm,
        },
        backText: {
          ...typography.label,
          color: c.textMuted,
        },
        title: {
          ...typography.title,
          color: c.text,
          marginBottom: spacing.md,
        },
        content: {
          paddingBottom: spacing.xxl,
        },
        sectionLabel: {
          ...typography.label,
          textTransform: "uppercase",
          color: c.textMuted,
          marginTop: spacing.lg,
          marginBottom: spacing.sm,
        },
        card: {
          backgroundColor: c.surface,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
        },
        row: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: spacing.md,
          paddingVertical: spacing.md,
        },
        rowStack: {
          gap: spacing.sm,
          paddingVertical: spacing.md,
        },
        rowLabelWrap: {
          flexShrink: 1,
          gap: 2,
        },
        rowLabel: {
          ...typography.body,
          color: c.text,
        },
        rowHint: {
          ...typography.label,
          color: c.textFaint,
        },
        divider: {
          height: StyleSheet.hairlineWidth,
          backgroundColor: c.border,
        },
        unitDropdown: {
          minWidth: 140,
        },
        clearButton: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.sm,
          borderWidth: 1,
          borderColor: c.danger,
          borderRadius: radius.md,
          paddingVertical: spacing.md,
        },
        clearText: {
          ...typography.body,
          fontFamily: fonts.semibold,
          color: c.danger,
        },
        clearHint: {
          ...typography.label,
          color: c.textFaint,
          textAlign: "center",
          marginTop: spacing.sm,
        },
      }),
    [c]
  );
}
