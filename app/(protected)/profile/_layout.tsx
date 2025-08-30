import { Stack } from "expo-router";

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="profile-settings"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="terms-of-service"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="community-rules"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="support"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="risk-assessment"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}

//TODO risk assessment screen yerine risk form kullanılacak
