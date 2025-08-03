import { useState, useEffect } from "react";
import * as Location from "expo-location";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";

interface LocationData {
  latitude: number;
  longitude: number;
}

interface LocationState {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  hasPermission: boolean;
}

interface LocationInfo {
  latitude: number;
  longitude: number;
  city?: string;
  district?: string;
  address?: string;
}

export const useLocation = () => {
  const { user, loading: authLoading } = useAuth();
  const [locationState, setLocationState] = useState<LocationState>({
    location: null,
    loading: false,
    error: null,
    hasPermission: false,
  });

  // Konum izni isteme
  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const hasPermission = status === "granted";

      setLocationState((prev) => ({
        ...prev,
        hasPermission,
        error: hasPermission ? null : "Konum izni reddedildi",
      }));

      return hasPermission;
    } catch (error) {
      setLocationState((prev) => ({
        ...prev,
        error: "Konum izni alınırken hata oluştu",
        hasPermission: false,
      }));
      return false;
    }
  };

  // Mevcut konumu alma
  const getCurrentLocation = async (): Promise<LocationData | null> => {
    if (!locationState.hasPermission) {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) return null;
    }

    setLocationState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000,
        distanceInterval: 1,
      });

      const { latitude, longitude } = location.coords;

      const locationData: LocationData = {
        latitude,
        longitude,
      };

      setLocationState((prev) => ({
        ...prev,
        location: locationData,
        loading: false,
      }));

      return locationData;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Konum alınırken hata oluştu";
      setLocationState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return null;
    }
  };

  // Reverse geocoding ile adres bilgisi alma
  const getAddressFromCoordinates = async (
    latitude: number,
    longitude: number
  ): Promise<{ city?: string; district?: string; address?: string }> => {
    try {
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (reverseGeocode.length > 0) {
        const location = reverseGeocode[0];
        return {
          city: location.city || location.subregion,
          district: location.district || location.subLocality,
          address: [
            location.street,
            location.streetNumber,
            location.subLocality,
            location.locality,
            location.region,
          ]
            .filter(Boolean)
            .join(", "),
        };
      }
      return {};
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      return {};
    }
  };

  // Kullanıcının konumunu Supabase'e kaydetme
  const saveLocationToSupabase = async (
    locationData: LocationData
  ): Promise<boolean> => {
    // Auth loading durumunu kontrol et
    if (authLoading) {
      console.log("Authentication still loading...");
      return false;
    }

    if (!user?.id) {
      console.error("User not authenticated");
      return false;
    }

    try {
      // Önce mevcut profil var mı kontrol et
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      const profileData = {
        id: user.id,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        updated_at: new Date().toISOString(),
      };

      let result;
      if (existingProfile) {
        // Mevcut profili güncelle
        result = await supabase
          .from("profiles")
          .update(profileData)
          .eq("id", user.id);
      } else {
        // Yeni profil oluştur
        result = await supabase.from("profiles").insert({
          ...profileData,
          created_at: new Date().toISOString(),
        });
      }

      if (result.error) {
        console.error("Location save error:", result.error);
        return false;
      }

      console.log("Location saved successfully");
      return true;
    } catch (error) {
      console.error("Location save error:", error);
      return false;
    }
  };

  // Konum al ve kaydet
  const getAndSaveLocation = async (): Promise<boolean> => {
    const locationData = await getCurrentLocation();

    if (locationData) {
      return await saveLocationToSupabase(locationData);
    }

    return false;
  };

  // Konum al ve adres bilgisi ile birlikte döndür
  const getLocationWithAddress = async (): Promise<LocationInfo | null> => {
    const locationData = await getCurrentLocation();
    
    if (locationData) {
      const addressInfo = await getAddressFromCoordinates(
        locationData.latitude,
        locationData.longitude
      );
      
      return {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        ...addressInfo,
      };
    }
    
    return null;
  };

  // Component mount olduğunda izni kontrol et
  useEffect(() => {
    const checkPermission = async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      setLocationState((prev) => ({
        ...prev,
        hasPermission: status === "granted",
      }));
    };

    checkPermission();
  }, []);

  return {
    ...locationState,
    authLoading,
    requestLocationPermission,
    getCurrentLocation,
    saveLocationToSupabase,
    getAndSaveLocation,
    getLocationWithAddress,
    getAddressFromCoordinates,
  };
};
