import { Preset } from "./types";

/**
 * Default presets seeded on first launch and restored when data is cleared.
 * Together they demonstrate every moment type (speeding up, slowing down,
 * splits, almost done) and both responses (sounds + buzzes). Sound ids refer
 * to the bundled seed sounds (see seedSounds.ts).
 */
export const SEED_PRESETS: Preset[] = [
  {
    id: "speedy-1-mile",
    name: "Speedy 1 Mile",
    description: "Go fast, hold form, kick to the line.",
    rules: [
      {
        id: "s1-speed",
        moment: { type: "speeding_up", threshold: 6, unit: "min/mi" },
        responses: [{ kind: "sound", soundId: "seed-gear-second" }],
      },
      {
        id: "s1-slow",
        moment: { type: "slowing_down", threshold: 6.5, unit: "min/mi" },
        responses: [{ kind: "vibrate", times: 2 }],
      },
      {
        id: "s1-done",
        moment: { type: "almost_done", amount: 400, unit: "m" },
        responses: [{ kind: "sound", soundId: "seed-assemble" }],
      },
    ],
  },
  {
    id: "endurance-run",
    name: "Endurance Run",
    description: "Settle in, tick off the splits, finish strong.",
    rules: [
      {
        id: "en-slow",
        moment: { type: "slowing_down", threshold: 9, unit: "min/mi" },
        responses: [{ kind: "vibrate", times: 2 }],
      },
      {
        id: "en-split",
        moment: { type: "split", interval: 1, unit: "km" },
        responses: [{ kind: "sound", soundId: "seed-narutos-theme" }],
      },
      {
        id: "en-done",
        moment: { type: "almost_done", amount: 5, unit: "min" },
        responses: [{ kind: "sound", soundId: "seed-david-goggins" }],
      },
    ],
  },
  {
    id: "5k-pr",
    name: "5K PR",
    description: "Every kilometer counts — chase the personal best.",
    rules: [
      {
        id: "5k-split",
        moment: { type: "split", interval: 1, unit: "km" },
        responses: [{ kind: "vibrate", times: 1 }],
      },
      {
        id: "5k-speed",
        moment: { type: "speeding_up", threshold: 6.5, unit: "min/mi" },
        responses: [{ kind: "sound", soundId: "seed-my-soldiers-rage" }],
      },
      {
        id: "5k-slow",
        moment: { type: "slowing_down", threshold: 7, unit: "min/mi" },
        responses: [{ kind: "vibrate", times: 3 }],
      },
      {
        id: "5k-done",
        moment: { type: "almost_done", amount: 500, unit: "m" },
        responses: [{ kind: "sound", soundId: "seed-ryujin-no-ken" }],
      },
    ],
  },
];
