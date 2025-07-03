
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/colors";

const buildingAges = [
  "0-5 yıl",
  "6-10 yıl",
  "11-20 yıl",
  "21-30 yıl",
  "31+ yıl",
];
const floorCounts = [
  "1-2 kat",
  "3-5 kat",
  "6-10 kat",
  "11+ kat",
];
const districts = [
  "Kadıköy",
  "Beşiktaş",
  "Şişli",
  "Bakırköy",
  "Üsküdar",
  "Diğer",
];

const CompleteProfile = () => {
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [location, setLocation] = useState("");
  // const [detailedLocation, setDetailedLocation] = useState("");
  const [buildingAge, setBuildingAge] = useState("");
  const [floorCount, setFloorCount] = useState("");
  const [district, setDistrict] = useState("");

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
          <Ionicons name="person-circle-outline" size={48} color={colors.gradientTwo} style={{ marginBottom: 10 }} />
          <Text style={styles.title}>Profilini Tamamla</Text>
          <Text style={styles.subtitle}>
            Terra AI'nin daha iyi çalışması için aşağıdaki bilgileri doldurmanızı öneririz.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kişisel Bilgiler</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>İsim</Text>
            <TextInput
              style={styles.input}
              placeholder="İsminiz"
              value={name}
              onChangeText={setName}
              placeholderTextColor={colors.light.textSecondary}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Soyisim</Text>
            <TextInput
              style={styles.input}
              placeholder="Soyisminiz"
              value={surname}
              onChangeText={setSurname}
              placeholderTextColor={colors.light.textSecondary}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Konum (İl/İlçe)</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: İstanbul, Kadıköy"
              value={location}
              onChangeText={setLocation}
              placeholderTextColor={colors.light.textSecondary}
            />
          </View>

        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bina Bilgileri</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Bina Yaşı</Text>
            <View style={styles.comboBoxRow}>
              {buildingAges.map((age) => (
                <TouchableOpacity
                  key={age}
                  style={[styles.comboBox, buildingAge === age && styles.comboBoxSelected]}
                  onPress={() => setBuildingAge(age)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.comboBoxText, buildingAge === age && styles.comboBoxTextSelected]}>{age}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Kat Sayısı</Text>
            <View style={styles.comboBoxRow}>
              {floorCounts.map((count) => (
                <TouchableOpacity
                  key={count}
                  style={[styles.comboBox, floorCount === count && styles.comboBoxSelected]}
                  onPress={() => setFloorCount(count)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.comboBoxText, floorCount === count && styles.comboBoxTextSelected]}>{count}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Semt</Text>
            <View style={styles.comboBoxRow}>
              {districts.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.comboBox, district === d && styles.comboBoxSelected]}
                  onPress={() => setDistrict(d)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.comboBoxText, district === d && styles.comboBoxTextSelected]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.infoText}>
            Bu bilgiler, Terra AI'nin deprem analizlerini ve topluluk önerilerini size daha iyi sunabilmesi için kullanılacaktır.
          </Text>
        </View>

        <TouchableOpacity style={styles.saveButton} activeOpacity={0.8}>
          <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.saveButtonText}>Kaydet</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    color: colors.gradientTwo,
    fontFamily: "NotoSans-Bold",
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: colors.light.textSecondary,
    fontFamily: "NotoSans-Regular",
    textAlign: "center",
    marginBottom: 2,
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
  saveButtonText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "NotoSans-Bold",
    fontWeight: "700",
  },
});

export default CompleteProfile;