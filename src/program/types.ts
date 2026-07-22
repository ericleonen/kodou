/**
 * Data model for the Program feature.
 *
 * A Preset is a named collection of Rules. Each Rule pairs one critical
 * moment (a well-defined runtime event, with its own typed parameters)
 * with one or more responses. Presets are just a library — the runner
 * picks which one to use when a run starts, so nothing here is "active".
 */

export type PaceUnit = "min/mi" | "min/km";
export type ProximityUnit = "mi" | "km" | "m" | "min" | "sec";
export type DistanceUnit = "mi" | "km" | "m";

/** The supported critical moments, each carrying its own parameters. */
export type CriticalMoment =
  | { type: "slowing_down"; threshold: number; unit: PaceUnit }
  | { type: "speeding_up"; threshold: number; unit: PaceUnit }
  | { type: "almost_done"; amount: number; unit: ProximityUnit }
  | { type: "split"; interval: number; unit: DistanceUnit };

export type MomentType = CriticalMoment["type"];

/**
 * A spoken cue. Live phrases ("pace", "remaining", "completed") are filled in
 * from the run's current stats when spoken; "custom" reads a fixed sentence.
 */
export type SpeakPhrase =
  | { kind: "pace" }
  | { kind: "remaining" }
  | { kind: "completed" }
  | { kind: "custom"; text: string };

export type SpeakPhraseKind = SpeakPhrase["kind"];

/** The supported responses. */
export type RuleResponse =
  | { kind: "sound"; soundId: string }
  | { kind: "vibrate"; times: number }
  | { kind: "speak"; phrase: SpeakPhrase };

export type ResponseKind = RuleResponse["kind"];

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

/** A user-uploaded audio file, stored locally on the device. */
export interface Sound {
  id: string;
  name: string;
  /** file:// URI inside the app's document directory. */
  uri: string;
  /** Full length of the file in seconds. */
  duration: number;
  /** Trim start in seconds (playback begins here). */
  start: number;
  /** Trim end in seconds (playback stops here). */
  end: number;
}
