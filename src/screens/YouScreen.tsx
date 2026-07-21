import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { fonts, radius, spacing, typography, useColors } from "../theme";
import { haptics } from "../haptics";
import PressableScale from "../components/PressableScale";
import RunMap from "../components/RunMap";
import { useRuns } from "../run/runsStore";
import RunDetail from "../run/RunDetail";
import { useRunPlace } from "../run/place";
import SettingsScreen from "./SettingsScreen";
import {
  formatAvgPace,
  formatDistance,
  formatDuration,
  formatGoalTarget,
  formatRunDate,
  formatRunTime,
  isGoalReached,
  paceUnitLabel,
  runAchievement,
  runDistanceUnit,
  runTitle,
} from "../run/format";
import { SavedRun } from "../run/types";

/** You tab: locally saved runs, each summarized on a tappable card. */
export default function YouScreen() {
  const c = useColors();
  const styles = useStyles();
  const { runs } = useRuns();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [openRunId, setOpenRunId] = useState<string | null>(null);

  if (settingsOpen) {
    return <SettingsScreen onBack={() => setSettingsOpen(false)} />;
  }

  const openRun = openRunId ? runs.find((r) => r.id === openRunId) : null;
  if (openRun) {
    return <RunDetail run={openRun} onBack={() => setOpenRunId(null)} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>Activity</Text>
        <TouchableOpacity onPress={() => setSettingsOpen(true)} hitSlop={8} accessibilityLabel="Settings">
          <MaterialCommunityIcons name="cog-outline" size={24} color={c.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {runs.length === 0 ? (
          <Text style={styles.empty}>No saved runs yet. Finish a run to save it here.</Text>
        ) : (
          runs.map((run) => (
            <RunCard key={run.id} run={run} onPress={() => setOpenRunId(run.id)} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function RunCard({ run, onPress }: { run: SavedRun; onPress: () => void }) {
  const c = useColors();
  const styles = useStyles();
  const place = useRunPlace(run);
  const unit = runDistanceUnit(run.goal);
  const paceUnit = paceUnitLabel(unit);
  const reached = isGoalReached(run);

  return (
    <PressableScale style={styles.card} onPress={onPress} haptic={haptics.select}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {runTitle(run)}
        </Text>
        <MaterialCommunityIcons name="chevron-right" size={22} color={c.textFaint} />
      </View>
      <Text style={styles.cardMeta} numberOfLines={1}>
        {[place, formatRunDate(run.date), formatRunTime(run.date)].filter(Boolean).join(" · ")}
      </Text>

      {run.path.length > 1 ? (
        <View style={styles.mapCard} pointerEvents="none">
          <RunMap path={run.path} style={StyleSheet.absoluteFill} />
        </View>
      ) : null}

      <View style={styles.goalRow}>
        <MaterialCommunityIcons
          name={reached ? "check-circle" : "flag-outline"}
          size={16}
          color={reached ? c.success : c.textMuted}
        />
        <Text style={styles.goalText} numberOfLines={1}>
          Goal: {formatGoalTarget(run.goal)}
        </Text>
      </View>
      <Text style={styles.achievement}>{runAchievement(run)}</Text>

      <View style={styles.totals}>
        <Text style={styles.totalsText}>
          {formatDistance(run.distance, unit)} {unit} · {formatDuration(run.duration)} ·{" "}
          {formatAvgPace(run.distance, run.duration, unit)} /{paceUnit}
        </Text>
        {run.presetName ? (
          <View style={styles.programRow}>
            <MaterialCommunityIcons name="tune-vertical" size={12} color={c.textFaint} />
            <Text style={styles.programText}>{run.presetName}</Text>
          </View>
        ) : null}
      </View>
    </PressableScale>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  headerLabel: {
    ...typography.label,
    textTransform: "uppercase",
    color: c.textMuted,
  },
  list: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  empty: {
    ...typography.body,
    color: c.textFaint,
    textAlign: "center",
    paddingVertical: spacing.xl,
  },
  card: {
    backgroundColor: c.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  cardTitle: {
    ...typography.heading,
    color: c.text,
    flexShrink: 1,
  },
  cardMeta: {
    ...typography.label,
    color: c.textMuted,
  },
  mapCard: {
    height: 150,
    borderRadius: radius.sm,
    overflow: "hidden",
    backgroundColor: c.surfaceAlt,
    marginTop: spacing.sm,
  },
  goalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  goalText: {
    ...typography.body,
    fontFamily: fonts.semibold,
    color: c.text,
    flexShrink: 1,
  },
  achievement: {
    ...typography.body,
    color: c.textMuted,
  },
  totals: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.border,
    paddingTop: spacing.sm,
  },
  totalsText: {
    ...typography.label,
    color: c.textFaint,
    fontVariant: ["tabular-nums"],
    flexShrink: 1,
  },
  programRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  programText: {
    ...typography.label,
    color: c.textFaint,
  },
    }), [c]);
}
