import { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { SlideInDown } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import RangeSlider from "../components/RangeSlider";
import { useKeyboardHeight } from "../hooks/useKeyboardHeight";
import { fonts, motion, useColors, radius, spacing, typography } from "../theme";
import { useStore } from "./store";
import { Sound } from "./types";

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreated?: (sound: Sound) => void;
};

/** Modal to name, pick, trim, and preview a new sound before saving it. */
export default function SoundEditorModal({ visible, onClose, onCreated }: Props) {
  const c = useColors();
  const styles = useStyles();
  const { createSound } = useStore();
  const keyboardHeight = useKeyboardHeight();
  const player = useAudioPlayer(undefined, { updateInterval: 50 });
  const status = useAudioPlayerStatus(player);

  const [name, setName] = useState("");
  const [sourceUri, setSourceUri] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [saving, setSaving] = useState(false);
  // Becomes true once playback has actually entered the [start, end) window,
  // so a stale currentTime right after seek can't stop it immediately.
  const armed = useRef(false);

  // Reset each time the modal opens.
  useEffect(() => {
    if (visible) {
      setName("");
      setSourceUri(null);
      setDuration(0);
      setStart(0);
      setEnd(0);
      setSaving(false);
    } else {
      player.pause();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Load a picked file into the player.
  useEffect(() => {
    if (sourceUri) player.replace(sourceUri);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceUri]);

  // Once the file's duration is known, default the trim to the whole clip.
  useEffect(() => {
    if (status.isLoaded && status.duration > 0 && duration === 0) {
      setDuration(status.duration);
      setStart(0);
      setEnd(status.duration);
    }
  }, [status.isLoaded, status.duration, duration]);

  // Stop preview playback when it reaches the trim end. Only after we've
  // seen the position inside the window (armed) to avoid a stale-time stop.
  useEffect(() => {
    if (!status.playing || end <= start) return;
    if (status.currentTime < end - 0.1) armed.current = true;
    if (armed.current && status.currentTime >= end) {
      player.pause();
      armed.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status.currentTime, status.playing]);

  async function chooseFile() {
    const result = await DocumentPicker.getDocumentAsync({
      type: "audio/*",
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || result.assets.length === 0) return;
    const asset = result.assets[0];
    player.pause();
    setDuration(0);
    setStart(0);
    setEnd(0);
    setSourceUri(asset.uri);
    if (!name.trim()) setName(stripExtension(asset.name));
  }

  async function togglePreview() {
    if (status.playing) {
      player.pause();
    } else {
      armed.current = false;
      await player.seekTo(start);
      player.play();
    }
  }

  const canSave = name.trim().length > 0 && sourceUri !== null && duration > 0 && end > start;

  async function save() {
    if (!canSave || !sourceUri) return;
    setSaving(true);
    player.pause();
    const sound = await createSound({ name: name.trim(), sourceUri, duration, start, end });
    setSaving(false);
    onCreated?.(sound);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <GestureHandlerRootView style={styles.root}>
      <View style={[styles.backdrop, { paddingBottom: keyboardHeight }]}>
        <Animated.View style={styles.sheet} entering={SlideInDown.duration(motion.base)}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.title}>New sound</Text>
            <TouchableOpacity onPress={save} disabled={!canSave || saving} hitSlop={8}>
              <Text style={[styles.saveBtn, (!canSave || saving) && styles.disabled]}>Save</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Push harder"
            placeholderTextColor={c.textFaint}
          />

          <Text style={styles.label}>Audio file</Text>
          <TouchableOpacity style={styles.fileButton} onPress={chooseFile} activeOpacity={0.7}>
            <MaterialCommunityIcons name="file-music-outline" size={20} color={c.primary} />
            <Text style={styles.fileText} numberOfLines={1}>
              {sourceUri ? "Change file" : "Choose a file"}
            </Text>
          </TouchableOpacity>

          {sourceUri && duration > 0 ? (
            <>
              <Text style={styles.label}>Trim</Text>
              <RangeSlider
                key={sourceUri}
                min={0}
                max={duration}
                low={start}
                high={end}
                minGap={0.2}
                playback={status.playing ? status.currentTime : null}
                onChange={(lo, hi) => {
                  setStart(lo);
                  setEnd(hi);
                }}
              />
              <View style={styles.timeRow}>
                <Text style={styles.time}>{formatTime(start)}</Text>
                <Text style={styles.time}>{formatTime(end)}</Text>
              </View>

              <TouchableOpacity style={styles.preview} onPress={togglePreview} activeOpacity={0.85}>
                <MaterialCommunityIcons
                  name={status.playing ? "pause" : "play"}
                  size={20}
                  color={c.primary}
                />
                <Text style={styles.previewText}>
                  {status.playing ? "Stop" : "Test"} ({formatTime(Math.max(0, end - start))})
                </Text>
              </TouchableOpacity>
            </>
          ) : sourceUri ? (
            <Text style={styles.loading}>Reading audio…</Text>
          ) : null}
        </Animated.View>
      </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

function stripExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot > 0 ? fileName.slice(0, dot) : fileName;
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
  root: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    backgroundColor: c.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  title: {
    ...typography.heading,
    fontSize: 18,
    color: c.text,
  },
  cancel: {
    ...typography.body,
    color: c.textMuted,
  },
  saveBtn: {
    ...typography.body,
    fontFamily: fonts.bold,
    color: c.primary,
  },
  disabled: {
    color: c.textFaint,
  },
  label: {
    ...typography.label,
    color: c.textMuted,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  input: {
    ...typography.body,
    color: c.text,
    backgroundColor: c.surfaceAlt,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  fileButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: c.surfaceAlt,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  fileText: {
    ...typography.body,
    color: c.text,
    flex: 1,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
  time: {
    ...typography.label,
    color: c.textMuted,
    fontVariant: ["tabular-nums"],
  },
  preview: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: c.primarySoft,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },
  previewText: {
    ...typography.body,
    fontFamily: fonts.bold,
    color: c.primary,
  },
  loading: {
    ...typography.body,
    color: c.textMuted,
    marginTop: spacing.md,
  },
    }), [c]);
}
