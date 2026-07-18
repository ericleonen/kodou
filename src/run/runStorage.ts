import { Directory, File, Paths } from "expo-file-system";
import { SavedRun } from "./types";

/** Local persistence for saved runs (a JSON file in the document dir). */

const DATA_DIR = new Directory(Paths.document, "kodou");
const RUNS_FILE = new File(DATA_DIR, "runs.json");

function ensureDir() {
  if (!DATA_DIR.exists) DATA_DIR.create();
}

export async function loadRuns(): Promise<SavedRun[]> {
  try {
    ensureDir();
    if (!RUNS_FILE.exists) return [];
    return JSON.parse(await RUNS_FILE.text()) as SavedRun[];
  } catch (error) {
    console.warn("Failed to load runs:", error);
    return [];
  }
}

export function saveRuns(runs: SavedRun[]) {
  try {
    ensureDir();
    if (!RUNS_FILE.exists) RUNS_FILE.create();
    RUNS_FILE.write(JSON.stringify(runs));
  } catch (error) {
    console.warn("Failed to save runs:", error);
  }
}
