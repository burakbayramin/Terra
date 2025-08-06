import { Stack } from "expo-router";

export default function EarthquakesLayout() {
  return (
    <Stack
      // screenOptions={{
      //   gestureEnabled: true,
      //   gestureDirection: 'horizontal',
      //   animation: 'slide_from_right',
      // }}
    >
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
        name="all-comments"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
