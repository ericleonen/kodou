import { createContext, ReactNode, useCallback, useContext, useState } from "react";
import { MOCK_PRESETS } from "./mockPresets";
import { Preset, Rule } from "./types";

let idCounter = 0;
const genId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${idCounter++}`;

type RuleDraft = Omit<Rule, "id">;

interface PresetsContextValue {
  presets: Preset[];
  createPreset: (name: string, description?: string) => string;
  deletePreset: (id: string) => void;
  addRule: (presetId: string, rule: RuleDraft) => void;
  updateRule: (presetId: string, rule: Rule) => void;
  deleteRule: (presetId: string, ruleId: string) => void;
}

const PresetsContext = createContext<PresetsContextValue | null>(null);

/**
 * Holds the preset library in memory above the tab navigator, so edits
 * survive switching tabs. (Persistence across app restarts is a
 * separate, still-to-come layer.)
 */
export function PresetsProvider({ children }: { children: ReactNode }) {
  const [presets, setPresets] = useState<Preset[]>(MOCK_PRESETS);

  const createPreset = useCallback((name: string, description?: string) => {
    const id = genId("preset");
    setPresets((prev) => [...prev, { id, name, description, rules: [] }]);
    return id;
  }, []);

  const deletePreset = useCallback((id: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== id));
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

  return (
    <PresetsContext.Provider
      value={{ presets, createPreset, deletePreset, addRule, updateRule, deleteRule }}
    >
      {children}
    </PresetsContext.Provider>
  );
}

export function usePresets() {
  const ctx = useContext(PresetsContext);
  if (!ctx) throw new Error("usePresets must be used within a PresetsProvider");
  return ctx;
}
