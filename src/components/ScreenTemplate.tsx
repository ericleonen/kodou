import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, spacing, typography } from "../theme";

type Props = {
  title: string;
  subtitle: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  children?: ReactNode;
};

/**
 * Shared scaffold for the tab screens. For now every page is a
 * placeholder: a title, a one-line description of the page's purpose,
 * and a large muted icon. Real content drops into `children` later.
 */
export default function ScreenTemplate({ title, subtitle, icon, children }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      {children ?? (
        <View style={styles.placeholder}>
          <MaterialCommunityIcons name={icon} size={72} color={colors.surfaceAlt} />
          <Text style={styles.placeholderText}>Coming soon</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  header: {
    marginBottom: spacing.xl,
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
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  placeholderText: {
    ...typography.label,
    color: colors.textFaint,
    textTransform: "uppercase",
  },
});
