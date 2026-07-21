import { useMemo } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  Theme,
} from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useColors } from "../theme";
import { useSettings } from "../settings/settings";
import RunScreen from "../screens/RunScreen";
import ProgramStack from "./ProgramStack";
import YouStack from "./YouStack";
import TabBar from "./TabBar";
import { TabParamList } from "./types";

const Tab = createBottomTabNavigator<TabParamList>();

/**
 * Bottom tabs (with a shift animation between them) over three sections;
 * Program and You are native stacks so their detail screens slide in and
 * support the native swipe/hardware back.
 */
export default function RootNavigator() {
  const c = useColors();
  const { theme } = useSettings();
  const styles = useStyles();

  const base = theme === "dark" ? DarkTheme : DefaultTheme;
  const navTheme: Theme = {
    ...base,
    colors: {
      ...base.colors,
      background: c.background,
      card: c.surface,
      border: c.border,
      primary: c.primary,
      text: c.text,
    },
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <NavigationContainer theme={navTheme}>
        <Tab.Navigator
          tabBar={(props) => <TabBar {...props} />}
          screenOptions={{ headerShown: false, animation: "shift" }}
        >
          <Tab.Screen name="program" component={ProgramStack} />
          <Tab.Screen name="run" component={RunScreen} />
          <Tab.Screen name="you" component={YouStack} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
}

function useStyles() {
  const c = useColors();
  return useMemo(
    () =>
      StyleSheet.create({
        safe: {
          flex: 1,
          backgroundColor: c.background,
        },
      }),
    [c]
  );
}
