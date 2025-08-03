import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import MapView, { Marker, Circle } from "react-native-maps";
import Carousel, {
  Pagination,
  ICarouselInstance,
} from "react-native-reanimated-carousel";
import { Earthquake } from "@/types/types";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "@/constants/colors";

interface EarthquakeCarouselProps {
  carouselData: Earthquake[];
  filter: string;
  width: number;
  CARD_HEIGHT: number;
  carouselRef: React.RefObject<ICarouselInstance | null>;
  progress: any;
  styles: any;
  formatDate: (dateString: string) => string;
  isLoading?: boolean;
}

const EarthquakeCarousel: React.FC<EarthquakeCarouselProps> = ({
  carouselData,
  filter,
  width,
  CARD_HEIGHT,
  carouselRef,
  progress,
  styles,
  formatDate,
  isLoading = false,
}) => {
  const getMagnitudeColor = (magnitude: number) => {
    if (magnitude >= 5.0) return "#FF4444";
    if (magnitude >= 4.0) return "#FF8800";
    if (magnitude >= 3.0) return "#FFB800";
    return "#4CAF50";
  };

  // Filter earthquakes based on provider and limit to last 15
  const filteredData = carouselData.filter(earthquake => {
    if (filter === "afad") return earthquake.provider === "AFAD";
    if (filter === "kandilli") return earthquake.provider === "Kandilli";
    if (filter === "usgs") return earthquake.provider === "USGS";
    if (filter === "iris") return earthquake.provider === "IRIS";
    if (filter === "emsc") return earthquake.provider === "EMSC";
    return true; // Show all if no specific filter
  }).slice(0, 15); // Only show last 15 earthquakes

  // Debug: Log filtering results
  useEffect(() => {
    console.log(`Filter: ${filter}, Total data: ${carouselData.length}, Filtered: ${filteredData.length}`);
    if (filteredData.length === 0 && carouselData.length > 0) {
      console.log('Available providers in data:', [...new Set(carouselData.map(eq => eq.provider))]);
    }
  }, [filter, carouselData.length, filteredData.length]);

  // Use filtered data directly (no "more" item)
  const carouselDataWithMore = filteredData;

  // Show loading state or empty state
  if (isLoading) {
    return (
      <View style={[styles.card, { height: CARD_HEIGHT + 140, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 16, color: '#666' }}>Deprem verileri yükleniyor...</Text>
      </View>
    );
  }

  if (filteredData.length === 0) {
    return (
      <View style={[styles.card, { height: CARD_HEIGHT + 140, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 16, color: '#666' }}>
          {filter === "afad" ? "AFAD" : 
           filter === "kandilli" ? "KANDILLI" : 
           filter === "usgs" ? "USGS" : 
           filter === "iris" ? "IRIS" : 
           filter === "emsc" ? "EMSC" : ""} verisi bulunamadı
        </Text>
      </View>
    );
  }

  return (
    <>
      <Carousel
        key={filter}
        loop
        autoPlay
        autoPlayInterval={6000}
        width={width}
        height={CARD_HEIGHT + 140}
        data={carouselDataWithMore}
        ref={carouselRef}
        onProgressChange={progress}
        renderItem={({ item }) => {
          // Regular earthquake item
          return (
            <View style={styles.card}>
              <View style={styles.mapContainer}>
                <MapView
                  style={StyleSheet.absoluteFill}
                  initialRegion={{
                    latitude: item.latitude,
                    longitude: item.longitude,
                    latitudeDelta: 0.5,
                    longitudeDelta: 0.5,
                  }}
                  pointerEvents="none"
                >
                  <Marker
                    coordinate={{
                      latitude: item.latitude,
                      longitude: item.longitude,
                    }}
                  />
                  <Circle
                    center={{
                      latitude: item.latitude,
                      longitude: item.longitude,
                    }}
                    radius={20000}
                    fillColor={`${getMagnitudeColor(item.mag)}33`} // 20% opacity
                    strokeColor={`${getMagnitudeColor(item.mag)}80`} // 50% opacity
                  />
                </MapView>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: getMagnitudeColor(item.mag) },
                  ]}
                >
                  <Text style={styles.badgeText}>{item.mag}</Text>
                </View>

                {/* Region and Faultline badges in bottom right */}
                {(item.region && item.region.trim() !== '') || (item.faultline && item.faultline.trim() !== '') ? (
                  <View style={styles.bottomRightBadges}>
                    {item.region && item.region.trim() !== '' && (
                      <View style={styles.regionBadge}>
                        <Text style={styles.regionBadgeText}>{item.region}</Text>
                      </View>
                    )}
                    {item.faultline && item.faultline.trim() !== '' && (
                      <View style={styles.faultlineBadge}>
                        <Text style={styles.faultlineBadgeText}>
                          {item.faultline}
                        </Text>
                      </View>
                    )}
                  </View>
                ) : null}
              </View>

              <View style={styles.info}>
                <View style={styles.row}>
                  <Text style={styles.date}>{formatDate(item.date)}</Text>
                  <View style={styles.regionTag}>
                    <Text style={styles.regionTagText}></Text>
                  </View>
                </View>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.depth}>Derinlik: {item.depth} km</Text>
              </View>

              <TouchableOpacity
                onPress={() => {
                  const { router } = require("expo-router");
                  router.push({
                    pathname: `/(protected)/(tabs)/earthquakes/${item.id}`,
                    params: { source: 'carousel' }
                  });
                }}
              >
                <LinearGradient
                  colors={[colors.gradientOne, colors.gradientTwo]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.button}
                >
                  <Text style={styles.buttonText}>Detayları Göster</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          );
        }}
      />
      <Pagination.Basic
        progress={progress}
        data={carouselDataWithMore}
        size={5}
        containerStyle={styles.pagination}
        dotStyle={styles.dot}
        activeDotStyle={styles.activeDot}
        onPress={(i) =>
          carouselRef.current?.scrollTo({
            count: i - progress.value,
            animated: true,
          })
        }
      />
    </>
  );
};

export default EarthquakeCarousel;