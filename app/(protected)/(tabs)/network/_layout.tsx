import { Stack } from "expo-router";

export default function NetworkLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Ağ",
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: "Ağ Detayı",
          headerShown: false,
          headerBackTitle: "Geri",
        }}
      />
      <Stack.Screen
        name="safe-zones"
        options={{
          title: "Güvenli Alanlar",
          headerShown: false,
          headerBackTitle: "Geri",
        }}
      />
      <Stack.Screen
        name="emergency-plan"
        options={{
          title: "Acil Durum Eylem Planı",
          headerShown: false,
          headerBackTitle: "Geri",
        }}
      />
    </Stack>
  );
}
