/**
 * Bundled starter sounds (files in assets/sounds). They're installed into
 * the sound library on first launch and restored when data is cleared.
 * Cues are trimmed to at most ~5s so a single moment doesn't play forever.
 */

export type SeedSound = {
  id: string;
  name: string;
  module: number; // require() of the bundled mp3
  duration: number; // full length (seconds)
  start: number;
  end: number;
};

const clip = (d: number) => Math.min(d, 5);

export const SEED_SOUNDS: SeedSound[] = [
  { id: "seed-assemble", name: "Assemble!", module: require("../../assets/sounds/assemble.mp3") as number, duration: 3.03, start: 0, end: clip(3.03) },
  { id: "seed-cheaper-town-hall", name: "Cheaper Town Hall", module: require("../../assets/sounds/cheaper-town-hall.mp3") as number, duration: 1.42, start: 0, end: clip(1.42) },
  { id: "seed-david-goggins", name: "David Goggins", module: require("../../assets/sounds/david-goggins.mp3") as number, duration: 6.92, start: 0, end: clip(6.92) },
  { id: "seed-gear-second", name: "Gear Second", module: require("../../assets/sounds/gear-second.mp3") as number, duration: 1.87, start: 0, end: clip(1.87) },
  { id: "seed-hinokami-kagura", name: "Hinokami Kagura", module: require("../../assets/sounds/hinokami-kagura.mp3") as number, duration: 5.83, start: 0, end: clip(5.83) },
  { id: "seed-my-soldiers-rage", name: "My Soldiers Rage!", module: require("../../assets/sounds/my-soldiers-rage.mp3") as number, duration: 12.62, start: 0, end: clip(12.62) },
  { id: "seed-narutos-fighting-spirit", name: "Naruto's Fighting Spirit", module: require("../../assets/sounds/narutos-fighting-spirit.mp3") as number, duration: 10.06, start: 0, end: clip(10.06) },
  { id: "seed-narutos-theme", name: "Naruto's Theme", module: require("../../assets/sounds/narutos-theme.mp3") as number, duration: 19.66, start: 0, end: clip(19.66) },
  { id: "seed-ryujin-no-ken", name: "Ryūjin no ken o kurae!", module: require("../../assets/sounds/ryujin-no-ken.mp3") as number, duration: 2.74, start: 0, end: clip(2.74) },
];
