import { useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import ReorderableList, { useReorderableDrag } from "react-native-reorderable-list";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { fonts, useColors, radius, spacing, typography } from "../theme";
import { useStore } from "../program/store";
import { Preset } from "../program/types";
import PresetCard from "../program/PresetCard";
import PresetFormModal from "../program/PresetFormModal";
import SoundsScreen from "../program/SoundsScreen";
import SegmentedControl from "../components/SegmentedControl";
import { ProgramStackParamList } from "../navigation/types";

type Tab = "presets" | "sounds";
type Nav = NativeStackNavigationProp<ProgramStackParamList, "ProgramHome">;

/**
 * Program home: a segmented view over the preset library and the sound
 * library. Presets and their moments reorder by long-press drag; opening a
 * preset pushes its detail screen.
 */
export default function ProgramScreen() {
  const c = useColors();
  const styles = useStyles();
  const navigation = useNavigation<Nav>();
  const store = useStore();
  const { presets, createPreset, reorderPresets } = store;

  const [tab, setTab] = useState<Tab>("presets");
  const [presetFormOpen, setPresetFormOpen] = useState(false);

  function handleCreatePreset(name: string, description?: string) {
    const id = createPreset(name, description);
    setPresetFormOpen(false);
    navigation.navigate("PresetDetail", { presetId: id });
  }

  if (!store.ready) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={c.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.segmentedTop}>
        <SegmentedControl
          value={tab}
          onChange={setTab}
          options={[
            { label: "Presets", value: "presets" },
            { label: "Sounds", value: "sounds" },
          ]}
        />
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
            <DraggablePreset
              preset={item}
              onOpen={(id) => navigation.navigate("PresetDetail", { presetId: id })}
            />
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
  segmentedTop: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.body,
    color: c.textMuted,
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
