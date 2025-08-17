import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import * as Location from "expo-location";
import { supabase } from "@/lib/supabase";
import { Profile, LocationData } from "@/types/types";

// Location service functions - hook'ların içinde tanımlandı
const requestLocationPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === "granted";
  } catch (error) {
    console.error("Location permission error:", error);
    return false;
  }
};

const checkLocationPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === "granted";
  } catch (error) {
    console.error("Check location permission error:", error);
    return false;
  }
};

const getCurrentLocation = async (): Promise<LocationData | null> => {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error("Get current location error:", error);
    return null;
  }
};

const saveLocationToProfile = async (
  userId: string,
  locationData: LocationData
): Promise<boolean> => {
  try {
    const { error } = await supabase.from("profiles").upsert(
      {
        id: userId,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "id",
      }
    );

    if (error) {
      console.error("Save location to profile error:", error);
      return false;
    }

    console.log("Location saved successfully to profile");
    return true;
  } catch (error) {
    console.error("Save location to profile error:", error);
    return false;
  }
};

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

// Location Setup Hook - Uygulamaya giriş yaparken konum kaydı
export const useLocationSetup = (
  userId: string | null,
  authLoading: boolean
) => {
  return useQuery({
    queryKey: ["location-setup", userId],
    queryFn: async (): Promise<boolean> => {
      if (authLoading || !userId) {
        return false;
      }

      try {
        // Önce konum iznini kontrol et
        const hasPermission = await checkLocationPermission();

        if (!hasPermission) {
          // İzin yoksa kullanıcıdan iste
          return new Promise<boolean>((resolve) => {
            Alert.alert(
              "Konum İzni",
              "Terra uygulaması size yakın depremleri gösterebilmek ve acil durumlarda konumunuzu paylaşabilmek için konum bilginize ihtiyaç duyar.",
              [
                {
                  text: "İptal",
                  style: "cancel",
                  onPress: () => {
                    console.log("Location permission denied by user");
                    resolve(false);
                  },
                },
                {
                  text: "İzin Ver",
                  onPress: async () => {
                    const permissionGranted = await requestLocationPermission();
                    if (permissionGranted) {
                      const locationData = await getCurrentLocation();
                      if (locationData) {
                        const success = await saveLocationToProfile(
                          userId,
                          locationData
                        );
                        console.log(
                          success
                            ? "Location successfully saved to profile"
                            : "Failed to save location to profile"
                        );
                        resolve(success);
                      } else {
                        resolve(false);
                      }
                    } else {
                      console.log("Location permission not granted");
                      resolve(false);
                    }
                  },
                },
              ]
            );
          });
        } else {
          // İzin varsa direkt konumu al ve kaydet
          const locationData = await getCurrentLocation();
          if (locationData) {
            const success = await saveLocationToProfile(userId, locationData);
            console.log(
              success
                ? "Location successfully saved to profile"
                : "Failed to save location to profile"
            );
            return success;
          }
          return false;
        }
      } catch (error) {
        console.error("Location setup error:", error);
        throw error;
      }
    },
    enabled: !authLoading && !!userId, // Auth loading bitince ve user varsa çalış
    retry: 1, // Bir kez daha dene
    retryDelay: 3000, // 3 saniye sonra tekrar dene
    staleTime: 5 * 60 * 1000, // 5 dakika boyunca fresh kabul et
    gcTime: 10 * 60 * 1000, // 10 dakika cache'te tut
  });
};

// Manuel konum güncelleme hook'u (isteğe bağlı)
export const useUpdateLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string): Promise<LocationData | null> => {
      const hasPermission = await checkLocationPermission();

      if (!hasPermission) {
        const permissionGranted = await requestLocationPermission();
        if (!permissionGranted) {
          throw new Error("Konum izni verilmedi");
        }
      }

      const locationData = await getCurrentLocation();
      if (!locationData) {
        throw new Error("Konum bilgisi alınamadı");
      }

      const success = await saveLocationToProfile(userId, locationData);
      if (!success) {
        throw new Error("Konum kaydedilemedi");
      }

      return locationData;
    },
    onSuccess: (data, userId) => {
      // Profile cache'ini invalidate et
      queryClient.invalidateQueries({
        queryKey: ["profile", userId],
      });
      console.log("Location updated successfully:", data);
    },
    onError: (error) => {
      console.error("Location update error:", error);
    },
  });
};

