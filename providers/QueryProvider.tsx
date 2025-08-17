import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// QueryClient'ı export ediyoruz - prefetch için gerekli
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time - verinin ne kadar süre fresh kabul edileceği
      staleTime: 1000 * 60 * 30, // 30 dakika - mevcut ayarınız iyi

      // Cache time - verinin cache'de ne kadar kalacağı
      gcTime: 1000 * 60 * 60, // 60 dakika - mevcut ayarınız iyi

      // Retry konfigürasyonu - mevcut mantığınız korundu
      retry: (failureCount, error) => {
        // Network hatalarında 3 kez deneme yap
        if (error instanceof Error && error.message.includes("network")) {
          return failureCount < 3;
        }
        // Profile hatalarında 2 kez deneme yap
        if (error instanceof Error && error.message.includes("Profil")) {
          return failureCount < 2;
        }
        return false;
      },

      // Prefetch stratejisi için önemli ayarlar
      refetchOnWindowFocus: false, // Mevcut ayarınız
      refetchOnReconnect: true,    // Mevcut ayarınız
      refetchOnMount: true,         // true bırakabilirsiniz ama stale kontrolü yapılır
      
      // Network modu - offline desteği için
      networkMode: 'offlineFirst', // Cache'i önceliklendirir
    },
    mutations: {
      retry: 1,
      // Mutation'lar için network modu
      networkMode: 'offlineFirst',
    },
  },
});

interface QueryProviderProps {
  children: React.ReactNode;
}

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};