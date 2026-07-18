import { useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "../theme";
import { MOCK_PRESETS } from "../program/mockPresets";
import { Preset } from "../program/types";
import PresetCard from "../program/PresetCard";
import RuleCard from "../program/RuleCard";

const notImplemented = () =>
  Alert.alert("Coming soon", "Editing presets isn't wired up yet.");

/**
 * Program tab. A library of presets the runner chooses from at run time
 * (none is "active" here). Tapping a preset drills into its rules. Uses
 * local state instead of a router to avoid extra native dependencies.
 */
export default function ProgramScreen() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(
    () => MOCK_PRESETS.find((p) => p.id === selectedId) ?? null,
    [selectedId]
  );

  if (selected) {
    return <PresetDetail preset={selected} onBack={() => setSelectedId(null)} />;
  }
  return <PresetList onOpen={setSelectedId} />;
}

function PresetList({ onOpen }: { onOpen: (id: string) => void }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Program</Text>
        <Text style={styles.subtitle}>
          Presets you can pick from when you start a run.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {MOCK_PRESETS.map((preset) => (
          <PresetCard key={preset.id} preset={preset} onPress={() => onOpen(preset.id)} />
        ))}
        <SecondaryButton icon="plus" label="New preset" onPress={notImplemented} />
      </ScrollView>
    </View>
  );
}

function PresetDetail({ preset, onBack }: { preset: Preset; onBack: () => void }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={onBack} activeOpacity={0.7} hitSlop={8}>
          <MaterialCommunityIcons name="chevron-left" size={22} color={colors.textMuted} />
          <Text style={styles.backText}>Presets</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{preset.name}</Text>
        {preset.description ? (
          <Text style={styles.subtitle}>{preset.description}</Text>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {preset.rules.map((rule) => (
          <RuleCard key={rule.id} rule={rule} />
        ))}
        <SecondaryButton icon="plus" label="Add moment" onPress={notImplemented} />
        <TouchableOpacity style={styles.testButton} onPress={notImplemented} activeOpacity={0.85}>
          <MaterialCommunityIcons name="play" size={18} color={colors.primary} />
          <Text style={styles.testText}>Test preset</Text>
        </TouchableOpacity>
      </ScrollView>
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
  header: {
    marginBottom: spacing.lg,
  },
  back: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
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
    marginTop: spacing.xs,
  },
  list: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
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
