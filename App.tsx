import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ProgramStoreProvider } from "./src/program/store";
import RootNavigator from "./src/navigation/RootNavigator";

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ProgramStoreProvider>
          <StatusBar style="light" />
          <RootNavigator />
        </ProgramStoreProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
