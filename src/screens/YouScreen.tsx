import { ReactNode, useState } from "react";
import {
  Alert,
  LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import PaceChart from "../components/PaceChart";
import RunPath from "../components/RunPath";
import { colors, radius, spacing, typography } from "../theme";
import { useRuns } from "../run/runsStore";
import {
  formatAvgPace,
  formatDistance,
  formatDuration,
  formatRunDate,
  paceUnitLabel,
  runDistanceUnit,
} from "../run/format";
import { SavedRun } from "../run/types";

/** You tab: locally saved runs, each shown with its route and pace. */
export default function YouScreen() {
  const { runs, deleteRun } = useRuns();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>You</Text>
      <Text style={styles.subtitle}>Your saved runs.</Text>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {runs.length === 0 ? (
          <Text style={styles.empty}>No saved runs yet. Finish a run to save it here.</Text>
        ) : (
          runs.map((run) => <RunCard key={run.id} run={run} onDelete={() => confirmDelete(run, deleteRun)} />)
        )}
      </ScrollView>
    </View>
  );
}

function confirmDelete(run: SavedRun, deleteRun: (id: string) => void) {
  Alert.alert("Delete run?", "This can't be undone.", [
    { text: "Cancel", style: "cancel" },
    { text: "Delete", style: "destructive", onPress: () => deleteRun(run.id) },
  ]);
}

function RunCard({ run, onDelete }: { run: SavedRun; onDelete: () => void }) {
  const unit = runDistanceUnit(run.goal);
  const paceUnit = paceUnitLabel(unit);

  return (
    <TouchableOpacity style={styles.card} onLongPress={onDelete} activeOpacity={0.9} delayLongPress={300}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardDistance}>
            {formatDistance(run.distance, unit)} {unit}
          </Text>
          <Text style={styles.cardDate}>{formatRunDate(run.date)}</Text>
        </View>
        <View style={styles.cardMeta}>
          <Text style={styles.cardMetaValue}>{formatDuration(run.duration)}</Text>
          <Text style={styles.cardMetaLabel}>
            {formatAvgPace(run.distance, run.duration, unit)} /{paceUnit}
          </Text>
        </View>
      </View>

      <Measured height={160}>
        {(w) => (
          <View style={styles.route}>
            <RunPath path={run.path} width={w} height={160} />
          </View>
        )}
      </Measured>

      <Measured height={56}>
        {(w) => <PaceChart samples={run.samples} width={w} height={56} strokeWidth={2} />}
      </Measured>

      {run.presetName ? (
        <View style={styles.programRow}>
          <MaterialCommunityIcons name="tune-vertical" size={13} color={colors.textMuted} />
          <Text style={styles.programText}>{run.presetName}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  list: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  empty: {
    ...typography.body,
    color: colors.textFaint,
    textAlign: "center",
    paddingVertical: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardDistance: {
    ...typography.heading,
    color: colors.text,
  },
  cardDate: {
    ...typography.label,
    color: colors.textMuted,
    marginTop: 2,
  },
  cardMeta: {
    alignItems: "flex-end",
  },
  cardMetaValue: {
    ...typography.body,
    fontWeight: "700",
    color: colors.text,
    fontVariant: ["tabular-nums"],
  },
  cardMetaLabel: {
    ...typography.label,
    color: colors.textMuted,
    fontVariant: ["tabular-nums"],
  },
  route: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  programRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  programText: {
    ...typography.label,
    color: colors.textMuted,
  },
});
