import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProgramScreen from "../screens/ProgramScreen";
import PresetDetailScreen from "../program/PresetDetailScreen";
import { ProgramStackParamList } from "./types";

const Stack = createNativeStackNavigator<ProgramStackParamList>();

export default function ProgramStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProgramHome" component={ProgramScreen} />
      <Stack.Screen name="PresetDetail" component={PresetDetailScreen} />
    </Stack.Navigator>
  );
}
