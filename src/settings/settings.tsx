import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useColorScheme } from "react-native";
import { Directory, File, Paths } from "expo-file-system";
import { ColorScheme, ColorsProvider, darkColors, lightColors } from "../theme";
import { setHapticsEnabled } from "../haptics";
import { DistanceGoalUnit, TimeGoalUnit } from "../run/types";

const DATA_DIR = new Directory(Paths.document, "kodou");
const SETTINGS_FILE = new File(DATA_DIR, "settings.json");

export type PaceUnit = "mi" | "km";
export type ThemePref = "light" | "dark" | "system";

interface StoredSettings {
  theme: ThemePref;
  /** Default distance unit for new distance-goal runs and distance display. */
  distanceUnit: DistanceGoalUnit;
  /** Default time unit for new time-goal runs. */
  timeUnit: TimeGoalUnit;
  /** Unit that pace is shown in everywhere. */
  paceUnit: PaceUnit;
  /** Whether tap/selection haptics fire. */
  haptics: boolean;
  /** Show a 3-2-1 countdown before tracking starts. */
  startCountdown: boolean;
  /** Auto-pause tracking when you stop moving. */
  autoPause: boolean;
  /** Keep the screen on during an active run. */
  keepAwake: boolean;
  /** Preset pre-selected on the run setup screen (null = no program). */
  defaultPresetId: string | null;
  /** Playback volume for program sound cues (0–1). */
  cueVolume: number;
  /** Lower other apps' audio while a cue plays. */
  duckAudio: boolean;
}

const DEFAULTS: StoredSettings = {
  theme: "dark",
  distanceUnit: "km",
  timeUnit: "min",
  paceUnit: "km",
  haptics: true,
  startCountdown: true,
  autoPause: true,
  keepAwake: true,
  defaultPresetId: null,
  cueVolume: 1,
  duckAudio: true,
};

async function loadSettings(): Promise<StoredSettings> {
  try {
    if (!DATA_DIR.exists) DATA_DIR.create();
    if (!SETTINGS_FILE.exists) return DEFAULTS;
    // Merge over defaults so settings files written before a field existed
    // still get a sensible value.
    return { ...DEFAULTS, ...(JSON.parse(await SETTINGS_FILE.text()) as Partial<StoredSettings>) };
  } catch {
    return DEFAULTS;
  }
}

function saveSettings(settings: StoredSettings) {
  try {
    if (!DATA_DIR.exists) DATA_DIR.create();
    if (!SETTINGS_FILE.exists) SETTINGS_FILE.create();
    SETTINGS_FILE.write(JSON.stringify(settings));
  } catch (error) {
    console.warn("Failed to save settings:", error);
  }
}

interface SettingsValue extends StoredSettings {
  /** The light/dark palette actually in effect (resolves "system"). */
  resolvedScheme: ColorScheme;
  update: (patch: Partial<StoredSettings>) => void;
}

const SettingsContext = createContext<SettingsValue | null>(null);

/** Holds app settings and provides the active color palette. */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoredSettings>(DEFAULTS);
  const systemScheme = useColorScheme();

  useEffect(() => {
    let active = true;
    loadSettings().then((s) => {
      if (active) setSettings(s);
    });
    return () => {
      active = false;
    };
  }, []);

  // Keep the haptics module in sync with the preference.
  useEffect(() => {
    setHapticsEnabled(settings.haptics);
  }, [settings.haptics]);

  const update = useCallback((patch: Partial<StoredSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  const resolvedScheme: ColorScheme =
    settings.theme === "system"
      ? systemScheme === "light"
        ? "light"
        : "dark"
      : settings.theme;
  const palette = resolvedScheme === "light" ? lightColors : darkColors;

  return (
    <SettingsContext.Provider value={{ ...settings, resolvedScheme, update }}>
      <ColorsProvider value={palette}>{children}</ColorsProvider>
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within a SettingsProvider");
  return ctx;
}
