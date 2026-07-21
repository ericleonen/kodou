import { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import ReorderableList, { useReorderableDrag } from "react-native-reorderable-list";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { fonts, radius, spacing, typography, useColors } from "../theme";
import ActionSheet from "../components/ActionSheet";
import { confirmDelete } from "../components/confirmDelete";
import { useStore } from "./store";
import { useTestRunner } from "./useTestRunner";
import RuleCard from "./RuleCard";
import RuleEditorModal from "./RuleEditorModal";
import { CriticalMoment, Rule, RuleResponse } from "./types";
import { ProgramStackParamList } from "../navigation/types";

type RuleData = { moment: CriticalMoment; responses: RuleResponse[] };
type Nav = NativeStackNavigationProp<ProgramStackParamList, "PresetDetail">;

/** A single preset: its moments (reorderable), simulate/rename/delete menu. */
export default function PresetDetailScreen() {
  const c = useColors();
  const styles = useStyles();
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<RouteProp<ProgramStackParamList, "PresetDetail">>();
  const { presets, sounds, renamePreset, deletePreset, reorderRules, addRule, updateRule, deleteRule } =
    useStore();
  const preset = presets.find((p) => p.id === params.presetId);

  const [menuOpen, setMenuOpen] = useState(false);
  const [editor, setEditor] = useState<{ rule: Rule | null } | null>(null);

  const { activeRuleId, running, start, stop } = useTestRunner(preset?.rules ?? [], sounds);

  if (!preset) return null;

  function handleSubmitRule(data: RuleData) {
    if (editor?.rule) {
      updateRule(preset!.id, { ...editor.rule, ...data });
    } else {
      addRule(preset!.id, data);
    }
    setEditor(null);
  }

  function handleDeleteRule() {
    if (!editor?.rule) return;
    const ruleId = editor.rule.id;
    confirmDelete("moment", () => {
      deleteRule(preset!.id, ruleId);
      setEditor(null);
    });
  }

  function handleDeletePreset() {
    confirmDelete("preset", () => {
      navigation.goBack();
      deletePreset(preset!.id);
    });
  }

  const hasRules = preset.rules.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.detailHeader}>
        <View style={styles.detailTop}>
          <TouchableOpacity
            style={styles.back}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            hitSlop={8}
          >
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
        onReorder={({ from, to }) => reorderRules(preset.id, from, to)}
        style={styles.flex}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={[styles.empty, styles.itemSpacing]}>
            No moments yet. Add one to start programming.
          </Text>
        }
        ListFooterComponent={
          <SecondaryButton icon="plus" label="Add moment" onPress={() => setEditor({ rule: null })} />
        }
        renderItem={({ item }) => (
          <DraggableRule
            rule={item}
            onEdit={(rule) => setEditor({ rule })}
            highlighted={item.id === activeRuleId}
          />
        )}
      />

      <RuleEditorModal
        visible={editor !== null}
        initial={editor?.rule ?? null}
        onSubmit={handleSubmitRule}
        onDelete={editor?.rule ? handleDeleteRule : undefined}
        onClose={() => setEditor(null)}
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
            onPress: handleDeletePreset,
          },
        ]}
      />
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
      <RuleCard rule={rule} onPress={() => onEdit(rule)} onLongPress={drag} highlighted={highlighted} />
    </View>
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
  listContent: {
    paddingBottom: spacing.xl,
  },
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
