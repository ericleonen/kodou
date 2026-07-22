import { useEffect, useState } from "react";
import { Vibration } from "react-native";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { Rule, RuleResponse, Sound } from "../program/types";
import {
  goalDistanceMeters,
  goalDurationSeconds,
  RunConfig,
  RunEvent,
  RunPoint,
  RunRecording,
  RunSample,
} from "./types";

const LOCATION_TASK = "kodou-run-location";

const ACCURACY_LIMIT = 30; // meters; drop worse fixes
const MIN_STEP = 1; // meters; ignore jitter below this
const SPEED_ALPHA = 0.3; // EMA smoothing factor
const MOVING_SPEED = 0.3; // m/s below which we treat as stopped (pace display)
// Auto-pause is deliberately lax: it fires only if every fix over a
// sustained window stayed within a small radius (real net stillness, not
// jittery GPS speed). Any genuine movement — even a slow walk — leaves the
// radius and keeps the run going.
const STOP_RADIUS = 5; // meters; must stay within this to count as stopped
const AUTO_PAUSE_MS = 5000; // stopped this long → auto-pause
const BUZZ_ON = 250;
const BUZZ_OFF = 150;

// ---- Trigger robustness ----
const TRIGGER_ALPHA = 0.18; // heavier smoothing than display for pace decisions
const PACE_HYST_FRAC = 0.08; // dead-band around the threshold: 8% of it…
const PACE_HYST_MIN = 0.1; // …but at least 0.1 min per unit
const CONFIRM_SEC = 3; // pace condition must hold this long before firing
const PACE_COOLDOWN_SEC = 30; // min gap between fires of the same pace rule
const WARMUP_SEC = 18; // ignore the start-from-rest ramp for this long
const WARMUP_DIST = 15; // …and until this much ground is covered (meters)
const CUE_GAP_MS = 900; // spacing between queued cues
const CUE_QUEUE_CAP = 4; // drop extra cues if the queue backs up

export type RunPhase = "idle" | "active" | "summary";

export interface EngineState {
  phase: RunPhase;
  config: RunConfig | null;
  paused: boolean;
  distance: number; // meters
  elapsed: number; // seconds
  speed: number; // smoothed m/s
  error: string | null;
  recording: RunRecording | null;
}

let state: EngineState = {
  phase: "idle",
  config: null,
  paused: false,
  distance: 0,
  elapsed: 0,
  speed: 0,
  error: null,
  recording: null,
};

let rules: Rule[] = [];
let sounds: Sound[] = [];

// Tracking internals.
let lastCoord: RunPoint | null = null;
let smoothed = 0;
let triggerSpeed = 0; // heavier-smoothed speed used only for pace triggers
let accumulatedMs = 0; // elapsed time from prior (unpaused) segments
let segmentStart = 0; // timestamp the current running segment began

// Run options + auto-pause state.
let autoPauseEnabled = false;
let cueVolume = 1;
let autoPaused = false; // paused by the engine (vs. the user)
// Recent fixes (within the auto-pause window) used to judge net stillness.
let moveWindow: { t: number; point: RunPoint }[] = [];
const path: RunPoint[] = [];
const samples: RunSample[] = [];
const events: RunEvent[] = [];

// Per-rule trigger memory.
type TriggerMemory = {
  fired?: boolean; // one-shots (almost_done)
  armed?: boolean; // pace rules: has a baseline been established to depart from
  lastSplit?: number;
  lastFireAt?: number; // elapsed sec of the last fire → cooldown
  candidateSince?: number; // elapsed sec the fire condition began → confirmation
};
let triggers: Record<string, TriggerMemory> = {};

// Cue playback queue: coincident moments are serialized so their sounds never
// clobber the shared player. Each entry is one rule's responses.
let cueQueue: RuleResponse[][] = [];
let cuePlaying = false;
let cueToken = 0; // bumped on run start/finish/reset to abort in-flight cues

// Subscriptions.
const listeners = new Set<() => void>();
function emit() {
  state = { ...state };
  listeners.forEach((l) => l());
}

function haversine(a: RunPoint, b: RunPoint): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function computeElapsed(now: number): number {
  if (state.phase !== "active") return state.elapsed;
  if (state.paused) return accumulatedMs / 1000;
  return (accumulatedMs + (now - segmentStart)) / 1000;
}

// ---- Response playback --------------------------------------------------

let player: ReturnType<typeof createAudioPlayer> | null = null;

function vibrate(times: number) {
  const n = Math.max(1, times);
  const pattern = [0];
  for (let i = 0; i < n; i++) {
    pattern.push(BUZZ_ON);
    if (i < n - 1) pattern.push(BUZZ_OFF);
  }
  Vibration.vibrate(pattern);
}

