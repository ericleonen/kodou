import { ReactNode, useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import RunMap from "../components/RunMap";
import { fonts, radius, spacing, typography, useColors } from "../theme";
import { useStore } from "../program/store";
import { useSettings } from "../settings/settings";
import { finishRun, pauseRun, resumeRun, useRunEngine } from "./runEngine";
import {
  DistanceGoalUnit,
  goalDistanceMeters,
  goalDurationSeconds,
  metersToDistanceUnit,
} from "./types";

/** The live tracking screen shown while a run is in progress. */
export default function ActiveRun() {
  const c = useColors();
  const styles = useStyles();
  const { presets } = useStore();
  const { paceUnit, keepAwake } = useSettings();
  const { config, distance, elapsed, paused, error } = useRunEngine();
  // Stats-first by default; the toggle expands the map (Strava-style).
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (!keepAwake) return;
    const tag = "kodou-run";
    activateKeepAwakeAsync(tag).catch(() => {});
    return () => {
      Promise.resolve(deactivateKeepAwake(tag)).catch(() => {});
    };
  }, [keepAwake]);

  if (!config) return null;

  const preset = presets.find((p) => p.id === config.presetId) ?? null;
  const programName = preset?.name ?? "No program";

  const distanceUnit: DistanceGoalUnit =
    config.goal.kind === "distance" ? (config.goal.unit as DistanceGoalUnit) : "km";
  const distanceInUnit = metersToDistanceUnit(distance, distanceUnit);

  // Average pace: total time over total distance, in seconds per mi/km.
  const paceMeters = paceUnit === "mi" ? 1609.344 : 1000;
  const paceSec = distance > 20 ? elapsed / (distance / paceMeters) : null;
  const paceValue = paceSec != null ? formatDuration(paceSec) : "--:--";

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
  const goalReached = clamped >= 1;

  function handleFinish() {
    if (goalReached) {
      finishRun();
      return;
    }
    Alert.alert("Quit before reaching your goal?", "You haven't reached your goal yet.", [
      { text: "Keep running", style: "cancel" },
      { text: "Finish", style: "destructive", onPress: finishRun },
    ]);
  }

  const distanceValue = formatDistance(distanceInUnit, distanceUnit);
  const timeValue = formatDuration(elapsed);

  const topRow = (
    <View style={styles.topRow}>
      <View style={styles.programPill}>
        <MaterialCommunityIcons name="tune-vertical" size={14} color={c.primary} />
        <Text style={styles.programText}>{programName}</Text>
      </View>
      <View style={styles.topRight}>
        {paused ? (
          <View style={styles.pausedPill}>
            <MaterialCommunityIcons name="pause" size={13} color={c.textMuted} />
            <Text style={styles.pausedBadge}>Paused</Text>
          </View>
        ) : null}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setShowMap((v) => !v)}
          activeOpacity={0.8}
          accessibilityLabel={showMap ? "Show stats" : "Show map"}
        >
          <MaterialCommunityIcons
            name={showMap ? "chart-box-outline" : "map-outline"}
            size={22}
            color={c.text}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  const goalBlock = (
    <>
      <View style={styles.goalTop}>
        <Text style={styles.goalLabel}>
          Goal: {config.goal.value} {config.goal.unit}
        </Text>
        <Text style={styles.goalRemaining}>{remainingLabel}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${clamped * 100}%` }]} />
      </View>
    </>
  );

  const controls = paused ? (
    <View style={styles.controlRow}>
      <TouchableOpacity
        style={[styles.control, styles.resumeButton]}
        onPress={resumeRun}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons name="play" size={20} color="#ffffff" />
        <Text style={styles.controlText}>Resume</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.control, styles.finishButton]}
        onPress={handleFinish}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons name="flag-checkered" size={20} color={c.danger} />
        <Text style={[styles.controlText, styles.finishText]}>Finish</Text>
      </TouchableOpacity>
    </View>
  ) : (
    <TouchableOpacity style={styles.pauseButton} onPress={pauseRun} activeOpacity={0.85}>
      <MaterialCommunityIcons name="pause" size={20} color={c.text} />
      <Text style={styles.pauseLabel}>Pause</Text>
    </TouchableOpacity>
  );

  // ---- Map-expanded layout: map fills the screen, stats collapse to a panel.
  if (showMap) {
    return (
      <View style={styles.container}>
        <RunMap live style={StyleSheet.absoluteFill} mapPadding={{ top: 170, bottom: 120 }} />
        <View style={styles.overlay} pointerEvents="box-none">
          <View style={styles.topCluster} pointerEvents="box-none">
            {topRow}
            <View style={styles.panel}>
              <View style={styles.metricRow}>
                <Metric label={`Distance (${distanceUnit})`} value={distanceValue} />
                <Metric label="Time" value={timeValue} />
                <Metric label={`Pace (/${paceUnit})`} value={paceValue} />
              </View>
              {goalBlock}
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
          <View style={styles.bottomCluster} pointerEvents="box-none">
            {controls}
          </View>
        </View>
      </View>
    );
  }

  // ---- Default stats-first layout: big centered numbers, no map.
  return (
    <View style={styles.statsContainer}>
      {topRow}
      <View style={styles.statsBody}>
        <View style={styles.statBlock}>
          <Text style={styles.statLabel}>Distance ({distanceUnit})</Text>
          <Text style={styles.statHuge} numberOfLines={1} adjustsFontSizeToFit>
            {distanceValue}
          </Text>
        </View>
        <View style={styles.statSecondaryRow}>
          <View style={styles.statBlockHalf}>
            <Text style={styles.statLabel}>Time</Text>
            <Text style={styles.statLarge} numberOfLines={1} adjustsFontSizeToFit>
              {timeValue}
            </Text>
          </View>
          <View style={styles.statBlockHalf}>
            <Text style={styles.statLabel}>Pace (/{paceUnit})</Text>
            <Text style={styles.statLarge} numberOfLines={1} adjustsFontSizeToFit>
              {paceValue}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.goalCard}>{goalBlock}</View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {controls}
    </View>
  );
}

function Metric({
  label,
  value,
  valueStyle,
}: {
  label: string;
  value: string;
  valueStyle?: object;
}) {
  const styles = useStyles();
  return (
    <View style={styles.metricCell}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, valueStyle]}>{value}</Text>
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

function useStyles() {
  const c = useColors();
  return useMemo(() =>
    StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.surfaceAlt,
  },
  statsContainer: {
    flex: 1,
    backgroundColor: c.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
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
    paddingBottom: spacing.lg,
  },
  topCluster: {
    gap: spacing.sm,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.overlay,
  },
  programPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: c.overlay,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  programText: {
    ...typography.label,
    color: c.primary,
  },
  pausedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: c.overlay,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  pausedBadge: {
    ...typography.label,
    textTransform: "uppercase",
    color: c.textMuted,
    fontFamily: fonts.bold,
  },
  panel: {
    backgroundColor: c.overlay,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  metricRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  metricCell: {
    flex: 1,
  },
  metricLabel: {
    ...typography.caption,
    color: c.textMuted,
    marginBottom: spacing.xxs,
  },
  metricValue: {
    ...typography.display,
    fontSize: 30,
    color: c.text,
    fontVariant: ["tabular-nums"],
  },
  // Centered big-number stats (default no-map view).
  statsBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xl,
  },
  statBlock: {
    alignItems: "center",
  },
  statSecondaryRow: {
    flexDirection: "row",
    alignSelf: "stretch",
  },
  statBlockHalf: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    ...typography.label,
    textTransform: "uppercase",
    color: c.textMuted,
    marginBottom: spacing.xs,
  },
  statHuge: {
    ...typography.display,
    fontSize: 132,
    color: c.text,
    fontVariant: ["tabular-nums"],
    textAlign: "center",
  },
  statLarge: {
    ...typography.display,
    fontSize: 60,
    color: c.text,
    fontVariant: ["tabular-nums"],
    textAlign: "center",
  },
  goalTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  goalLabel: {
    ...typography.label,
    fontFamily: fonts.semibold,
    color: c.text,
  },
  goalRemaining: {
    ...typography.label,
    color: c.textMuted,
    fontVariant: ["tabular-nums"],
  },
  goalCard: {
    marginTop: spacing.xxl,
    marginBottom: spacing.lg,
    backgroundColor: c.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  progressTrack: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: c.surfaceAlt,
    overflow: "hidden",
  },
  progressFill: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: c.primary,
  },
  error: {
    ...typography.label,
    color: c.danger,
    backgroundColor: c.overlay,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  spacer: {
    flex: 1,
  },
  bottomCluster: {
    gap: spacing.md,
  },
  controlRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  control: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
  },
  controlText: {
    ...typography.body,
    fontFamily: fonts.bold,
    color: "#ffffff",
    fontSize: 17,
  },
  pauseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: c.surface,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
  },
  pauseLabel: {
    ...typography.body,
    fontFamily: fonts.bold,
    fontSize: 17,
    color: c.text,
  },
  resumeButton: {
    backgroundColor: c.primary,
  },
  finishButton: {
    backgroundColor: c.overlay,
    borderWidth: 1.5,
    borderColor: c.danger,
  },
  finishText: {
    color: c.danger,
  },
    }), [c]);
}
