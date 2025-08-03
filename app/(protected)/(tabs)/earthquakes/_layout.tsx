import { Stack, useRouter } from "expo-router";
import { useCallback } from "react";

export default function EarthquakesLayout() {
  const router = useRouter();

  const handleCustomBack = useCallback((source: string) => {
    if (source === 'carousel') {
      // If came from carousel (Ana Sayfa), go back to Ana Sayfa
      router.push("/(protected)/(tabs)/");
    } else if (source === 'list') {
      // If came from earthquakes list, go back to earthquakes list
      router.push("/(protected)/(tabs)/earthquakes");
    } else {
      // Default fallback - go back in navigation stack
      router.back();
    }
  }, [router]);
  return (
    <Stack
      screenOptions={{
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        animation: 'slide_from_right',
      }}
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
          gestureEnabled: false,
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
