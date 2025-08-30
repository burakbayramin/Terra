import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useEarthquakes } from "@/hooks/useEarthquakes";
import { colors } from "@/constants/colors";
import { Earthquake } from "@/types/types";

interface UserFeltEarthquakesProps {
  sectionStyles?: any;
}

const UserFeltEarthquakes: React.FC<UserFeltEarthquakesProps> = ({
  sectionStyles,
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const { data: earthquakes = [] } = useEarthquakes();

  const { data: userFeltEarthquakes, isLoading: isLoadingFeltEarthquakes } =
    useQuery({
      queryKey: ["user-felt-earthquakes", user?.id],
      queryFn: async () => {
        if (!user?.id) return [];

        const { data, error } = await supabase
          .from("earthquake_felt_reports")
          .select("earthquake_id, created_at")
          .eq("profile_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10);

        if (error) {
          console.error("Error fetching user felt earthquakes:", error);
          return [];
        }

        // Earthquake ID'leri ile gerçek deprem verilerini eşleştir
        const earthquakeIds = data?.map((report) => report.earthquake_id) || [];
        const filteredEarthquakes = earthquakes
          .filter((eq: Earthquake) => earthquakeIds.includes(eq.id))
          .map((eq: Earthquake) => {
            const report = data?.find((r) => r.earthquake_id === eq.id);
            return {
              ...eq,
              felt_at: report?.created_at,
            };
          });

        return filteredEarthquakes;
      },
      enabled: !!user?.id && earthquakes.length > 0,
      staleTime: 5 * 60 * 1000, // 5 dakika fresh
    });

  const getMagnitudeColor = (magnitude: number) => {
    if (magnitude >= 5.0) return "#FF4444";
    if (magnitude >= 4.0) return "#FF8800";
    if (magnitude >= 3.0) return "#FFB800";
    return "#4CAF50";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!user) return null;

  return (
    <View
      style={[
        styles.feltEarthquakesSection,
        sectionStyles?.feltEarthquakesSection,
      ]}
    >
      <Text style={[styles.sectionTitle, sectionStyles?.sectionTitle]}>
        Hissettiğim Depremler
      </Text>

      {isLoadingFeltEarthquakes ? (
        <View
          style={[
            styles.feltEarthquakesLoading,
            sectionStyles?.feltEarthquakesLoading,
          ]}
        >
          <ActivityIndicator size="small" color={colors.primary} />
          <Text
            style={[
              styles.feltEarthquakesLoadingText,
              sectionStyles?.feltEarthquakesLoadingText,
            ]}
          >
            Yükleniyor...
          </Text>
        </View>
      ) : userFeltEarthquakes && userFeltEarthquakes.length > 0 ? (
        <View
          style={[
            styles.feltEarthquakesContainer,
            sectionStyles?.feltEarthquakesContainer,
          ]}
        >
          <FlashList
            data={userFeltEarthquakes}
            horizontal
            showsHorizontalScrollIndicator={false}
            estimatedItemSize={316}
            keyExtractor={(item) => `${item.id}-${item.felt_at}`}
            contentContainerStyle={{}}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.feltEarthquakeCard,
                  sectionStyles?.feltEarthquakeCard,
                ]}
                activeOpacity={0.8}
                onPress={() =>
                  router.push(`/(protected)/(tabs)/earthquakes/${item.id}`)
                }
              >
                <View
                  style={[
                    styles.feltEarthquakeHeader,
                    sectionStyles?.feltEarthquakeHeader,
                  ]}
                >
                  <View
                    style={[
                      styles.feltEarthquakeMagnitude,
                      sectionStyles?.feltEarthquakeMagnitude,
                      {
                        backgroundColor: getMagnitudeColor(item.mag),
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.feltEarthquakeMagnitudeText,
                        sectionStyles?.feltEarthquakeMagnitudeText,
                      ]}
                    >
                      {item.mag.toFixed(1)}
                    </Text>
                  </View>
                </View>

                <Text
                  style={[
                    styles.feltEarthquakeTitle,
                    sectionStyles?.feltEarthquakeTitle,
                  ]}
                  numberOfLines={2}
                >
                  {item.title}
                </Text>

                <View
                  style={[
                    styles.feltEarthquakeDetails,
                    sectionStyles?.feltEarthquakeDetails,
                  ]}
                >
                  <View
                    style={[
                      styles.feltEarthquakeDetailItem,
                      sectionStyles?.feltEarthquakeDetailItem,
                    ]}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={12}
                      color="#6b7280"
                    />
                    <Text
                      style={[
                        styles.feltEarthquakeDetailText,
                        sectionStyles?.feltEarthquakeDetailText,
                      ]}
                    >
                      {formatDate(item.date)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.feltEarthquakeDetailItem,
                      sectionStyles?.feltEarthquakeDetailItem,
                    ]}
                  >
                    <Ionicons name="time-outline" size={12} color="#6b7280" />
                    <Text
                      style={[
                        styles.feltEarthquakeDetailText,
                        sectionStyles?.feltEarthquakeDetailText,
                      ]}
                    >
                      {formatTime(item.date)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.feltEarthquakeDetailItem,
                      sectionStyles?.feltEarthquakeDetailItem,
                    ]}
                  >
                    <Ionicons name="layers-outline" size={12} color="#6b7280" />
                    <Text
                      style={[
                        styles.feltEarthquakeDetailText,
                        sectionStyles?.feltEarthquakeDetailText,
                      ]}
                    >
                      {item.depth} km
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.feltEarthquakeFooter,
                    sectionStyles?.feltEarthquakeFooter,
                  ]}
                >
                  <Text
                    style={[
                      styles.feltEarthquakeFeltDate,
                      sectionStyles?.feltEarthquakeFeltDate,
                    ]}
                  >
                    {new Date(item.felt_at).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    tarihinde hissettim
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      ) : (
        <View
          style={[
            styles.feltEarthquakesEmpty,
            sectionStyles?.feltEarthquakesEmpty,
          ]}
        >
          <Ionicons name="heart-outline" size={48} color="#cbd5e0" />
          <Text
            style={[
              styles.feltEarthquakesEmptyTitle,
              sectionStyles?.feltEarthquakesEmptyTitle,
            ]}
          >
            Henüz deprem hissetmediniz
          </Text>
          <Text
            style={[
              styles.feltEarthquakesEmptyDescription,
              sectionStyles?.feltEarthquakesEmptyDescription,
            ]}
          >
            Deprem detaylarına giderek hissettiğiniz depremleri
            işaretleyebilirsiniz
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  feltEarthquakesSection: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    marginHorizontal: 16,
    color: "#1a202c",
  },
  feltEarthquakesLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  feltEarthquakesLoadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#6b7280",
  },
  feltEarthquakesContainer: {
    paddingLeft: 16,
  },
  feltEarthquakeCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 300,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  feltEarthquakeHeader: {
    alignItems: "flex-start",
    marginBottom: 12,
  },
  feltEarthquakeMagnitude: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  feltEarthquakeMagnitudeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  feltEarthquakeTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a202c",
    marginBottom: 12,
    lineHeight: 18,
  },
  feltEarthquakeDetails: {
    marginBottom: 12,
  },
  feltEarthquakeDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  feltEarthquakeDetailText: {
    fontSize: 12,
    color: "#6b7280",
    marginLeft: 6,
  },
  feltEarthquakeFooter: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 8,
  },
  feltEarthquakeFeltDate: {
    fontSize: 11,
    color: "#9ca3af",
    fontStyle: "italic",
    textAlign: "center",
  },
  feltEarthquakesEmpty: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  feltEarthquakesEmptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginTop: 12,
    marginBottom: 8,
  },
  feltEarthquakesEmptyDescription: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
  },
});

export default UserFeltEarthquakes;
