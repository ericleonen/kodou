import { MomentType } from "../program/types";

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

export interface RunPoint {
  latitude: number;
  longitude: number;
}

export interface RunSample {
  /** Seconds since the run started. */
  t: number;
  /** Smoothed speed in meters/second. */
  speed: number;
}

/** A moment that fired during a run, with where and when it happened. */
export interface RunEvent {
  type: MomentType;
  t: number; // seconds since start
  latitude: number;
  longitude: number;
}

/** The raw output of a completed run, before it's saved. */
export interface RunRecording {
  distance: number; // meters
  duration: number; // seconds
  path: RunPoint[];
  samples: RunSample[];
  events: RunEvent[];
}

export interface SavedRun extends RunRecording {
  id: string;
  date: string; // ISO timestamp
  goal: Goal;
  presetName: string | null;
  /** User-given name for the run; falls back to a generated title. */
  title?: string;
  /** Free-form notes the user added about the run. */
  notes?: string;
  /** Reverse-geocoded general area, e.g. "Lynnwood, Washington". */
  place?: string;
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
