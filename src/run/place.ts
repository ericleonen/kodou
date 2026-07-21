import { useEffect, useState } from "react";
import * as Location from "expo-location";
import { RunPoint, SavedRun } from "./types";

/**
 * Turns a coordinate into a general area like "Lynnwood, Washington".
 * Returns null if it can't be resolved (offline, no permission, etc.).
 */
export async function reverseGeocode(point: RunPoint): Promise<string | null> {
  try {
    const [result] = await Location.reverseGeocodeAsync(point);
    if (!result) return null;
    const city = result.city ?? result.subregion ?? result.district ?? null;
    const region = result.region ?? result.country ?? null;
    return [city, region].filter(Boolean).join(", ") || null;
  } catch {
    return null;
  }
}

/**
 * The run's area, using its stored value or resolving it from the path's
 * start the first time it's needed (older runs saved without one).
 */
export function useRunPlace(run: SavedRun | null | undefined): string | null {
  const [place, setPlace] = useState<string | null>(run?.place ?? null);

  useEffect(() => {
    if (!run || run.place || run.path.length === 0) return;
    let active = true;
    reverseGeocode(run.path[0]).then((p) => {
      if (active && p) setPlace(p);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run?.id]);

  return place;
}
