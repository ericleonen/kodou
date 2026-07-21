import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { loadRuns, saveRuns } from "./runStorage";
import { Goal, RunRecording, SavedRun } from "./types";

let counter = 0;
const genId = () => `run-${Date.now().toString(36)}-${counter++}`;

/** Optional fields captured when a run is saved. */
type SaveExtras = { title?: string; notes?: string; place?: string };

interface RunsValue {
  ready: boolean;
  runs: SavedRun[];
  saveRun: (
    recording: RunRecording,
    goal: Goal,
    presetName: string | null,
    extras?: SaveExtras
  ) => SavedRun;
  updateRun: (id: string, patch: Pick<SavedRun, "title" | "notes">) => void;
  deleteRun: (id: string) => void;
  clearRuns: () => void;
}

const RunsContext = createContext<RunsValue | null>(null);

/** Holds saved runs in memory and persists them locally. */
export function RunsProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [runs, setRuns] = useState<SavedRun[]>([]);

  useEffect(() => {
    let active = true;
    loadRuns().then((loaded) => {
      if (!active) return;
      setRuns(loaded);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (ready) saveRuns(runs);
  }, [ready, runs]);

  const saveRun = useCallback(
    (recording: RunRecording, goal: Goal, presetName: string | null, extras?: SaveExtras) => {
      const run: SavedRun = {
        ...recording,
        id: genId(),
        date: new Date().toISOString(),
        goal,
        presetName,
        title: extras?.title?.trim() || undefined,
        notes: extras?.notes?.trim() || undefined,
        place: extras?.place || undefined,
      };
      setRuns((prev) => [run, ...prev]);
      return run;
    },
    []
  );

  const updateRun = useCallback((id: string, patch: Pick<SavedRun, "title" | "notes">) => {
    setRuns((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, title: patch.title?.trim() || undefined, notes: patch.notes?.trim() || undefined }
          : r
      )
    );
  }, []);

  const deleteRun = useCallback((id: string) => {
    setRuns((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const clearRuns = useCallback(() => setRuns([]), []);

  return (
    <RunsContext.Provider value={{ ready, runs, saveRun, updateRun, deleteRun, clearRuns }}>
      {children}
    </RunsContext.Provider>
  );
}

export function useRuns() {
  const ctx = useContext(RunsContext);
  if (!ctx) throw new Error("useRuns must be used within a RunsProvider");
  return ctx;
}
