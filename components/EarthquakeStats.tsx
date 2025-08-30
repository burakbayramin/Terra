import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { colors } from "@/constants/colors";
import { useEarthquakeStats } from "@/hooks/useEarthquakeStats";
// import { usePremium } from "@/hooks/usePremium";
// import PremiumFeatureGate from "@/components/PremiumFeatureGate";
import { router } from "expo-router";
import PremiumFeatureGate from "./PremiumFeatureGate";

type MagnitudeFilter = 'total' | 'mag3' | 'mag4' | 'mag5';

const EarthquakeStat: React.FC = () => {
  const { data: stats, isLoading, isError, error, refetch, isRefetching } = useEarthquakeStats();
  const [selectedFilter, setSelectedFilter] = useState<MagnitudeFilter>('total');

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>Deprem İstatistikleri</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (isError || !stats) {
    return (
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>Deprem İstatistikleri</Text>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error?.message || 'Veriler yüklenemedi'}
          </Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => refetch()}
            disabled={isRefetching}
          >
            <Text style={styles.retryButtonText}>
              {isRefetching ? 'Yeniden deneniyor...' : 'Tekrar Dene'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const getDisplayData = () => {
    switch (selectedFilter) {
      case 'mag3':
        return {
          lastDay: stats.mag3_plus_last_day,
          lastWeek: stats.mag3_plus_last_week,
          lastMonth: stats.mag3_plus_last_month,
          title: 'Magnitude 3+ Depremler'
        };
      case 'mag4':
        return {
          lastDay: stats.mag4_plus_last_day,
          lastWeek: stats.mag4_plus_last_week,
          lastMonth: stats.mag4_plus_last_month,
          title: 'Magnitude 4+ Depremler'
        };
      case 'mag5':
        return {
          lastDay: stats.mag5_plus_last_day,
          lastWeek: stats.mag5_plus_last_week,
          lastMonth: stats.mag5_plus_last_month,
          title: 'Magnitude 5+ Depremler'
        };
      default:
        return {
          lastDay: stats.total_last_day,
          lastWeek: stats.total_last_week,
          lastMonth: stats.total_last_month,
          title: 'Tüm Depremler'
        };
    }
  };

  const displayData = getDisplayData();

  return (
    <View style={styles.statsContainer}>
      <Text style={styles.statsTitle}>Deprem İstatistikleri</Text>
      
      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedFilter === 'total' && styles.activeFilterButton
          ]}
          onPress={() => setSelectedFilter('total')}
        >
          <Text style={[
            styles.filterButtonText,
            selectedFilter === 'total' && styles.activeFilterButtonText
          ]}>
            Tümü
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedFilter === 'mag3' && styles.activeFilterButton
          ]}
          onPress={() => setSelectedFilter('mag3')}
        >
          <Text style={[
            styles.filterButtonText,
            selectedFilter === 'mag3' && styles.activeFilterButtonText
          ]}>
            +3
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedFilter === 'mag4' && styles.activeFilterButton
          ]}
          onPress={() => setSelectedFilter('mag4')}
        >
          <Text style={[
            styles.filterButtonText,
            selectedFilter === 'mag4' && styles.activeFilterButtonText
          ]}>
            +4
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedFilter === 'mag5' && styles.activeFilterButton
          ]}
          onPress={() => setSelectedFilter('mag5')}
        >
          <Text style={[
            styles.filterButtonText,
            selectedFilter === 'mag5' && styles.activeFilterButtonText
          ]}>
            +5
          </Text>
        </TouchableOpacity>
      </View>

      {/* Current Filter Title */}
      {/* <Text style={styles.currentFilterTitle}>{displayData.title}</Text> */}
      
      {/* Stats Boxes */}
      <View style={styles.statsBoxContainer}>
        <View style={styles.statsBox}>
          <Text style={styles.statsNumber}>{displayData.lastMonth}</Text>
          <Text style={styles.statsLabel}>Son 30 Gün</Text>
        </View>
        <View style={styles.statsBox}>
          <Text style={styles.statsNumber}>{displayData.lastWeek}</Text>
          <Text style={styles.statsLabel}>Son 7 Gün</Text>
        </View>
        <View style={styles.statsBox}>
          <Text style={styles.statsNumber}>{displayData.lastDay}</Text>
          <Text style={styles.statsLabel}>Son 24 Saat</Text>
        </View>
      </View>

      <View style={{ marginTop: 20 }} />

      <PremiumFeatureGate featureId="detailed-statistics">
        <TouchableOpacity 
          style={styles.detailedStatsButton}
          onPress={() => router.push("/earthquake-stats")}
        >
          <Text style={styles.detailedStatsButtonText}>Detaylı İstatistikler Git</Text>
        </TouchableOpacity>
      </PremiumFeatureGate>
    </View>
  );
};

const styles = StyleSheet.create({
  statsContainer: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.light.textPrimary,
    marginBottom: 16,
    textAlign: "center",
    fontFamily: "NotoSans-Bold",
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 3,
    borderRadius: 8,
    backgroundColor: colors.light.background,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    alignItems: "center",
  },
  activeFilterButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.light.textPrimary,
    fontFamily: "NotoSans-Regular",
  },
  activeFilterButtonText: {
    color: "white",
    fontWeight: "600",
  },
  currentFilterTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.primary,
    textAlign: "center",
    marginBottom: 12,
    fontFamily: "NotoSans-Regular",
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
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.light.textPrimary,
    fontFamily: "NotoSans-Regular",
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 14,
    color:"#e74c3c",
    textAlign: "center",
    fontFamily: "NotoSans-Regular",
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "NotoSans-Bold",
  },
  detailedStatsButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  detailedStatsButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "NotoSans-Bold",
  },
});

export default EarthquakeStat;