import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import ReorderableList, { useReorderableDrag } from "react-native-reorderable-list";
import { colors, radius, spacing, typography } from "../theme";
import { useStore } from "../program/store";
import { CriticalMoment, Preset, Rule, RuleResponse } from "../program/types";
import PresetCard from "../program/PresetCard";
import RuleCard from "../program/RuleCard";
import PresetFormModal from "../program/PresetFormModal";
import RuleEditorModal from "../program/RuleEditorModal";
import SoundsScreen from "../program/SoundsScreen";

type RuleData = { moment: CriticalMoment; responses: RuleResponse[] };
type Tab = "presets" | "sounds";

/**
 * Program tab. Two sub-tabs: a library of presets (the runner picks one
 * at run time, so none is "active") and the sound library. Both the
 * preset list and a preset's moments can be reordered by long-pressing
 * and dragging. Local state instead of a router.
 */
export default function ProgramScreen() {
  const store = useStore();
  const { presets, createPreset, deletePreset, reorderPresets, addRule, updateRule, deleteRule } =
    store;

  const [tab, setTab] = useState<Tab>("presets");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [presetFormOpen, setPresetFormOpen] = useState(false);
  const [editor, setEditor] = useState<{ rule: Rule | null } | null>(null);

  const selected = useMemo(
    () => presets.find((p) => p.id === selectedId) ?? null,
    [presets, selectedId]
  );

  function handleCreatePreset(name: string, description?: string) {
    const id = createPreset(name, description);
    setPresetFormOpen(false);
    setSelectedId(id);
  }

  function handleSubmitRule(data: RuleData) {
    if (!selected) return;
    if (editor?.rule) {
      updateRule(selected.id, { ...editor.rule, ...data });
    } else {
      addRule(selected.id, data);
    }
    setEditor(null);
  }

  function handleDeleteRule() {
    if (!selected || !editor?.rule) return;
    deleteRule(selected.id, editor.rule.id);
    setEditor(null);
  }

  function confirmDeletePreset(preset: Preset) {
    Alert.alert("Delete preset", `Delete "${preset.name}"? This can't be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setSelectedId(null);
          deletePreset(preset.id);
        },
      },
    ]);
  }

  if (!store.ready) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  // Preset detail is a full-screen view (no sub-tabs).
  if (selected) {
    return (
      <View style={styles.container}>
        <PresetDetail
          preset={selected}
          onBack={() => setSelectedId(null)}
          onReorderRules={(from, to) => store.reorderRules(selected.id, from, to)}
          onAddRule={() => setEditor({ rule: null })}
          onEditRule={(rule) => setEditor({ rule })}
          onDelete={() => confirmDeletePreset(selected)}
        />
        <RuleEditorModal
          visible={editor !== null}
          initial={editor?.rule ?? null}
          onSubmit={handleSubmitRule}
          onDelete={editor?.rule ? handleDeleteRule : undefined}
          onClose={() => setEditor(null)}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Program</Text>
      <View style={styles.segmented}>
        <SegmentButton label="Presets" active={tab === "presets"} onPress={() => setTab("presets")} />
        <SegmentButton label="Sounds" active={tab === "sounds"} onPress={() => setTab("sounds")} />
      </View>

      {tab === "presets" ? (
        <ReorderableList
          data={presets}
          keyExtractor={(item) => item.id}
          onReorder={({ from, to }) => reorderPresets(from, to)}
          style={styles.flex}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={[styles.subtitle, styles.itemSpacing]}>
              Presets you can pick from when you start a run.
            </Text>
          }
          ListFooterComponent={
            <SecondaryButton icon="plus" label="New preset" onPress={() => setPresetFormOpen(true)} />
          }
          renderItem={({ item }) => (
            <DraggablePreset preset={item} onOpen={setSelectedId} />
          )}
        />
      ) : (
        <SoundsScreen />
      )}

      <PresetFormModal
        visible={presetFormOpen}
        onSubmit={handleCreatePreset}
        onClose={() => setPresetFormOpen(false)}
      />
    </View>
  );
}

function DraggablePreset({ preset, onOpen }: { preset: Preset; onOpen: (id: string) => void }) {
  const drag = useReorderableDrag();
  return (
    <View style={styles.itemSpacing}>
      <PresetCard preset={preset} onPress={() => onOpen(preset.id)} onLongPress={drag} />
    </View>
  );
}

function DraggableRule({ rule, onEdit }: { rule: Rule; onEdit: (rule: Rule) => void }) {
  const drag = useReorderableDrag();
  return (
    <View style={styles.itemSpacing}>
      <RuleCard rule={rule} onPress={() => onEdit(rule)} onLongPress={drag} />
    </View>
  );
}

function PresetDetail({
  preset,
  onBack,
  onReorderRules,
  onAddRule,
  onEditRule,
  onDelete,
}: {
  preset: Preset;
  onBack: () => void;
  onReorderRules: (from: number, to: number) => void;
  onAddRule: () => void;
  onEditRule: (rule: Rule) => void;
  onDelete: () => void;
}) {
  function testPreset() {
    if (preset.rules.length === 0) return;
    Vibration.vibrate(preset.rules.flatMap(() => [0, 250, 150]));
  }

  return (
    <>
      <View style={styles.detailHeader}>
        <View style={styles.detailTop}>
          <TouchableOpacity style={styles.back} onPress={onBack} activeOpacity={0.7} hitSlop={8}>
            <MaterialCommunityIcons name="chevron-left" size={22} color={colors.textMuted} />
            <Text style={styles.backText}>Presets</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} hitSlop={8}>
            <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>{preset.name}</Text>
        {preset.description ? <Text style={styles.subtitle}>{preset.description}</Text> : null}
      </View>

      <ReorderableList
        data={preset.rules}
        keyExtractor={(item) => item.id}
        onReorder={({ from, to }) => onReorderRules(from, to)}
        style={styles.flex}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.empty}>No moments yet. Add one to start programming.</Text>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <SecondaryButton icon="plus" label="Add moment" onPress={onAddRule} />
            {preset.rules.length > 0 ? (
              <TouchableOpacity style={styles.testButton} onPress={testPreset} activeOpacity={0.85}>
                <MaterialCommunityIcons name="play" size={18} color={colors.primary} />
                <Text style={styles.testText}>Test preset</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        }
        renderItem={({ item }) => <DraggableRule rule={item} onEdit={onEditRule} />}
      />
    </>
  );
}

function SegmentButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.segment, active && styles.segmentActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function SecondaryButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.secondary} onPress={onPress} activeOpacity={0.7}>
      <MaterialCommunityIcons name={icon} size={20} color={colors.textMuted} />
      <Text style={styles.secondaryText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  flex: {
    flex: 1,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
  detailHeader: {
    marginBottom: spacing.lg,
  },
  detailTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  back: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: -spacing.xs,
  },
  backText: {
    ...typography.label,
    color: colors.textMuted,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
  },
  segmented: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.xs,
    gap: spacing.xs,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  segment: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  segmentActive: {
    backgroundColor: colors.primarySoft,
  },
  segmentText: {
    ...typography.body,
    fontWeight: "600",
    color: colors.textMuted,
  },
  segmentTextActive: {
    color: colors.primary,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  // Per-item spacing (a list can't rely on container `gap` for its rows).
  itemSpacing: {
    marginBottom: spacing.md,
  },
  footer: {
    gap: spacing.md,
  },
  empty: {
    ...typography.body,
    color: colors.textFaint,
    textAlign: "center",
    paddingVertical: spacing.lg,
  },
  secondary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  secondaryText: {
    ...typography.body,
    fontWeight: "600",
    color: colors.textMuted,
  },
  testButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  testText: {
    ...typography.body,
    fontWeight: "700",
    color: colors.primary,
  },
});
