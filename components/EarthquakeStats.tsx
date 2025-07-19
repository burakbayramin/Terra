import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "@/constants/colors";
import { EarthquakeStats } from "@/types/types";

const EarthquakeStat: React.FC<EarthquakeStats> = ({ total }) => (
  <View style={styles.statsContainer}>
    <Text style={styles.statsTitle}>Deprem İstatistikleri</Text>
    <View style={styles.statsBoxContainer}>
      <View style={styles.statsBox}>
        <Text style={styles.statsNumber}>{total.lastMonth}</Text>
        <Text style={styles.statsLabel}>Son 30 Gün</Text>
      </View>
      <View style={styles.statsBox}>
        <Text style={styles.statsNumber}>{total.lastWeek}</Text>
        <Text style={styles.statsLabel}>Son 7 Gün</Text>
      </View>
      <View style={styles.statsBox}>
        <Text style={styles.statsNumber}>{total.lastDay}</Text>
        <Text style={styles.statsLabel}>Son 24 Saat</Text>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  statsContainer: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.light.textPrimary,
    marginBottom: 12,
    textAlign: "center",
    fontFamily: "NotoSans-Bold",
  },
  statsBoxContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  statsBox: {
    flex: 1,
    backgroundColor: colors.light.background,
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  statsNumber: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 5,
    fontFamily: "NotoSans-Bold",
  },
  statsLabel: {
    fontSize: 12,
    color: colors.light.textPrimary,
    textAlign: "center",
    fontFamily: "NotoSans-Regular",
  },
});

export default EarthquakeStat;
