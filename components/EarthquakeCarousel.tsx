import React from "react";
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
}) => {
  const getMagnitudeColor = (magnitude: number) => {
    if (magnitude >= 5.0) return "#FF4444";
    if (magnitude >= 4.0) return "#FF8800";
    if (magnitude >= 3.0) return "#FFB800";
    return "#4CAF50";
  };

  return (
    <>
      <Carousel
        key={filter}
        loop
        autoPlay
        width={width}
        height={CARD_HEIGHT + 140}
        data={carouselData}
        ref={carouselRef}
        onProgressChange={progress}
        renderItem={({ item }) => (
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

            <TouchableOpacity>
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
        )}
      />
      <Pagination.Basic
        progress={progress}
        data={carouselData}
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
