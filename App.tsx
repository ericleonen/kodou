import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ProgramStoreProvider } from "./src/program/store";
import { RunsProvider } from "./src/run/runsStore";
import { SettingsProvider, useSettings } from "./src/settings/settings";
import RootNavigator from "./src/navigation/RootNavigator";

function ThemedStatusBar() {
  const { theme } = useSettings();
  return <StatusBar style={theme === "light" ? "dark" : "light"} />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SettingsProvider>
          <ProgramStoreProvider>
            <RunsProvider>
              <ThemedStatusBar />
              <RootNavigator />
            </RunsProvider>
          </ProgramStoreProvider>
        </SettingsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
