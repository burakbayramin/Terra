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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/colors";
import cityDistrictData from "@/assets/data/turkey-cities-districts.json";
import { useAuth } from "@/providers/AuthProvider";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { Profile, City, District } from "@/types/types";
import * as Contacts from "expo-contacts";

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
  const insets = useSafeAreaInsets();

  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    emergency_phone: "",
  });
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(
    null
  );
  const [modalVisible, setModalVisible] = useState(false);

  // Contacts için state
  const [contacts, setContacts] = useState<Contacts.Contact[]>([]);
  const [contactsModalVisible, setContactsModalVisible] = useState(false);

  // TanStack Query hooks
  const {
    data: profile,
    isLoading,
    error,
    refetch,
  } = useProfile(user?.id || "");

  const updateProfileMutation = useUpdateProfile();

  // Profile datayı form state'e yükle
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        surname: profile.surname || "",
        emergency_phone: profile.emergency_phone || "",
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

  const updateFormData = useCallback(
    (field: keyof typeof formData, value: string | null) => {
      setFormData((prev) => ({ ...prev, [field]: value || "" }));
    },
    []
  );

  const formatPhoneNumber = useCallback((value: string) => {
    const numeric = value.replace(/\D/g, "");
    const limited = numeric.slice(0, 10);
    if (limited.length >= 7) {
      return limited.replace(/(\d{3})(\d{3})(\d{2})(\d{2})/, "$1 $2 $3 $4");
    } else if (limited.length >= 6) {
      return limited.replace(/(\d{3})(\d{3})(\d{1,2})/, "$1 $2 $3");
    } else if (limited.length >= 3) {
      return limited.replace(/(\d{3})(\d{1,3})/, "$1 $2");
    }
    return limited;
  }, []);

  const handlePhoneChange = useCallback(
    (text: string) => {
      const formatted = formatPhoneNumber(text);
      updateFormData("emergency_phone", formatted);
    },
    [formatPhoneNumber, updateFormData]
  );

  const validatePhoneNumber = useCallback((phone: string) => {
    const numeric = phone.replace(/\D/g, "");
    return numeric.length === 10;
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
    if (
      formData.emergency_phone &&
      !validatePhoneNumber(formData.emergency_phone)
    ) {
      showAlert("Lütfen geçerli bir telefon numarası girin (10 haneli)");
      return;
    }

    const profileData = {
      name: formData.name.trim(),
      surname: formData.surname.trim(),
      emergency_phone: formData.emergency_phone
        ? formData.emergency_phone.replace(/\D/g, "")
        : null,
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
        },
      }
    );
  }, [
    user,
    formData,
    selectedCity,
    selectedDistrict,
    updateProfileMutation,
    showAlert,
    validatePhoneNumber,
  ]);

  // ---------- REHBERDEN SEÇ BUTONU ----------
  const openContacts = useCallback(async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("İzin Gerekli", "Rehbere erişim izni verilmedi.");
      return;
    }

    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.PhoneNumbers],
      sort: Contacts.SortTypes.FirstName,
    });

    if (data.length > 0) {
      setContacts(
        data.filter((c) => c.phoneNumbers && c.phoneNumbers.length > 0)
      );
      setContactsModalVisible(true);
    } else {
      Alert.alert("Uyarı", "Rehberde telefon numarası bulunamadı.");
    }
  }, []);

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
          </View>

          {/* ---- ACİL DURUM TELEFONU ---- */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Acil Durum Telefonu</Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="5XX XXX XX XX"
                value={formData.emergency_phone}
                onChangeText={handlePhoneChange}
                placeholderTextColor={colors.light.textSecondary}
                keyboardType="phone-pad"
                maxLength={13} // XXX XXX XX XX format
                editable={!isSaving}
              />
              <TouchableOpacity
                style={{ marginLeft: 8 }}
                onPress={openContacts}
                disabled={isSaving}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="person-add"
                  size={24}
                  color={colors.gradientTwo}
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.helperText}>
              Tehlikedeyim butonuna basıldığında mesaj gidecek numara (isteğe bağlı)
            </Text>
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

      <CityDistrictSelector
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelect={handleLocationSelect}
        selectedCity={selectedCity}
        selectedDistrict={selectedDistrict}
      />

      {/* --------- REHBER MODAL --------- */}
      <Modal
        visible={contactsModalVisible}
        animationType="slide"
        onRequestClose={() => setContactsModalVisible(false)}
      >
        <View style={[{ flex: 1, backgroundColor: "#fff" }, { paddingTop: insets.top }]}>
          <View style={[styles.modalHeader, { borderBottomWidth: 0 }]}>
            <Text style={styles.modalTitle}>Rehberden Kişi Seç</Text>
            <TouchableOpacity onPress={() => setContactsModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.gradientTwo} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={contacts}
            keyExtractor={(item) =>
              item.id
                ? String(item.id)
                : String(item.phoneNumbers?.[0]?.number || Math.random())
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.listItem}
                onPress={() => {
                  // İlk telefon numarasını al
                  const phoneRaw = item.phoneNumbers?.[0]?.number || "";
                  const phone = cleanAndFormatTurkishNumber(phoneRaw);
                  setContactsModalVisible(false);
                  handlePhoneChange(phone);
                }}
              >
                <Text style={styles.listItemText}>
                  {item.name ||
                    [item.firstName, item.lastName].filter(Boolean).join(" ")}
                </Text>
                <Text
                  style={[
                    styles.listItemText,
                    {
                      color: colors.light.textSecondary,
                      marginLeft: 12,
                      fontSize: 14,
                    },
                  ]}
                >
                  {item.phoneNumbers?.[0]?.number}
                </Text>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => (
              <View style={{ height: 1, backgroundColor: "#eee" }} />
            )}
          />
        </View>
      </Modal>
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
  helperText: {
    fontSize: 12,
    color: colors.light.textSecondary,
    fontFamily: "NotoSans-Regular",
    marginTop: 4,
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
