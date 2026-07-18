import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "../theme";
import { useStore } from "../program/store";
import { useRunTracker } from "./useRunTracker";
import {
  DistanceGoalUnit,
  goalDistanceMeters,
  goalDurationSeconds,
  metersToDistanceUnit,
  RunConfig,
} from "./types";

/** The live tracking screen shown while a run is in progress. */
export default function ActiveRun({ config, onStop }: { config: RunConfig; onStop: () => void }) {
  const { presets } = useStore();
  const { distance, elapsed, error } = useRunTracker(true);

  const preset = presets.find((p) => p.id === config.presetId) ?? null;
  const programName = preset?.name ?? "No program";

  // Choose display units: follow the distance goal, else default to km.
  const distanceUnit: DistanceGoalUnit =
    config.goal.kind === "distance" ? (config.goal.unit as DistanceGoalUnit) : "km";
  const paceUnit = distanceUnit === "mi" ? "mi" : "km";
  const distanceInUnit = metersToDistanceUnit(distance, distanceUnit);

  // Average pace (sec per mi/km); needs a little distance to be meaningful.
  const paceMeters = paceUnit === "mi" ? 1609.344 : 1000;
  const paceSec = distance > 20 ? elapsed / (distance / paceMeters) : null;

  // Goal progress + what's left.
  let progress = 0;
  let remainingLabel = "";
  if (config.goal.kind === "distance") {
    const goalM = goalDistanceMeters(config.goal);
    progress = goalM > 0 ? distance / goalM : 0;
    const leftUnits = metersToDistanceUnit(Math.max(0, goalM - distance), distanceUnit);
    remainingLabel = `${formatDistance(leftUnits, distanceUnit)} ${distanceUnit} left`;
  } else {
    const goalS = goalDurationSeconds(config.goal);
    progress = goalS > 0 ? elapsed / goalS : 0;
    remainingLabel = `${formatDuration(Math.max(0, goalS - elapsed))} left`;
  }
  const clamped = Math.max(0, Math.min(1, progress));

  return (
    <View style={styles.container}>
      <View style={styles.programPill}>
        <MaterialCommunityIcons name="tune-vertical" size={14} color={colors.primary} />
        <Text style={styles.programText}>{programName}</Text>
      </View>

      <View style={styles.metrics}>
        <Metric label={`Distance (${distanceUnit})`} value={formatDistance(distanceInUnit, distanceUnit)} big />
        <View style={styles.metricRow}>
          <Metric label="Time" value={formatDuration(elapsed)} />
          <Metric label={`Pace (/${paceUnit})`} value={paceSec != null ? formatDuration(paceSec) : "--:--"} />
        </View>
      </View>

      <View style={styles.goalCard}>
        <View style={styles.goalTop}>
          <Text style={styles.goalLabel}>
            Goal: {config.goal.value} {config.goal.unit}
          </Text>
          <Text style={styles.goalRemaining}>{remainingLabel}</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${clamped * 100}%` }]} />
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.spacer} />

      <TouchableOpacity style={styles.stopButton} onPress={onStop} activeOpacity={0.85}>
        <MaterialCommunityIcons name="stop" size={20} color="#ffffff" />
        <Text style={styles.stopText}>End run</Text>
      </TouchableOpacity>
    </View>
  );
}

function Metric({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <View style={big ? undefined : styles.metricCell}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, big && styles.metricValueBig]}>{value}</Text>
    </View>
  );
}

function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = m.toString().padStart(2, "0");
  const ss = s.toString().padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

function formatDistance(value: number, unit: DistanceGoalUnit): string {
  return unit === "m" ? Math.round(value).toString() : value.toFixed(2);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  programPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: spacing.xs,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  programText: {
    ...typography.label,
    color: colors.primary,
  },
  metrics: {
    marginTop: spacing.xxl,
    gap: spacing.xl,
  },
  metricRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  metricCell: {
    flex: 1,
  },
  metricLabel: {
    ...typography.label,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  metricValue: {
    ...typography.title,
    color: colors.text,
    fontVariant: ["tabular-nums"],
  },
  metricValueBig: {
    fontSize: 72,
    fontWeight: "800",
  },
  goalCard: {
    marginTop: spacing.xxl,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  goalTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  goalLabel: {
    ...typography.body,
    fontWeight: "600",
    color: colors.text,
  },
  goalRemaining: {
    ...typography.label,
    color: colors.textMuted,
    fontVariant: ["tabular-nums"],
  },
  progressTrack: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    overflow: "hidden",
  },
  progressFill: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  error: {
    ...typography.body,
    color: colors.danger,
    marginTop: spacing.lg,
  },
  spacer: {
    flex: 1,
  },
  stopButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  stopText: {
    ...typography.body,
    fontWeight: "700",
    color: "#ffffff",
    fontSize: 17,
  },
});
