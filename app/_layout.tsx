import { Slot } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { AuthProvider } from "@/providers/AuthProvider";
import { GestureHandlerRootView } from "react-native-gesture-handler";

//TODO color theme dark-light theme secime eklenecek ThemeProvider
SplashScreen.preventAutoHideAsync();

// SplashScreen.setOptions({
//   duration: 1000,
//   fade: true,
// });

export default function RootLayout() {
  const [loaded] = useFonts({
    "NotoSans-Bold": require("@/assets/fonts/NotoSans-Bold.ttf"),
    "NotoSans-Regular": require("@/assets/fonts/NotoSans-Regular.ttf"),
    "NotoSans-Medium": require("@/assets/fonts/NotoSans-Medium.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  // TODO theme provider eklenebilir
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <Slot />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
