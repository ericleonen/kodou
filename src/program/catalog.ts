import { MaterialCommunityIcons } from "@expo/vector-icons";
import { MomentType, ResponseKind, Rule, RuleResponse } from "./types";

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

/**
 * The curated vocabulary of critical moments. Keeping this a fixed
 * catalog (rather than free-form config) is what lets each rule read as
 * a well-defined sentence. `phrase` slots in after "When…".
 */
export const MOMENTS: Record<
  MomentType,
  { phrase: string; icon: IconName; needsGoal?: boolean }
> = {
  slowing_down: { phrase: "I slow down", icon: "trending-down" },
  nearing_end: { phrase: "I'm nearing the end", icon: "flag-checkered", needsGoal: true },
  stopped: { phrase: "I stop", icon: "pause-circle-outline" },
  new_fastest: { phrase: "I hit a new fastest pace", icon: "flash-outline" },
  every_split: { phrase: "I complete a split", icon: "map-marker-distance" },
  halfway: { phrase: "I reach the halfway point", icon: "arrow-collapse-vertical", needsGoal: true },
  milestone: { phrase: "I reach a milestone", icon: "map-marker-check-outline" },
  goal_reached: { phrase: "I reach my goal", icon: "trophy-outline", needsGoal: true },
};

/** The curated set of responses a rule can trigger. */
export const RESPONSES: Record<ResponseKind, { icon: IconName; describe: (value: string) => string }> = {
  sound: { icon: "volume-high", describe: (v) => `"${v}"` },
  speak: { icon: "account-voice", describe: (v) => `Say "${v}"` },
  vibrate: { icon: "vibrate", describe: (v) => `Buzz ${v}` },
};

/** Builds the "When …" sentence for a rule's moment. */
export function describeMoment(rule: Rule): string {
  const { phrase } = MOMENTS[rule.moment.type];
  return rule.moment.detail ? `When ${phrase} ${rule.moment.detail}` : `When ${phrase}`;
}

export function describeResponse(response: RuleResponse): string {
  return RESPONSES[response.kind].describe(response.value);
}
