import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import * as DocumentPicker from "expo-document-picker";
import { reorderItems } from "react-native-reorderable-list";
import { SEED_PRESETS } from "./mockPresets";
import { deleteSoundFile, loadData, persistSoundFile, saveData } from "./storage";
import { Preset, Rule, Sound } from "./types";

let idCounter = 0;
const genId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${idCounter++}`;

type RuleDraft = Omit<Rule, "id">;

interface StoreValue {
  ready: boolean;
  presets: Preset[];
  sounds: Sound[];
  createPreset: (name: string, description?: string) => string;
  deletePreset: (id: string) => void;
  reorderPresets: (from: number, to: number) => void;
  addRule: (presetId: string, rule: RuleDraft) => void;
  updateRule: (presetId: string, rule: Rule) => void;
  deleteRule: (presetId: string, ruleId: string) => void;
  reorderRules: (presetId: string, from: number, to: number) => void;
  /** Opens the file picker, persists the chosen audio, returns the new sound. */
  addSound: () => Promise<Sound | null>;
  deleteSound: (id: string) => void;
  soundName: (id: string) => string | undefined;
}

const StoreContext = createContext<StoreValue | null>(null);

/**
 * Holds the whole Program library (presets + sounds) in memory above the
 * navigator so edits survive tab switches, and persists it locally so it
 * survives app restarts.
 */
export function ProgramStoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [sounds, setSounds] = useState<Sound[]>([]);

  // Load persisted data once on mount (falling back to seed presets).
  useEffect(() => {
    let active = true;
    loadData().then((data) => {
      if (!active) return;
      setPresets(data?.presets ?? SEED_PRESETS);
      setSounds(data?.sounds ?? []);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  // Persist on any change, but only after the initial load has happened.
  useEffect(() => {
    if (ready) saveData({ presets, sounds });
  }, [ready, presets, sounds]);

  const createPreset = useCallback((name: string, description?: string) => {
    const id = genId("preset");
    setPresets((prev) => [...prev, { id, name, description, rules: [] }]);
    return id;
  }, []);

  const deletePreset = useCallback((id: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const reorderPresets = useCallback((from: number, to: number) => {
    setPresets((prev) => reorderItems(prev, from, to));
  }, []);

  const addRule = useCallback((presetId: string, rule: RuleDraft) => {
    setPresets((prev) =>
      prev.map((p) =>
        p.id === presetId ? { ...p, rules: [...p.rules, { ...rule, id: genId("rule") }] } : p
      )
    );
  }, []);

  const updateRule = useCallback((presetId: string, rule: Rule) => {
    setPresets((prev) =>
      prev.map((p) =>
        p.id === presetId
          ? { ...p, rules: p.rules.map((r) => (r.id === rule.id ? rule : r)) }
          : p
      )
    );
  }, []);

  const deleteRule = useCallback((presetId: string, ruleId: string) => {
    setPresets((prev) =>
      prev.map((p) =>
        p.id === presetId ? { ...p, rules: p.rules.filter((r) => r.id !== ruleId) } : p
      )
    );
  }, []);

  const reorderRules = useCallback((presetId: string, from: number, to: number) => {
    setPresets((prev) =>
      prev.map((p) =>
        p.id === presetId ? { ...p, rules: reorderItems(p.rules, from, to) } : p
      )
    );
  }, []);

  const addSound = useCallback(async (): Promise<Sound | null> => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "audio/*",
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || result.assets.length === 0) return null;

    const asset = result.assets[0];
    const id = genId("sound");
    const uri = await persistSoundFile(asset.uri, id, asset.name);
    const sound: Sound = { id, name: displayName(asset.name), uri };
    setSounds((prev) => [...prev, sound]);
    return sound;
  }, []);

  const deleteSound = useCallback((id: string) => {
    setSounds((prev) => {
      const target = prev.find((s) => s.id === id);
      if (target) deleteSoundFile(target.uri);
      return prev.filter((s) => s.id !== id);
    });
  }, []);

  const soundsRef = useRef(sounds);
  soundsRef.current = sounds;
  const soundName = useCallback((id: string) => soundsRef.current.find((s) => s.id === id)?.name, []);

  return (
    <StoreContext.Provider
      value={{
        ready,
        presets,
        sounds,
        createPreset,
        deletePreset,
        reorderPresets,
        addRule,
        updateRule,
        deleteRule,
        reorderRules,
        addSound,
        deleteSound,
        soundName,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within a ProgramStoreProvider");
  return ctx;
}

function displayName(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot > 0 ? fileName.slice(0, dot) : fileName;
}
