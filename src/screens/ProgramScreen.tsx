import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import ReorderableList, { useReorderableDrag } from "react-native-reorderable-list";
import { fonts, useColors, radius, spacing, typography } from "../theme";
import { useStore } from "../program/store";
import { useTestRunner } from "../program/useTestRunner";
import { CriticalMoment, Preset, Rule, RuleResponse } from "../program/types";
import PresetCard from "../program/PresetCard";
import RuleCard from "../program/RuleCard";
import PresetFormModal from "../program/PresetFormModal";
import RuleEditorModal from "../program/RuleEditorModal";
import SoundsScreen from "../program/SoundsScreen";
import ActionSheet from "../components/ActionSheet";
import SwipeBackView from "../components/SwipeBackView";
import { confirmDelete } from "../components/confirmDelete";
import { useBackHandler } from "../hooks/useBackHandler";

type RuleData = { moment: CriticalMoment; responses: RuleResponse[] };
type Tab = "presets" | "sounds";

/**
 * Program tab. Two sub-tabs: a library of presets (the runner picks one
 * at run time, so none is "active") and the sound library. Both the
 * preset list and a preset's moments can be reordered by long-pressing
 * and dragging. Local state instead of a router.
 */
export default function ProgramScreen() {
  const c = useColors();
  const styles = useStyles();
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
    const { id: presetId } = selected;
    const ruleId = editor.rule.id;
    confirmDelete("moment", () => {
      deleteRule(presetId, ruleId);
      setEditor(null);
    });
  }

  function confirmDeletePreset(preset: Preset) {
    confirmDelete("preset", () => {
      setSelectedId(null);
      deletePreset(preset.id);
    });
  }

  if (!store.ready) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={c.primary} />
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
      <View style={[styles.segmented, styles.segmentedTop]}>
        <SegmentButton label="Presets" active={tab === "presets"} onPress={() => setTab("presets")} />
        <SegmentButton label="Sounds" active={tab === "sounds"} onPress={() => setTab("sounds")} />
      </View>

      {tab === "presets" ? (
        <ReorderableList
          data={presets}
          keyExtractor={(item, index) => item?.id ?? String(index)}
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
  const styles = useStyles();
  const drag = useReorderableDrag();
  return (
    <View style={styles.itemSpacing}>
      <PresetCard preset={preset} onPress={() => onOpen(preset.id)} onLongPress={drag} />
    </View>
  );
}

function DraggableRule({
  rule,
  onEdit,
  highlighted,
}: {
  rule: Rule;
  onEdit: (rule: Rule) => void;
  highlighted: boolean;
}) {
  const styles = useStyles();
  const drag = useReorderableDrag();
  return (
    <View style={styles.itemSpacing}>
      <RuleCard
        rule={rule}
        onPress={() => onEdit(rule)}
        onLongPress={drag}
        highlighted={highlighted}
      />
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
  const c = useColors();
  const styles = useStyles();
  const { sounds, renamePreset } = useStore();
  const { activeRuleId, running, start, stop } = useTestRunner(preset.rules, sounds);
  const [menuOpen, setMenuOpen] = useState(false);

  useBackHandler(onBack);

  const hasRules = preset.rules.length > 0;

  return (
    <SwipeBackView onBack={onBack}>
      <View style={styles.detailHeader}>
        <View style={styles.detailTop}>
          <TouchableOpacity style={styles.back} onPress={onBack} activeOpacity={0.7} hitSlop={8}>
            <MaterialCommunityIcons name="chevron-left" size={22} color={c.textMuted} />
            <Text style={styles.backText}>Presets</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setMenuOpen(true)}
            hitSlop={8}
            accessibilityLabel="Preset options"
          >
            <MaterialCommunityIcons name="dots-vertical" size={22} color={c.textMuted} />
          </TouchableOpacity>
        </View>
        <View style={styles.titleCol}>
          <Text style={styles.title}>{preset.name}</Text>
          {preset.description ? <Text style={styles.subtitle}>{preset.description}</Text> : null}
        </View>
        {running ? (
          <TouchableOpacity style={styles.simBanner} onPress={stop} activeOpacity={0.8}>
            <View style={styles.simDot} />
            <Text style={styles.simText}>Simulating…</Text>
            <View style={styles.simStop}>
              <MaterialCommunityIcons name="stop" size={16} color={c.success} />
              <Text style={styles.simStopText}>Stop</Text>
            </View>
          </TouchableOpacity>
        ) : null}
      </View>

      <ReorderableList
        data={preset.rules}
        extraData={activeRuleId}
        keyExtractor={(item, index) => item?.id ?? String(index)}
        onReorder={({ from, to }) => onReorderRules(from, to)}
        style={styles.flex}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={[styles.empty, styles.itemSpacing]}>
            No moments yet. Add one to start programming.
          </Text>
        }
        ListFooterComponent={
          <SecondaryButton icon="plus" label="Add moment" onPress={onAddRule} />
        }
        renderItem={({ item }) => (
          <DraggableRule
            rule={item}
            onEdit={onEditRule}
            highlighted={item.id === activeRuleId}
          />
        )}
      />

      <ActionSheet
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={preset.name}
        rename={{
          label: "Rename",
          initialValue: preset.name,
          placeholder: "Preset name",
          onSubmit: (name) => renamePreset(preset.id, name),
        }}
        actions={[
          ...(hasRules
            ? [
                {
                  label: running ? "Stop simulation" : "Simulate preset",
                  icon: (running ? "stop" : "play") as keyof typeof MaterialCommunityIcons.glyphMap,
                  onPress: running ? stop : start,
                },
              ]
            : []),
          {
            label: "Delete preset",
            icon: "trash-can-outline" as keyof typeof MaterialCommunityIcons.glyphMap,
            destructive: true,
            onPress: onDelete,
          },
        ]}
      />
    </SwipeBackView>
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
  const styles = useStyles();
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
  const c = useColors();
  const styles = useStyles();
  return (
    <TouchableOpacity style={styles.secondary} onPress={onPress} activeOpacity={0.7}>
      <MaterialCommunityIcons name={icon} size={20} color={c.textMuted} />
      <Text style={styles.secondaryText}>{label}</Text>
    </TouchableOpacity>
  );
}

function useStyles() {
  const c = useColors();
  return useMemo(() =>
    StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
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
    color: c.textMuted,
  },
  titleCol: {
    gap: spacing.xs,
  },
  simBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "rgba(61, 214, 140, 0.14)",
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  simDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: c.success,
  },
  simText: {
    ...typography.label,
    fontFamily: fonts.semibold,
    color: c.text,
    flex: 1,
  },
  simStop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  simStopText: {
    ...typography.label,
    fontFamily: fonts.bold,
    color: c.success,
  },
  title: {
    ...typography.title,
    color: c.text,
  },
  subtitle: {
    ...typography.body,
    color: c.textMuted,
  },
  segmented: {
    flexDirection: "row",
    backgroundColor: c.surface,
    borderRadius: radius.md,
    padding: spacing.xs,
    gap: spacing.xs,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  segmentedTop: {
    marginTop: spacing.sm,
  },
  segment: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  segmentActive: {
    backgroundColor: c.primarySoft,
  },
  segmentText: {
    ...typography.body,
    fontFamily: fonts.semibold,
    color: c.textMuted,
  },
  segmentTextActive: {
    color: c.primary,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  // Per-item spacing. Uses paddingBottom (not margin) so the spacing is
  // part of each cell's measured height — the reorderable list records
  // itemSize from layout.height, and a margin gap it can't see desyncs
  // its drop detection (which broke dragging items upward).
  itemSpacing: {
    paddingBottom: spacing.md,
  },
  empty: {
    ...typography.body,
    color: c.textFaint,
    textAlign: "center",
    paddingVertical: spacing.lg,
  },
  secondary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: c.border,
    borderStyle: "dashed",
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  secondaryText: {
    ...typography.body,
    fontFamily: fonts.semibold,
    color: c.textMuted,
  },
    }), [c]);
}
