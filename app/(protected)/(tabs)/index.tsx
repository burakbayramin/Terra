import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Divider } from "react-native-paper";
import React, { useState, useRef } from "react";
import { useSharedValue } from "react-native-reanimated";
import { ICarouselInstance } from "react-native-reanimated-carousel";
import { colors } from "@/constants/colors";
import EarthquakeCarousel from "@/components/EarthquakeCarousel"; // Import your carousel component
import { Earthquake } from "@/types/types";
import EarthquakeStats from "@/components/EarthquakeStats";

const { width } = Dimensions.get("window");
const CARD_HEIGHT = width * 0.5; // Adjust height based on width for better responsiveness

export default function HomeScreen() {
  const [activeSegment, setActiveSegment] = useState<
    "afad" | "kandilli" | "usgs"
  >("kandilli");
  const carouselRef = useRef<ICarouselInstance | null>(null);
  const progress = useSharedValue(0);

  // Format date function
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const { earthquakes }: { earthquakes: Earthquake[] } = require("@/data");

  // Dummy stats for earthquake statistics
  const stats = {
    last24Hours: 12,
    last7Days: 37,
    last30Days: 142,
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainHeader}>
        <Text style={styles.inboxText}>Terra</Text>
      </View>

      <View style={styles.segmentedControl}>
        <TouchableOpacity
          style={[
            styles.segmentButton,
            activeSegment === "afad" && styles.activeSegmentButton,
          ]}
          onPress={() => setActiveSegment("afad")}
        >
          <Text
            style={[
              styles.segmentText,
              activeSegment === "afad" && styles.activeSegmentText,
            ]}
          >
            AFAD
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.segmentButton,
            activeSegment === "kandilli" && styles.activeSegmentButton,
          ]}
          onPress={() => setActiveSegment("kandilli")}
        >
          <Text
            style={[
              styles.segmentText,
              activeSegment === "kandilli" && styles.activeSegmentText,
            ]}
          >
            Kandilli
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.segmentButton,
            activeSegment === "usgs" && styles.activeSegmentButton,
          ]}
          onPress={() => setActiveSegment("usgs")}
        >
          <Text
            style={[
              styles.segmentText,
              activeSegment === "usgs" && styles.activeSegmentText,
            ]}
          >
            USGS
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <View style={styles.carouselContainer}>
          <EarthquakeCarousel
            carouselData={earthquakes}
            filter={activeSegment}
            width={width}
            CARD_HEIGHT={CARD_HEIGHT}
            carouselRef={carouselRef}
            progress={progress}
            styles={carouselStyles}
            formatDate={formatDate}
          />
        </View>
        <Divider style={styles.divider} />
        <EarthquakeStats stats={stats} />
        <Divider style={styles.divider} />
        
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  content: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  mainHeader: {
    padding: 10,
    backgroundColor: colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.background,
    alignItems: "center",
    justifyContent: "center",
  },
  inboxText: {
    fontSize: 24,
    fontFamily: "NotoSans-Bold",
  },
  segmentedControl: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    marginBottom: 10,
    paddingHorizontal: 15,
  },
  segmentButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    position: "relative",
  },
  activeSegmentButton: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  segmentText: {
    fontSize: 14,
    color: "#808080",
    fontWeight: "500",
  },
  activeSegmentText: {
    color: "#000",
    fontWeight: "600",
  },
  carouselContainer: {
    marginBottom: 15,
  },
  divider: {
    height: 3,
    backgroundColor: colors.light.surface,
    marginHorizontal: 12,
    marginVertical: 20,
    borderRadius: 10,
  },
});

// Carousel specific styles
const carouselStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.light.surface,
    borderRadius: 16,
    overflow: "hidden",
    marginHorizontal: 10,
  },
  mapContainer: {
    height: CARD_HEIGHT,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
  },
  badge: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  info: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  date: {
    fontSize: 12,
    color: colors.light.textSecondary,
  },
  regionTag: {
    backgroundColor: colors.light.surface,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  regionTagText: {
    fontSize: 10,
    color: colors.light.textPrimary,
  },
  title: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: "600",
    color: colors.light.textPrimary,
  },
  depth: {
    marginTop: 2,
    fontSize: 12,
    color: colors.light.textSecondary,
  },
  button: {
    marginHorizontal: 12,
    marginBottom: 12,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  activeDot: {
    backgroundColor: colors.primary,
  },
});
