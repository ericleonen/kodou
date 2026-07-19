import { useEffect, useState } from "react";
import { Vibration } from "react-native";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { Rule, Sound } from "../program/types";
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
const MOVING_SPEED = 0.3; // m/s below which we treat as stopped
const BUZZ_ON = 250;
const BUZZ_OFF = 150;

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
let accumulatedMs = 0; // elapsed time from prior (unpaused) segments
let segmentStart = 0; // timestamp the current running segment began
const path: RunPoint[] = [];
const samples: RunSample[] = [];
const events: RunEvent[] = [];

// Per-rule trigger memory.
type TriggerMemory = { fired?: boolean; armed?: boolean; lastSplit?: number };
let triggers: Record<string, TriggerMemory> = {};

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

function fire(rule: Rule) {
  if (lastCoord) {
    events.push({
      type: rule.moment.type,
      t: state.elapsed,
      latitude: lastCoord.latitude,
      longitude: lastCoord.longitude,
    });
  }
  for (const response of rule.responses) {
    if (response.kind === "vibrate") {
      const times = Math.max(1, response.times);
      const pattern = [0];
      for (let i = 0; i < times; i++) {
        pattern.push(BUZZ_ON);
        if (i < times - 1) pattern.push(BUZZ_OFF);
      }
      Vibration.vibrate(pattern);
    } else {
      const sound = sounds.find((s) => s.id === response.soundId);
      if (!sound) continue;
      try {
        if (!player) player = createAudioPlayer(sound.uri);
        else player.replace(sound.uri);
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
        }, durationMs);
      } catch (e) {
        console.warn("Failed to play run sound:", e);
      }
    }
  }
}

// ---- Trigger evaluation -------------------------------------------------

function evaluateTriggers() {
  const cfg = state.config;
  if (!cfg) return;
  const { distance, elapsed, speed } = state;
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

  for (const rule of rules) {
    const mem = triggers[rule.id] ?? (triggers[rule.id] = { armed: true });
    const moment = rule.moment;

    if (moment.type === "slowing_down") {
      if (speed <= MOVING_SPEED) {
        mem.armed = true; // stopped/unknown; re-arm and don't fire
        continue;
      }
      const paceMeters = moment.unit === "min/mi" ? 1609.344 : 1000;
      const currentPaceMin = paceMeters / speed / 60;
      const slow = currentPaceMin > moment.threshold;
      if (slow && mem.armed) {
        fire(rule);
        mem.armed = false;
      } else if (!slow) {
        mem.armed = true; // recovered; can fire again next time
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
        fire(rule);
        mem.fired = true;
      }
    } else if (moment.type === "split") {
      const per = moment.unit === "mi" ? 1609.344 : moment.unit === "km" ? 1000 : 1;
      const intervalM = moment.interval * per;
      if (intervalM > 0) {
        const crossed = Math.floor(distance / intervalM);
        if (crossed > (mem.lastSplit ?? 0)) {
          mem.lastSplit = crossed;
          fire(rule);
        }
      }
    }
  }
}

// ---- Location handling --------------------------------------------------

function onLocations(locations: Location.LocationObject[]) {
  if (state.phase !== "active" || state.paused) return;
  const now = Date.now();
  let changed = false;

  for (const loc of locations) {
    const { latitude, longitude, accuracy, speed: raw } = loc.coords;
    if (accuracy != null && accuracy > ACCURACY_LIMIT) continue;

    const rawSpeed = raw != null && raw > 0 ? raw : 0;
    smoothed = smoothed === 0 ? rawSpeed : SPEED_ALPHA * rawSpeed + (1 - SPEED_ALPHA) * smoothed;

    const next = { latitude, longitude };
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

export async function startRun(config: RunConfig, ruleList: Rule[], soundList: Sound[]) {
  rules = ruleList;
  sounds = soundList;
  triggers = {};
  lastCoord = null;
  smoothed = 0;
  accumulatedMs = 0;
  segmentStart = Date.now();
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
      interruptionMode: "mixWithOthers",
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
  emit();
}

export function resumeRun() {
  if (state.phase !== "active" || !state.paused) return;
  segmentStart = Date.now();
  lastCoord = null;
  state.paused = false;
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
