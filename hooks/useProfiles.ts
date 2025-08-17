import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Profile } from "@/types/types";
import { useAuth } from "./useAuths";

// Ana profile hook - userId opsiyonel
export const useProfile = (userId?: string) => {
  // userId verilmemişse cache'deki auth user'ı kullan
  const { userId: authUserId } = useAuth();
  const effectiveUserId = userId || authUserId || "";

  return useQuery({
    queryKey: ["profile", effectiveUserId],
    queryFn: async (): Promise<Profile | null> => {
      if (!effectiveUserId) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", effectiveUserId)
        .single();

      if (error && error.code !== "PGRST116") {
        throw new Error("Profil bilgileri alınamadı.");
      }

      return data;
    },
    enabled: !!effectiveUserId,
    staleTime: 1000 * 60 * 30, // 30 dakika
    gcTime: 1000 * 60 * 60, // 60 dakika
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

// Subscription plan name için helper hook
export const useSubscriptionPlanName = (planId?: string | null) => {
  return useQuery({
    queryKey: ['subscription-plan', planId],
    queryFn: async () => {
      if (!planId) return { name: "FREE" };
      
      const { data } = await supabase
        .from("subscription_plans")
        .select("name")
        .eq("id", planId)
        .eq("is_active", true)
        .single();
      
      return data || { name: "FREE" };
    },
    enabled: !!planId,
    staleTime: 1000 * 60 * 60, // 1 saat
    gcTime: 1000 * 60 * 120, // 2 saat
  });
};

// Update profile mutation - userId opsiyonel
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { userId: authUserId } = useAuth();

  return useMutation({
    mutationFn: async ({
      userId,
      profileData,
    }: {
      userId?: string; // Opsiyonel
      profileData: Partial<Profile>;
    }): Promise<Profile> => {
      const effectiveUserId = userId || authUserId;
      
      if (!effectiveUserId) {
        throw new Error("Kullanıcı ID'si bulunamadı");
      }

      const { data, error } = await supabase
        .from("profiles")
        .update({
          ...profileData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", effectiveUserId)
        .select()
        .single();

      if (error) {
        throw new Error(`Profil güncellenemedi: ${error.message}`);
      }

      return data;
    },
    onSuccess: (data, variables) => {
      const effectiveUserId = variables.userId || authUserId;
      if (effectiveUserId) {
        queryClient.setQueryData(["profile", effectiveUserId], data);
        queryClient.invalidateQueries({
          queryKey: ["profile", effectiveUserId],
        });
      }
    },
  });
};