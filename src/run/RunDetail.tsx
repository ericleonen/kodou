import { ReactNode, useMemo, useState } from "react";
import {
  LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import PaceChart from "../components/PaceChart";
import RunMap from "../components/RunMap";
import ActionSheet from "../components/ActionSheet";
import SwipeBackView from "../components/SwipeBackView";
import { confirmDelete } from "../components/confirmDelete";
import { useBackHandler } from "../hooks/useBackHandler";
import { MOMENTS } from "../program/catalog";
import { fonts, radius, spacing, typography, useColors } from "../theme";
import { useRuns } from "./runsStore";
import { useRunPlace } from "./place";
import RunEdit from "./RunEdit";
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
} from "./format";
import { SavedRun } from "./types";

/** Full-detail view of a saved run; editing lives on a separate screen. */
export default function RunDetail({ run, onBack }: { run: SavedRun; onBack: () => void }) {
  const c = useColors();
  const styles = useStyles();
  const { deleteRun } = useRuns();
  const place = useRunPlace(run);

  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  useBackHandler(onBack);

  const unit = runDistanceUnit(run.goal);
  const paceUnit = paceUnitLabel(unit);
  const reached = isGoalReached(run);

  const runEvents = run.events ?? [];
  const paceMarkers = runEvents.map((e) => ({ icon: MOMENTS[e.type].icon, t: e.t }));

  if (editing) {
    return <RunEdit run={run} onDone={() => setEditing(false)} />;
  }

  return (
    <SwipeBackView onBack={onBack} style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} hitSlop={8} accessibilityLabel="Back">
          <MaterialCommunityIcons name="chevron-left" size={28} color={c.text} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setMenuOpen(true)}
          hitSlop={8}
          accessibilityLabel="Run options"
        >
          <MaterialCommunityIcons name="dots-vertical" size={24} color={c.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.titleText}>{runTitle(run)}</Text>
        <Text style={styles.meta}>
          {[place, formatRunDate(run.date), formatRunTime(run.date)].filter(Boolean).join(" · ")}
        </Text>

        <View style={[styles.goalBanner, reached ? styles.goalBannerDone : null]}>
          <MaterialCommunityIcons
            name={reached ? "check-circle" : "flag-outline"}
            size={18}
            color={reached ? c.success : c.textMuted}
          />
          <Text style={styles.goalBannerText}>
            Goal: {formatGoalTarget(run.goal)} · {runAchievement(run)}
          </Text>
        </View>

        {run.notes ? (
          <>
            <Text style={styles.cardLabel}>Notes</Text>
            <Text style={styles.notesText}>{run.notes}</Text>
          </>
        ) : null}

        <View style={styles.stats}>
          <Stat label={`Distance (${unit})`} value={formatDistance(run.distance, unit)} />
          <Stat label="Time" value={formatDuration(run.duration)} />
          <Stat
            label={`Pace (/${paceUnit})`}
            value={formatAvgPace(run.distance, run.duration, unit)}
          />
        </View>

        <Text style={styles.cardLabel}>Route</Text>
        <View style={styles.mapCard}>
          <RunMap path={run.path} style={StyleSheet.absoluteFill} />
        </View>

        <Text style={styles.cardLabel}>Pace</Text>
        <View style={styles.card}>
          <Measured height={170}>
            {(w) => (
              <PaceChart
                samples={run.samples}
                markers={paceMarkers}
                paceUnit={paceUnit}
                width={w}
                height={170}
              />
            )}
          </Measured>
        </View>

        {run.presetName ? (
          <View style={styles.programRow}>
            <MaterialCommunityIcons name="tune-vertical" size={14} color={c.textMuted} />
            <Text style={styles.programText}>{run.presetName}</Text>
          </View>
        ) : null}
      </ScrollView>

      <ActionSheet
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={runTitle(run)}
        actions={[
          {
            label: "Edit run",
            icon: "pencil-outline",
            onPress: () => setEditing(true),
          },
          {
            label: "Delete run",
            icon: "trash-can-outline",
            destructive: true,
            onPress: () =>
              confirmDelete("run", () => {
                deleteRun(run.id);
                onBack();
              }),
          },
        ]}
      />
    </SwipeBackView>
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
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  titleText: {
    ...typography.title,
    color: c.text,
  },
  meta: {
    ...typography.label,
    color: c.textMuted,
    marginTop: spacing.xs,
  },
  goalBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: c.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.lg,
  },
  goalBannerDone: {
    backgroundColor: c.primarySoft,
  },
  goalBannerText: {
    ...typography.body,
    fontFamily: fonts.semibold,
    color: c.text,
    flexShrink: 1,
  },
  stats: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
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
  cardLabel: {
    ...typography.label,
    textTransform: "uppercase",
    color: c.textMuted,
    marginTop: spacing.lg,
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
  notesText: {
    ...typography.body,
    color: c.text,
    backgroundColor: c.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  programRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
  programText: {
    ...typography.label,
    color: c.textMuted,
  },
    }), [c]);
}
