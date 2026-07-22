/**
 * Pluggable live heart-rate layer.
 *
 * The rest of the app — the run engine's triggers, the active-run display,
 * the settings pairing UI — all read heart rate from this single store and
 * never touch a specific sensor. The *source* of the beats (Bluetooth today;
 * a Wear OS or Apple Watch companion later) plugs in behind the
 * `HeartRateSource` interface, so adding a new data source doesn't ripple
 * out into feature code.
 */

import { useEffect, useState } from "react";

/** Readings older than this are treated as "no data" (sensor dropped out). */
const STALE_MS = 12000;

export type HeartRateStatus = "disconnected" | "scanning" | "connecting" | "connected";

/** How a concrete sensor reports back into the store. */
export interface SourceCallbacks {
  onBpm: (bpm: number) => void;
  onStatus: (status: HeartRateStatus, info?: { deviceName?: string; error?: string }) => void;
}

/** A concrete heart-rate source (e.g. a BLE sensor). */
export interface HeartRateSource {
  readonly id: string;
  readonly label: string;
  start: (callbacks: SourceCallbacks) => Promise<void>;
  stop: () => Promise<void>;
}

export interface HeartRateSnapshot {
  bpm: number | null;
  status: HeartRateStatus;
  deviceName: string | null;
  error: string | null;
  updatedAt: number;
}

let store: HeartRateSnapshot = {
  bpm: null,
  status: "disconnected",
  deviceName: null,
  error: null,
  updatedAt: 0,
};

const listeners = new Set<() => void>();
function emit() {
  store = { ...store };
  listeners.forEach((l) => l());
}

/** Subscribe to any heart-rate change (used by the run engine). */
export function subscribeHeartRate(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * The current beats-per-minute, or null when there's no fresh reading.
 * The run engine calls this while evaluating heart-rate moments.
 */
export function getHeartRate(): number | null {
  if (store.bpm == null) return null;
  if (Date.now() - store.updatedAt > STALE_MS) return null;
  return store.bpm;
}

let source: HeartRateSource | null = null;

const callbacks: SourceCallbacks = {
  onBpm(bpm) {
    store.bpm = bpm;
    store.updatedAt = Date.now();
    store.error = null;
    if (store.status !== "connected") store.status = "connected";
    emit();
  },
  onStatus(status, info) {
    store.status = status;
    if (info?.deviceName !== undefined) store.deviceName = info.deviceName;
    if (info?.error !== undefined) store.error = info.error;
    if (status === "disconnected") store.bpm = null;
    emit();
  },
};

/**
 * Connect a heart-rate sensor. The BLE source is loaded lazily so the native
 * module is only pulled in when the user actually connects (and the app still
 * runs on a binary built before the module was added).
 */
export async function connectHeartRateSensor() {
  if (store.status === "scanning" || store.status === "connecting") return;
  store.error = null;
  store.status = "scanning";
  emit();
  try {
    if (!source) {
      const { createBleHeartRateSource } = await import("./bleHeartRate");
      source = createBleHeartRateSource();
    }
    await source.start(callbacks);
  } catch (e) {
    store.status = "disconnected";
    store.bpm = null;
    store.error = e instanceof Error ? e.message : "Couldn't connect to a heart-rate sensor.";
    emit();
  }
}

export async function disconnectHeartRateSensor() {
  try {
    await source?.stop();
  } catch {
    // ignore
  }
  store = { ...store, status: "disconnected", bpm: null, error: null };
  emit();
}

/** Subscribe a React component to the live heart-rate snapshot. */
export function useHeartRate(): HeartRateSnapshot {
  const [snapshot, setSnapshot] = useState(store);
  useEffect(() => {
    const update = () => setSnapshot(store);
    listeners.add(update);
    update();
    return () => {
      listeners.delete(update);
    };
  }, []);
  return snapshot;
}
