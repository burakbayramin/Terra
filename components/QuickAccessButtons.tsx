import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import EmergencyButton from "@/components/EmergencyButton";

const QuickAccessButtons = () => {
  const router = useRouter();
  const { sendEmergencySMS, loading } = EmergencyButton();

  return (
    <View style={styles.quickAccessContainer}>
      <TouchableOpacity
        style={[styles.quickAccessButton, { backgroundColor: "#e74c3c" }]}
        activeOpacity={0.8}
        onPress={sendEmergencySMS}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <MaterialCommunityIcons
              name="home-alert"
              size={28}
              color="#fff"
              style={{ marginBottom: 4 }}
            />
            <Text style={styles.quickAccessText}>Tehlikedeyim</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.quickAccessButton, { backgroundColor: "#f39c12" }]}
        activeOpacity={0.8}
        onPress={() => {
          router.push("/(protected)/whistle");
        }}
      >
        <MaterialCommunityIcons
          name="whistle"
          size={28}
          color="#fff"
          style={{ marginBottom: 4 }}
        />
        <Text style={styles.quickAccessText}>Deprem Düdüğü</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.quickAccessButton, { backgroundColor: "#27ae60" }]}
        activeOpacity={0.8}
        onPress={() => {
          router.push("/(protected)/first-aid");
        }}
      >
        <Ionicons
          name="medkit"
          size={28}
          color="#fff"
          style={{ marginBottom: 4 }}
        />
        <Text style={styles.quickAccessText}>İlk Yardım</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  quickAccessContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginVertical: 16,
    gap: 12,
  },
  quickAccessButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 80,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  quickAccessText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 4,
  },
});

export default QuickAccessButtons;
