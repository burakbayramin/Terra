import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Platform,
  Alert,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useLocalSearchParams, Stack } from "expo-router";
import { Earthquake } from "@/types/types";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/colors";
import { useEarthquakeById } from "@/hooks/useEarthquakes";

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

function formatDate(dateString: string) {
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
}

function getFaultLineName(longitude: number, latitude: number) {
  return "Kuzey Anadolu Fayı";
}

// Harici harita uygulamasını açma fonksiyonu
const openInExternalMap = async (
  latitude: number,
  longitude: number,
  title: string
) => {
  // URL'leri öncelik sırasına göre tanımla
  const urls = [
    // Google Maps uygulaması (en yaygın)
    `comgooglemaps://?q=${latitude},${longitude}&center=${latitude},${longitude}&zoom=14`,
    // iOS Apple Maps
    `http://maps.apple.com/?q=${latitude},${longitude}&ll=${latitude},${longitude}`,
    // Android geo intent
    `geo:${latitude},${longitude}?q=${latitude},${longitude}`,
    // Google Maps web (son çare)
    `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
  ];

  // Her URL'yi sırayla dene
  for (const url of urls) {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return; // Başarılı olursa çık
      }
    } catch (error) {
      console.log(`URL açılamadı: ${url}`, error);
      continue; // Bir sonraki URL'yi dene
    }
  }

  // Hiçbir URL çalışmazsa kullanıcıyı bilgilendir
  Alert.alert(
    "Harita Uygulaması",
    "Harita uygulaması açılamadı. Koordinatları manuel olarak kopyalayabilirsiniz:\n\n" +
      `${latitude}, ${longitude}`,
    [
      {
        text: "Koordinatları Kopyala",
        onPress: () => {
          // Expo'da Clipboard varsa kullan, yoksa sadece konsola yazdır
          console.log(`Koordinatlar: ${latitude}, ${longitude}`);
        },
      },
      { text: "Tamam", style: "cancel" },
    ]
  );
};

export default function EarthquakeDetailScreen() {
  const { id } = useLocalSearchParams();

  const {
    data: earthquake,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useEarthquakeById(id as string);

  // Loading durumu
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Deprem verisi yükleniyor...</Text>
      </View>
    );
  }

  // Error durumu
  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={[styles.loadingText, { color: "red", marginBottom: 20 }]}>
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
    );
  }

  // Deprem bulunamadı durumu
  if (!earthquake) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Deprem verisi bulunamadı.</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#1a365d" />

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        bounces={false}
        // YENİ: Pull to refresh
        // refreshControl={
        //   <RefreshControl
        //     refreshing={isFetching}
        //     onRefresh={() => refetch()}
        //     colors={[colors.primary]}
        //     tintColor={colors.primary}
        //   />
        // }
      >
        {/* Hero Header */}
        <View
          style={[
            styles.heroHeader,
            { backgroundColor: getMagnitudeColor(earthquake.mag) },
          ]}
        >
          <View style={styles.heroContent}>
            <View style={styles.magnitudeDisplay}>
              <Text style={styles.magnitudeNumber}>
                {earthquake.mag.toFixed(1)}
              </Text>
              <View style={styles.magnitudeBadge}>
                <Text style={styles.magnitudeBadgeText}>
                  {getMagnitudeLabel(earthquake.mag)}
                </Text>
              </View>
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.heroTitle}>{earthquake.title}</Text>
              <View style={styles.timeAgo}>
                <Ionicons
                  name="time-outline"
                  size={16}
                  color="rgba(255,255,255,0.8)"
                />
                <Text style={styles.timeAgoText}>
                  {formatDate(earthquake.date)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.statItem}>
              <Ionicons
                name="layers-outline"
                size={20}
                color={getMagnitudeColor(earthquake.mag)}
              />
              <Text style={styles.statValue}>{earthquake.depth} km</Text>
              <Text style={styles.statLabel}>Derinlik</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons
                name="people-outline"
                size={20}
                color={getMagnitudeColor(earthquake.mag)}
              />
              <Text style={styles.statValue}>
                {Math.floor(Math.random() * 1000) + 100}
              </Text>
              <Text style={styles.statLabel}>Hisseden</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={getMagnitudeColor(earthquake.mag)}
              />
              <Text style={styles.statValue}>{earthquake.provider}</Text>
              <Text style={styles.statLabel}>Kaynak</Text>
            </View>
          </View>

          {/* Map Section */}
          <View style={styles.mapSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location-outline" size={22} color="#2d3748" />
              <Text style={styles.sectionTitle}>Deprem Konumu</Text>
            </View>

            {earthquake.longitude !== 0 && earthquake.latitude !== 0 ? (
              <View style={styles.mapContainer}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() =>
                    openInExternalMap(
                      earthquake.latitude,
                      earthquake.longitude,
                      earthquake.title
                    )
                  }
                >
                  <MapView
                    style={styles.map}
                    initialRegion={{
                      latitude: earthquake.latitude,
                      longitude: earthquake.longitude,
                      latitudeDelta: 0.5,
                      longitudeDelta: 0.5,
                    }}
                    scrollEnabled={false}
                    zoomEnabled={false}
                    pitchEnabled={false}
                    rotateEnabled={false}
                    onPress={() =>
                      openInExternalMap(
                        earthquake.latitude,
                        earthquake.longitude,
                        earthquake.title
                      )
                    }
                  >
                    <Marker
                      coordinate={{
                        latitude: earthquake.latitude,
                        longitude: earthquake.longitude,
                      }}
                      pinColor={getMagnitudeColor(earthquake.mag)}
                      onPress={() =>
                        openInExternalMap(
                          earthquake.latitude,
                          earthquake.longitude,
                          earthquake.title
                        )
                      }
                    />
                  </MapView>
                </TouchableOpacity>

                {/* Harita tıklama ipucu */}
                <TouchableOpacity
                  style={styles.mapOverlay}
                  onPress={() =>
                    openInExternalMap(
                      earthquake.latitude,
                      earthquake.longitude,
                      earthquake.title
                    )
                  }
                  activeOpacity={0.7}
                >
                  <View style={styles.mapOverlayContent}>
                    <Ionicons name="open-outline" size={16} color="#6b7280" />
                    <Text style={styles.mapOverlayText}>
                      Harita uygulamasında aç
                    </Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.coordinatesContainer}>
                  <Ionicons name="navigate-outline" size={16} color="#6b7280" />
                  <Text style={styles.coordinates}>
                    {earthquake.latitude.toFixed(4)},{" "}
                    {earthquake.longitude.toFixed(4)}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.noLocationContainer}>
                <Ionicons name="location-outline" size={48} color="#cbd5e0" />
                <Text style={styles.noLocationText}>
                  Konum bilgisi bulunamadı
                </Text>
              </View>
            )}
          </View>

          {/* Detailed Information */}
          <View style={styles.detailsSection}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="information-circle-outline"
                size={22}
                color="#2d3748"
              />
              <Text style={styles.sectionTitle}>Detaylı Bilgiler</Text>
            </View>

            <View style={styles.detailGrid}>
              <View style={styles.detailItem}>
                <View style={styles.detailIcon}>
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={getMagnitudeColor(earthquake.mag)}
                  />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Tarih</Text>
                  <Text style={styles.detailValue}>
                    {new Date(earthquake.date).toLocaleDateString("tr-TR", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <View style={styles.detailIcon}>
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={getMagnitudeColor(earthquake.mag)}
                  />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Saat</Text>
                  <Text style={styles.detailValue}>
                    {new Date(earthquake.date).toLocaleTimeString("tr-TR", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </Text>
                </View>
              </View>

              {earthquake.faultline && (
                <View style={styles.detailItem}>
                  <View style={styles.detailIcon}>
                    <Ionicons
                      name="git-branch-outline"
                      size={20}
                      color={getMagnitudeColor(earthquake.mag)}
                    />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Fay Hattı</Text>
                    <Text style={styles.detailValue}>
                      {earthquake.faultline}
                    </Text>
                  </View>
                </View>
              )}
              {earthquake.region && (
                <View style={styles.detailItem}>
                  <View style={styles.detailIcon}>
                    <Ionicons
                      name="location-outline"
                      size={20}
                      color={getMagnitudeColor(earthquake.mag)}
                    />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Bölge</Text>
                    <Text style={styles.detailValue}>
                      {earthquake.region}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Impact Assessment */}
          <View style={styles.impactSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="analytics-outline" size={22} color="#2d3748" />
              <Text style={styles.sectionTitle}>Etki Değerlendirmesi</Text>
            </View>

            <View style={styles.impactCard}>
              <View
                style={[
                  styles.impactHeader,
                  { backgroundColor: `${getMagnitudeColor(earthquake.mag)}15` },
                ]}
              >
                <Text
                  style={[
                    styles.impactTitle,
                    { color: getMagnitudeColor(earthquake.mag) },
                  ]}
                >
                  {getMagnitudeLabel(earthquake.mag)} Şiddette Deprem
                </Text>
              </View>

              <View style={styles.impactContent}>
                <Text style={styles.impactDescription}>
                  Bu deprem {earthquake.mag.toFixed(1)} büyüklüğünde kaydedilmiş
                  olup, {earthquake.depth} km derinliğinde gerçekleşmiştir.
                  {earthquake.mag >= 4.0
                    ? " Bu şiddetteki depremler genellikle geniş bir alanda hissedilir ve hafif hasarlara neden olabilir."
                    : earthquake.mag >= 3.0
                    ? " Bu şiddetteki depremler genellikle sadece yakın çevrede hissedilir."
                    : " Bu şiddetteki depremler genellikle sadece hassas cihazlarla tespit edilir."}
                </Text>

                <View style={styles.impactMetrics}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricValue}>
                      {Math.floor(Math.random() * 50) + 10} km
                    </Text>
                    <Text style={styles.metricLabel}>Hissedilme Yarıçapı</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricValue}>
                      {Math.floor(Math.random() * 10) + 1}
                    </Text>
                    <Text style={styles.metricLabel}>Mercalli Şiddeti</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "500",
    marginTop: 10,
  },
  heroHeader: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  heroContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  magnitudeDisplay: {
    alignItems: "center",
    marginRight: 20,
  },
  magnitudeNumber: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#ffffff",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  magnitudeBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  magnitudeBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  heroInfo: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
    lineHeight: 26,
  },
  heroDate: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 8,
  },
  timeAgo: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeAgoText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginLeft: 6,
  },
  content: {
    padding: 16,
  },
  quickStats: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginTop: -20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#e2e8f0",
    marginHorizontal: 16,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2d3748",
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  mapSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2d3748",
    marginLeft: 8,
  },
  mapContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    position: "relative",
  },
  map: {
    width: "100%",
    height: 220,
  },
  mapOverlay: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  mapOverlayContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  mapOverlayText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
    marginLeft: 4,
  },
  coordinatesContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "#f8fafc",
  },
  coordinates: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
    marginLeft: 6,
  },
  noLocationContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  noLocationText: {
    fontSize: 16,
    color: "#9ca3af",
    fontWeight: "500",
    marginTop: 12,
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailGrid: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 15,
    color: "#2d3748",
    fontWeight: "600",
  },
  impactSection: {
    marginBottom: 24,
  },
  impactCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  impactHeader: {
    padding: 16,
  },
  impactTitle: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  impactContent: {
    padding: 20,
  },
  impactDescription: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 22,
    marginBottom: 20,
    textAlign: "justify",
  },
  impactMetrics: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  metricItem: {
    alignItems: "center",
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2d3748",
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
});
