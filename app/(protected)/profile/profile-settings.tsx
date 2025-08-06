import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
  Switch,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/colors";
import cityDistrictData from "@/assets/data/turkey-cities-districts.json";
import { useAuth } from "@/providers/AuthProvider";
import { useProfile, useUpdateProfile, useEmergencyContacts } from "@/hooks/useProfile";
import { useQueryClient } from "@tanstack/react-query";
import { Profile, City, District } from "@/types/types";
import EmergencyContactsManager from "@/components/EmergencyContactsManager";
import LocationConfirmationModal from "@/components/LocationConfirmationModal";

function cleanAndFormatTurkishNumber(input: string): string {
  let number = input.replace(/\D/g, "");
  if (number.startsWith("90")) number = number.slice(2);
  if (number.startsWith("0")) number = number.slice(1);
  number = number.slice(0, 10);
  if (number.length === 10)
    return number.replace(/(\d{3})(\d{3})(\d{2})(\d{2})/, "$1 $2 $3 $4");
  else return number;
}

// Util fonksiyonlar
const findCityByName = (cityName: string): City | null => {
  return cityDistrictData.cities.find((city) => city.name === cityName) || null;
};
const findDistrictByName = (districtName: string): District | null => {
  for (const [cityId, districts] of Object.entries(
    cityDistrictData.districts
  )) {
    const district = districts.find((d) => d.name === districtName);
    if (district) return district;
  }
  return null;
};

const CityDistrictSelector = React.memo(
  ({
    visible,
    onClose,
    onSelect,
    selectedCity,
    selectedDistrict,
  }: {
    visible: boolean;
    onClose: () => void;
    onSelect: (city: City, district: District) => void;
    selectedCity: City | null;
    selectedDistrict: District | null;
  }) => {
    const [step, setStep] = useState<"city" | "district">("city");
    const [tempSelectedCity, setTempSelectedCity] = useState<City | null>(
      selectedCity
    );

    const handleCitySelect = useCallback((city: City) => {
      setTempSelectedCity(city);
      setStep("district");
    }, []);

    const handleDistrictSelect = useCallback(
      (district: District) => {
        if (tempSelectedCity) {
          onSelect(tempSelectedCity, district);
          setStep("city");
          setTempSelectedCity(null);
          onClose();
        }
      },
      [tempSelectedCity, onSelect, onClose]
    );

    const handleBack = useCallback(() => {
      setStep("city");
      setTempSelectedCity(null);
    }, []);

    const handleClose = useCallback(() => {
      setStep("city");
      setTempSelectedCity(null);
      onClose();
    }, [onClose]);

    const districts = useMemo(() => {
      if (!tempSelectedCity) return [];
      const cityId = tempSelectedCity.id.toString();
      return (
        cityDistrictData.districts[
          cityId as keyof typeof cityDistrictData.districts
        ] || []
      );
    }, [tempSelectedCity]);

    const renderCityItem = useCallback(
      ({ item }: { item: City }) => (
        <TouchableOpacity
          style={styles.listItem}
          onPress={() => handleCitySelect(item)}
          activeOpacity={0.7}
        >
          <Text style={styles.listItemText}>{item.name}</Text>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.light.textSecondary}
          />
        </TouchableOpacity>
      ),
      [handleCitySelect]
    );

    const renderDistrictItem = useCallback(
      ({ item }: { item: District }) => (
        <TouchableOpacity
          style={styles.listItem}
          onPress={() => handleDistrictSelect(item)}
          activeOpacity={0.7}
        >
          <Text style={styles.listItemText}>{item.name}</Text>
        </TouchableOpacity>
      ),
      [handleDistrictSelect]
    );

    const keyExtractor = useCallback(
      (item: City | District) => item.id.toString(),
      []
    );

    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={step === "district" ? handleBack : handleClose}
            >
              <Ionicons
                name={step === "district" ? "chevron-back" : "close"}
                size={24}
                color={colors.gradientTwo}
              />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {step === "city"
                ? "İl Seçin"
                : `${tempSelectedCity?.name} - İlçe Seçin`}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <FlatList
            data={step === "city" ? cityDistrictData.cities : districts}
            renderItem={step === "city" ? renderCityItem : renderDistrictItem}
            keyExtractor={keyExtractor}
            style={styles.list}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            maxToRenderPerBatch={20}
            windowSize={10}
            getItemLayout={(data, index) => ({
              length: 56,
              offset: 56 * index,
              index,
            })}
          />
        </View>
      </Modal>
    );
  }
);

