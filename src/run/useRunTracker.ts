import { useCallback, useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import { RunPoint, RunRecording, RunSample } from "./types";

type Coord = { latitude: number; longitude: number };

export interface RunStats {
  distance: number; // meters
  elapsed: number; // seconds
  speed: number; // smoothed meters/second
  error: string | null;
  getRecording: () => Pick<RunRecording, "path" | "samples">;
}

// Ignore fixes worse than this (meters) and jitter smaller than this (meters).
const ACCURACY_LIMIT = 30;
const MIN_STEP = 1;
// Exponential smoothing factor for speed (0..1; higher = more responsive).
const SPEED_ALPHA = 0.3;

function haversine(a: Coord, b: Coord): number {
  const R = 6371000; // earth radius, meters
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Tracks a run while `active`: distance (filtered GPS), elapsed time,
 * and a smoothed speed. Records the path and periodic pace samples for
 * the post-run summary. Time/distance freeze while `paused`.
 */
export function useRunTracker(active: boolean, paused: boolean): RunStats {
  const [distance, setDistance] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const last = useRef<Coord | null>(null);
  const smoothed = useRef(0);
  const elapsedRef = useRef(0);
  const path = useRef<RunPoint[]>([]);
  const samples = useRef<RunSample[]>([]);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    if (!paused) last.current = null; // re-anchor on resume
  }, [paused]);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    let subscription: Location.LocationSubscription | null = null;
    last.current = null;
    smoothed.current = 0;
    elapsedRef.current = 0;
    path.current = [];
    samples.current = [];
    setDistance(0);
    setElapsed(0);
    setSpeed(0);
    setError(null);

    let accumulatedMs = 0;
    let lastTick = Date.now();
    const timer = setInterval(() => {
      const now = Date.now();
      if (!pausedRef.current) {
        accumulatedMs += now - lastTick;
        elapsedRef.current = accumulatedMs / 1000;
        setElapsed(elapsedRef.current);
      }
      lastTick = now;
    }, 250);

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      if (status !== "granted") {
        setError("Location permission is needed to track your run.");
        return;
      }
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 0,
        },
        (loc) => {
          if (cancelled || pausedRef.current) return;
          const { latitude, longitude, accuracy, speed: raw } = loc.coords;
          if (accuracy != null && accuracy > ACCURACY_LIMIT) return;

          // Smooth the reported speed with an exponential moving average.
          const rawSpeed = raw != null && raw > 0 ? raw : 0;
          smoothed.current =
            smoothed.current === 0
              ? rawSpeed
              : SPEED_ALPHA * rawSpeed + (1 - SPEED_ALPHA) * smoothed.current;
          setSpeed(smoothed.current);
          samples.current.push({ t: elapsedRef.current, speed: smoothed.current });

          const next = { latitude, longitude };
          if (last.current) {
            const step = haversine(last.current, next);
            if (step >= MIN_STEP) {
              setDistance((prev) => prev + step);
              last.current = next;
              path.current.push(next);
            }
          } else {
            last.current = next;
            path.current.push(next);
          }
        }
      );
    })();

    return () => {
      cancelled = true;
      clearInterval(timer);
      subscription?.remove();
    };
  }, [active]);

  const getRecording = useCallback(
    () => ({ path: [...path.current], samples: [...samples.current] }),
    []
  );

  return { distance, elapsed, speed, error, getRecording };
}
