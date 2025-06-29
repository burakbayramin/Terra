import { colors } from "@/constants/colors";
import { useAuth } from "@/providers/AuthProvider";
import { Stack, Redirect } from "expo-router";

export default function AuthLayout() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Redirect href="/(protected)" />;
  }

  return (
    <Stack>
      <Stack.Screen
        name="sign-in"
        options={{ headerShown: false, title: "Sign In" }}
      />
      <Stack.Screen
        name="sign-up"
        options={{
          headerTitleAlign: "center",
          headerShown: false,
          headerTitleStyle: {
            fontFamily: "NotoSans-Bold",
            color: colors.light.textPrimary,
            fontSize: 20,
          },
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="sign-in-email"
        options={{
          headerTitleAlign: "center",
          headerShown: false,
          headerTitleStyle: {
            fontFamily: "NotoSans-Bold",
            color: colors.light.textPrimary,
            fontSize: 20,
          },
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{
          headerTitleAlign: "center",
          headerShown: false,
          headerTitleStyle: {
            fontFamily: "NotoSans-Bold",
            color: colors.light.textPrimary,
            fontSize: 20,
          },
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="privacy-policy"
        options={{
          headerTitleAlign: "center",
          headerShown: false,
          headerTitleStyle: {
            fontFamily: "NotoSans-Bold",
            color: colors.light.textPrimary,
            fontSize: 20,
          },
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
    </Stack>
  );
}
