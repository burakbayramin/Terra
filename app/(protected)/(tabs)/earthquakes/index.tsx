import { View, Text, TouchableOpacity, Modal } from "react-native";
import React, { useCallback, useMemo, useState } from "react";
import { Earthquake } from "@/types/types";
import MapView, { Marker } from "react-native-maps";
import {
  ScrollView,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { colors } from "@/constants/colors";
import { Divider } from "react-native-paper";
import { useEarthquakes } from "@/hooks/useEarthquakes";

export default function EarthquakesScreen() {
  const { width } = Dimensions.get("window");
  const mapHeight = 280;
  const router = useRouter();

  // Filter states
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedMagnitudeRanges, setSelectedMagnitudeRanges] = useState<{min: number, max: number, label: string}[]>([]);

  const region = {
    latitude: 39.0,
    longitude: 35.0,
    latitudeDelta: 12.5,
    longitudeDelta: 17.5,
  };

  const {
    data: earthquakes = [],
    isLoading,
    error,
    refetch,
    isFetching,
  } = useEarthquakes();

  // Filter earthquakes based on selected filters
  const filteredEarthquakes = useMemo(() => {
    if (!earthquakes || earthquakes.length === 0) return [];
    
    let filtered = [...earthquakes];

    // Region filter
    if (selectedRegions.length > 0) {
      filtered = filtered.filter((eq: Earthquake) => 
        selectedRegions.some(region => 
          eq.region?.toLowerCase().includes(region.toLowerCase()) ||
          eq.title?.toLowerCase().includes(region.toLowerCase())
        )
      );
    }

    // Magnitude filter - multiple ranges support
    if (selectedMagnitudeRanges.length > 0) {
      filtered = filtered.filter((eq: Earthquake) => 
        selectedMagnitudeRanges.some(range => 
          eq.mag >= range.min && eq.mag <= range.max
        )
      );
    }

    return filtered;
  }, [earthquakes, selectedRegions, selectedMagnitudeRanges]);

  // Get unique regions from earthquakes
  const availableRegions = useMemo(() => {
    if (!earthquakes || earthquakes.length === 0) return [];
    
    const regions = new Set<string>();
    earthquakes.forEach((eq: Earthquake) => {
      if (eq.region && eq.region.trim() !== '') {
        regions.add(eq.region);
      }
    });
    return Array.from(regions).sort();
  }, [earthquakes]);

  // Magnitude ranges for filtering
  const magnitudeRanges = [
    { label: "Zayıf (0-3)", min: 0, max: 3 },
    { label: "Hafif (3-4)", min: 3, max: 4 },
    { label: "Orta (4-5)", min: 4, max: 5 },
    { label: "Güçlü (5+)", min: 5, max: 10 },
  ];

  const getMagnitudeColor = (magnitude: number) => {
    if (magnitude >= 5.0) return "#FF4444";
    if (magnitude >= 4.0) return "#FF8800";
    if (magnitude >= 3.0) return "#FFB800";
    return "#4CAF50";
  };

  const getMagnitudeLabel = (magnitude: number) => {
    if (magnitude >= 5.0) return "Güçlü";
    if (magnitude >= 4.0) return "Orta";
    if (magnitude >= 3.0) return "Hafif";
    return "Zayıf";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "Az önce";
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;
    return date.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Custom marker component for magnitude display - Memoized to prevent re-renders
  const CustomMagnitudeMarker = useCallback(
    ({ magnitude }: { magnitude: number }) => (
      <View
        style={[
          styles.customMarker,
          { backgroundColor: getMagnitudeColor(magnitude) },
        ]}
      >
        <Text style={styles.markerText}>{magnitude.toFixed(1)}</Text>
      </View>
    ),
    []
  );

  // Memoize region to prevent map re-initialization
  const mapRegion = useMemo(
    () => ({
      latitude: 39.0,
      longitude: 35.0,
      latitudeDelta: 12.5,
      longitudeDelta: 17.5,
    }),
    []
  );

  // Clear all filters
  const clearFilters = () => {
    setSelectedRegions([]);
    setSelectedMagnitudeRanges([]);
  };

  // Check if any filters are active
  const hasActiveFilters = selectedRegions.length > 0 || selectedMagnitudeRanges.length > 0;

  // Toggle region selection - deselect if already selected
  const toggleRegion = (region: string) => {
    setSelectedRegions(prev => {
      if (prev.includes(region)) {
        // Deselect: Remove from array
        return prev.filter(r => r !== region);
      } else {
        // Select: Add to array
        return [...prev, region];
      }
    });
  };

  // Toggle magnitude range selection - deselect if already selected
  const toggleMagnitudeRange = (range: {min: number, max: number, label: string}) => {
    setSelectedMagnitudeRanges(prev => {
      const isSelected = prev.some(r => r.min === range.min && r.max === range.max && r.label === range.label);
      if (isSelected) {
        // Deselect: Remove from array
        return prev.filter(r => !(r.min === range.min && r.max === range.max && r.label === range.label));
      } else {
        // Select: Add to array
        return [...prev, range];
      }
    });
  };

  // Check if magnitude range is selected - more precise matching
  const isMagnitudeRangeSelected = (range: {min: number, max: number, label: string}) => {
    return selectedMagnitudeRanges.some(r => r.min === range.min && r.max === range.max && r.label === range.label);
  };

  // Loading durumu
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.mainHeader}>
          <Text style={styles.inboxText}>Depremler</Text>
        </View>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text>Depremler yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error durumu
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.mainHeader}>
          <Text style={styles.inboxText}>Depremler</Text>
        </View>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ color: "red", marginBottom: 20 }}>
            {error instanceof Error ? error.message : "Bir hata oluştu"}
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: colors.primary,
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 8,
            }}
            onPress={() => refetch()}
          >
            <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "600" }}>
              Tekrar Dene
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={() => refetch()}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Map Container */}
        <View style={styles.mapContainer}>
          <MapView
            style={[styles.map, { width: width - 32, height: mapHeight }]}
            initialRegion={mapRegion}
            showsUserLocation={false}
            showsMyLocationButton={false}
            toolbarEnabled={false}
            loadingEnabled={true}
            loadingIndicatorColor={colors.primary}
            loadingBackgroundColor={colors.light.background}
          >
            {filteredEarthquakes.map((eq: Earthquake) => (
              <Marker
                key={`earthquake-${eq.id}`}
                coordinate={{
                  latitude: eq.latitude,
                  longitude: eq.longitude,
                }}
                title={eq.title}
                description={`Büyüklük: ${eq.mag} - Derinlik: ${eq.depth} km`}
                onCalloutPress={() => {
                  router.push(`/earthquakes/${eq.id}`);
                }}
                tracksViewChanges={false}
              >
                <CustomMagnitudeMarker magnitude={eq.mag} />
              </Marker>
            ))}
          </MapView>
        </View>

        {/* Earthquake List */}
        <View style={styles.listContainer}>
          {/* List Header with Filter Button */}
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Deprem Listesi</Text>
            <TouchableOpacity
              style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
              onPress={() => setShowFilterModal(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterButtonText, hasActiveFilters && styles.filterButtonTextActive]}>
                🔍 Filtrele
              </Text>
              {hasActiveFilters && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>
                    {selectedRegions.length + selectedMagnitudeRanges.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <View style={styles.activeFiltersContainer}>
              <Text style={styles.activeFiltersTitle}>Aktif Filtreler:</Text>
              <View style={styles.activeFiltersRow}>
                {selectedRegions.map(region => (
                  <View key={`region-${region}`} style={styles.filterTag}>
                    <Text style={styles.filterTagText}>📍 {region}</Text>
                    <TouchableOpacity onPress={() => toggleRegion(region)}>
                      <Text style={styles.filterTagRemove}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                {selectedMagnitudeRanges.map((range, index) => (
                  <View key={`magnitude-${index}`} style={styles.filterTag}>
                    <Text style={styles.filterTagText}>⚡ {range.label}</Text>
                    <TouchableOpacity onPress={() => toggleMagnitudeRange(range)}>
                      <Text style={styles.filterTagRemove}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity onPress={clearFilters} style={styles.clearFiltersButton}>
                  <Text style={styles.clearFiltersText}>Temizle</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Results Count */}
          <View style={styles.resultsCount}>
            <Text style={styles.resultsCountText}>
              {filteredEarthquakes.length} deprem listeleniyor
            </Text>
          </View>

          {filteredEarthquakes.map((eq: Earthquake, index: number) => (
            <TouchableOpacity
              key={eq.id}
              style={[styles.earthquakeCard, index === 0 && styles.firstCard]}
              activeOpacity={0.7}
              onPress={() => router.push(`/earthquakes/${eq.id}`)}
            >
              {/* Magnitude Chip */}
              <View
                style={[
                  styles.magnitudeChip,
                  { backgroundColor: getMagnitudeColor(eq.mag) },
                ]}
              >
                <Text style={styles.magnitudeText}>{eq.mag}</Text>
                <Text style={styles.magnitudeLabel}>
                  {getMagnitudeLabel(eq.mag)}
                </Text>
              </View>

              {/* Main Content */}
              <View style={styles.cardContent}>
                <Text style={styles.earthquakeTitle} numberOfLines={2}>
                  {eq.title}
                </Text>

                <View style={styles.detailsRow}>
                  {eq.date && (
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Zaman</Text>
                      <Text style={styles.detailValue}>
                        {formatDate(eq.date)}
                      </Text>
                    </View>
                  )}

                  {eq.depth && (
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Derinlik</Text>
                      <Text style={styles.detailValue}>{eq.depth} km</Text>
                    </View>
                  )}
                </View>

                <View style={styles.detailsRow}>
                  {eq.region && (
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Bölge</Text>
                      <Text style={styles.detailValue}>{eq.region}</Text>
                    </View>
                  )}

                  {eq.faultline && (
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Fay Hattı</Text>
                      <Text style={styles.detailValue}>{eq.faultline}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Time Badge for recent earthquakes */}
              {new Date().getTime() - new Date(eq.date).getTime() < 3600000 && (
                <View style={styles.recentBadge}>
                  <Text style={styles.recentText}>YENİ</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}

          {filteredEarthquakes.length === 0 && (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>
                Seçilen filtrelere uygun deprem bulunamadı.
              </Text>
              <TouchableOpacity onPress={clearFilters} style={styles.clearFiltersButton}>
                <Text style={styles.clearFiltersText}>Filtreleri Temizle</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtrele</Text>
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              {/* Magnitude Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>🔢 B</Text>
                {magnitudeRanges.map((range) => (
                  <TouchableOpacity
                    key={`magnitude-${range.label}`}
                    style={[
                      styles.filterOption,
                      isMagnitudeRangeSelected(range) && styles.filterOptionSelected
                    ]}
                    onPress={() => toggleMagnitudeRange(range)}
                    activeOpacity={0.6}
                  >
                    <View style={styles.filterOptionContent}>
                      <Text style={[
                        styles.filterOptionText,
                        isMagnitudeRangeSelected(range) && styles.filterOptionTextSelected
                      ]}>
                        {range.label}
                      </Text>
                      {isMagnitudeRangeSelected(range) && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Region Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>📍 Bölge</Text>
                {availableRegions.length > 0 ? (
                  availableRegions.map((region) => (
                    <TouchableOpacity
                      key={`region-${region}`}
                      style={[
                        styles.filterOption,
                        selectedRegions.includes(region) && styles.filterOptionSelected
                      ]}
                      onPress={() => toggleRegion(region)}
                      activeOpacity={0.6}
                    >
                      <View style={styles.filterOptionContent}>
                        <Text style={[
                          styles.filterOptionText,
                          selectedRegions.includes(region) && styles.filterOptionTextSelected
                        ]}>
                          {region}
                        </Text>
                        {selectedRegions.includes(region) && (
                          <Text style={styles.checkmark}>✓</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.noOptionsContainer}>
                    <Text style={styles.noOptionsText}>Henüz bölge verisi yüklenmemiş</Text>
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalClearButton}
                onPress={clearFilters}
              >
                <Text style={styles.modalClearButtonText}>Temizle</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalApplyButton}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.modalApplyButtonText}>Uygula</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Styles - Filter styles added
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  mapContainer: {
    margin: 16,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  map: {
    borderRadius: 16,
  },
  customMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2d3748",
  },
  // Filter Button Styles
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    position: "relative",
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4a5568",
  },
  filterButtonTextActive: {
    color: "#ffffff",
  },
  filterBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#e53e3e",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  filterBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "bold",
  },
  // Active Filters Styles
  activeFiltersContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#f0f9ff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  activeFiltersTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1e40af",
    marginBottom: 8,
  },
  activeFiltersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  filterTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3b82f6",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 4,
  },
  filterTagText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "500",
    marginRight: 6,
  },
  filterTagRemove: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  clearFiltersButton: {
    backgroundColor: "#ef4444",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 4,
  },
  clearFiltersText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  // Results Count
  resultsCount: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  resultsCountText: {
    fontSize: 14,
    color: "#718096",
    fontWeight: "500",
  },
  // No Results
  noResultsContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 16,
    color: "#718096",
    textAlign: "center",
    marginBottom: 16,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2d3748",
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f7fafc",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseText: {
    fontSize: 24,
    color: "#718096",
    fontWeight: "300",
  },
  modalScrollView: {
    maxHeight: 400,
  },
  filterSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f7fafc",
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d3748",
    marginBottom: 12,
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#f7fafc",
  },
  filterOptionSelected: {
    backgroundColor: colors.primary,
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4a5568",
    flex: 1,
  },
  filterOptionTextSelected: {
    color: "#ffffff",
  },
  filterOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  checkmark: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
  },
  noOptionsContainer: {
    padding: 20,
    alignItems: "center",
  },
  noOptionsText: {
    fontSize: 14,
    color: "#718096",
    fontStyle: "italic",
  },
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  modalClearButton: {
    flex: 1,
    backgroundColor: "#f7fafc",
    borderRadius: 12,
    paddingVertical: 12,
    marginRight: 10,
    alignItems: "center",
  },
  modalClearButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#718096",
  },
  modalApplyButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalApplyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  // Existing styles continue...
  earthquakeCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    position: "relative",
  },
  firstCard: {},
  magnitudeChip: {
    position: "absolute",
    top: "50%",
    right: 12,
    transform: [{ translateY: -20 }],
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 75,
    alignItems: "center",
  },
  magnitudeText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  magnitudeLabel: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "500",
    opacity: 0.9,
  },
  cardContent: {
    paddingRight: 80,
  },
  earthquakeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d3748",
    marginBottom: 12,
    lineHeight: 22,
  },
  detailsRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
    marginRight: 16,
  },
  detailLabel: {
    fontSize: 12,
    color: "#718096",
    fontWeight: "500",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    color: "#2d3748",
    fontWeight: "600",
  },
  recentBadge: {
    position: "absolute",
    top: -6,
    left: 16,
    backgroundColor: "#48bb78",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  recentText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  mainHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    marginBottom: 10,
    marginTop: 10,
  },
  inboxText: {
    fontSize: 25,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
});