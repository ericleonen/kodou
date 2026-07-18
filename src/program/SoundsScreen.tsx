import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAudioPlayer } from "expo-audio";
import { colors, radius, spacing, typography } from "../theme";
import { useStore } from "./store";

/** Sounds tab: the library of uploaded audio the presets can play. */
export default function SoundsScreen() {
  const { sounds, addSound, deleteSound } = useStore();
  const player = useAudioPlayer();

  function preview(uri: string) {
    player.replace(uri);
    player.seekTo(0);
    player.play();
  }

  return (
    <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
      {sounds.length === 0 ? (
        <Text style={styles.empty}>
          No sounds yet. Add an audio file to use it in your presets.
        </Text>
      ) : (
        sounds.map((sound) => (
          <View key={sound.id} style={styles.row}>
            <TouchableOpacity
              style={styles.play}
              onPress={() => preview(sound.uri)}
              activeOpacity={0.7}
              hitSlop={8}
            >
              <MaterialCommunityIcons name="play" size={20} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.name} numberOfLines={1}>
              {sound.name}
            </Text>
            <TouchableOpacity onPress={() => deleteSound(sound.id)} hitSlop={8}>
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={20}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        ))
      )}

      <TouchableOpacity style={styles.addButton} onPress={addSound} activeOpacity={0.7}>
        <MaterialCommunityIcons name="plus" size={20} color={colors.textMuted} />
        <Text style={styles.addText}>Add sound</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  empty: {
    ...typography.body,
    color: colors.textFaint,
    textAlign: "center",
    paddingVertical: spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  play: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    ...typography.body,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
  },
  addButton: {
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
  addText: {
    ...typography.body,
    fontWeight: "600",
    color: colors.textMuted,
  },
});
