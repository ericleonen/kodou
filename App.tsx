import { useCallback, useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from "@expo-google-fonts/inter";
import {
  BarlowSemiCondensed_700Bold,
  BarlowSemiCondensed_800ExtraBold,
} from "@expo-google-fonts/barlow-semi-condensed";
import { ProgramStoreProvider } from "./src/program/store";
import { RunsProvider } from "./src/run/runsStore";
import { SettingsProvider, useSettings } from "./src/settings/settings";
import RootNavigator from "./src/navigation/RootNavigator";

SplashScreen.preventAutoHideAsync();

function ThemedStatusBar() {
  const { theme } = useSettings();
  return <StatusBar style={theme === "light" ? "dark" : "light"} />;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    BarlowSemiCondensed_700Bold,
    BarlowSemiCondensed_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  const onLayout = useCallback(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayout}>
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
