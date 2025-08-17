import React, { useState, useCallback, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/colors";
import cityDistrictData from "@/assets/data/turkey-cities-districts.json";
import { City, District } from "@/types/types";

export interface CityDistrictSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (city: City, district: District) => void;
  selectedCity: City | null;
  selectedDistrict: District | null; // (Şu an sadece gösterim amaçlı; gerekirse kullanılabilir)
}

const CityDistrictSelector: React.FC<CityDistrictSelectorProps> = React.memo(
  ({ visible, onClose, onSelect, selectedCity }) => {
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
            removeClippedSubviews
            maxToRenderPerBatch={20}
            windowSize={10}
            getItemLayout={(_, index) => ({
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

export default CityDistrictSelector;

const styles = StyleSheet.create({
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
  list: { flex: 1 },
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
