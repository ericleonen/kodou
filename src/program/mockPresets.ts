import { Preset } from "./types";

/**
 * Seed presets used while the Program UI is being built. These stand in
 * for persisted data and double as the "never a blank canvas" starter
 * content a real user would begin with.
 */
export const MOCK_PRESETS: Preset[] = [
  {
    id: "long-run",
    name: "Long Run",
    description: "Steady encouragement to keep an easy pace.",
    rules: [
      {
        id: "lr-1",
        moment: { type: "slowing_down", detail: "by 30 sec/km" },
        responses: [{ kind: "sound", value: "Keep it steady" }],
      },
      {
        id: "lr-2",
        moment: { type: "stopped", detail: "for 10s" },
        responses: [
          { kind: "speak", value: "Come on, keep moving" },
          { kind: "vibrate", value: "twice" },
        ],
      },
      {
        id: "lr-3",
        moment: { type: "halfway" },
        responses: [{ kind: "sound", value: "Halfway there" }],
      },
      {
        id: "lr-4",
        moment: { type: "nearing_end", detail: "last 1 km" },
        responses: [{ kind: "sound", value: "Finish strong" }],
      },
    ],
  },
  {
    id: "intervals",
    name: "Intervals",
    description: "Sharp cues for speed work.",
    rules: [
      {
        id: "iv-1",
        moment: { type: "every_split", detail: "every 400 m" },
        responses: [{ kind: "vibrate", value: "once" }],
      },
      {
        id: "iv-2",
        moment: { type: "new_fastest" },
        responses: [{ kind: "sound", value: "New best!" }],
      },
      {
        id: "iv-3",
        moment: { type: "slowing_down", detail: "below target pace" },
        responses: [{ kind: "speak", value: "Pick it back up" }],
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
        moment: { type: "milestone", detail: "at every 5 km" },
        responses: [{ kind: "speak", value: "On pace, stay locked in" }],
      },
      {
        id: "rp-2",
        moment: { type: "goal_reached" },
        responses: [
          { kind: "sound", value: "You did it" },
          { kind: "vibrate", value: "long" },
        ],
      },
    ],
  },
];
