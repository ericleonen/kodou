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

interface RunsValue {
  ready: boolean;
  runs: SavedRun[];
  saveRun: (
    recording: RunRecording,
    goal: Goal,
    presetName: string | null
  ) => SavedRun;
  deleteRun: (id: string) => void;
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
    (recording: RunRecording, goal: Goal, presetName: string | null) => {
      const run: SavedRun = {
        ...recording,
        id: genId(),
        date: new Date().toISOString(),
        goal,
        presetName,
      };
      setRuns((prev) => [run, ...prev]);
      return run;
    },
    []
  );

  const deleteRun = useCallback((id: string) => {
    setRuns((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return (
    <RunsContext.Provider value={{ ready, runs, saveRun, deleteRun }}>
      {children}
    </RunsContext.Provider>
  );
}

export function useRuns() {
  const ctx = useContext(RunsContext);
  if (!ctx) throw new Error("useRuns must be used within a RunsProvider");
  return ctx;
}
