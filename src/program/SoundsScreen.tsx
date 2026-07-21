import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import CircularProgress from "../components/CircularProgress";
import ActionSheet from "../components/ActionSheet";
import { confirmDelete } from "../components/confirmDelete";
import { fonts, radius, spacing, typography, useColors } from "../theme";
import { useStore } from "./store";
import SoundEditorModal from "./SoundEditorModal";
import { Sound } from "./types";

/** Sounds tab: the library of uploaded audio the presets can play. */
export default function SoundsScreen() {
  const c = useColors();
  const styles = useStyles();
  const { sounds, renameSound, deleteSound } = useStore();
  const player = useAudioPlayer(undefined, { updateInterval: 50 });
  const status = useAudioPlayerStatus(player);

  const [editorOpen, setEditorOpen] = useState(false);
  const [menuFor, setMenuFor] = useState<Sound | null>(null);
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
                      color={c.primary}
                    />
                  </CircularProgress>
                </TouchableOpacity>
                <View style={styles.info}>
                  <Text style={styles.name} numberOfLines={1}>
                    {sound.name}
                  </Text>
                  <Text style={styles.meta}>{formatTime(sound.end - sound.start)}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setMenuFor(sound)}
                  hitSlop={8}
                  accessibilityLabel="Sound options"
                >
                  <MaterialCommunityIcons name="dots-vertical" size={22} color={c.textMuted} />
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
          <MaterialCommunityIcons name="plus" size={20} color={c.textMuted} />
          <Text style={styles.addText}>Add sound</Text>
        </TouchableOpacity>
      </ScrollView>

      <SoundEditorModal visible={editorOpen} onClose={() => setEditorOpen(false)} />

      <ActionSheet
        visible={menuFor !== null}
        onClose={() => setMenuFor(null)}
        title={menuFor?.name}
        rename={
          menuFor
            ? {
                label: "Rename",
                initialValue: menuFor.name,
                placeholder: "Sound name",
                onSubmit: (name) => renameSound(menuFor.id, name),
              }
            : undefined
        }
        actions={
          menuFor
            ? [
                {
                  label: "Delete",
                  icon: "trash-can-outline",
                  destructive: true,
                  onPress: () => confirmDelete("sound", () => deleteSound(menuFor.id)),
                },
              ]
            : []
        }
      />
    </>
  );
}

function formatTime(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function useStyles() {
  const c = useColors();
  return useMemo(() =>
    StyleSheet.create({
  list: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  empty: {
    ...typography.body,
    color: c.textFaint,
    textAlign: "center",
    paddingVertical: spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: c.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...typography.body,
    fontFamily: fonts.semibold,
    color: c.text,
  },
  meta: {
    ...typography.label,
    color: c.textFaint,
    fontVariant: ["tabular-nums"],
  },
  addButton: {
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
  addText: {
    ...typography.body,
    fontFamily: fonts.semibold,
    color: c.textMuted,
  },
    }), [c]);
}
