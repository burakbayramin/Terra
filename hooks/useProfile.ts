import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Profile } from "@/types/types";

export const useProfile = (userId: string) => {
  return useQuery({
    queryKey: ["profile", userId],
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        throw new Error("Profil bilgileri alınamadı.");
      }

      return data;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 dakika
    gcTime: 1000 * 60 * 10, // 10 dakika
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      profileData,
    }: {
      userId: string;
      profileData: Partial<Profile>;
    }): Promise<Profile> => {
      const { data, error } = await supabase
        .from("profiles")
        .update({
          ...profileData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single();

      if (error) {
        throw new Error("Profil güncellenemedi.");
      }

      return data;
    },
    onSuccess: (data, variables) => {
      // Cache'i güncelle
      queryClient.setQueryData(["profile", variables.userId], data);

      // İlgili query'leri invalidate et
      queryClient.invalidateQueries({
        queryKey: ["profile", variables.userId],
      });
    },
    onError: (error) => {
      console.error("Profile update error:", error);
    },
  });
};

export const useSafetyScore = (userId: string) => {
  return useQuery({
    queryKey: ["safetyScore", userId],
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("safety_score")
        .eq("id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        throw new Error("Güvenlik skoru alınamadı.");
      }

      return data?.safety_score || 0;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 dakika
    gcTime: 1000 * 60 * 5, // 5 dakika
  });
};
