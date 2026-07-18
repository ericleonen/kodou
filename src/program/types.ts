/**
 * Data model for the Program feature.
 *
 * A Preset is a named collection of Rules. Each Rule pairs one
 * "critical moment" (a well-defined runtime event) with one or more
 * responses (a sound, spoken phrase, or vibration). Presets are just a
 * library — the runner picks which preset to use when a run starts, so
 * nothing here is "active".
 */

export type MomentType =
  | "slowing_down"
  | "nearing_end"
  | "stopped"
  | "new_fastest"
  | "every_split"
  | "halfway"
  | "milestone"
  | "goal_reached";

export type ResponseKind = "sound" | "speak" | "vibrate";

export interface CriticalMoment {
  type: MomentType;
  /** Human-readable qualifier, e.g. "by 30 sec/km" or "for 10s". */
  detail?: string;
}

export interface RuleResponse {
  kind: ResponseKind;
  /** Sound name, spoken phrase, or vibration pattern label. */
  value: string;
}

export interface Rule {
  id: string;
  moment: CriticalMoment;
  responses: RuleResponse[];
}

export interface Preset {
  id: string;
  name: string;
  description?: string;
  rules: Rule[];
}
