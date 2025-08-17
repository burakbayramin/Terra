import { View, Text, TouchableOpacity } from "react-native";
import React, { useCallback, useMemo } from "react";
import { Earthquake } from "@/types/types";
import MapView, { Marker } from "react-native-maps";
import {
  ScrollView,
  StyleSheet,
  Dimensions,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { colors } from "@/constants/colors";
import { mapConstants } from "@/constants/mapConstants";
import { useEarthquakes } from "@/hooks/useEarthquakes";
import { 
  getMagnitudeColor, 
  getMagnitudeLabel, 
  formatSourceName, 
  formatDate 
} from '@/utils/earthquakeUtils';
import LoadingView from "@/components/LoadingView";
import ErrorView from "@/components/ErrorView";

export default function EarthquakesScreen() {
  const { width } = Dimensions.get("window");
  const mapHeight = 280;
  const router = useRouter();

  const {
    data: earthquakes = [],
    isLoading,
    error,
    refetch,
    isFetching,
  } = useEarthquakes();

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

  const mapRegion = mapConstants.turkeyRegion;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingView />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorView 
          message={error instanceof Error ? error.message : "Bir hata oluştu"}
          onRetry={refetch}
        />
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
            {earthquakes.map((eq: Earthquake) => (
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
          </View>

          <View style={styles.resultsCount}>
            <Text style={styles.resultsCountText}>
              {earthquakes.length} deprem listeleniyor
            </Text>
          </View>

          {earthquakes.map((eq: Earthquake, index: number) => (
            <TouchableOpacity
              key={eq.id}
              style={[styles.earthquakeCard, index === 0 && styles.firstCard]}
              activeOpacity={0.7}
              onPress={() => router.push({
                pathname: `/(protected)/(tabs)/earthquakes/${eq.id}`,
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

          {earthquakes.length === 0 && (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>
                Henüz deprem verisi bulunmuyor.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
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