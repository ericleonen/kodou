import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Directory, File, Paths } from "expo-file-system";
import { ColorScheme, ColorsProvider, darkColors, lightColors } from "../theme";

const DATA_DIR = new Directory(Paths.document, "kodou");
const SETTINGS_FILE = new File(DATA_DIR, "settings.json");

interface StoredSettings {
  theme: ColorScheme;
}

async function loadSettings(): Promise<StoredSettings> {
  try {
    if (!DATA_DIR.exists) DATA_DIR.create();
    if (!SETTINGS_FILE.exists) return { theme: "dark" };
    return JSON.parse(await SETTINGS_FILE.text()) as StoredSettings;
  } catch {
    return { theme: "dark" };
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

interface SettingsValue {
  theme: ColorScheme;
  setTheme: (theme: ColorScheme) => void;
}

const SettingsContext = createContext<SettingsValue | null>(null);

/** Holds app settings (theme) and provides the active color palette. */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ColorScheme>("dark");

  useEffect(() => {
    let active = true;
    loadSettings().then((s) => {
      if (active) setThemeState(s.theme);
    });
    return () => {
      active = false;
    };
  }, []);

  const setTheme = useCallback((next: ColorScheme) => {
    setThemeState(next);
    saveSettings({ theme: next });
  }, []);

  const palette = theme === "light" ? lightColors : darkColors;

  return (
    <SettingsContext.Provider value={{ theme, setTheme }}>
      <ColorsProvider value={palette}>{children}</ColorsProvider>
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within a SettingsProvider");
  return ctx;
}
