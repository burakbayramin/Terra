import { View, Text, TouchableOpacity } from "react-native";
import React, { useCallback, useMemo, useState } from "react";
import { Earthquake } from "@/types/types";
import MapView, { Marker } from "react-native-maps";
import {
  ScrollView,
  StyleSheet,
  Dimensions,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { colors } from "@/constants/colors";
import { useEarthquakes } from "@/hooks/useEarthquakes";
import EarthquakeFilter from "@/components/EarthquakeFilter"; // Import the new component
import { Ionicons } from '@expo/vector-icons';

interface MagnitudeRange {
  min: number;
  max: number;
  label: string;
}

export default function EarthquakesScreen() {
  const { width } = Dimensions.get("window");
  const mapHeight = 280;
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Filter states
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedMagnitudeRanges, setSelectedMagnitudeRanges] = useState<
    MagnitudeRange[]
  >([]);

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
        selectedRegions.some(
          (region) =>
            eq.region?.toLowerCase().includes(region.toLowerCase()) ||
            eq.title?.toLowerCase().includes(region.toLowerCase())
        )
      );
    }

    // Magnitude filter - multiple ranges support
    if (selectedMagnitudeRanges.length > 0) {
      filtered = filtered.filter((eq: Earthquake) =>
        selectedMagnitudeRanges.some(
          (range) => eq.mag >= range.min && eq.mag <= range.max
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
      if (eq.region && eq.region.trim() !== "") {
        regions.add(eq.region);
      }
    });
    return Array.from(regions).sort();
  }, [earthquakes]);

  const getMagnitudeColor = useCallback((magnitude: number) => {
    if (magnitude >= 5.0) return "#FF4444";
    if (magnitude >= 4.0) return "#FF8800";
    if (magnitude >= 3.0) return "#FFB800";
    return "#4CAF50";
  }, []);

  const getMagnitudeLabel = useCallback((magnitude: number) => {
    if (magnitude >= 5.0) return "Güçlü";
    if (magnitude >= 4.0) return "Orta";
    if (magnitude >= 3.0) return "Hafif";
    return "Zayıf";
  }, []);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString || typeof dateString !== 'string') return "Bilinmiyor";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Geçersiz tarih";

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
    } catch {
      return "Geçersiz tarih";
    }
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
    [getMagnitudeColor]
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
  const hasActiveFilters =
    selectedRegions.length > 0 || selectedMagnitudeRanges.length > 0;

  // Toggle region selection - deselect if already selected
  const toggleRegion = (region: string) => {
    setSelectedRegions((prev) => {
      if (prev.includes(region)) {
        // Deselect: Remove from array
        return prev.filter((r) => r !== region);
      } else {
        // Select: Add to array
        return [...prev, region];
      }
    });
  };

  // Toggle magnitude range selection - deselect if already selected
  const toggleMagnitudeRange = (range: MagnitudeRange) => {
    setSelectedMagnitudeRanges((prev) => {
      const isSelected = prev.some(
        (r) =>
          r.min === range.min && r.max === range.max && r.label === range.label
      );
      if (isSelected) {
        // Deselect: Remove from array
        return prev.filter(
          (r) =>
            !(
              r.min === range.min &&
              r.max === range.max &&
              r.label === range.label
            )
        );
      } else {
        // Select: Add to array
        return [...prev, range];
      }
    });
  };

  // Check if magnitude range is selected - more precise matching
  const isMagnitudeRangeSelected = (range: MagnitudeRange) => {
    return selectedMagnitudeRanges.some(
      (r) =>
        r.min === range.min && r.max === range.max && r.label === range.label
    );
  };

  // Loading durumu
  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.mainHeader}>
          <Text style={styles.inboxText}>Depremler</Text>
        </View>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text>Depremler yükleniyor...</Text>
        </View>
      </View>
    );
  }

  // Error durumu
  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
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
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom }}
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
            <EarthquakeFilter
              showFilterModal={showFilterModal}
              setShowFilterModal={setShowFilterModal}
              selectedRegions={selectedRegions}
              availableRegions={availableRegions}
              selectedMagnitudeRanges={selectedMagnitudeRanges}
              toggleRegion={toggleRegion}
              toggleMagnitudeRange={toggleMagnitudeRange}
              clearFilters={clearFilters}
              isMagnitudeRangeSelected={isMagnitudeRangeSelected}
              hasActiveFilters={hasActiveFilters}
            />
          </View>

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
                  {eq.title && eq.title.trim() !== "" ? eq.title : "Başlık bulunamadı"}
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

                  {eq.depth !== undefined && eq.depth !== null && (
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Derinlik</Text>
                      <Text style={styles.detailValue}>
                        {typeof eq.depth === "number"
                          ? `${eq.depth} km`
                          : String(eq.depth)}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.detailsRow}>
                  {eq.region && eq.region.trim() !== "" && (
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Bölge</Text>
                      <Text style={styles.detailValue}>
                        {String(eq.region)}
                      </Text>
                    </View>
                  )}

                  {/* Fay hattı detayı */}
                  {eq.faultline && eq.faultline.trim() !== "" && (
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Fay Hattı</Text>
                      <Text style={styles.detailValue}>
                        {String(eq.faultline)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Time Badge for recent earthquakes */}
              {eq.date && new Date().getTime() - new Date(eq.date).getTime() < 3600000 && (
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
              <TouchableOpacity
                onPress={clearFilters}
                style={styles.clearFiltersButton}
              >
                <Text style={styles.clearFiltersText}>Filtreleri Temizle</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// Styles - Filter styles removed (now in EarthquakeFilter component)
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