import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Image,
  Linking,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Divider } from "react-native-paper";
import {
  AntDesign,
  Feather,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "expo-router";
import { useSharedValue } from "react-native-reanimated";
import { ICarouselInstance } from "react-native-reanimated-carousel";
import { colors } from "@/constants/colors";
import EarthquakeCarousel from "@/components/EarthquakeCarousel";
import { Earthquake } from "@/types/types";
import { news } from "data";
import EarthquakeStats from "@/components/EarthquakeStats";
import { FlashList } from "@shopify/flash-list";
import { LinearGradient } from "expo-linear-gradient";
import EmergencyButton from "@/components/EmergencyButton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useEarthquakes } from "@/hooks/useEarthquakes";
import { useLocation } from "@/hooks/useLocation";

// Yeni düzenlenmiş görev verisi (sabit)
const taskData = [
  {
    id: "1",
    title: "Profili Tamamla",
    percentage: 75,
    icon: "person-circle",
    category: "profile",
    description: "Kişisel bilgilerini güncelle",
  },
  {
    id: "2",
    title: "İlk Yardım Çantanı Hazırla",
    icon: "medical",
    category: "preparation",
    description: "Acil durum malzemelerini hazırla",
  },
  {
    id: "3",
    title: "Depremde Ne Yapılmalı?",
    icon: "shield-checkmark",
    category: "education",
    description: "Temel deprem bilgilerini öğren",
  },
  {
    id: "4",
    title: "Acil Durum Numaraları",
    icon: "call",
    category: "emergency",
    description: "Önemli telefon numaralarını kaydet",
  },
  {
    id: "5",
    title: "Acil Toplanma Alanları",
    icon: "location",
    category: "location",
    description: "Yakın toplanma noktalarını belirle",
  },
  {
    id: "6",
    title: "Ev Güvenliği Kontrolü",
    icon: "home",
    category: "safety",
    description: "Evin deprem güvenliğini kontrol et",
  },
  {
    id: "7",
    title: "Acil Durum Çıkışları",
    icon: "exit",
    category: "safety",
    description: "Güvenli çıkış yollarını planla",
  },
  {
    id: "8",
    title: "Acil Durum Kiti Önerileri",
    icon: "bag",
    category: "preparation",
    description: "Hayatta kalma kiti hazırla",
  },
];

const { width } = Dimensions.get("window");
const CARD_HEIGHT = width * 0.6; // Adjust height based on width for better responsiveness

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    getAndSaveLocation,
    hasPermission,
    requestLocationPermission,
    authLoading,
  } = useLocation();
  const [activeSegment, setActiveSegment] = useState<
    "afad" | "kandilli" | "usgs"
  >("kandilli");
  const carouselRef = useRef<ICarouselInstance | null>(null);
  const progress = useSharedValue(0);

  //Temp eklendi
  const [securityScore] = useState(78);

  // Deprem verileri
  const { data: earthquakeData = [] } = useEarthquakes();

  // Kullanıcının hissettiği depremler
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
        const filteredEarthquakes = earthquakeData
          .filter((eq) => earthquakeIds.includes(eq.id))
          .map((eq) => {
            const report = data?.find((r) => r.earthquake_id === eq.id);
            return {
              ...eq,
              felt_at: report?.created_at,
            };
          });

        return filteredEarthquakes;
      },
      enabled: !!user?.id && earthquakeData.length > 0,
      staleTime: 5 * 60 * 1000, // 5 dakika fresh
    });

  // Güvenlik skoru renk fonksiyonu
  const getScoreColor = (score: number): string => {
    if (score >= 85) return "#27ae60"; // Koyu Yeşil
    if (score >= 70) return "#2ecc71"; // Açık Yeşil
    if (score >= 55) return "#f1c40f"; // Sarı
    if (score >= 40) return "#f39c12"; // Koyu Sarı/Altın
    if (score >= 25) return "#e67e22"; // Turuncu
    if (score >= 10) return "#e74c3c"; // Kırmızı
    return "#c0392b"; // Koyu Kırmızı
  };

  // Görevler için state: visibleTasks ve nextTaskIndex
  const [visibleTasks, setVisibleTasks] = useState(() => taskData.slice(0, 4));
  const [nextTaskIndex, setNextTaskIndex] = useState(4);

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

  const { sendEmergencySMS, loading } = EmergencyButton();

  // AI sorulari için örnek veriler
  const aiQuestions = [
    { id: "1", question: "Depremde ne yapmalıyım?" },
    { id: "2", question: "En yakın toplanma alanı nerede?" },
    { id: "3", question: "Deprem çantasında neler olmalı?" },
    { id: "4", question: "Deprem anında evdeysem ne yapmalıyım?" },
    { id: "5", question: "Afet sonrası iletişim nasıl sağlanır?" },
  ];

  // ...

  // Yardımcı fonksiyonlar
  const getCategoryColor = (category: string) => {
    const categoryColors = {
      profile: "#3498db",
      preparation: "#e74c3c",
      education: "#f39c12",
      emergency: "#e67e22",
      location: "#9b59b6",
      safety: "#27ae60",
    };
    return (
      (categoryColors as Record<string, string>)[category] || colors.primary
    );
  };

  const getCategoryName = (category: string) => {
    const categoryNames = {
      profile: "Profil",
      preparation: "Hazırlık",
      education: "Eğitim",
      emergency: "Acil Durum",
      location: "Konum",
      safety: "Güvenlik",
    };
    return (categoryNames as Record<string, string>)[category] || "Genel";
  };

  // Bildirim ayarları için state'ler (diğer state'lerin yanına ekleyin)
  const [magnitudeNotification, setMagnitudeNotification] = useState(true);
  const [selectedMagnitude, setSelectedMagnitude] = useState("4.0");
  const [locationNotification, setLocationNotification] = useState(true);
  const [selectedDistance, setSelectedDistance] = useState("50");
  const [criticalNotification, setCriticalNotification] = useState(true);

  // Sayfa yüklendiğinde kullanıcının konumunu al ve kaydet
  useEffect(() => {
    const handleLocationOnLoad = async () => {
      // Auth loading durumunu bekle
      if (authLoading) {
        console.log("Auth still loading, waiting...");
        return;
      }

      if (user) {
        try {
          // Konum iznini kontrol et veya iste
          if (!hasPermission) {
            // Kullanıcıya konum izni hakkında bilgi ver
            Alert.alert(
              "Konum İzni",
              "Terra uygulaması size yakın depremleri gösterebilmek ve acil durumlarda konumunuzu paylaşabilmek için konum bilginize ihtiyaç duyar.",
              [
                {
                  text: "İptal",
                  style: "cancel",
                },
                {
                  text: "İzin Ver",
                  onPress: async () => {
                    const permissionGranted = await requestLocationPermission();
                    if (permissionGranted) {
                      const success = await getAndSaveLocation();
                      if (success) {
                        console.log("Konum başarıyla kaydedildi");
                      }
                    }
                  },
                },
              ]
            );
          } else {
            // İzin zaten varsa konumu al ve kaydet
            const success = await getAndSaveLocation();
            if (success) {
              console.log("Konum başarıyla kaydedildi");
            } else {
              console.log("Konum kaydedilemedi");
            }
          }
        } catch (error) {
          console.error("Konum alma hatası:", error);
        }
      }
    };

    handleLocationOnLoad();
  }, [user, authLoading]); // authLoading'i de dependency'e ekle

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainHeader}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.headerIconContainer}
              onPress={() => router.push("/(protected)/profile")}
            >
              <Feather name="user" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.inboxText}>TERRA</Text>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[
                styles.securityScoreChip,
                { borderColor: getScoreColor(securityScore) },
              ]}
              activeOpacity={0.7}
              onPress={() => {
                // router.push("/(protected)/security-score");
              }}
            >
              <MaterialCommunityIcons
                name="shield-check"
                size={16}
                color={getScoreColor(securityScore)}
              />
              <Text
                style={[
                  styles.securityScoreText,
                  { color: getScoreColor(securityScore) },
                ]}
              >
                % {securityScore}
              </Text>
            </TouchableOpacity>
          </View>
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
          <EarthquakeStats />
          <Divider style={styles.divider} />
          {/* Quick Access Buttons */}
          <Text style={styles.sectionTitle}>Hızlı Erişim</Text>
          <View style={styles.quickAccessContainer}>
            <TouchableOpacity
              style={[styles.quickAccessButton, { backgroundColor: "#e74c3c" }]}
              activeOpacity={0.8}
              onPress={sendEmergencySMS}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="home-alert"
                    size={28}
                    color="#fff"
                    style={{ marginBottom: 4 }}
                  />
                  <Text style={styles.quickAccessText}>Tehlikedeyim</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickAccessButton, { backgroundColor: "#f39c12" }]}
              activeOpacity={0.8}
              onPress={() => {
                router.push("/(protected)/whistle");
              }}
            >
              <MaterialCommunityIcons
                name="whistle"
                size={28}
                color="#fff"
                style={{ marginBottom: 4 }}
              />
              <Text style={styles.quickAccessText}>Deprem Düdüğü</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickAccessButton, { backgroundColor: "#27ae60" }]}
              activeOpacity={0.8}
              onPress={() => {
                router.push("/(protected)/first-aid");
              }}
            >
              <Ionicons
                name="medkit"
                size={28}
                color="#fff"
                style={{ marginBottom: 4 }}
              />
              <Text style={styles.quickAccessText}>İlk Yardım</Text>
            </TouchableOpacity>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.aiQuestionsSection}>
            <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>
              AI'a Sor
            </Text>
            <FlashList
              data={aiQuestions}
              horizontal
              estimatedItemSize={220}
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{
                paddingHorizontal: 8,
                paddingVertical: 2,
              }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    // Soru seçildiğinde yapılacak işlem
                  }}
                >
                  <LinearGradient
                    colors={[colors.gradientOne, colors.gradientTwo]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.aiQuestionCard}
                  >
                    <Text style={styles.aiQuestionText}>{item.question}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            />
          </View>

          <Divider style={styles.divider} />

          {/* Kullanıcının hissettiği deprem listesi */}
          {user && (
            <View style={styles.feltEarthquakesSection}>
              <Text style={styles.sectionTitle}>Hissettiğim Depremler</Text>

              {isLoadingFeltEarthquakes ? (
                <View style={styles.feltEarthquakesLoading}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.feltEarthquakesLoadingText}>
                    Yükleniyor...
                  </Text>
                </View>
              ) : userFeltEarthquakes && userFeltEarthquakes.length > 0 ? (
                <View style={styles.feltEarthquakesContainer}>
                  <FlashList
                    data={userFeltEarthquakes}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    estimatedItemSize={280}
                    keyExtractor={(item) => `${item.id}-${item.felt_at}`}
                    contentContainerStyle={{}}
                    renderItem={({ item }) => {
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

                      return (
                        <TouchableOpacity
                          style={styles.feltEarthquakeCard}
                          activeOpacity={0.8}
                          onPress={() =>
                            router.push(
                              `/(protected)/(tabs)/earthquakes/${item.id}`
                            )
                          }
                        >
                          <View style={styles.feltEarthquakeHeader}>
                            <View
                              style={[
                                styles.feltEarthquakeMagnitude,
                                {
                                  backgroundColor: getMagnitudeColor(item.mag),
                                },
                              ]}
                            >
                              <Text style={styles.feltEarthquakeMagnitudeText}>
                                {item.mag.toFixed(1)}
                              </Text>
                            </View>
                          </View>

                          <Text
                            style={styles.feltEarthquakeTitle}
                            numberOfLines={2}
                          >
                            {item.title}
                          </Text>

                          <View style={styles.feltEarthquakeDetails}>
                            <View style={styles.feltEarthquakeDetailItem}>
                              <Ionicons
                                name="calendar-outline"
                                size={12}
                                color="#6b7280"
                              />
                              <Text style={styles.feltEarthquakeDetailText}>
                                {formatDate(item.date)}
                              </Text>
                            </View>
                            <View style={styles.feltEarthquakeDetailItem}>
                              <Ionicons
                                name="time-outline"
                                size={12}
                                color="#6b7280"
                              />
                              <Text style={styles.feltEarthquakeDetailText}>
                                {formatTime(item.date)}
                              </Text>
                            </View>
                            <View style={styles.feltEarthquakeDetailItem}>
                              <Ionicons
                                name="layers-outline"
                                size={12}
                                color="#6b7280"
                              />
                              <Text style={styles.feltEarthquakeDetailText}>
                                {item.depth} km
                              </Text>
                            </View>
                          </View>

                          <View style={styles.feltEarthquakeFooter}>
                            <Text style={styles.feltEarthquakeFeltDate}>
                              {new Date(item.felt_at).toLocaleDateString(
                                "tr-TR",
                                {
                                  day: "numeric",
                                  month: "short",
                                }
                              )}{" "}
                              tarihinde hissettim
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    }}
                  />
                </View>
              ) : (
                <View style={styles.feltEarthquakesEmpty}>
                  <Ionicons name="heart-outline" size={48} color="#cbd5e0" />
                  <Text style={styles.feltEarthquakesEmptyTitle}>
                    Henüz deprem hissetmediniz
                  </Text>
                  <Text style={styles.feltEarthquakesEmptyDescription}>
                    Deprem detaylarına giderek hissettiğiniz depremleri
                    işaretleyebilirsiniz
                  </Text>
                </View>
              )}
            </View>
          )}

          <Divider style={styles.divider} />

          {/* Bildirim Ayarları */}
          <View style={styles.notificationSection}>
            <Text style={styles.sectionTitle}>Bildirim Ayarları</Text>

            {/* 1. Anlık Deprem Bildirimi */}
            <View style={styles.notificationCard}>
              <View style={styles.notificationHeader}>
                <View style={styles.notificationIconContainer}>
                  <MaterialCommunityIcons
                    name="earth"
                    size={24}
                    color={magnitudeNotification ? colors.primary : "#ccc"}
                  />
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>
                    Anlık Deprem Bildirimi
                  </Text>
                  <Text style={styles.notificationDescription}>
                    Belirlediğiniz büyüklükteki tüm depremler için bildirim
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.toggle,
                    magnitudeNotification
                      ? styles.toggleActive
                      : styles.toggleInactive,
                  ]}
                  onPress={() =>
                    setMagnitudeNotification(!magnitudeNotification)
                  }
                >
                  <View
                    style={[
                      styles.toggleCircle,
                      magnitudeNotification
                        ? styles.toggleCircleActive
                        : styles.toggleCircleInactive,
                    ]}
                  />
                </TouchableOpacity>
              </View>

              {magnitudeNotification && (
                <View style={styles.notificationOptions}>
                  <Text style={styles.optionsLabel}>Büyüklük Eşiği:</Text>
                  <View style={styles.optionsRow}>
                    {["3.0", "4.0", "5.0", "6.0"].map((magnitude) => (
                      <TouchableOpacity
                        key={magnitude}
                        style={[
                          styles.optionButton,
                          selectedMagnitude === magnitude &&
                            styles.optionButtonActive,
                        ]}
                        onPress={() => setSelectedMagnitude(magnitude)}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            selectedMagnitude === magnitude &&
                              styles.optionTextActive,
                          ]}
                        >
                          +{magnitude}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* 2. Konuma Göre Deprem Bildirimi */}
            <View style={styles.notificationCard}>
              <View style={styles.notificationHeader}>
                <View style={styles.notificationIconContainer}>
                  <Ionicons
                    name="location"
                    size={24}
                    color={locationNotification ? colors.primary : "#ccc"}
                  />
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>
                    Konuma Göre Deprem Bildirimi
                  </Text>
                  <Text style={styles.notificationDescription}>
                    Konumunuza yakın tüm depremler için bildirim
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.toggle,
                    locationNotification
                      ? styles.toggleActive
                      : styles.toggleInactive,
                  ]}
                  onPress={() => setLocationNotification(!locationNotification)}
                >
                  <View
                    style={[
                      styles.toggleCircle,
                      locationNotification
                        ? styles.toggleCircleActive
                        : styles.toggleCircleInactive,
                    ]}
                  />
                </TouchableOpacity>
              </View>

              {locationNotification && (
                <View style={styles.notificationOptions}>
                  <Text style={styles.optionsLabel}>Mesafe:</Text>
                  <View style={styles.optionsRow}>
                    {["25", "50", "100"].map((distance) => (
                      <TouchableOpacity
                        key={distance}
                        style={[
                          styles.optionButton,
                          selectedDistance === distance &&
                            styles.optionButtonActive,
                        ]}
                        onPress={() => setSelectedDistance(distance)}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            selectedDistance === distance &&
                              styles.optionTextActive,
                          ]}
                        >
                          {distance === "İl" ? "İl Sınırları" : `${distance}km`}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* 3. Kritik Büyüklükteki Depremler */}
            <View style={styles.notificationCard}>
              <View style={styles.notificationHeader}>
                <View style={styles.notificationIconContainer}>
                  <MaterialCommunityIcons
                    name="alert-circle"
                    size={24}
                    color={criticalNotification ? "#e74c3c" : "#ccc"}
                  />
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>
                    Kritik Büyüklükteki Depremler
                  </Text>
                  <Text style={styles.notificationDescription}>
                    Büyük depremler için her zaman bildirim (5.5+)
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.toggle,
                    criticalNotification
                      ? styles.toggleActive
                      : styles.toggleInactive,
                  ]}
                  onPress={() => setCriticalNotification(!criticalNotification)}
                >
                  <View
                    style={[
                      styles.toggleCircle,
                      criticalNotification
                        ? styles.toggleCircleActive
                        : styles.toggleCircleInactive,
                    ]}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.detailedSettingsButton}
              onPress={() => {
                // router.push("/(protected)/notification-settings");
              }}
            >
              <Text style={styles.detailedSettingsText}>
                Detaylı Bildirim Ayarları
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>

          <Divider style={styles.divider} />

          {/* Yeni Görevler ve Bilgilendirme Bölümü */}
          <View style={styles.tasksSection}>
            <Text style={styles.sectionTitle}>Görevler ve Bilgilendirme</Text>
            <View style={styles.tasksGrid}>
              {visibleTasks.map((task, index) => (
                <TouchableOpacity
                  key={task.id}
                  style={[
                    styles.taskCardNew,
                    index % 2 === 0
                      ? styles.taskCardLeft
                      : styles.taskCardRight,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => {
                    // Görev tamamlandı: kutuyu kaldır ve sıradaki görevi ekle
                    setVisibleTasks((prev) => {
                      const newTasks = prev.filter((t) => t.id !== task.id);
                      // Sıradaki görev var mı?
                      if (nextTaskIndex < taskData.length) {
                        newTasks.push(taskData[nextTaskIndex]);
                        setNextTaskIndex((idx) => idx + 1);
                      }
                      return newTasks;
                    });
                  }}
                >
                  <View style={styles.taskCardContent}>
                    <View style={styles.taskHeader}>
                      <View
                        style={[
                          styles.taskIconContainer,
                          { backgroundColor: getCategoryColor(task.category) },
                        ]}
                      >
                        <Ionicons
                          name={task.icon as any}
                          size={20}
                          color="#fff"
                        />
                      </View>
                      {task.percentage && (
                        <View style={styles.progressContainer}>
                          <Text style={styles.progressText}>
                            {task.percentage}%
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.taskTitleNew}>{task.title}</Text>
                    <Text style={styles.taskDescription}>
                      {task.description}
                    </Text>
                    {task.percentage && (
                      <View style={styles.progressBarContainer}>
                        <View style={styles.progressBarBackground}>
                          <View
                            style={[
                              styles.progressBarFill,
                              {
                                width: `${task.percentage}%`,
                                backgroundColor: getCategoryColor(
                                  task.category
                                ),
                              },
                            ]}
                          />
                        </View>
                      </View>
                    )}
                    <View style={styles.taskFooter}>
                      <Text style={styles.categoryTag}>
                        {getCategoryName(task.category)}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={colors.light.textSecondary}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Divider style={styles.divider} />

          {/* Yakında Çıkacak Özellikler */}
          <View style={styles.comingSoonSection}>
            <Text style={styles.sectionTitle}>Yakında Çıkacak Özellikler</Text>
            <View style={styles.comingSoonGrid}>
              <View style={styles.comingSoonCard}>
                <LinearGradient
                  colors={["#667eea", "#764ba2"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.comingSoonGradient}
                >
                  <View style={styles.comingSoonIconContainer}>
                    <Ionicons name="warning" size={24} color="#fff" />
                  </View>
                  <Text style={styles.comingSoonTitle}>Erken Uyarı</Text>
                  <Text style={styles.comingSoonDescription}>
                    Deprem erken uyarı sistemi
                  </Text>
                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonBadgeText}>Yakında</Text>
                  </View>
                </LinearGradient>
              </View>

              <View style={styles.comingSoonCard}>
                <LinearGradient
                  colors={["#f093fb", "#f5576c"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.comingSoonGradient}
                >
                  <View style={styles.comingSoonIconContainer}>
                    <Ionicons name="people" size={24} color="#fff" />
                  </View>
                  <Text style={styles.comingSoonTitle}>Topluluk</Text>
                  <Text style={styles.comingSoonDescription}>
                    Kullanıcılar arası deneyim paylaşımı
                  </Text>
                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonBadgeText}>
                      Geliştiriliyor
                    </Text>
                  </View>
                </LinearGradient>
              </View>

              <View style={styles.comingSoonCard}>
                <LinearGradient
                  colors={["#4facfe", "#00f2fe"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.comingSoonGradient}
                >
                  <View style={styles.comingSoonIconContainer}>
                    <Ionicons name="document-text" size={24} color="#fff" />
                  </View>
                  <Text style={styles.comingSoonTitle}>Rapor</Text>
                  <Text style={styles.comingSoonDescription}>
                    Bölgesel deprem sıklığı raporlaması
                  </Text>
                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonBadgeText}>
                      Geliştiriliyor
                    </Text>
                  </View>
                </LinearGradient>
              </View>

              <View style={styles.comingSoonCard}>
                <LinearGradient
                  colors={["#fa709a", "#fee140"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.comingSoonGradient}
                >
                  <View style={styles.comingSoonIconContainer}>
                    <Ionicons name="alert-circle" size={24} color="#fff" />
                  </View>
                  <Text style={styles.comingSoonTitle}>Sarsıntı Alarm</Text>
                  <Text style={styles.comingSoonDescription}>
                    Yüksek hassasiyetli sarsıntı alarmı
                  </Text>
                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonBadgeText}>Yakında</Text>
                  </View>
                </LinearGradient>
              </View>
            </View>
          </View>

          <Divider style={styles.divider} />

          {/* haberler */}
          <View style={styles.newsSection}>
            <Text style={styles.sectionTitle}>Haberler</Text>
            <FlashList
              data={news}
              horizontal
              showsHorizontalScrollIndicator={false}
              estimatedItemSize={200}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: 12 }}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.newsCard} activeOpacity={0.8}>
                  <Image
                    source={{ uri: item.image }}
                    style={styles.newsImage}
                    resizeMode="cover"
                  />
                  <View style={styles.newsOverlay}>
                    <Text style={styles.newsSnippet} numberOfLines={2}>
                      {item.snippet}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>

          <Divider style={styles.divider} />
          {/* Depremzedelere Destek Ol */}
          <View style={styles.supportContainer}>
            <LinearGradient
              colors={["#ff6b6b", "#ff8e8e", "#ffb3b3"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.supportGradientContainer}
            >
              <View style={styles.supportHeader}>
                <Ionicons
                  name="heart"
                  size={32}
                  color="#fff"
                  style={styles.supportIcon}
                />
                <Text style={styles.supportTitle}>
                  Depremzedelere Destek Ol
                </Text>
                <Text style={styles.supportSubtitle}>
                  Birlikte daha güçlüyüz
                </Text>
              </View>

              <View style={styles.supportContentNew}>
                <Text style={styles.supportTextNew}>
                  Depremden etkilenenlere yardım etmek için çeşitli kuruluşlara
                  bağışta bulunabilir veya gönüllü olabilirsiniz. Küçük bir
                  destek bile büyük bir fark yaratabilir.
                </Text>

                <View style={styles.supportButtonsContainer}>
                  <TouchableOpacity
                    style={styles.fullWidthSupportButton}
                    activeOpacity={0.7}
                    onPress={() => {
                      Linking.openURL(
                        "https://www.afad.gov.tr/depremkampanyasi2"
                      );
                    }}
                  >
                    <LinearGradient
                      colors={["#fff", "#f8f9fa"]}
                      style={styles.supportButtonGradient}
                    >
                      <Ionicons
                        name="heart"
                        size={20}
                        color="#ff6b6b"
                        style={{ marginRight: 8 }}
                      />
                      <Text style={styles.primarySupportButtonText}>
                        Bağış Yap
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.supportContainer}>
            <LinearGradient
              colors={["#4a90e2", "#5ba3f5", "#7bb8ff"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.supportGradientContainer}
            >
              <View style={styles.supportHeader}>
                <Ionicons
                  name="code-slash"
                  size={32}
                  color="#fff"
                  style={styles.supportIcon}
                />
                <Text style={styles.supportTitle}>
                  Geliştiricilere Destek Ol
                </Text>
                <Text style={styles.supportSubtitle}>
                  Açık kaynak projeye katkı
                </Text>
              </View>

              <View style={styles.supportContentNew}>
                <Text style={styles.supportTextNew}>
                  Terra uygulaması topluluk katkılarıyla geliştirilmektedir.
                  Deprem bilinci ve güvenliği için daha iyi özellikler
                  geliştirmemize yardımcı olabilirsiniz.
                </Text>

                <View style={styles.supportButtonsContainer}>
                  <TouchableOpacity
                    style={styles.fullWidthSupportButton}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={["#fff", "#f8f9fa"]}
                      style={styles.supportButtonGradient}
                    >
                      <Ionicons
                        name="cafe"
                        size={20}
                        color="#4a90e2"
                        style={{ marginRight: 8 }}
                      />
                      <Text
                        style={[
                          styles.primarySupportButtonText,
                          { color: "#4a90e2" },
                        ]}
                      >
                        Destek Ol
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* İletişime Geç */}
          <View style={styles.supportContainer}>
            <LinearGradient
              colors={["#10b981", "#34d399", "#6ee7b7"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.supportGradientContainer}
            >
              <View style={styles.supportHeader}>
                <Ionicons
                  name="mail"
                  size={32}
                  color="#fff"
                  style={styles.supportIcon}
                />
                <Text style={styles.supportTitle}>İletişime Geç</Text>
                <Text style={styles.supportSubtitle}>
                  Bizimle iletişime geçin
                </Text>
              </View>

              <View style={styles.supportContentNew}>
                <Text style={styles.supportTextNew}>
                  Sorularınız, önerileriniz veya geri bildirimleriniz için
                  bizimle iletişime geçebilirsiniz. Size yardımcı olmaktan
                  mutluluk duyarız.
                </Text>

                <View style={styles.supportButtonsContainer}>
                  <TouchableOpacity
                    style={styles.fullWidthSupportButton}
                    activeOpacity={0.7}
                    onPress={() => {
                      // İletişim formuna yönlendirme veya mail açma işlemi
                    }}
                  >
                    <LinearGradient
                      colors={["#fff", "#f8f9fa"]}
                      style={styles.supportButtonGradient}
                    >
                      <Ionicons
                        name="send"
                        size={20}
                        color="#10b981"
                        style={{ marginRight: 8 }}
                      />
                      <Text
                        style={[
                          styles.primarySupportButtonText,
                          { color: "#10b981" },
                        ]}
                      >
                        İletişime Geç
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Mevcut styles objesinin sonuna ekleyin (son } parantezinden önce)
  notificationSection: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: colors.light.background,
  },
  notificationCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  notificationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.light.textPrimary,
    marginBottom: 4,
    fontFamily: "NotoSans-Bold",
  },
  notificationDescription: {
    fontSize: 13,
    color: colors.light.textSecondary,
    lineHeight: 18,
    fontFamily: "NotoSans-Regular",
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    padding: 2,
  },
  toggleActive: {
    backgroundColor: colors.primary,
  },
  toggleInactive: {
    backgroundColor: "#e0e0e0",
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleCircleActive: {
    alignSelf: "flex-end",
  },
  toggleCircleInactive: {
    alignSelf: "flex-start",
  },
  notificationOptions: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  optionsLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.light.textPrimary,
    marginBottom: 8,
    fontFamily: "NotoSans-Medium",
  },
  optionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    alignItems: "center",
  },
  optionButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.light.textSecondary,
    fontFamily: "NotoSans-Medium",
  },
  optionTextActive: {
    color: "#fff",
  },
  detailedSettingsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8f9fa",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  detailedSettingsText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary,
    fontFamily: "NotoSans-Medium",
  },
  securityScoreChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.light.background,
    borderWidth: 2,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  securityScoreText: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "NotoSans-Bold",
  },
  quickAccessContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 18,
    marginBottom: 8,
    gap: 10,
  },
  quickAccessButton: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
    marginHorizontal: 4,
  },
  quickAccessText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
    fontFamily: "NotoSans-Bold",
    textAlign: "center",
  },
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  content: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  scrollView: {
    flex: 1,
  },
  mainHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    marginBottom: 10,
    marginTop: 15,
  },
  inboxText: {
    fontSize: 25,
    fontFamily: "NotoSans-Bold",
    textAlign: "center",
  },
  headerLeft: {
    flex: 1,
    alignItems: "flex-start",
  },
  headerRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  headerIconContainer: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: colors.light.background,
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

  // Yeni Görevler Bölümü Stilleri
  tasksSection: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: colors.light.background,
  },
  tasksGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  taskCardNew: {
    backgroundColor: "#fff",
    width: "48.5%",
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  taskCardLeft: {
    marginRight: "1.5%",
  },
  taskCardRight: {
    marginLeft: "1.5%",
  },
  taskCardContent: {
    padding: 16,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  taskIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  progressContainer: {
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  progressText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  taskTitleNew: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.light.textPrimary,
    marginBottom: 6,
    fontFamily: "NotoSans-Bold",
    lineHeight: 20,
  },
  taskDescription: {
    fontSize: 13,
    color: colors.light.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
    fontFamily: "NotoSans-Regular",
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: "#e9ecef",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  taskFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryTag: {
    fontSize: 11,
    color: colors.light.textSecondary,
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  newsSection: {
    // paddingVertical: 1,
    backgroundColor: colors.light.background,
  },
  newsCard: {
    width: 180,
    height: 120,
    marginRight: 12,
    borderRadius: 16,
    backgroundColor: "#fff",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  newsImage: {
    width: "100%",
    height: "100%",
  },
  newsOverlay: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  newsSnippet: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
    fontFamily: "NotoSans-Medium",
    lineHeight: 16,
  },

  // Eski stiller (değişmedi)
  taskCard: {
    backgroundColor: colors.light.surface,
    width: width * 0.48,
    minHeight: 110,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    marginRight: 0,
    justifyContent: "center",
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.light.surface,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.light.textPrimary,
    marginBottom: 6,
    fontFamily: "NotoSans-Bold",
  },
  taskPercentage: {
    fontSize: 13,
    color: colors.primary,
    backgroundColor: "#eaf6f3",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6,
    fontWeight: "600",
    fontFamily: "NotoSans-Medium",
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 18,
    color: colors.light.textPrimary,
    fontFamily: "NotoSans-Bold",
    letterSpacing: 0.2,
    textAlign: "center",
    alignSelf: "center",
  },
  taskColumn: {
    flexDirection: "column",
    width: width * 0.52,
    minWidth: 220,
    marginRight: 18,
    justifyContent: "flex-start",
  },
  supportContainer: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  supportGradientContainer: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#ff6b6b",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  supportHeader: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 16,
  },
  supportIcon: {
    marginBottom: 12,
    textShadowColor: "rgba(255, 255, 255, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  supportTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    fontFamily: "NotoSans-Bold",
    textAlign: "center",
    marginBottom: 4,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  supportSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    fontFamily: "NotoSans-Medium",
    textAlign: "center",
  },
  supportContentNew: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  supportTextNew: {
    fontSize: 15,
    color: "#444",
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 32,
    fontFamily: "NotoSans-Regular",
  },
  supportStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    paddingVertical: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
  },
  supportStat: {
    alignItems: "center",
    flex: 1,
  },
  supportStatNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: "#ff6b6b",
    fontFamily: "NotoSans-Bold",
    marginBottom: 2,
  },
  supportStatLabel: {
    fontSize: 12,
    color: "#666",
    fontFamily: "NotoSans-Medium",
    textAlign: "center",
  },
  supportStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 20,
  },
  supportButtonsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  primarySupportButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#ff6b6b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  fullWidthSupportButton: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#ff6b6b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  supportButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  primarySupportButtonText: {
    color: "#ff6b6b",
    fontWeight: "700",
    fontSize: 16,
    fontFamily: "NotoSans-Bold",
  },
  secondarySupportButton: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  secondarySupportButtonInner: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  secondarySupportButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    fontFamily: "NotoSans-Bold",
  },
  supportContent: {
    backgroundColor: colors.light.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  supportContentImproved: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    shadowColor: colors.gradientTwo,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
    marginTop: 8,
  },
  supportText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 16,
  },
  supportTextImproved: {
    fontSize: 15,
    color: "#444",
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 18,
    fontFamily: "NotoSans-Regular",
  },
  supportButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  supportButtonsRowImproved: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  supportButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  supportButtonImproved: {
    flex: 1,
    backgroundColor: colors.gradientTwo,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 2,
    shadowColor: colors.gradientTwo,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
  },
  supportButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  supportButtonTextImproved: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
    fontFamily: "NotoSans-Bold",
  },
  statsTitle: {
    fontSize: 18,
    fontFamily: "NotoSans-Bold",
    color: colors.gradientTwo,
    textAlign: "center",
    marginBottom: 10,
    marginTop: 2,
  },
  aiQuestionsSection: {
    paddingHorizontal: 10,
    paddingBottom: 2,
    backgroundColor: colors.light.background,
  },
  aiQuestionCard: {
    minWidth: 220,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  aiQuestionText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    fontFamily: "NotoSans-Medium",
  },

  // Yakında Çıkacak Özellikler Stilleri
  comingSoonSection: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: colors.light.background,
  },
  comingSoonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  comingSoonCard: {
    width: "48%",
    height: 180,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  comingSoonGradient: {
    flex: 1,
    padding: 16,
    justifyContent: "flex-start",
    position: "relative",
  },
  comingSoonIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  comingSoonTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "NotoSans-Bold",
    marginBottom: 4,
  },
  comingSoonDescription: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
    fontFamily: "NotoSans-Regular",
    lineHeight: 18,
    marginBottom: 8,
  },
  comingSoonBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  comingSoonBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#fff",
    fontFamily: "NotoSans-Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  // Hissedilen depremler bölümü
  feltEarthquakesSection: {
    marginBottom: 20,
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
    height: 160,
  },
  feltEarthquakeCard: {
    width: 280,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  feltEarthquakeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  feltEarthquakeMagnitude: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  feltEarthquakeMagnitudeText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
  },
  feltEarthquakeBadge: {
    backgroundColor: "#ff6b6b",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  feltEarthquakeTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2d3748",
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
    borderTopColor: "#f1f5f9",
    paddingTop: 8,
  },
  feltEarthquakeFeltDate: {
    fontSize: 11,
    color: "#9ca3af",
    fontStyle: "italic",
  },
  feltEarthquakesEmpty: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  feltEarthquakesEmptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
    marginTop: 12,
    marginBottom: 8,
  },
  feltEarthquakesEmptyDescription: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 20,
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
  bottomRightBadges: {
    position: "absolute",
    bottom: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  regionBadge: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  regionBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  faultlineBadge: {
    backgroundColor: "rgba(74, 144, 226, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  faultlineBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
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
