import { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import SwipeBackView from "../components/SwipeBackView";
import { useBackHandler } from "../hooks/useBackHandler";
import { fonts, radius, spacing, typography, useColors } from "../theme";
import { useRuns } from "./runsStore";
import { defaultRunTitle } from "./format";
import { SavedRun } from "./types";

/** Edit-only screen for a run's title and notes, with discard/save. */
export default function RunEdit({ run, onDone }: { run: SavedRun; onDone: () => void }) {
  const c = useColors();
  const styles = useStyles();
  const { updateRun } = useRuns();

  const [title, setTitle] = useState(run.title ?? "");
  const [notes, setNotes] = useState(run.notes ?? "");

  const dirty = title !== (run.title ?? "") || notes !== (run.notes ?? "");

  function discard() {
    if (!dirty) {
      onDone();
      return;
    }
    Alert.alert("Discard changes?", "Your edits won't be saved.", [
      { text: "Keep editing", style: "cancel" },
      { text: "Discard", style: "destructive", onPress: onDone },
    ]);
  }

  function save() {
    updateRun(run.id, { title, notes });
    onDone();
  }

  useBackHandler(discard);

  return (
    <SwipeBackView onBack={discard}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.topBar}>
          <TouchableOpacity onPress={discard} hitSlop={8}>
            <Text style={styles.discard}>Discard</Text>
          </TouchableOpacity>
          <Text style={styles.topTitle}>Edit run</Text>
          <TouchableOpacity onPress={save} hitSlop={8}>
            <Text style={styles.save}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder={defaultRunTitle(run.date)}
            placeholderTextColor={c.textFaint}
            maxLength={80}
            returnKeyType="done"
            autoFocus
          />

          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="How did it go?"
            placeholderTextColor={c.textFaint}
            multiline
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SwipeBackView>
  );
}

function useStyles() {
  const c = useColors();
  return useMemo(() =>
    StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  topTitle: {
    ...typography.heading,
    fontSize: 18,
    color: c.text,
  },
  discard: {
    ...typography.body,
    color: c.textMuted,
  },
  save: {
    ...typography.body,
    fontFamily: fonts.bold,
    color: c.primary,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  label: {
    ...typography.label,
    textTransform: "uppercase",
    color: c.textMuted,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  input: {
    ...typography.body,
    color: c.text,
    backgroundColor: c.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  notesInput: {
    minHeight: 120,
    textAlignVertical: "top",
    paddingTop: spacing.md,
  },
    }), [c]);
}
