import { Slot } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { AuthProvider } from "@/providers/AuthProvider";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryProvider } from "@/providers/QueryProvider";
import { prefetchCriticalData, setupBackgroundRefresh } from "@/utils/prefetchData";
import NetInfo from '@react-native-community/netinfo';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isAppReady, setIsAppReady] = useState(false);
  const [loaded] = useFonts({
    "NotoSans-Bold": require("@/assets/fonts/NotoSans-Bold.ttf"),
    "NotoSans-Regular": require("@/assets/fonts/NotoSans-Regular.ttf"),
    "NotoSans-Medium": require("@/assets/fonts/NotoSans-Medium.ttf"),
    "tt-fors-trial.demibold.ttf": require("@/assets/fonts/tt-fors-trial.demibold.ttf"),
  });

  useEffect(() => {
    const prepareApp = async () => {
      try {
        // Network durumunu kontrol et
        const netInfo = await NetInfo.fetch();
        
        if (netInfo.isConnected) {
          // Online ise verileri prefetch et
          await prefetchCriticalData();
        }
        // Offline olsa bile cache'deki verilerle devam et
        
      } catch (error) {
        console.error('App hazırlama hatası:', error);
        // Hata olsa bile uygulamayı aç
      } finally {
        setIsAppReady(true);
      }
    };

    if (loaded) {
      prepareApp();
    }
  }, [loaded]);

  useEffect(() => {
    if (loaded && isAppReady) {
      SplashScreen.hideAsync();
    }
  }, [loaded, isAppReady]);

  // Background refresh'i başlat
  useEffect(() => {
    if (isAppReady) {
      const cleanup = setupBackgroundRefresh();
      return cleanup;
    }
  }, [isAppReady]);

  if (!loaded || !isAppReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryProvider>
        <AuthProvider>
          <Slot />
        </AuthProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}