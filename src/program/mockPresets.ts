import { Preset } from "./types";

/**
 * Default presets seeded on first launch (before anything is persisted),
 * so the library is never a blank canvas. They use vibration only, since
 * the sound library starts empty.
 */
export const SEED_PRESETS: Preset[] = [
  {
    id: "long-run",
    name: "Long Run",
    description: "Gentle nudges to hold an easy pace.",
    rules: [
      {
        id: "lr-1",
        moment: { type: "slowing_down", threshold: 8, unit: "mi/min" },
        responses: [{ kind: "vibrate", times: 2 }],
      },
      {
        id: "lr-2",
        moment: { type: "almost_done", amount: 1, unit: "km" },
        responses: [{ kind: "vibrate", times: 3 }],
      },
    ],
  },
  {
    id: "race-pace",
    name: "Race Pace",
    description: "Hold goal pace to the line.",
    rules: [
      {
        id: "rp-1",
        moment: { type: "almost_done", amount: 400, unit: "m" },
        responses: [{ kind: "vibrate", times: 1 }],
      },
    ],
  },
];