// ---------------------- ANA SAYFA
const ProfileSettingsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    address: "",
  });
  const [privacySettings, setPrivacySettings] = useState({
    show_full_name_in_profile: false,
    show_full_name_in_comments: false,
  });
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(
    null
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [emergencyContacts, setEmergencyContacts] = useState<string[]>([]);
  const [locationJustConfirmed, setLocationJustConfirmed] = useState(false);

  // TanStack Query hooks
  const {
    data: profile,
    isLoading,
    error,
    refetch,
  } = useProfile(user?.id || "");

  const { data: savedEmergencyContacts = [] } = useEmergencyContacts(user?.id || "");

  const updateProfileMutation = useUpdateProfile();

  // Profile datayı form state'e yükle
  useEffect(() => {
    if (profile && !locationJustConfirmed) {
      setFormData({
        name: profile.name || "",
        surname: profile.surname || "",
        address: profile.address || "",
      });

      // Privacy ayarlarını yükle
      setPrivacySettings({
        show_full_name_in_profile: profile.show_full_name_in_profile || false,
        show_full_name_in_comments: profile.show_full_name_in_comments || false,
      });

      // Set city and district from backend data
      if (profile.city) {
        const cityData = findCityByName(profile.city);
        if (cityData) setSelectedCity(cityData);
      }

      if (profile.district) {
        const districtData = findDistrictByName(profile.district);
        if (districtData) setSelectedDistrict(districtData);
      }
    }
  }, [profile, locationJustConfirmed]);

  // Emergency contacts'ı yükle
  useEffect(() => {
    if (savedEmergencyContacts.length > 0 && emergencyContacts.length === 0) {
      setEmergencyContacts(savedEmergencyContacts);
    }
  }, [savedEmergencyContacts, emergencyContacts.length]);

  const handleEmergencyContactsChange = useCallback((contacts: string[] | ((prev: string[]) => string[])) => {
    if (typeof contacts === 'function') {
      setEmergencyContacts(contacts);
    } else {
      setEmergencyContacts(contacts);
    }
  }, []);

  const handleLocationSelect = useCallback((city: City, district: District) => {
    setSelectedCity(city);
    setSelectedDistrict(district);
  }, []);

  const locationText = useMemo(() => {
    if (selectedCity && selectedDistrict) {
      return `${selectedCity.name}, ${selectedDistrict.name}`;
    }
    return "İl ve İlçe Seçin";
  }, [selectedCity, selectedDistrict]);

  const showAlert = useCallback((message: string) => {
    Alert.alert("Uyarı", message);
  }, []);

  const updateFormData = useCallback(
    (field: keyof typeof formData, value: string | null) => {
      setFormData((prev) => {
        const newData = { ...prev, [field]: value || "" };
        return newData;
      });
    },
    []
  );

  const handleGetGPSLocation = useCallback(() => {
    setLocationModalVisible(true);
  }, []);

  // Konum onaylandığında çalışacak fonksiyon
  const handleLocationConfirmed = useCallback(async (locationInfo: {
    latitude: number;
    longitude: number;
    city?: string;
    district?: string;
    address?: string;
  }) => {
    // Konum onaylandığını işaretle
    setLocationJustConfirmed(true);
    
    try {
      // Açık adres alanını oluştur
      let fullAddress = "";
      
      // Şehir ve ilçe bilgilerini ekle
      if (locationInfo.city && locationInfo.district) {
        fullAddress += `${locationInfo.city}, ${locationInfo.district}`;
      } else if (locationInfo.city) {
        fullAddress += locationInfo.city;
      } else if (locationInfo.district) {
        fullAddress += locationInfo.district;
      }

      // Detaylı adres bilgisini ekle
      if (locationInfo.address) {
        if (fullAddress) {
          fullAddress += "\n";
        }
        fullAddress += locationInfo.address;
      }

      // Koordinat bilgilerini ekle
      if (fullAddress) {
        fullAddress += "\n";
      }
      fullAddress += `Koordinatlar: ${locationInfo.latitude.toFixed(6)}, ${locationInfo.longitude.toFixed(6)}`;

      // Tüm profile verilerini backend'e kaydet
      const profileData = {
        latitude: locationInfo.latitude,
        longitude: locationInfo.longitude,
        city: locationInfo.city || null,
        district: locationInfo.district || null,
        address: fullAddress,
      };

      if (user?.id) {
        await updateProfileMutation.mutateAsync({
          userId: user.id,
          profileData,
        });
      }

      // UI'da şehir ve ilçe bilgilerini güncelle
      if (locationInfo.city) {
        const cityData = findCityByName(locationInfo.city);
        if (cityData) {
          setSelectedCity(cityData);
        }
      }

      if (locationInfo.district) {
        const districtData = findDistrictByName(locationInfo.district);
        if (districtData) {
          setSelectedDistrict(districtData);
        }
      }

      // Form data'yı güncelle
      updateFormData("address", fullAddress);
      
      Alert.alert("Başarılı", "Konumunuz başarıyla alındı ve kaydedildi");
      
      // Profile verilerini yeniden yükle (backend'den güncel verileri almak için)
      refetch();
      
      // Invalidate profile completion cache
      queryClient.invalidateQueries({
        queryKey: ["profileCompletion", user?.id],
      });
      
      // 1 saniye sonra flag'i sıfırla
      setTimeout(() => {
        setLocationJustConfirmed(false);
      }, 1000);
      
    } catch (error) {
      console.error("Error in handleLocationConfirmed:", error);
      Alert.alert("Hata", "Konum kaydedilirken bir hata oluştu");
      setLocationJustConfirmed(false);
    }
  }, [updateProfileMutation, user?.id, updateFormData, refetch]);

  const handleSaveProfile = useCallback(async () => {
    if (!user) return;

    if (!formData.name.trim()) {
      showAlert("Lütfen isminizi girin");
      return;
    }
    if (!formData.surname.trim()) {
      showAlert("Lütfen soyisminizi girin");
      return;
    }

    const profileData = {
      name: formData.name.trim(),
      surname: formData.surname.trim(),
      address: formData.address.trim() || null,
      city: selectedCity ? selectedCity.name : null,
      district: selectedDistrict ? selectedDistrict.name : null,
      emergency_contacts: emergencyContacts.length > 0 ? emergencyContacts : null,
      show_full_name_in_profile: privacySettings.show_full_name_in_profile,
      show_full_name_in_comments: privacySettings.show_full_name_in_comments,
    };

    updateProfileMutation.mutate(
      { userId: user.id, profileData },
      {
        onSuccess: () => {
          // Invalidate profile completion cache
          queryClient.invalidateQueries({
            queryKey: ["profileCompletion", user.id],
          });
          Alert.alert("Başarılı", "Profil bilgileriniz kaydedildi");
        },
        onError: (error) => {
          Alert.alert("Hata", "Profil kaydedilirken bir hata oluştu");
        },
      }
    );
  }, [
    user,
    formData,
    selectedCity,
    selectedDistrict,
    emergencyContacts,
    updateProfileMutation,
    showAlert,
  ]);

  // ---------- LOADING ----------
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.gradientTwo} />
        <Text style={styles.loadingText}>Bilgileriniz yükleniyor...</Text>
      </View>
    );
  }

  // ---------- ERROR ----------
  if (error) {
    return (
      <View style={[styles.container, styles.loadingContainer, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>
          {error instanceof Error ? error.message : "Bir hata oluştu"}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Tekrar Dene</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isSaving = updateProfileMutation.isPending;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kişisel Bilgiler</Text>
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

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Konum</Text>
            <TouchableOpacity
              style={[styles.locationButton, isSaving && styles.disabledButton]}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.7}
              disabled={isSaving}
            >
              <Text
                style={[
                  styles.locationButtonText,
                  (!selectedCity || !selectedDistrict) &&
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
            
            {/* GPS Konum Butonu */}
            <TouchableOpacity
              style={[styles.gpsButton, isSaving && styles.disabledButton]}
              onPress={handleGetGPSLocation}
              disabled={isSaving}
              activeOpacity={0.7}
            >
              <Ionicons
                name="location"
                size={16}
                color={colors.gradientTwo}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.gpsButtonText}>
                Konumumu Seç
              </Text>
            </TouchableOpacity>
          </View>

          {/* Adres Alanı */}
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
            <Text style={styles.helperText}>
              GPS konumunuz alındığında otomatik olarak doldurulacaktır
            </Text>
          </View>

          {/* Acil Durum Telefonları */}
          <EmergencyContactsManager
            contacts={emergencyContacts}
            onContactsChange={handleEmergencyContactsChange}
            disabled={isSaving}
          />
        </View>

        {/* Gizlilik Ayarları */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gizlilik Ayarları</Text>
          
          <View style={styles.privacyOption}>
            <View style={styles.privacyOptionContent}>
              <View style={styles.privacyOptionText}>
                <Text style={styles.privacyOptionTitle}>Profilimde Ad Soyadımı Göster</Text>
                <Text style={styles.privacyOptionDescription}>
                  {privacySettings.show_full_name_in_profile 
                    ? "Profil sayfanızda adınız ve soyadınız görünecek"
                    : "Profil sayfanızda kullanıcı ID'niz (@kullaniciadi) görünecek"
                  }
                </Text>
              </View>
              <Switch
                value={privacySettings.show_full_name_in_profile}
                onValueChange={(value) => 
                  setPrivacySettings(prev => ({ ...prev, show_full_name_in_profile: value }))
                }
                trackColor={{ false: "#e2e8f0", true: colors.primary }}
                thumbColor={privacySettings.show_full_name_in_profile ? "#fff" : "#f4f3f4"}
                disabled={isSaving}
              />
            </View>
          </View>

          <View style={styles.privacyOption}>
            <View style={styles.privacyOptionContent}>
              <View style={styles.privacyOptionText}>
                <Text style={styles.privacyOptionTitle}>Yorumlarda Tam Adımı Göster</Text>
                <Text style={styles.privacyOptionDescription}>
                  {privacySettings.show_full_name_in_comments 
                    ? "Yorumlarınızda adınız ve soyadınız görünecek"
                    : "Yorumlarınızda kullanıcı ID'niz (@kullaniciadi) görünecek"
                  }
                </Text>
              </View>
              <Switch
                value={privacySettings.show_full_name_in_comments}
                onValueChange={(value) => 
                  setPrivacySettings(prev => ({ ...prev, show_full_name_in_comments: value }))
                }
                trackColor={{ false: "#e2e8f0", true: colors.primary }}
                thumbColor={privacySettings.show_full_name_in_comments ? "#fff" : "#f4f3f4"}
                disabled={isSaving}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.infoText}>
            Bu bilgiler, Terra AI'nin deprem analizlerini ve topluluk
            önerilerini size daha iyi sunabilmesi için kullanılacaktır.
          </Text>
        </View>

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

      <CityDistrictSelector
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelect={handleLocationSelect}
        selectedCity={selectedCity}
        selectedDistrict={selectedDistrict}
      />

      <LocationConfirmationModal
        visible={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
        onConfirm={handleLocationConfirmed}
      />
    </View>
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
  },
  privacyOption: {
    marginBottom: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  privacyOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  privacyOptionText: {
    flex: 1,
    marginRight: 16,
  },
  privacyOptionTitle: {
    fontSize: 16,
    color: colors.light.textPrimary,
    fontFamily: "NotoSans-Bold",
    marginBottom: 4,
  },
  privacyOptionDescription: {
    fontSize: 14,
    color: colors.light.textSecondary,
    fontFamily: "NotoSans-Regular",
    lineHeight: 20,
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
    marginBottom: 8,
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
    backgroundColor: colors.light.surface,
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
    color: colors.light.textSecondary,
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
  modalContainer: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.textSecondary + "20",
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "NotoSans-Bold",
    color: colors.gradientTwo,
  },
  list: {
    flex: 1,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.textSecondary + "10",
    height: 56,
  },
  listItemText: {
    fontSize: 16,
    color: colors.light.textPrimary,
    fontFamily: "NotoSans-Regular",
  },
});

export default ProfileSettingsPage;
