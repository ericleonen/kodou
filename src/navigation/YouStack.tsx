import { createNativeStackNavigator } from "@react-navigation/native-stack";
import YouScreen from "../screens/YouScreen";
import SettingsScreen from "../screens/SettingsScreen";
import RunDetailScreen from "../run/RunDetailScreen";
import RunEditScreen from "../run/RunEditScreen";
import { YouStackParamList } from "./types";

const Stack = createNativeStackNavigator<YouStackParamList>();

export default function YouStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="YouHome" component={YouScreen} />
      <Stack.Screen name="RunDetail" component={RunDetailScreen} />
      <Stack.Screen name="RunEdit" component={RunEditScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}