/** Records the moment's event and enqueues its responses for playback. */
function queueRule(rule: Rule) {
  if (lastCoord) {
    events.push({
      type: rule.moment.type,
      t: state.elapsed,
      latitude: lastCoord.latitude,
      longitude: lastCoord.longitude,
    });
  }
  // The moment still counts even if we drop the cue when backed up.
  if (cueQueue.length >= CUE_QUEUE_CAP) return;
  cueQueue.push(rule.responses);
  pumpQueue();
}

/** Plays the next queued cue if nothing is currently playing. */
function pumpQueue() {
  if (cuePlaying) return;
  const responses = cueQueue.shift();
  if (!responses) return;
  cuePlaying = true;
  const token = cueToken;
  playCue(responses, () => {
    if (token !== cueToken) return; // run ended or restarted mid-cue
    cuePlaying = false;
    setTimeout(() => {
      if (token === cueToken) pumpQueue();
    }, CUE_GAP_MS);
  });
}

/** Fires a cue's vibrations at once and plays its sounds one after another. */
function playCue(responses: RuleResponse[], done: () => void) {
  const cueSounds: Sound[] = [];
  for (const r of responses) {
    if (r.kind === "vibrate") {
      vibrate(r.times);
    } else {
      const s = sounds.find((x) => x.id === r.soundId);
      if (s) cueSounds.push(s);
    }
  }
  playSoundsSeq(cueSounds, 0, done);
}

function playSoundsSeq(list: Sound[], i: number, done: () => void) {
  if (i >= list.length) {
    // Give vibration-only cues a moment so they still get spaced out.
    setTimeout(done, list.length === 0 ? 250 : 0);
    return;
  }
  const sound = list[i];
  const token = cueToken;
  try {
    if (!player) player = createAudioPlayer(sound.uri);
    else player.replace(sound.uri);
    player.volume = cueVolume;
    player.seekTo(sound.start);
    player.play();
    const activePlayer = player;
    const durationMs = Math.max(0, sound.end - sound.start) * 1000;
    setTimeout(() => {
      try {
        activePlayer.pause();
      } catch {
        // player may have been replaced already; ignore
      }
      if (token === cueToken) playSoundsSeq(list, i + 1, done);
    }, durationMs);
  } catch (e) {
    console.warn("Failed to play run sound:", e);
    playSoundsSeq(list, i + 1, done);
  }
}

/** Clears the cue queue and stops any in-flight playback. */
function resetCues() {
  cueToken++;
  cueQueue = [];
  cuePlaying = false;
  try {
    player?.pause();
  } catch {
    // ignore
  }
}

// ---- Trigger evaluation -------------------------------------------------

