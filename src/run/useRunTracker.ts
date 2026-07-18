import { useEffect, useRef, useState } from "react";
import * as Location from "expo-location";

type Coord = { latitude: number; longitude: number };

export interface RunStats {
  /** Distance travelled, in meters. */
  distance: number;
  /** Elapsed time, in seconds. */
  elapsed: number;
  /** Current speed, in meters/second (0 when not moving/unknown). */
  speed: number;
  error: string | null;
}

// Ignore fixes worse than this (meters) and jitter smaller than this (meters).
const ACCURACY_LIMIT = 30;
const MIN_STEP = 1;

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
 * Tracks distance (from filtered GPS fixes) and elapsed time while
 * `active` is true. Starts fresh each time it becomes active. While
 * `paused` is true, time and distance stop accumulating.
 */
export function useRunTracker(active: boolean, paused: boolean): RunStats {
  const [distance, setDistance] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const last = useRef<Coord | null>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  // On resume, drop the last coord so movement during the pause isn't counted.
  useEffect(() => {
    if (!paused) last.current = null;
  }, [paused]);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    let subscription: Location.LocationSubscription | null = null;
    last.current = null;
    setDistance(0);
    setElapsed(0);
    setSpeed(0);
    setError(null);

    // Accumulate elapsed time only while not paused.
    let accumulatedMs = 0;
    let lastTick = Date.now();
    const timer = setInterval(() => {
      const now = Date.now();
      if (!pausedRef.current) {
        accumulatedMs += now - lastTick;
        setElapsed(accumulatedMs / 1000);
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
          const { latitude, longitude, accuracy, speed: s } = loc.coords;
          if (accuracy != null && accuracy > ACCURACY_LIMIT) return;
          setSpeed(s != null && s > 0 ? s : 0);

          const next = { latitude, longitude };
          if (last.current) {
            const step = haversine(last.current, next);
            if (step >= MIN_STEP) {
              setDistance((prev) => prev + step);
              last.current = next;
            }
          } else {
            last.current = next;
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

  return { distance, elapsed, speed, error };
}
