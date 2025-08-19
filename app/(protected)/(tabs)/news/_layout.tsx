import { Stack } from "expo-router";

export default function NewsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="earthquake-analysis"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="earthquake-scenario"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