function evaluateTriggers() {
  const cfg = state.config;
  if (!cfg) return;
  const { distance, elapsed } = state;
  const avgSpeed = elapsed > 0 ? distance / elapsed : 0;

  // Remaining distance/time to the goal, estimating the missing dimension
  // from average pace when the moment's unit doesn't match the goal type.
  let remainingDistance = Infinity;
  let remainingTime = Infinity;
  if (cfg.goal.kind === "distance") {
    const goalM = goalDistanceMeters(cfg.goal);
    remainingDistance = goalM - distance;
    remainingTime = avgSpeed > 0 ? remainingDistance / avgSpeed : Infinity;
  } else {
    const goalS = goalDurationSeconds(cfg.goal);
    remainingTime = goalS - elapsed;
    remainingDistance = avgSpeed > 0 ? remainingTime * avgSpeed : Infinity;
  }

  // Warm-up: ignore the initial ramp from rest before judging pace.
  const warmedUp = elapsed >= WARMUP_SEC && distance >= WARMUP_DIST;

  for (const rule of rules) {
    const mem = triggers[rule.id] ?? (triggers[rule.id] = {});
    const moment = rule.moment;

    if (moment.type === "slowing_down" || moment.type === "speeding_up") {
      // Not warmed up, or effectively stopped → don't judge pace. Cancel any
      // pending confirmation so a stop doesn't count toward firing.
      if (!warmedUp || triggerSpeed <= MOVING_SPEED) {
        mem.candidateSince = undefined;
        continue;
      }
      const paceMeters = moment.unit === "min/mi" ? 1609.344 : 1000;
      const pace = paceMeters / triggerSpeed / 60; // minutes per unit
      const hyst = Math.max(PACE_HYST_MIN, moment.threshold * PACE_HYST_FRAC);
      const slowing = moment.type === "slowing_down";
      // Dead-band around the threshold. You must reach "good" pace to arm the
      // rule (a baseline to depart from) before a "bad" pace can fire it — so a
      // slow start can't trigger "slowing down" until you've actually sped up.
      const goodPace = slowing ? pace <= moment.threshold - hyst : pace >= moment.threshold + hyst;
      const badPace = slowing ? pace >= moment.threshold + hyst : pace <= moment.threshold - hyst;

      if (goodPace) {
        mem.armed = true;
        mem.candidateSince = undefined;
      } else if (badPace && mem.armed) {
        // Require the condition to hold (confirmation) and respect the cooldown.
        if (mem.candidateSince === undefined) mem.candidateSince = elapsed;
        const held = elapsed - mem.candidateSince >= CONFIRM_SEC;
        const cooled = mem.lastFireAt === undefined || elapsed - mem.lastFireAt >= PACE_COOLDOWN_SEC;
        if (held && cooled) {
          queueRule(rule);
          mem.armed = false;
          mem.lastFireAt = elapsed;
          mem.candidateSince = undefined;
        }
      } else {
        // Inside the dead-band → hold arming, drop any pending confirmation.
        mem.candidateSince = undefined;
      }
    } else if (moment.type === "almost_done") {
      const isTime = moment.unit === "min" || moment.unit === "sec";
      let cond = false;
      if (isTime) {
        const threshold = moment.amount * (moment.unit === "min" ? 60 : 1);
        cond = remainingTime >= 0 && remainingTime <= threshold;
      } else {
        const per = moment.unit === "mi" ? 1609.344 : moment.unit === "km" ? 1000 : 1;
        const threshold = moment.amount * per;
        cond = remainingDistance >= 0 && remainingDistance <= threshold;
      }
      if (cond && !mem.fired) {
        queueRule(rule);
        mem.fired = true;
      }
    } else if (moment.type === "split") {
      const per = moment.unit === "mi" ? 1609.344 : moment.unit === "km" ? 1000 : 1;
      const intervalM = moment.interval * per;
      if (intervalM > 0) {
        const crossed = Math.floor(distance / intervalM);
        if (crossed > (mem.lastSplit ?? 0)) {
          mem.lastSplit = crossed;
          queueRule(rule);
        }
      }
    }
  }
}

// ---- Location handling --------------------------------------------------

function onLocations(locations: Location.LocationObject[]) {
  if (state.phase !== "active") return;
  // A manual pause ignores fixes entirely; an auto-pause keeps listening so
  // it can detect movement and resume on its own.
  if (state.paused && !autoPaused) return;
  const now = Date.now();
  let changed = false;

  for (const loc of locations) {
    const { latitude, longitude, accuracy, speed: raw } = loc.coords;
    if (accuracy != null && accuracy > ACCURACY_LIMIT) continue;

    const rawSpeed = raw != null && raw > 0 ? raw : 0;
    smoothed = smoothed === 0 ? rawSpeed : SPEED_ALPHA * rawSpeed + (1 - SPEED_ALPHA) * smoothed;
    triggerSpeed =
      triggerSpeed === 0 ? rawSpeed : TRIGGER_ALPHA * rawSpeed + (1 - TRIGGER_ALPHA) * triggerSpeed;
    const next = { latitude, longitude };

    // Net-stillness tracking over the window (independent of GPS speed).
    // "moving" = some recent fix is farther than STOP_RADIUS from now.
    let shouldAutoPause = false;
    if (autoPauseEnabled) {
      moveWindow.push({ t: now, point: next });
      while (moveWindow.length > 2 && moveWindow[1].t < now - AUTO_PAUSE_MS) moveWindow.shift();
      let maxDisp = 0;
      for (const e of moveWindow) {
        const d = haversine(e.point, next);
        if (d > maxDisp) maxDisp = d;
      }
      const moving = maxDisp > STOP_RADIUS;
      const spanned = now - moveWindow[0].t >= AUTO_PAUSE_MS;

      if (state.paused && autoPaused) {
        if (moving) {
          // Genuine movement while auto-paused → resume.
          segmentStart = now;
          lastCoord = next;
          state.paused = false;
          autoPaused = false;
          moveWindow = [{ t: now, point: next }];
          changed = true;
        }
      } else if (spanned && !moving) {
        shouldAutoPause = true;
      }
    }

    // While paused: don't accumulate distance/time.
    if (state.paused) {
      state.speed = smoothed;
      continue;
    }

    if (lastCoord) {
      const step = haversine(lastCoord, next);
      if (step >= MIN_STEP) {
        state.distance += step;
        lastCoord = next;
        path.push(next);
      }
    } else {
      lastCoord = next;
      path.push(next);
    }

    state.speed = smoothed;
    state.elapsed = computeElapsed(now);
    samples.push({ t: state.elapsed, speed: smoothed });
    changed = true;

    if (shouldAutoPause) {
      accumulatedMs += now - segmentStart;
      lastCoord = null;
      state.paused = true;
      autoPaused = true;
    }
  }

  if (changed) {
    evaluateTriggers();
    emit();
  }
}

