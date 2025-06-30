import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "@/constants/colors";

interface EarthquakeStatsProps {
  stats: {
    last24Hours: number;
    last7Days: number;
    last30Days: number;
  };
}

const EarthquakeStats: React.FC<EarthquakeStatsProps> = ({ stats }) => (
  <View style={styles.statsContainer}>
    <Text style={styles.statsTitle}>Deprem İstatistikleri</Text>
    <View style={styles.statsBoxContainer}>
      <View style={styles.statsBox}>
        <Text style={styles.statsNumber}>{stats.last30Days}</Text>
        <Text style={styles.statsLabel}>Son 30 Gün</Text>
      </View>
      <View style={styles.statsBox}>
        <Text style={styles.statsNumber}>{stats.last7Days}</Text>
        <Text style={styles.statsLabel}>Son 7 Gün</Text>
      </View>
      <View style={styles.statsBox}>
        <Text style={styles.statsNumber}>{stats.last24Hours}</Text>
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
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  statsBoxContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  statsBox: {
    flex: 1,
    backgroundColor: colors.light.surface,
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
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
  },
  statsLabel: {
    fontSize: 12,
    color: "#777",
    textAlign: "center",
  },
});

export default EarthquakeStats;
