import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import CircularProgress from "../components/CircularProgress";
import { colors, radius, spacing, typography } from "../theme";
import { useStore } from "./store";
import SoundEditorModal from "./SoundEditorModal";
import { Sound } from "./types";

/** Sounds tab: the library of uploaded audio the presets can play. */
export default function SoundsScreen() {
  const { sounds, deleteSound } = useStore();
  const player = useAudioPlayer(undefined, { updateInterval: 50 });
  const status = useAudioPlayerStatus(player);

  const [editorOpen, setEditorOpen] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  // See SoundEditorModal: guards against a stale currentTime stopping
  // playback immediately after a seek.
  const armed = useRef(false);

  const active = sounds.find((s) => s.id === playingId) ?? null;

  // Stop playback when it reaches the trim end (once actually inside the window).
  useEffect(() => {
    if (!active || !status.playing) return;
    if (status.currentTime < active.end - 0.1) armed.current = true;
    if (armed.current && status.currentTime >= active.end) {
      player.pause();
      setPlayingId(null);
      armed.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status.currentTime, status.playing]);

  async function toggle(sound: Sound) {
    if (playingId === sound.id && status.playing) {
      player.pause();
      setPlayingId(null);
      return;
    }
    if (playingId !== sound.id) player.replace(sound.uri);
    armed.current = false;
    setPlayingId(sound.id);
    await player.seekTo(sound.start);
    player.play();
  }

  const activeSpan = active ? Math.max(active.end - active.start, 0.0001) : 1;
  const progress = active ? (status.currentTime - active.start) / activeSpan : 0;

  return (
    <>
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {sounds.length === 0 ? (
          <Text style={styles.empty}>
            No sounds yet. Add an audio file to use it in your presets.
          </Text>
        ) : (
          sounds.map((sound) => {
            const isActive = sound.id === playingId;
            return (
              <View key={sound.id} style={styles.row}>
                <TouchableOpacity onPress={() => toggle(sound)} activeOpacity={0.7}>
                  <CircularProgress size={44} strokeWidth={3} progress={isActive ? progress : 0}>
                    <MaterialCommunityIcons
                      name={isActive && status.playing ? "pause" : "play"}
                      size={20}
                      color={colors.primary}
                    />
                  </CircularProgress>
                </TouchableOpacity>
                <View style={styles.info}>
                  <Text style={styles.name} numberOfLines={1}>
                    {sound.name}
                  </Text>
                  <Text style={styles.meta}>{formatTime(sound.end - sound.start)}</Text>
                </View>
                <TouchableOpacity onPress={() => deleteSound(sound.id)} hitSlop={8}>
                  <MaterialCommunityIcons
                    name="trash-can-outline"
                    size={20}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            );
          })
        )}

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setEditorOpen(true)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="plus" size={20} color={colors.textMuted} />
          <Text style={styles.addText}>Add sound</Text>
        </TouchableOpacity>
      </ScrollView>

      <SoundEditorModal visible={editorOpen} onClose={() => setEditorOpen(false)} />
    </>
  );
}

function formatTime(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
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
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...typography.body,
    fontWeight: "600",
    color: colors.text,
  },
  meta: {
    ...typography.label,
    color: colors.textFaint,
    fontVariant: ["tabular-nums"],
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
