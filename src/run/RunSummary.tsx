import { ReactNode, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import PaceChart from "../components/PaceChart";
import RunMap from "../components/RunMap";
import PressableScale from "../components/PressableScale";
import { haptics } from "../haptics";
import { MOMENTS } from "../program/catalog";
import { fonts, useColors, radius, spacing, typography } from "../theme";
import { useRuns } from "./runsStore";
import { reverseGeocode } from "./place";
import {
  defaultRunTitle,
  formatAvgPace,
  formatDistance,
  formatDuration,
  paceUnitLabel,
  runDistanceUnit,
} from "./format";
import { Goal, RunRecording } from "./types";

type Props = {
  recording: RunRecording;
  goal: Goal;
  presetName: string | null;
  onDone: () => void;
};

/** Post-run screen: review the route and pace, then save or discard. */
export default function RunSummary({ recording, goal, presetName, onDone }: Props) {
  const c = useColors();
  const { saveRun } = useRuns();
  const styles = useStyles();
  const unit = runDistanceUnit(goal);
  const paceUnit = paceUnitLabel(unit);

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  const paceMarkers = recording.events.map((e) => ({ icon: MOMENTS[e.type].icon, t: e.t }));

  async function handleSave() {
    const place = recording.path[0] ? await reverseGeocode(recording.path[0]) : null;
    saveRun(recording, goal, presetName, {
      title,
      notes,
      place: place ?? undefined,
    });
    onDone();
  }

  function handleDiscard() {
    Alert.alert("Discard this run?", "It won't be saved.", [
      { text: "Cancel", style: "cancel" },
      { text: "Discard", style: "destructive", onPress: onDone },
    ]);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Run complete</Text>

        <View style={styles.stats}>
          <Stat label={`Distance (${unit})`} value={formatDistance(recording.distance, unit)} />
          <Stat label="Time" value={formatDuration(recording.duration)} />
          <Stat
            label={`Pace (/${paceUnit})`}
            value={formatAvgPace(recording.distance, recording.duration, unit)}
          />
        </View>

        <Text style={styles.fieldLabel}>Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder={defaultRunTitle(new Date().toISOString())}
          placeholderTextColor={c.textFaint}
          maxLength={80}
          returnKeyType="done"
        />

        <Text style={styles.fieldLabel}>Notes</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          value={notes}
          onChangeText={setNotes}
          placeholder="How did it go?"
          placeholderTextColor={c.textFaint}
          multiline
        />

        <Text style={styles.cardLabel}>Route</Text>
        <View style={styles.mapCard}>
          <RunMap path={recording.path} style={StyleSheet.absoluteFill} />
        </View>

        <Text style={styles.cardLabel}>Pace</Text>
        <View style={styles.card}>
          <Measured height={160}>
            {(w) => (
              <PaceChart
                samples={recording.samples}
                markers={paceMarkers}
                paceUnit={paceUnit}
                width={w}
                height={160}
              />
            )}
          </Measured>
        </View>

        <PressableScale style={styles.saveButton} onPress={handleSave} haptic={haptics.success}>
          <Text style={styles.saveText}>Save run</Text>
        </PressableScale>
        <TouchableOpacity style={styles.discardButton} onPress={handleDiscard} activeOpacity={0.7}>
          <Text style={styles.discardText}>Discard</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const styles = useStyles();
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function Measured({ height, children }: { height: number; children: (w: number) => ReactNode }) {
  const [width, setWidth] = useState(0);
  return (
    <View style={{ height }} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 ? children(width) : null}
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
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    ...typography.title,
    color: c.text,
  },
  stats: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  stat: {
    flex: 1,
  },
  statLabel: {
    ...typography.label,
    color: c.textMuted,
    marginBottom: spacing.xs,
  },
  statValue: {
    ...typography.display,
    fontSize: 28,
    color: c.text,
    fontVariant: ["tabular-nums"],
  },
  fieldLabel: {
    ...typography.label,
    textTransform: "uppercase",
    color: c.textMuted,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  input: {
    ...typography.body,
    color: c.text,
    backgroundColor: c.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  notesInput: {
    minHeight: 84,
    textAlignVertical: "top",
    paddingTop: spacing.sm,
  },
  cardLabel: {
    ...typography.label,
    textTransform: "uppercase",
    color: c.textMuted,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  mapCard: {
    height: 260,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: c.surfaceAlt,
  },
  card: {
    backgroundColor: c.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  saveButton: {
    backgroundColor: c.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.xl,
  },
  saveText: {
    ...typography.body,
    fontFamily: fonts.bold,
    color: "#ffffff",
    fontSize: 17,
  },
  discardButton: {
    alignItems: "center",
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  discardText: {
    ...typography.body,
    fontFamily: fonts.semibold,
    color: c.textMuted,
  },
    }), [c]);
}
