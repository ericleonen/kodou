import {
  DistanceGoalUnit,
  Goal,
  goalDistanceMeters,
  goalDurationSeconds,
  metersToDistanceUnit,
  SavedRun,
} from "./types";

export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = m.toString().padStart(2, "0");
  const ss = s.toString().padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

/** Which distance unit to display a run in (follow the goal, else km). */
export function runDistanceUnit(goal: Goal): DistanceGoalUnit {
  return goal.kind === "distance" ? (goal.unit as DistanceGoalUnit) : "km";
}

export function formatDistance(meters: number, unit: DistanceGoalUnit): string {
  const value = metersToDistanceUnit(meters, unit);
  return unit === "m" ? Math.round(value).toString() : value.toFixed(2);
}

/** Average pace as m:ss per km/mi, or "--:--" without enough distance. */
export function formatAvgPace(meters: number, seconds: number, unit: DistanceGoalUnit): string {
  if (meters <= 20) return "--:--";
  const paceMeters = unit === "mi" ? 1609.344 : 1000;
  return formatDuration(seconds / (meters / paceMeters));
}

/** The unit label used for pace (mi or km). */
export function paceUnitLabel(unit: DistanceGoalUnit): "mi" | "km" {
  return unit === "mi" ? "mi" : "km";
}

export function formatRunDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** Time of day a run took place, e.g. "7:30 AM". */
export function formatRunTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** The goal target as a short label, e.g. "5 km" or "30 min". */
export function formatGoalTarget(goal: Goal): string {
  return `${goal.value} ${goal.unit}`;
}

/** Whether the run met its goal (distance covered, or time elapsed). */
export function isGoalReached(run: SavedRun): boolean {
  if (run.goal.kind === "distance") {
    return run.distance >= goalDistanceMeters(run.goal) * 0.999;
  }
  return run.duration >= goalDurationSeconds(run.goal) * 0.999;
}

/**
 * How the run measured up to its goal: for a met goal, what it took to get
 * there; otherwise how far it got.
 */
export function runAchievement(run: SavedRun): string {
  const unit = runDistanceUnit(run.goal);
  const reached = isGoalReached(run);
  if (run.goal.kind === "distance") {
    return reached
      ? `Finished in ${formatDuration(run.duration)}`
      : `Reached ${formatDistance(run.distance, unit)} of ${run.goal.value} ${unit}`;
  }
  return reached
    ? `Covered ${formatDistance(run.distance, unit)} ${unit}`
    : `Ran ${formatDuration(run.duration)} of ${formatGoalTarget(run.goal)}`;
}

/** A generated title based on the time of day, e.g. "Morning run". */
export function defaultRunTitle(iso: string): string {
  const h = new Date(iso).getHours();
  const part = h < 12 ? "Morning" : h < 17 ? "Afternoon" : h < 21 ? "Evening" : "Night";
  return `${part} run`;
}

/** The run's display title: the user's, or a generated fallback. */
export function runTitle(run: SavedRun): string {
  return run.title?.trim() || defaultRunTitle(run.date);
}
