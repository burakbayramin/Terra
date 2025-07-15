import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time - verinin ne kadar süre fresh kabul edileceği
      staleTime: 1000 * 60 * 30, // 30 dakika

      // Cache time - verinin cache'de ne kadar kalacağı
      gcTime: 1000 * 60 * 60, // 60 dakika (eski cacheTime)

      // Retry konfigürasyonu
      retry: (failureCount, error) => {
        // Network hatalarında 3 kez deneme yap
        if (error instanceof Error && error.message.includes("network")) {
          return failureCount < 3;
        }
        return false;
      },

      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
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

export { queryClient };