// The task must be defined at module load so the OS can dispatch to it.
if (!TaskManager.isTaskDefined(LOCATION_TASK)) {
  TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
    if (error) {
      state.error = error.message;
      emit();
      return;
    }
    if (data) {
      const { locations } = data as { locations: Location.LocationObject[] };
      onLocations(locations);
    }
  });
}

// ---- Public control -----------------------------------------------------

export interface RunOptions {
  autoPause?: boolean;
  cueVolume?: number;
  duckAudio?: boolean;
}

export async function startRun(
  config: RunConfig,
  ruleList: Rule[],
  soundList: Sound[],
  options: RunOptions = {}
) {
  rules = ruleList;
  sounds = soundList;
  triggers = {};
  lastCoord = null;
  smoothed = 0;
  triggerSpeed = 0;
  accumulatedMs = 0;
  segmentStart = Date.now();
  autoPauseEnabled = options.autoPause ?? false;
  cueVolume = options.cueVolume ?? 1;
  autoPaused = false;
  moveWindow = [];
  resetCues();
  path.length = 0;
  samples.length = 0;
  events.length = 0;
  state = {
    phase: "active",
    config,
    paused: false,
    distance: 0,
    elapsed: 0,
    speed: 0,
    error: null,
    recording: null,
  };
  emit();

  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: options.duckAudio ? "duckOthers" : "mixWithOthers",
    });
  } catch {
    // non-fatal
  }

  const foreground = await Location.requestForegroundPermissionsAsync();
  if (foreground.status !== "granted") {
    state.error = "Location permission is needed to track your run.";
    emit();
    return;
  }
  // Background permission lets tracking continue with the screen off.
  try {
    await Location.requestBackgroundPermissionsAsync();
  } catch {
    // best effort; foreground-service tracking still works while running
  }

  const alreadyRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(
    () => false
  );
  if (alreadyRunning) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK).catch(() => {});
  }

  await Location.startLocationUpdatesAsync(LOCATION_TASK, {
    accuracy: Location.Accuracy.BestForNavigation,
    timeInterval: 1000,
    distanceInterval: 0,
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: "Kodou is tracking your run",
      notificationBody: "Distance, pace, and your program are running.",
    },
  });
}

export function pauseRun() {
  if (state.phase !== "active" || state.paused) return;
  accumulatedMs += Date.now() - segmentStart;
  lastCoord = null; // re-anchor on resume so paused movement isn't counted
  state.paused = true;
  autoPaused = false; // this is a manual pause
  emit();
}

export function resumeRun() {
  if (state.phase !== "active" || !state.paused) return;
  segmentStart = Date.now();
  lastCoord = null;
  moveWindow = []; // re-arm so it doesn't immediately auto-pause
  state.paused = false;
  autoPaused = false;
  emit();
}

async function stopLocation() {
  Vibration.cancel();
  const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false);
  if (started) await Location.stopLocationUpdatesAsync(LOCATION_TASK).catch(() => {});
}

export function finishRun() {
  const recording: RunRecording = {
    distance: state.distance,
    duration: state.elapsed,
    path: [...path],
    samples: [...samples],
    events: [...events],
  };
  state = { ...state, phase: "summary", paused: false, recording };
  emit();
  resetCues();
  void stopLocation();
}

export function resetRun() {
  state = {
    phase: "idle",
    config: null,
    paused: false,
    distance: 0,
    elapsed: 0,
    speed: 0,
    error: null,
    recording: null,
  };
  rules = [];
  sounds = [];
  triggers = {};
  autoPaused = false;
  autoPauseEnabled = false;
  moveWindow = [];
  triggerSpeed = 0;
  resetCues();
  path.length = 0;
  samples.length = 0;
  events.length = 0;
  emit();
}

/** Recompute elapsed between location fixes so the UI clock stays smooth. */
function tick() {
  if (state.phase !== "active" || state.paused) return;
  const elapsed = computeElapsed(Date.now());
  if (Math.abs(elapsed - state.elapsed) > 0.05) {
    state.elapsed = elapsed;
    emit();
  }
}

/** Subscribe a React component to the engine state. */
export function useRunEngine(): EngineState {
  const [snapshot, setSnapshot] = useState(state);
  useEffect(() => {
    const update = () => setSnapshot(state);
    listeners.add(update);
    update();
    const timer = setInterval(tick, 250);
    return () => {
      listeners.delete(update);
      clearInterval(timer);
    };
  }, []);
  return snapshot;
}
