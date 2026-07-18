import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme";
import ProgramScreen from "../screens/ProgramScreen";
import RunScreen from "../screens/RunScreen";
import YouScreen from "../screens/YouScreen";
import TabBar, { TabKey } from "./TabBar";

/**
 * Minimal tab navigation without a routing library: a piece of state
 * selects which screen renders above a persistent bottom bar. This keeps
 * the app free of extra native modules for now; it can be swapped for
 * expo-router or React Navigation once the screens grow real content.
 */
export default function RootNavigator() {
  const [active, setActive] = useState<TabKey>("run");

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.screen}>
        {active === "program" && <ProgramScreen />}
        {active === "run" && <RunScreen />}
        {active === "you" && <YouScreen />}
      </View>
      <TabBar active={active} onChange={setActive} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screen: {
    flex: 1,
  },
});
