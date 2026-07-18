import { DistanceGoalUnit, Goal, metersToDistanceUnit } from "./types";

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
