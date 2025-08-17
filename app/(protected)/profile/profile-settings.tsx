import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/colors";
import { Divider } from "react-native-paper";
import { useProfile, useUpdateProfile } from "@/hooks/useProfiles";
import { useQueryClient } from "@tanstack/react-query";
import { City, District } from "@/types/types";
import CityDistrictSelector from "@/components/CityDistrictSelector";
import * as Location from "expo-location";
import { useRouter } from "expo-router";

interface FormData {
  name: string;
  surname: string;
  username: string;
  city: string;
  district: string;
  address: string;
  emergency_phone: string;
  latitude?: number | null;
  longitude?: number | null;
}

const ProfileSettingsPage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Profile verisini cache'den al (prefetch edilmiş)
  const { data: profile, isLoading, error, refetch } = useProfile();
  const updateProfileMutation = useUpdateProfile();

  // Form state - profile verisiyle başlat
  const [formData, setFormData] = useState<FormData>({
    name: "",
    surname: "",
    username: "",
    city: "",
    district: "",
    address: "",
    emergency_phone: "",
    latitude: null,
    longitude: null,
  });

  // City/District selection states
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(
    null
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Profile yüklendiğinde form'u doldur
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        surname: profile.surname || "",
        username: profile.username || "",
        city: profile.city || "",
        district: profile.district || "",
        address: profile.address || "",
        emergency_phone: profile.emergency_phone || "",
        latitude: profile.latitude,
        longitude: profile.longitude,
      });

      // City ve District'i de set et
      if (profile.city) {
        // Use a placeholder numeric id; actual id is resolved when user selects from the modal
        setSelectedCity({ id: 0, name: profile.city });
      }
      if (profile.district) {
        setSelectedDistrict({ id: 0, name: profile.district });
      }
    }
  }, [profile]);

  // Form güncelleme fonksiyonu
  const updateFormData = useCallback(
    (field: keyof FormData, value: string | number | null) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // Konum seçim handler
  const handleLocationSelect = useCallback((city: City, district: District) => {
    setSelectedCity(city);
    setSelectedDistrict(district);
    setFormData((prev) => ({
      ...prev,
      city: city.name,
      district: district.name,
    }));
  }, []);

  // GPS konum alma
  const handleGetGPSLocation = async () => {
    try {
      setIsGettingLocation(true);

      // İzin kontrolü
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Uyarı",
          "Konum izni verilmedi. Ayarlardan konum iznini açabilirsiniz."
        );
        return;
      }

      // Konumu al
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Koordinatları güncelle
      updateFormData("latitude", location.coords.latitude);
      updateFormData("longitude", location.coords.longitude);

      // Reverse geocoding ile adres bilgisini al
      try {
        const [address] = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (address) {
          // İl ve ilçe bilgilerini güncelle
          if (address.city) {
            updateFormData("city", address.city);
            setSelectedCity({ id: 0, name: address.city });
          }
          if (address.district || address.subregion) {
            const districtName = address.district || address.subregion || "";
            updateFormData("district", districtName);
            setSelectedDistrict({ id: 0, name: districtName });
          }

          // Açık adresi oluştur
          const fullAddress = [
            address.street,
            address.streetNumber,
            address.district,
            address.city,
            address.region,
            address.postalCode,
          ]
            .filter(Boolean)
            .join(", ");

          if (fullAddress) {
            updateFormData("address", fullAddress);
          }
        }
      } catch (geocodeError) {
        console.error("Reverse geocoding error:", geocodeError);
      }

      Alert.alert(
        "Başarılı",
        "Konumunuz alındı ve adres bilgileriniz güncellendi."
      );
    } catch (error) {
      console.error("Location error:", error);
      Alert.alert("Hata", "Konum alınırken bir hata oluştu.");
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Profili kaydet
  const handleSaveProfile = async () => {

    // Validasyon
    if (!formData.name || !formData.surname) {
      Alert.alert("Uyarı", "Lütfen isim ve soyisim alanlarını doldurun.");
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        profileData: {
          name: formData.name.trim(),
          surname: formData.surname.trim(),
          username: formData.username.trim() || null,
          city: formData.city || null,
          district: formData.district || null,
          address: formData.address.trim() || null,
          emergency_phone: formData.emergency_phone.trim() || null,
          latitude: formData.latitude,
          longitude: formData.longitude,
        },
      });

      // Başarılı güncelleme
      Alert.alert("Başarılı", "Profil bilgileriniz güncellendi.", [
        {
          text: "Tamam",
          onPress: () => {
            // Profile sayfasına geri dön
            router.back();
          },
        },
      ]);

      // Cache'i güncelle
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({
        queryKey: ["profileNullFieldsCount"],
      });
    } catch (error) {
      console.error("Profile update error:", error);
      Alert.alert(
        "Hata",
        error instanceof Error
          ? error.message
          : "Profil güncellenirken bir hata oluştu."
      );
    }
  };

  const locationText = useMemo(() => {
    if (formData.city && formData.district) {
      return `${formData.city}, ${formData.district}`;
    }
    return "İl ve İlçe Seçin";
  }, [formData.city, formData.district]);

  const isSaving = updateProfileMutation.isPending;

  // Loading state - sadece ilk yüklemede ve cache'de veri yoksa göster
  if (isLoading && !profile) {
    return (
      <SafeAreaView
        style={[styles.container, styles.loadingContainer]}
        edges={["top"]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Profil bilgileri yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  // Error state
  if (error && !profile) {
    return (
      <SafeAreaView
        style={[styles.container, styles.errorContainer]}
        edges={["top"]}
      >
        <Text style={styles.errorText}>
          {error instanceof Error ? error.message : "Bir hata oluştu"}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Tekrar Dene</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kişisel Bilgiler</Text>

            {/* İsim */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>İsim</Text>
              <TextInput
                style={styles.input}
                placeholder="İsminiz"
                value={formData.name}
                onChangeText={(text) => updateFormData("name", text)}
                placeholderTextColor={colors.light.textSecondary}
                editable={!isSaving}
              />
            </View>

            {/* Soyisim */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Soyisim</Text>
              <TextInput
                style={styles.input}
                placeholder="Soyisminiz"
                value={formData.surname}
                onChangeText={(text) => updateFormData("surname", text)}
                placeholderTextColor={colors.light.textSecondary}
                editable={!isSaving}
              />
            </View>

            {/* Kullanıcı Adı */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Kullanıcı Adı</Text>
              <TextInput
                style={styles.input}
                placeholder="Kullanıcı adınızı girin"
                value={formData.username}
                onChangeText={(text) => updateFormData("username", text)}
                placeholderTextColor={colors.light.textSecondary}
                editable={!isSaving}
              />
              <Text style={styles.helperText}>
                Yorumlarda ve ağlarda kullanıcı adınız gözükür
              </Text>
            </View>

            <Divider style={styles.divider} />

            {/* Konum */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Konum</Text>
              <TouchableOpacity
                style={[
                  styles.locationButton,
                  isSaving && styles.disabledButton,
                ]}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.7}
                disabled={isSaving}
              >
                <Text
                  style={[
                    styles.locationButtonText,
                    (!formData.city || !formData.district) &&
                      styles.placeholderText,
                  ]}
                >
                  {locationText}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={colors.light.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Adres */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Adres</Text>
              <TextInput
                style={[styles.input, styles.addressInput]}
                placeholder="Açık adresinizi girin"
                value={formData.address}
                onChangeText={(text) => updateFormData("address", text)}
                placeholderTextColor={colors.light.textSecondary}
                editable={!isSaving}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <TouchableOpacity
                style={[
                  styles.gpsButton,
                  (isSaving || isGettingLocation) && styles.disabledButton,
                ]}
                onPress={handleGetGPSLocation}
                disabled={isSaving || isGettingLocation}
                activeOpacity={0.7}
              >
                {isGettingLocation ? (
                  <ActivityIndicator
                    size="small"
                    color={colors.gradientTwo}
                    style={{ marginRight: 8 }}
                  />
                ) : (
                  <Ionicons
                    name="location"
                    size={16}
                    color={colors.gradientTwo}
                    style={{ marginRight: 8 }}
                  />
                )}
                <Text style={styles.gpsButtonText}>
                  {isGettingLocation
                    ? "Konum alınıyor..."
                    : "Otomatik Konumu Doldur"}
                </Text>
              </TouchableOpacity>
              {/* {formData.latitude && formData.longitude && (
                <Text style={styles.helperText}>
                  GPS konumu alındı: {formData.latitude.toFixed(6)},{" "}
                  {formData.longitude.toFixed(6)}
                </Text>
              )} */}
            </View>

            <Divider style={styles.divider} />

            {/* Acil Durum Telefonu */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Acil Durum Telefonu</Text>
              <TextInput
                style={styles.input}
                placeholder="555 444 33 22"
                value={formData.emergency_phone}
                onChangeText={(text) => updateFormData("emergency_phone", text)}
                placeholderTextColor={colors.light.textSecondary}
                editable={!isSaving}
                keyboardType="phone-pad"
                maxLength={10}
              />
              <Text style={styles.helperText}>
                Tehlikedeyim butonuna basıldığında mesaj gönderilecek kişi
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.infoText}>
              Bu bilgiler, Terra AI'nin deprem analizlerini ve topluluk
              önerilerini size daha iyi sunabilmesi için kullanılacaktır.
            </Text>
          </View>

          {/* Kaydet Butonu */}
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            activeOpacity={0.8}
            onPress={handleSaveProfile}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator
                size="small"
                color="#fff"
                style={{ marginRight: 8 }}
              />
            ) : (
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#fff"
                style={{ marginRight: 8 }}
              />
            )}
            <Text style={styles.saveButtonText}>
              {isSaving ? "Kaydediliyor..." : "Kaydet"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>

      {/* City District Selector Modal */}
      <CityDistrictSelector
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelect={handleLocationSelect}
        selectedCity={selectedCity}
        selectedDistrict={selectedDistrict}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.light.textPrimary,
    fontFamily: "NotoSans-Regular",
  },
  errorText: {
    fontSize: 16,
    color: "#ff0000",
    fontFamily: "NotoSans-Regular",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: colors.gradientTwo,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "NotoSans-Bold",
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 28,
    backgroundColor: colors.light.surface,
    borderRadius: 14,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    color: colors.gradientTwo,
    fontFamily: "NotoSans-Bold",
    marginBottom: 10,
  },
  divider: {
    height: 3,
    backgroundColor: "white",
    marginVertical: 10,
    borderRadius: 10,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 15,
    color: colors.light.textPrimary,
    fontFamily: "NotoSans-Bold",
    marginBottom: 4,
  },
  input: {
    backgroundColor: colors.light.background,
    borderWidth: 1,
    borderColor: colors.light.textSecondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    fontSize: 15,
    color: colors.light.textPrimary,
    fontFamily: "NotoSans-Regular",
  },
  addressInput: {
    minHeight: 80,
    paddingTop: 12,
    paddingBottom: 12,
  },
  helperText: {
    fontSize: 12,
    color: colors.light.textSecondary,
    fontFamily: "NotoSans-Regular",
    marginTop: 4,
    marginLeft: 6,
    marginRight: 6,
  },
  locationButton: {
    backgroundColor: colors.light.background,
    borderWidth: 1,
    borderColor: colors.light.textSecondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  locationButtonText: {
    fontSize: 15,
    color: colors.light.textPrimary,
    fontFamily: "NotoSans-Regular",
  },
  placeholderText: {
    color: colors.light.textSecondary,
  },
  gpsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: colors.gradientTwo,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  gpsButtonText: {
    fontSize: 14,
    color: colors.gradientTwo,
    fontFamily: "NotoSans-Bold",
  },
  disabledButton: {
    opacity: 0.6,
  },
  infoText: {
    fontSize: 14,
    color: colors.light.textPrimary,
    fontFamily: "NotoSans-Regular",
    textAlign: "center",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.gradientTwo,
    paddingVertical: 13,
    borderRadius: 10,
    justifyContent: "center",
    marginTop: 8,
    shadowColor: colors.gradientTwo,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 5,
    elevation: 2,
  },
  saveButtonDisabled: {
    backgroundColor: colors.light.textSecondary,
    shadowOpacity: 0.05,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "NotoSans-Bold",
    fontWeight: "700",
  },
});

export default ProfileSettingsPage;
