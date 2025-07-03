import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import { Earthquake } from "@/types/types";
import MapView, { Marker } from "react-native-maps";
import {
  ScrollView,
  StyleSheet,
  Dimensions,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { colors } from "@/constants/colors";
import { Divider } from "react-native-paper";

export default function EarthquakesScreen() {
  const { width } = Dimensions.get("window");
  const mapHeight = 280;
  const router = useRouter();

  const region = {
    latitude: 39.0,
    longitude: 35.0,
    latitudeDelta: 12.5,
    longitudeDelta: 17.5,
  };

  const { earthquakes }: { earthquakes: Earthquake[] } = require("@/data");

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

  return (
    <SafeAreaView style={styles.container}>
      {/* <StatusBar barStyle="light-content" backgroundColor="#1a365d" /> */}
      <View style={styles.mainHeader}>
        <Text style={styles.inboxText}>Depremler</Text>
      </View>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Map Container */}
        <View style={styles.mapContainer}>
          <MapView
            style={[styles.map, { width: width - 32, height: mapHeight }]}
            initialRegion={region}
            showsUserLocation={false}
            showsMyLocationButton={false}
            toolbarEnabled={false}
          >
            {earthquakes.map((eq: Earthquake) => (
              <Marker
                key={eq.id}
                coordinate={{ latitude: eq.latitude, longitude: eq.longitude }}
                title={eq.title}
                description={`Büyüklük: ${eq.mag} - Derinlik: ${eq.depth} km`}
                pinColor={getMagnitudeColor(eq.mag)}
              />
            ))}
          </MapView>
        </View>
          <Divider style={styles.divider} />

        {/* Earthquake List */}
        <View style={styles.listContainer}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Deprem Listesi</Text>
          </View>

          {earthquakes.map((eq: Earthquake, index: number) => (
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
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Zaman</Text>
                    <Text style={styles.detailValue}>
                      {formatDate(eq.date)}
                    </Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Derinlik</Text>
                    <Text style={styles.detailValue}>{eq.depth} km</Text>
                  </View>
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
  divider: {
    height: 3,
    backgroundColor: colors.light.surface,
    marginHorizontal: 12,
    marginVertical: 15,
    borderRadius: 10,
  },
  // header: {
  //   backgroundColor: "#1a365d",
  //   paddingTop: 60,
  //   paddingBottom: 20,
  //   paddingHorizontal: 20,
  //   borderBottomLeftRadius: 20,
  //   borderBottomRightRadius: 20,
  //   shadowColor: "#000",
  //   shadowOffset: { width: 0, height: 4 },
  //   shadowOpacity: 0.1,
  //   shadowRadius: 8,
  //   elevation: 8,
  // },
  // headerTitle: {
  //   fontSize: 24,
  //   fontWeight: "bold",
  //   color: "#ffffff",
  //   marginBottom: 4,
  // },
  // headerSubtitle: {
  //   fontSize: 14,
  //   color: "#cbd5e0",
  //   opacity: 0.8,
  // },
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
  countBadge: {
    backgroundColor: "#4299e1",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  earthquakeCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 12,
    marginBottom: 16, // kartlar arası boşluk biraz artırıldı
    borderWidth: 1,
    borderColor: "#e2e8f0", // açık gri, modern görünüm
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    position: "relative",
  },
  firstCard: {
    // ...boş...
  },
  magnitudeChip: {
    position: "absolute",
    top: "50%",
    right: 12,
    transform: [{ translateY: -20 }], // Yüksekliğe göre ayarlanabilir
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 60,
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
    marginTop: 10, // İkonların altındaki boşluk için
  },
  inboxText: {
    fontSize: 25,
    fontWeight: "bold",
    flex: 1, // Inbox metninin ortalanması için
    textAlign: "center", // Inbox metnini ortalamak için
  },
});
