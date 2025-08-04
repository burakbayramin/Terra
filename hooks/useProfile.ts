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
      console.log("Updating profile with data:", { userId, profileData });
      
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
        console.error("Supabase error details:", error);
        throw new Error(`Profil güncellenemedi: ${error.message}`);
      }

      console.log("Profile updated successfully:", data);
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

      if (error) {
        if (error.code === "PGRST116") {
          // Profil bulunamadı, skor 0 demektir
          return 0;
        }
        throw new Error("Güvenlik skoru alınamadı.");
      }

      return data?.safety_score || 0;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 dakika
    gcTime: 1000 * 60 * 5, // 5 dakika
  });
};

export const useSafetyFormCompletion = (userId: string) => {
  return useQuery({
    queryKey: ["safetyFormCompletion", userId],
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("has_completed_safety_form")
        .eq("id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // Profil bulunamadı, form tamamlanmamış demektir
          return false;
        }
        throw new Error("Güvenlik formu durumu alınamadı.");
      }

      return data?.has_completed_safety_form || false;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 dakika
    gcTime: 1000 * 60 * 5, // 5 dakika
  });
};

export const useEmergencyContacts = (userId: string) => {
  return useQuery({
    queryKey: ["emergencyContacts", userId],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("emergency_contacts")
        .eq("id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return [];
        }
        throw new Error("Acil durum kontakları alınamadı.");
      }

      return data?.emergency_contacts || [];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 dakika
    gcTime: 1000 * 60 * 5, // 5 dakika
  });
};

export const useProfileCompletion = (userId: string) => {
  return useQuery({
    queryKey: ["profileCompletion", userId],
    queryFn: async (): Promise<{ percentage: number; completedFields: number; totalFields: number }> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("name, surname, city, district, address, emergency_contacts")
        .eq("id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return { percentage: 0, completedFields: 0, totalFields: 6 };
        }
        throw new Error("Profil tamamlanma durumu alınamadı.");
      }

      // Kişisel bilgiler alanlarını kontrol et
      const fields = [
        { value: data?.name, name: 'name' },
        { value: data?.surname, name: 'surname' },
        { value: data?.city, name: 'city' },
        { value: data?.district, name: 'district' },
        { value: data?.address, name: 'address' },
        { value: data?.emergency_contacts && data.emergency_contacts.length > 0, name: 'emergency_contacts' }
      ];

      const completedFields = fields.filter(field => {
        if (field.name === 'emergency_contacts') {
          return field.value === true; // Boolean değer
        }
        return field.value && field.value.toString().trim().length > 0;
      }).length;

      const totalFields = fields.length;
      const percentage = Math.round((completedFields / totalFields) * 100);

      return { percentage, completedFields, totalFields };
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 dakika
    gcTime: 1000 * 60 * 5, // 5 dakika
  });
};
