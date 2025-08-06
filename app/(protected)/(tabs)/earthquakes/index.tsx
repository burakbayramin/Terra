import { View, Text, TouchableOpacity } from "react-native";
import React, { useCallback, useMemo, useState, useEffect, useRef } from "react";
import { Earthquake, MagnitudeRange } from "@/types/types";
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
import EarthquakeFilter from "@/components/EarthquakeFilter";

export default function EarthquakesScreen() {
  const { width } = Dimensions.get("window");
  const mapHeight = 280;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const sourcesInitialized = useRef(false);

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedMagnitudeRanges, setSelectedMagnitudeRanges] = useState<
    MagnitudeRange[]
  >([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);

  const [tempSelectedRegions, setTempSelectedRegions] = useState<string[]>([]);
  const [tempSelectedMagnitudeRanges, setTempSelectedMagnitudeRanges] = useState<
    MagnitudeRange[]
  >([]);
  const [tempSelectedSources, setTempSelectedSources] = useState<string[]>([]);

  const {
    data: earthquakes = [],
    isLoading,
    error,
    refetch,
    isFetching,
  } = useEarthquakes();

  const availableSources = useMemo(() => {
    if (!earthquakes || earthquakes.length === 0) return [];

    const sources = new Set<string>();
    earthquakes.forEach((eq: Earthquake) => {
      if (eq.provider && eq.provider.trim() !== "") {
        sources.add(eq.provider);
      }
    });
    return Array.from(sources).sort();
  }, [earthquakes]);

  useEffect(() => {
    if (availableSources && availableSources.length > 0 && !sourcesInitialized.current) {
      setSelectedSources([...availableSources]);
      sourcesInitialized.current = true;
    }
  }, [availableSources]);

  const openFilterModal = () => {
    try {
      const currentRegions = Array.isArray(selectedRegions) ? [...selectedRegions] : [];
      const currentMagnitudeRanges = Array.isArray(selectedMagnitudeRanges) ? [...selectedMagnitudeRanges] : [];
      const currentSources = Array.isArray(selectedSources) ? [...selectedSources] : [];
      
      setTempSelectedRegions(currentRegions);
      setTempSelectedMagnitudeRanges(currentMagnitudeRanges);
      setTempSelectedSources(currentSources);
      setShowFilterModal(true);
    } catch (error) {
      console.error('Error opening filter modal:', error);
      setTempSelectedRegions([]);
      setTempSelectedMagnitudeRanges([]);
      setTempSelectedSources([]);
      setShowFilterModal(true);
    }
  };

  const applyFilters = () => {
    try {
      const tempRegions = tempSelectedRegions || [];
      const tempMagnitudeRanges = tempSelectedMagnitudeRanges || [];
      const tempSources = tempSelectedSources || [];
      
      setSelectedRegions(() => [...tempRegions]);
      setSelectedMagnitudeRanges(() => [...tempMagnitudeRanges]);
      setSelectedSources(() => [...tempSources]);
      
      setTimeout(() => {
        setShowFilterModal(false);
      }, 0);
    } catch (error) {
      console.error('Error applying filters:', error);
      setShowFilterModal(false);
    }
  };

  const closeFilterModal = () => {
    setShowFilterModal(false);
  };

  const filteredEarthquakes = useMemo(() => {
    if (!earthquakes || earthquakes.length === 0) return [];

    let filtered = [...earthquakes];

    if (selectedSources && Array.isArray(selectedSources) && selectedSources.length > 0) {
      filtered = filtered.filter((eq: Earthquake) =>
        selectedSources.includes(eq.provider)
      );
    }

    if (selectedRegions && Array.isArray(selectedRegions) && selectedRegions.length > 0) {
      filtered = filtered.filter((eq: Earthquake) =>
        selectedRegions.some(
          (region) =>
            eq.region?.toLowerCase().includes(region.toLowerCase()) ||
            eq.title?.toLowerCase().includes(region.toLowerCase())
        )
      );
    }

    if (selectedMagnitudeRanges && Array.isArray(selectedMagnitudeRanges) && selectedMagnitudeRanges.length > 0) {
      filtered = filtered.filter((eq: Earthquake) =>
        selectedMagnitudeRanges.some(
          (range) => eq.mag >= range.min && eq.mag <= range.max
        )
      );
    }

    return filtered;
  }, [earthquakes, selectedSources, selectedRegions, selectedMagnitudeRanges]);

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

  const formatSourceName = useCallback((source: string) => {
    switch (source.toLowerCase()) {
      case 'kandilli':
        return 'KANDILLI';
      case 'afad':
        return 'AFAD';
      case 'usgs':
        return 'USGS';
      case 'iris':
        return 'IRIS';
      case 'emsc':
        return 'EMSC';
      default:
        return source.toUpperCase();
    }
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

  const mapRegion = useMemo(
    () => ({
      latitude: 39.0,
      longitude: 35.0,
      latitudeDelta: 12.5,
      longitudeDelta: 17.5,
    }),
    []
  );

  const clearFilters = () => {
    setTempSelectedRegions([]);
    setTempSelectedMagnitudeRanges([]);
    setTempSelectedSources(availableSources ? [...availableSources] : []);
  };

  const hasActiveFilters =
    selectedRegions.length > 0 || selectedMagnitudeRanges.length > 0;

  const toggleRegion = (region: string) => {
    setSelectedRegions((prev) => {
      if (prev.includes(region)) {
        return prev.filter((r) => r !== region);
      } else {
        return [...prev, region];
      }
    });
  };

  const toggleMagnitudeRange = (range: MagnitudeRange) => {
    setSelectedMagnitudeRanges((prev) => {
      const isSelected = prev.some(
        (r) =>
          r.min === range.min && r.max === range.max && r.label === range.label
      );
      if (isSelected) {
        return prev.filter(
          (r) =>
            !(
              r.min === range.min &&
              r.max === range.max &&
              r.label === range.label
            )
        );
      } else {
        return [...prev, range];
      }
    });
  };

  const toggleSource = (source: string) => {
    setSelectedSources((prev) => {
      const currentSources = prev || [];
      if (currentSources.includes(source)) {
        return currentSources.filter((s) => s !== source);
      } else {
        return [...currentSources, source];
      }
    });
  };

  const toggleTempRegion = (region: string) => {
    setTempSelectedRegions((prev) => {
      if (prev.includes(region)) {
        return prev.filter((r) => r !== region);
      } else {
        return [...prev, region];
      }
    });
  };

  const toggleTempMagnitudeRange = (range: MagnitudeRange) => {
    setTempSelectedMagnitudeRanges((prev) => {
      const isSelected = prev.some(
        (r) =>
          r.min === range.min && r.max === range.max && r.label === range.label
      );
      if (isSelected) {
        return prev.filter(
          (r) =>
            !(
              r.min === range.min &&
              r.max === range.max &&
              r.label === range.label
            )
        );
      } else {
        return [...prev, range];
      }
    });
  };

  const toggleTempSource = (source: string) => {
    setTempSelectedSources((prev) => {
      const currentSources = prev || [];
      if (currentSources.includes(source)) {
        return currentSources.filter((s) => s !== source);
      } else {
        return [...currentSources, source];
      }
    });
  };

  const isMagnitudeRangeSelected = (range: MagnitudeRange) => {
    return selectedMagnitudeRanges.some(
      (r) =>
        r.min === range.min && r.max === range.max && r.label === range.label
    );
  };

  const isTempMagnitudeRangeSelected = (range: MagnitudeRange) => {
    return tempSelectedMagnitudeRanges.some(
      (r) =>
        r.min === range.min && r.max === range.max && r.label === range.label
    );
  };

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
        <View style={styles.mapContainer}>
          <MapView
            key={`map-${(selectedSources || []).join('-')}-${(selectedRegions || []).join('-')}-${(selectedMagnitudeRanges || []).length}`}
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
                  router.push({
                    pathname: `/(protected)/(tabs)/earthquakes/${eq.id}`,
                    params: { source: 'list' }
                  });
                }}
                tracksViewChanges={false}
              >
                <CustomMagnitudeMarker magnitude={eq.mag} />
              </Marker>
            ))}
          </MapView>
        </View>

        <View style={styles.listContainer}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Deprem Listesi</Text>
            <EarthquakeFilter
              showFilterModal={showFilterModal}
              setShowFilterModal={setShowFilterModal}
              selectedRegions={tempSelectedRegions}
              availableRegions={availableRegions}
              selectedMagnitudeRanges={tempSelectedMagnitudeRanges}
              selectedSources={tempSelectedSources}
              availableSources={availableSources}
              toggleRegion={toggleTempRegion}
              toggleMagnitudeRange={toggleTempMagnitudeRange}
              toggleSource={toggleTempSource}
              clearFilters={clearFilters}
              isMagnitudeRangeSelected={isTempMagnitudeRangeSelected}
              hasActiveFilters={hasActiveFilters}
              onApply={applyFilters}
              onOpenModal={openFilterModal}
              onClose={closeFilterModal}
            />
          </View>

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
              onPress={() => router.push({
                pathname: `/(protected)/(tabs)/earthquakes/${eq.id}`,
                params: { source: 'list' }
              })}
            >
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

                  {eq.faultline && eq.faultline.trim() !== "" && (
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Fay Hattı</Text>
                      <Text style={styles.detailValue}>
                        {String(eq.faultline)}
                      </Text>
                    </View>
                  )}
                </View>

                {eq.provider && (
                  <View style={styles.sourceContainer}>
                    <Text style={styles.sourceLabel}>Kaynak:</Text>
                    <View style={styles.sourceBadge}>
                      <Text style={styles.sourceText}>{formatSourceName(eq.provider)}</Text>
                    </View>
                  </View>
                )}
              </View>

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
  resultsCount: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  resultsCountText: {
    fontSize: 14,
    color: "#718096",
    fontWeight: "500",
  },
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
  sourceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  sourceLabel: {
    fontSize: 12,
    color: "#718096",
    fontWeight: "500",
    marginRight: 8,
  },
  sourceBadge: {
    backgroundColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  sourceText: {
    fontSize: 12,
    color: "#4299e1",
    fontWeight: "600",
  },
});