import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  SafeAreaView,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/colors";
import cityDistrictData from "@/assets/data/turkey-cities-districts.json";
import { useAuth } from "@/providers/AuthProvider";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { Profile, City, District } from "@/types/types";

interface CityDistrictSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (city: City, district: District) => void;
  selectedCity: City | null;
  selectedDistrict: District | null;
}

// Constants - moved to top for better organization
const buildingAges = [
  { label: "0-5 yıl", value: 1 },
  { label: "6-10 yıl", value: 2 },
  { label: "11-20 yıl", value: 3 },
  { label: "21-30 yıl", value: 4 },
  { label: "31+ yıl", value: 5 }
];

const buildingTypes = [
  { label: "Müstakil Ev", value: 1 },
  { label: "Apartman", value: 2 },
  { label: "Rezidans", value: 3 },
  { label: "Villa", value: 4 },
  { label: "Diğer", value: 5 }
];

// Utility functions
const findCityByName = (cityName: string): City | null => {
  return cityDistrictData.cities.find(city => city.name === cityName) || null;
};

const findDistrictByName = (districtName: string): District | null => {
  for (const [cityId, districts] of Object.entries(cityDistrictData.districts)) {
    const district = districts.find(d => d.name === districtName);
    if (district) return district;
  }
  return null;
};

const CityDistrictSelector = React.memo(({
  visible,
  onClose,
  onSelect,
  selectedCity,
  selectedDistrict,
}: CityDistrictSelectorProps) => {
  const [step, setStep] = useState<"city" | "district">("city");
  const [tempSelectedCity, setTempSelectedCity] = useState<City | null>(selectedCity);

  const handleCitySelect = useCallback((city: City) => {
    setTempSelectedCity(city);
    setStep("district");
  }, []);

  const handleDistrictSelect = useCallback((district: District) => {
    if (tempSelectedCity) {
      onSelect(tempSelectedCity, district);
      setStep("city");
      setTempSelectedCity(null);
      onClose();
    }
  }, [tempSelectedCity, onSelect, onClose]);

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
    return cityDistrictData.districts[cityId as keyof typeof cityDistrictData.districts] || [];
  }, [tempSelectedCity]);

  const renderCityItem = useCallback(({ item }: { item: City }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => handleCitySelect(item)}
      activeOpacity={0.7}
    >
      <Text style={styles.listItemText}>{item.name}</Text>
      <Ionicons name="chevron-forward" size={20} color={colors.light.textSecondary} />
    </TouchableOpacity>
  ), [handleCitySelect]);

  const renderDistrictItem = useCallback(({ item }: { item: District }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => handleDistrictSelect(item)}
      activeOpacity={0.7}
    >
      <Text style={styles.listItemText}>{item.name}</Text>
    </TouchableOpacity>
  ), [handleDistrictSelect]);

  const keyExtractor = useCallback((item: City | District) => item.id.toString(), []);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={step === "district" ? handleBack : handleClose}>
            <Ionicons
              name={step === "district" ? "chevron-back" : "close"}
              size={24}
              color={colors.gradientTwo}
            />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {step === "city" ? "İl Seçin" : `${tempSelectedCity?.name} - İlçe Seçin`}
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
      </SafeAreaView>
    </Modal>
  );
});

const ProfileSettingsPage = () => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    buildingAge: null as number | null,
    buildingType: null as number | null,
  });
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // TanStack Query hooks
  const { 
    data: profile, 
    isLoading, 
    error, 
    refetch 
  } = useProfile(user?.id || '');
  
  const updateProfileMutation = useUpdateProfile();

  // Profile data'yı form state'e yükle
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        surname: profile.surname || "",
        buildingAge: profile.building_age || null,
        buildingType: profile.building_type || null,
      });

      // Set city and district
      if (profile.city) {
        const cityData = findCityByName(profile.city);
        if (cityData) setSelectedCity(cityData);
      }

      if (profile.district) {
        const districtData = findDistrictByName(profile.district);
        if (districtData) setSelectedDistrict(districtData);
      }
    }
  }, [profile]);

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
      building_age: formData.buildingAge,
      building_type: formData.buildingType,
      city: selectedCity ? selectedCity.name : null,
      district: selectedDistrict ? selectedDistrict.name : null,
    };

    updateProfileMutation.mutate(
      { userId: user.id, profileData },
      {
        onSuccess: () => {
          Alert.alert("Başarılı", "Profil bilgileriniz kaydedildi");
        },
        onError: (error) => {
          Alert.alert("Hata", "Profil kaydedilirken bir hata oluştu");
        }
      }
    );
  }, [user, formData, selectedCity, selectedDistrict, updateProfileMutation, showAlert]);

  const updateFormData = useCallback((field: keyof typeof formData, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const renderBuildingAgeButton = useCallback((age: typeof buildingAges[0]) => (
    <TouchableOpacity
      key={age.value}
      style={[
        styles.comboBox,
        formData.buildingAge === age.value && styles.comboBoxSelected,
      ]}
      onPress={() => updateFormData("buildingAge", age.value)}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.comboBoxText,
          formData.buildingAge === age.value && styles.comboBoxTextSelected,
        ]}
      >
        {age.label}
      </Text>
    </TouchableOpacity>
  ), [formData.buildingAge, updateFormData]);

  const renderBuildingTypeButton = useCallback((type: typeof buildingTypes[0]) => (
    <TouchableOpacity
      key={type.value}
      style={[
        styles.comboBox,
        formData.buildingType === type.value && styles.comboBoxSelected,
      ]}
      onPress={() => updateFormData("buildingType", type.value)}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.comboBoxText,
          formData.buildingType === type.value && styles.comboBoxTextSelected,
        ]}
      >
        {type.label}
      </Text>
    </TouchableOpacity>
  ), [formData.buildingType, updateFormData]);

  // Handle loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.gradientTwo} />
        <Text style={styles.loadingText}>Bilgileriniz yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  // Handle error state
  if (error) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.errorText}>
          {error instanceof Error ? error.message : "Bir hata oluştu"}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Tekrar Dene</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isSaving = updateProfileMutation.isPending;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
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
                  (!selectedCity || !selectedDistrict) && styles.placeholderText,
                ]}
              >
                {locationText}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.light.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bina Bilgileri</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Bina Tipi</Text>
            <View style={styles.comboBoxRow}>
              {buildingTypes.map(renderBuildingTypeButton)}
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Bina Yaşı</Text>
            <View style={styles.comboBoxRow}>
              {buildingAges.map(renderBuildingAgeButton)}
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
            <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
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
  disabledButton: {
    opacity: 0.6,
  },
  comboBoxRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  comboBox: {
    backgroundColor: colors.light.background,
    borderWidth: 1.5,
    borderColor: colors.gradientTwo,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 8,
    marginBottom: 8,
  },
  comboBoxSelected: {
    backgroundColor: colors.gradientTwo,
  },
  comboBoxText: {
    color: colors.gradientTwo,
    fontFamily: "NotoSans-Bold",
    fontSize: 14,
  },
  comboBoxTextSelected: {
    color: "#fff",
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