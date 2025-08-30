import { useAuth } from "@/providers/AuthProvider";
import { Redirect, Stack } from "expo-router";

export default function AppLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="whistle" options={{ headerShown: false }} />
      <Stack.Screen name="first-aid" options={{ headerShown: false }} />
      <Stack.Screen
        name="profile"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="risk-form"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="earthquake-risk-analyzer"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="developer-support"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="premium-packages"
        options={{
          headerShown: false,
        }}
      />
      {/* <Stack.Screen
        name="notification-settings"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="create-notification-wizard"
        options={{
          headerShown: false,
        }}
      /> */}
    </Stack>
  );
}
