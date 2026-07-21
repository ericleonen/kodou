import { useEffect, useMemo, useRef, useState } from "react";
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
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { fonts, radius, spacing, typography, useColors } from "../theme";
import { useRuns } from "./runsStore";
import { defaultRunTitle } from "./format";
import { YouStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<YouStackParamList, "RunEdit">;

/** Edit-only screen for a run's title and notes, with discard/save. */
export default function RunEditScreen() {
  const c = useColors();
  const styles = useStyles();
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<RouteProp<YouStackParamList, "RunEdit">>();
  const { runs, updateRun } = useRuns();
  const run = runs.find((r) => r.id === params.runId);

  const [title, setTitle] = useState(run?.title ?? "");
  const [notes, setNotes] = useState(run?.notes ?? "");
  // Set true right before an intentional leave so the guard lets it through.
  const leaving = useRef(false);

  const dirty = !!run && (title !== (run.title ?? "") || notes !== (run.notes ?? ""));

  // Confirm before leaving with unsaved edits — covers the back button, the
  // swipe gesture, and the hardware back, not just the Discard button.
  useEffect(() => {
    const unsub = navigation.addListener("beforeRemove", (e) => {
      if (!dirty || leaving.current) return;
      e.preventDefault();
      Alert.alert("Discard changes?", "Your edits won't be saved.", [
        { text: "Keep editing", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => {
            leaving.current = true;
            navigation.dispatch(e.data.action);
          },
        },
      ]);
    });
    return unsub;
  }, [navigation, dirty]);

  if (!run) return null;

  function save() {
    leaving.current = true;
    updateRun(run!.id, { title, notes });
    navigation.goBack();
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
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
