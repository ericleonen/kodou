/** A run's target: reach a distance, or run for a duration. */
export type GoalKind = "distance" | "time";
export type DistanceGoalUnit = "mi" | "km" | "m";
export type TimeGoalUnit = "min" | "hr";
export type GoalUnit = DistanceGoalUnit | TimeGoalUnit;

export interface Goal {
  kind: GoalKind;
  value: number;
  unit: GoalUnit;
}

export interface RunConfig {
  goal: Goal;
  /** Chosen preset to apply during the run, or null for no program. */
  presetId: string | null;
}

export const DISTANCE_GOAL_UNITS: DistanceGoalUnit[] = ["mi", "km", "m"];
export const TIME_GOAL_UNITS: TimeGoalUnit[] = ["min", "hr"];

export const GOAL_UNIT_NAMES: Record<GoalUnit, string> = {
  mi: "miles",
  km: "kilometers",
  m: "meters",
  min: "minutes",
  hr: "hours",
};

const METERS_PER: Record<DistanceGoalUnit, number> = { mi: 1609.344, km: 1000, m: 1 };
const SECONDS_PER: Record<TimeGoalUnit, number> = { min: 60, hr: 3600 };

/** Converts a distance goal to meters. */
export function goalDistanceMeters(goal: Goal): number {
  return goal.value * METERS_PER[goal.unit as DistanceGoalUnit];
}

/** Converts a time goal to seconds. */
export function goalDurationSeconds(goal: Goal): number {
  return goal.value * SECONDS_PER[goal.unit as TimeGoalUnit];
}

/** Converts meters into the given distance unit. */
export function metersToDistanceUnit(meters: number, unit: DistanceGoalUnit): number {
  return meters / METERS_PER[unit];
}
