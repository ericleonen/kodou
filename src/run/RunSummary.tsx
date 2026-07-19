import { ReactNode, useMemo, useState } from "react";
import {
  Alert,
  LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import PaceChart from "../components/PaceChart";
import RunPath from "../components/RunPath";
import { MOMENTS } from "../program/catalog";
import { useColors, radius, spacing, typography } from "../theme";
import { useRuns } from "./runsStore";
import { formatAvgPace, formatDistance, formatDuration, paceUnitLabel, runDistanceUnit } from "./format";
import { Goal, RunRecording } from "./types";

type Props = {
  recording: RunRecording;
  goal: Goal;
  presetName: string | null;
  onDone: () => void;
};

/** Post-run screen: review the route and pace, then save or discard. */
export default function RunSummary({ recording, goal, presetName, onDone }: Props) {
  const { saveRun } = useRuns();
  const styles = useStyles();
  const unit = runDistanceUnit(goal);
  const paceUnit = paceUnitLabel(unit);

  const pathMarkers = recording.events.map((e) => ({
    icon: MOMENTS[e.type].icon,
    latitude: e.latitude,
    longitude: e.longitude,
  }));
  const paceMarkers = recording.events.map((e) => ({ icon: MOMENTS[e.type].icon, t: e.t }));

  function handleSave() {
    saveRun(recording, goal, presetName);
    onDone();
  }

  function handleDiscard() {
    Alert.alert("Discard this run?", "It won't be saved.", [
      { text: "Cancel", style: "cancel" },
      { text: "Discard", style: "destructive", onPress: onDone },
    ]);
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Run complete</Text>

        <View style={styles.stats}>
          <Stat label={`Distance (${unit})`} value={formatDistance(recording.distance, unit)} />
          <Stat label="Time" value={formatDuration(recording.duration)} />
          <Stat
            label={`Pace (/${paceUnit})`}
            value={formatAvgPace(recording.distance, recording.duration, unit)}
          />
        </View>

        <Text style={styles.cardLabel}>Route</Text>
        <View style={styles.card}>
          <Measured height={220}>
            {(w) => <RunPath path={recording.path} markers={pathMarkers} width={w} height={220} />}
          </Measured>
        </View>

        <Text style={styles.cardLabel}>Pace</Text>
        <View style={styles.card}>
          <Measured height={110}>
            {(w) => (
              <PaceChart samples={recording.samples} markers={paceMarkers} width={w} height={110} />
            )}
          </Measured>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.saveText}>Save run</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.discardButton} onPress={handleDiscard} activeOpacity={0.7}>
          <Text style={styles.discardText}>Discard</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
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
    ...typography.heading,
    color: c.text,
    fontVariant: ["tabular-nums"],
  },
  cardLabel: {
    ...typography.label,
    textTransform: "uppercase",
    color: c.textMuted,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
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
    fontWeight: "700",
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
    fontWeight: "600",
    color: c.textMuted,
  },
    }), [c]);
}
