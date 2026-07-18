import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  CriticalMoment,
  DistanceUnit,
  MomentType,
  PaceUnit,
  ProximityUnit,
  ResponseKind,
  RuleResponse,
} from "./types";

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

/** The curated set of critical moments and their icon / picker label. */
export const MOMENTS: Record<MomentType, { label: string; icon: IconName }> = {
  slowing_down: { label: "I slow down", icon: "trending-down" },
  almost_done: { label: "I'm almost done", icon: "flag-checkered" },
  split: { label: "I reach a split", icon: "map-marker-distance" },
};

/** The curated set of responses. */
export const RESPONSES: Record<ResponseKind, { label: string; icon: IconName }> = {
  sound: { label: "Play a sound", icon: "volume-high" },
  vibrate: { label: "Buzz", icon: "vibrate" },
};

export const PACE_UNITS: PaceUnit[] = ["mi/min", "km/min"];
export const PROXIMITY_UNITS: ProximityUnit[] = ["mi", "km", "m", "min", "sec"];
export const DISTANCE_UNITS: DistanceUnit[] = ["mi", "km", "m"];

/** Full names for units, shown alongside the short form in pickers. */
export const UNIT_NAMES: Record<string, string> = {
  "mi/min": "miles per minute",
  "km/min": "kilometers per minute",
  mi: "miles",
  km: "kilometers",
  m: "meters",
  min: "minutes",
  sec: "seconds",
};

/** Builds the readable sentence for a moment, per its parameters. */
export function describeMoment(moment: CriticalMoment): string {
  switch (moment.type) {
    case "slowing_down":
      return `Pace drops below ${moment.threshold} ${moment.unit}`;
    case "almost_done":
      return `Within ${moment.amount} ${moment.unit} of my goal`;
    case "split":
      return `Every ${moment.interval} ${moment.unit}`;
  }
}

/**
 * Builds the readable sentence for a response. Sound responses need the
 * sound's display name resolved from the library (ids are stored, not
 * names), so it's passed in.
 */
export function describeResponse(response: RuleResponse, soundName?: string): string {
  switch (response.kind) {
    case "sound":
      return `${soundName ?? "(deleted)"}`;
    case "vibrate":
      return `Vibrate ${response.times} ${response.times === 1 ? "time" : "times"}`;
  }
}
