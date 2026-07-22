import { Directory, File, Paths } from "expo-file-system";
import { Asset } from "expo-asset";
import { Preset, Sound } from "./types";

/**
 * Local persistence for the Program feature. Everything lives under a
 * "kodou" folder in the app's document directory: a JSON manifest for
 * presets + sound metadata, and the uploaded audio files themselves.
 */

const DATA_DIR = new Directory(Paths.document, "kodou");
const SOUNDS_DIR = new Directory(DATA_DIR, "sounds");
const STORE_FILE = new File(DATA_DIR, "store.json");

export interface PersistedData {
  presets: Preset[];
  sounds: Sound[];
}

function ensureDirs() {
  if (!DATA_DIR.exists) DATA_DIR.create();
  if (!SOUNDS_DIR.exists) SOUNDS_DIR.create();
}

export async function loadData(): Promise<PersistedData | null> {
  try {
    ensureDirs();
    if (!STORE_FILE.exists) return null;
    const text = await STORE_FILE.text();
    return JSON.parse(text) as PersistedData;
  } catch (error) {
    console.warn("Failed to load program data:", error);
    return null;
  }
}

export function saveData(data: PersistedData) {
  try {
    ensureDirs();
    if (!STORE_FILE.exists) STORE_FILE.create();
    STORE_FILE.write(JSON.stringify(data));
  } catch (error) {
    console.warn("Failed to save program data:", error);
  }
}

/** Copies a picked audio file into persistent storage; returns its URI. */
export async function persistSoundFile(
  sourceUri: string,
  id: string,
  originalName: string
): Promise<string> {
  ensureDirs();
  const source = new File(sourceUri);
  const ext = source.extension || extensionOf(originalName) || ".m4a";
  const dest = new File(SOUNDS_DIR, `${id}${ext}`);
  await source.copy(dest);
  return dest.uri;
}

/**
 * Copies a bundled seed sound (a require()'d asset) into the persistent
 * sounds dir as `${id}.mp3` and returns its file:// URI, so it behaves
 * exactly like a user-uploaded sound.
 */
export async function installSeedSound(module: number, id: string): Promise<string> {
  ensureDirs();
  const asset = Asset.fromModule(module);
  await asset.downloadAsync();
  const localUri = asset.localUri ?? asset.uri;
  const dest = new File(SOUNDS_DIR, `${id}.mp3`);
  if (dest.exists) dest.delete();
  await new File(localUri).copy(dest);
  return dest.uri;
}

export function deleteSoundFile(uri: string) {
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch (error) {
    console.warn("Failed to delete sound file:", error);
  }
}

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot) : "";
}