// buna bakilacak
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

// buna bakilacak
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

// buna bakilacak
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

// buna bakilacak
// export const useProfileCompletion = (userId: string) => {
//   return useQuery({
//     queryKey: ["profileCompletion", userId],
//     queryFn: async (): Promise<{
//       percentage: number;
//       completedFields: number;
//       totalFields: number;
//     }> => {
//       const { data, error } = await supabase
//         .from("profiles")
//         .select("name, surname, city, district, address, emergency_contacts")
//         .eq("id", userId)
//         .single();

//       if (error) {
//         if (error.code === "PGRST116") {
//           return { percentage: 0, completedFields: 0, totalFields: 6 };
//         }
//         throw new Error("Profil tamamlanma durumu alınamadı.");
//       }

//       // Kişisel bilgiler alanlarını kontrol et
//       const fields = [
//         { value: data?.name, name: "name" },
//         { value: data?.surname, name: "surname" },
//         { value: data?.city, name: "city" },
//         { value: data?.district, name: "district" },
//         { value: data?.address, name: "address" },
//         {
//           value: data?.emergency_contacts && data.emergency_contacts.length > 0,
//           name: "emergency_contacts",
//         },
//       ];

//       const completedFields = fields.filter((field) => {
//         if (field.name === "emergency_contacts") {
//           return field.value === true; // Boolean değer
//         }
//         return field.value && field.value.toString().trim().length > 0;
//       }).length;

//       const totalFields = fields.length;
//       const percentage = Math.round((completedFields / totalFields) * 100);

//       return { percentage, completedFields, totalFields };
//     },
//     enabled: !!userId,
//     staleTime: 1000 * 60 * 2, // 2 dakika
//     gcTime: 1000 * 60 * 5, // 5 dakika
//   });
// };

// Belirli profil alanlarının kaç tanesinin null olduğunu dönen hook
export const useProfileNullFieldsCount = (userId: string) => {
  return useQuery({
    queryKey: ["profileNullFieldsCount", userId],
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("name, surname, city, district, emergency_phone, username, address")
        .eq("id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // Profil bulunamadı, tüm alanlar null
          return 7;
        }
        throw new Error("Profil alanları kontrol edilemedi.");
      }

      const fields = [
        data?.name,
        data?.surname,
        data?.city,
        data?.district,
        data?.emergency_phone,
        data?.username,
        data?.address,
      ];

      const nullFieldsCount = fields.filter(
        (field) => !field || field.toString().trim().length === 0
      ).length;

      return nullFieldsCount;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 dakika
    gcTime: 1000 * 60 * 5, // 5 dakika
  });
};

// Kullanıcının subscription plan ismini ve bitiş tarihini getiren hook
export const useSubscriptionPlan = (userId: string) => {
  return useQuery({
    queryKey: ["subscriptionPlan", userId],
    queryFn: async (): Promise<{
      planName: string;
      endDate: string | null;
    } | null> => {
      // Kullanıcının subscription_plan_id ve subscription_end_date'ini al
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("subscription_plan_id, subscription_end_date")
        .eq("id", userId)
        .single();

      if (profileError) {
        if (profileError.code === "PGRST116") {
          // Profil bulunamadı
          return null;
        }
        throw new Error("Profil bilgileri alınamadı.");
      }

      // Eğer subscription_plan_id yoksa FREE plan döndür
      if (!profileData?.subscription_plan_id) {
        return {
          planName: "FREE",
          endDate: profileData?.subscription_end_date || null,
        };
      }

      // subscription_plan_id ile plan ismini al
      const { data: planData, error: planError } = await supabase
        .from("subscription_plans")
        .select("name")
        .eq("id", profileData.subscription_plan_id)
        .eq("is_active", true)
        .single();

      if (planError) {
        if (planError.code === "PGRST116") {
          // Plan bulunamadı, FREE döndür
          return {
            planName: "FREE",
            endDate: profileData?.subscription_end_date || null,
          };
        }
        throw new Error("Subscription plan bilgileri alınamadı.");
      }

      return {
        planName: planData.name,
        endDate: profileData?.subscription_end_date || null,
      };
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 dakika
    gcTime: 1000 * 60 * 10, // 10 dakika
  });
};
