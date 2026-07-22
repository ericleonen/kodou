import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { reorderItems } from "react-native-reorderable-list";
import { SEED_PRESETS } from "./mockPresets";
import { SEED_SOUNDS } from "./seedSounds";
import { deleteSoundFile, installSeedSound, loadData, persistSoundFile, saveData } from "./storage";
import { Preset, Rule, Sound } from "./types";

let idCounter = 0;
const genId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${idCounter++}`;

/** Installs the bundled seed sounds into the sounds dir (best-effort). */
async function buildSeedSounds(): Promise<Sound[]> {
  const out: Sound[] = [];
  for (const s of SEED_SOUNDS) {
    try {
      const uri = await installSeedSound(s.module, s.id);
      out.push({ id: s.id, name: s.name, uri, duration: s.duration, start: s.start, end: s.end });
    } catch (error) {
      console.warn("Failed to install seed sound:", s.id, error);
    }
  }
  return out;
}

type RuleDraft = Omit<Rule, "id">;

/** A finished sound ready to persist: metadata plus the picked file's URI. */
export type SoundDraft = {
  name: string;
  sourceUri: string;
  duration: number;
  start: number;
  end: number;
};

interface StoreValue {
  ready: boolean;
  presets: Preset[];
  sounds: Sound[];
  createPreset: (name: string, description?: string) => string;
  renamePreset: (id: string, name: string) => void;
  deletePreset: (id: string) => void;
  reorderPresets: (from: number, to: number) => void;
  addRule: (presetId: string, rule: RuleDraft) => void;
  updateRule: (presetId: string, rule: Rule) => void;
  deleteRule: (presetId: string, ruleId: string) => void;
  reorderRules: (presetId: string, from: number, to: number) => void;
  /** Persists a finished sound (copies its file locally) and returns it. */
  createSound: (draft: SoundDraft) => Promise<Sound>;
  renameSound: (id: string, name: string) => void;
  deleteSound: (id: string) => void;
  soundName: (id: string) => string | undefined;
  /** Wipes all presets and sounds (deleting the audio files too). */
  clearAll: () => void;
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

  // Load persisted data once on mount. On a first launch (nothing saved yet)
  // seed the library with the default presets and their bundled sounds.
  useEffect(() => {
    let active = true;
    (async () => {
      const data = await loadData();
      if (!active) return;
      if (data) {
        setPresets(data.presets);
        // Backfill trim fields for any sounds saved before they existed.
        setSounds(
          (data.sounds ?? []).map((s) => ({
            ...s,
            duration: s.duration ?? 0,
            start: s.start ?? 0,
            end: s.end ?? s.duration ?? 0,
          }))
        );
      } else {
        const seeded = await buildSeedSounds();
        if (!active) return;
        setSounds(seeded);
        setPresets(SEED_PRESETS);
      }
      setReady(true);
    })();
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

  const renamePreset = useCallback((id: string, name: string) => {
    setPresets((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
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

  const createSound = useCallback(async (draft: SoundDraft): Promise<Sound> => {
    const id = genId("sound");
    const uri = await persistSoundFile(draft.sourceUri, id, draft.name);
    const sound: Sound = {
      id,
      name: draft.name,
      uri,
      duration: draft.duration,
      start: draft.start,
      end: draft.end,
    };
    setSounds((prev) => [...prev, sound]);
    return sound;
  }, []);

  const renameSound = useCallback((id: string, name: string) => {
    setSounds((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));
  }, []);

  const deleteSound = useCallback((id: string) => {
    setSounds((prev) => {
      const target = prev.find((s) => s.id === id);
      if (target) deleteSoundFile(target.uri);
      return prev.filter((s) => s.id !== id);
    });
  }, []);

  // "Clear all" wipes user data but restores the default library so the app
  // is never left empty: seed presets + their bundled sounds come back.
  const clearAll = useCallback(() => {
    setSounds((prev) => {
      prev.forEach((s) => deleteSoundFile(s.uri));
      return [];
    });
    setPresets(SEED_PRESETS);
    buildSeedSounds().then((seeded) => setSounds(seeded));
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
        renamePreset,
        deletePreset,
        reorderPresets,
        addRule,
        updateRule,
        deleteRule,
        reorderRules,
        createSound,
        renameSound,
        deleteSound,
        soundName,
        clearAll,
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
