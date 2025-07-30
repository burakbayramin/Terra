import { Stack } from "expo-router";
import { colors } from "@/constants/colors";

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
        name="support"
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
        name="community-rules"
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
        name="terms-of-service"
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
        name="profile-settings"
        options={{
          headerTitleAlign: "center",
          headerShown: false,
          headerTitleStyle: {
            fontFamily: "NotoSans-Bold",
            color: colors.light.textPrimary,
            fontSize: 20,
          },
          // presentation: "modal",
          // animation: "slide_from_bottom",
        }}
      />
    </Stack>
  );
}
