import { formatDate } from "@/utils/earthquakeUtils";
import { getCategoryColor } from "@/utils/generalUtils";
import { getScoreColor } from "@/utils/userUtils";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Image,
  Linking,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Divider } from "react-native-paper";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState, useRef } from "react";
import { useRouter } from "expo-router";
import { useSharedValue } from "react-native-reanimated";
import { ICarouselInstance } from "react-native-reanimated-carousel";
import { colors } from "@/constants/colors";
import EarthquakeCarousel from "@/components/EarthquakeCarousel";
import EarthquakeStats from "@/components/EarthquakeStats";
import { FlashList } from "@shopify/flash-list";
import { LinearGradient } from "expo-linear-gradient";
import QuickAccessButtons from "@/components/QuickAccessButtons";
import UserComments from "@/components/UserComments";
import UserFeltEarthquakes from "@/components/UserFeltEarthquakes";
// import PremiumFeatureGate from "@/components/PremiumFeatureGate";
import { useEarthquakes } from "@/hooks/useEarthquakes";
import { useNews } from "@/hooks/useNews";
import { TASK_DATA } from "@/constants/taskConstants";
import { useProfile } from "@/hooks/useProfiles";
import { useAuth } from "@/hooks/useAuth";
import PremiumFeatureGate from "@/components/PremiumFeatureGate";

const { width } = Dimensions.get("window");
const CARD_HEIGHT = width * 0.6;

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [activeSegment, setActiveSegment] = useState<
    "afad" | "kandilli" | "usgs" | "iris" | "emsc"
  >("kandilli");
  const carouselRef = useRef<ICarouselInstance | null>(null);
  const progress = useSharedValue(0);

  const { data: profile } = useProfile();
  const { data: earthquakes = [], isLoading: isLoadingEarthquakes } =
    useEarthquakes();
  const { data: news = [], isLoading: isLoadingNews } = useNews();

  const [visibleTasks, setVisibleTasks] = useState(() => TASK_DATA.slice(0, 4));
  const [nextTaskIndex, setNextTaskIndex] = useState(4);

  // // Temporary state variables to fix errors
  // const [magnitudeNotification, setMagnitudeNotification] = useState(false);
  // const [locationNotification, setLocationNotification] = useState(false);
  // const [criticalNotification, setCriticalNotification] = useState(true);
  // const [selectedMagnitude, setSelectedMagnitude] = useState("4.0");
  // const [selectedDistance, setSelectedDistance] = useState("50");

  const aiQuestions = [
    { id: "1", question: "Depremde ne yapmalıyım?" },
    { id: "2", question: "En yakın toplanma alanı nerede?" },
    { id: "3", question: "Deprem çantasında neler olmalı?" },
    { id: "4", question: "Deprem anında evdeysem ne yapmalıyım?" },
    { id: "5", question: "Afet sonrası iletişim nasıl sağlanır?" },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom }}
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
                {
                  borderColor: profile?.has_completed_safety_form
                    ? getScoreColor(profile.safety_score || 0)
                    : "#e74c3c",
                  backgroundColor: profile?.has_completed_safety_form
                    ? "transparent"
                    : "#e74c3c",
                },
              ]}
              activeOpacity={0.7}
              onPress={() => {
                if (profile?.has_completed_safety_form) {
                  router.push("/(protected)/risk-form?showResults=true");
                } else {
                  router.push("/(protected)/risk-form");
                }
              }}
            >
              {!profile ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : profile?.has_completed_safety_form ? (
                <>
                  <MaterialCommunityIcons
                    name="shield-check"
                    size={16}
                    color={getScoreColor(profile.safety_score || 0)}
                  />
                  <Text
                    style={[
                      styles.securityScoreText,
                      { color: getScoreColor(profile.safety_score || 0) },
                    ]}
                  >
                    % {profile.safety_score || 0}
                  </Text>
                </>
              ) : (
                <Text style={[styles.securityScoreText, { color: "#fff" }]}>
                  Formu Çöz
                </Text>
              )}
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
              KANDILLI
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

          <TouchableOpacity
            style={[
              styles.segmentButton,
              activeSegment === "iris" && styles.activeSegmentButton,
            ]}
            onPress={() => setActiveSegment("iris")}
          >
            <Text
              style={[
                styles.segmentText,
                activeSegment === "iris" && styles.activeSegmentText,
              ]}
            >
              IRIS
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentButton,
              activeSegment === "emsc" && styles.activeSegmentButton,
            ]}
            onPress={() => setActiveSegment("emsc")}
          >
            <Text
              style={[
                styles.segmentText,
                activeSegment === "emsc" && styles.activeSegmentText,
              ]}
            >
              EMSC
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
              isLoading={isLoadingEarthquakes}
            />
          </View>
          <Divider style={styles.divider} />
          <EarthquakeStats />
          <Divider style={styles.divider} />
          <Text style={styles.sectionTitle}>Hızlı Erişim</Text>
          <QuickAccessButtons />
          <Divider style={styles.divider} />

          {/* Deprem Risk Analizi Modülü - Premium Özellik */}
          <PremiumFeatureGate featureId="earthquake-risk-analysis">
            <View style={styles.riskAnalysisContainer}>
              <Text style={styles.sectionTitle}>
                Konumuna Göre Deprem Riskini Öğren
              </Text>
              <View style={styles.riskAnalysisCard}>
                <LinearGradient
                  colors={[colors.gradientOne, colors.gradientTwo]}
                  style={styles.riskAnalysisGradient}
                >
                  <View style={styles.riskAnalysisContent}>
                    <View style={styles.riskAnalysisHeader}>
                      <MaterialCommunityIcons
                        name="map-marker-alert"
                        size={32}
                        color="#fff"
                      />
                      <Text style={styles.riskAnalysisTitle}>
                        Deprem Risk Analizi
                      </Text>
                    </View>
                    <Text style={styles.riskAnalysisDescription}>
                      İl, ilçe ve mahalle seçerek konumunuza özel deprem risk
                      değerlendirmesi yapın
                    </Text>
                    <View style={styles.riskAnalysisFeatures}>
                      <View style={styles.riskAnalysisFeature}>
                        <Ionicons name="location" size={16} color="#fff" />
                        <Text style={styles.riskAnalysisFeatureText}>
                          İl, İlçe, Mahalle Seçimi
                        </Text>
                      </View>
                      <View style={styles.riskAnalysisFeature}>
                        <Ionicons name="search" size={16} color="#fff" />
                        <Text style={styles.riskAnalysisFeatureText}>
                          Google Maps Entegrasyonu
                        </Text>
                      </View>
                      <View style={styles.riskAnalysisFeature}>
                        <Ionicons name="analytics" size={16} color="#fff" />
                        <Text style={styles.riskAnalysisFeatureText}>
                          Detaylı Risk Analizi
                        </Text>
                      </View>
                    </View>
                  </View>
                </LinearGradient>
                <TouchableOpacity
                  style={styles.riskAnalysisButton}
                  activeOpacity={0.8}
                  onPress={() => {
                    // Navigate to risk analyzer screen
                    router.push("/(protected)/earthquake-risk-analyzer");
                  }}
                >
                  <Text style={styles.riskAnalysisButtonText}>
                    Risk Analizi Yap
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </PremiumFeatureGate>

          {/* <Divider style={styles.divider} /> */}
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
          <UserFeltEarthquakes sectionStyles={styles} />
          <Divider style={styles.divider} />
          <UserComments sectionStyles={styles} />
          <Divider style={styles.divider} />

          {/* Bildirim Ayarları */}
          {/* <View style={styles.notificationSection}>
            <Text style={styles.sectionTitle}>Bildirim Ayarları</Text>

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

            <PremiumFeatureGate
              featureId="smart-notification-engine"
              compact={true}
            >
              <TouchableOpacity
                style={styles.detailedSettingsButton}
                onPress={() => {
                  router.push("/(protected)/notification-settings");
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.detailedSettingsGradient}
                >
                  <View style={styles.detailedSettingsContent}>
                    <View style={styles.detailedSettingsLeft}>
                      <View style={styles.detailedSettingsIconContainer}>
                        <Ionicons name="settings" size={20} color="#fff" />
                      </View>
                      <View style={styles.detailedSettingsTextContainer}>
                        <Text style={styles.detailedSettingsText}>
                          Akıllı Bildirim Kural Motoru
                        </Text>
                        <Text style={styles.detailedSettingsSubtext}>
                          Özelleştirilebilir deprem bildirimleri
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#fff" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </PremiumFeatureGate>
          </View> */}

          {/* <Divider style={styles.divider} /> */}

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
                      if (nextTaskIndex < TASK_DATA.length) {
                        newTasks.push(TASK_DATA[nextTaskIndex]);
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
                    </View>
                    <Text style={styles.taskTitleNew}>{task.title}</Text>
                    <Text style={styles.taskDescription}>
                      {task.description}
                    </Text>
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

          {/* Premium CTA Button - Coming Soon Features */}
          <View style={styles.premiumCTAContainer}>
            <TouchableOpacity
              style={styles.premiumCTAButton}
              activeOpacity={0.8}
              onPress={() => router.push("/(protected)/premium-packages")}
            >
              <View style={styles.premiumCTAContent}>
                <View style={styles.premiumCTAHeader}>
                  <Ionicons name="rocket" size={24} color="#FFD700" />
                  <Text style={styles.premiumCTATitle}>Önce Deneyimle</Text>
                  <View style={styles.premiumCTABadge}>
                    <Text style={styles.premiumCTABadgeText}>Beta Erişim</Text>
                  </View>
                </View>
                <Text style={styles.premiumCTASubtitle}>
                  Yakında çıkacak özellikleri premium üyelerimizle birlikte ilk
                  siz deneyimleyin
                </Text>
                <View style={styles.premiumCTAFeatures}>
                  <View style={styles.premiumCTAFeature}>
                    <Ionicons name="flash" size={16} color="#4CAF50" />
                    <Text style={styles.premiumCTAFeatureText}>
                      Erken Uyarı Sistemi
                    </Text>
                  </View>
                  <View style={styles.premiumCTAFeature}>
                    <Ionicons name="people" size={16} color="#4CAF50" />
                    <Text style={styles.premiumCTAFeatureText}>
                      Topluluk Özellikleri
                    </Text>
                  </View>
                  <View style={styles.premiumCTAFeature}>
                    <Ionicons name="trending-up" size={16} color="#4CAF50" />
                    <Text style={styles.premiumCTAFeatureText}>
                      Gelişmiş Raporlar
                    </Text>
                  </View>
                </View>
              </View>
              <Ionicons name="arrow-forward" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <Divider style={styles.divider} />

          {/* haberler */}
          <View style={styles.newsSection}>
            <Text style={styles.sectionTitle}>Haberler</Text>
            {isLoadingNews ? (
              <View style={styles.newsLoading}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.newsLoadingText}>
                  Haberler yükleniyor...
                </Text>
              </View>
            ) : news.length > 0 ? (
              <FlashList
                data={news}
                horizontal
                showsHorizontalScrollIndicator={false}
                estimatedItemSize={200}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingHorizontal: 12 }}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.newsCard} activeOpacity={0.8}>
                    {item.image && (
                      <Image
                        source={{ uri: item.image }}
                        style={styles.newsImage}
                        resizeMode="cover"
                      />
                    )}
                    <View style={styles.newsOverlay}>
                      <Text style={styles.newsSnippet} numberOfLines={2}>
                        {item.snippet}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            ) : (
              <View style={styles.newsEmpty}>
                <Text style={styles.newsEmptyText}>Henüz haber bulunmuyor</Text>
              </View>
            )}
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
                    onPress={() =>
                      router.push("/(protected)/developer-support")
                    }
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
                      Linking.openURL("mailto:info@terraapp.io");
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
    </View>
  );
}

const styles = StyleSheet.create({
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
    marginTop: 8,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  detailedSettingsGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  detailedSettingsContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  detailedSettingsLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  detailedSettingsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  detailedSettingsTextContainer: {
    flex: 1,
  },
  detailedSettingsText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "NotoSans-Bold",
  },
  detailedSettingsSubtext: {
    fontSize: 12,
    fontWeight: "400",
    color: "rgba(255, 255, 255, 0.8)",
    fontFamily: "NotoSans-Regular",
    marginTop: 2,
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
    color: colors.primary,
    letterSpacing: 3,
    textShadowColor: colors.light.textPrimary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 1,
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
    paddingHorizontal: 5,
  },
  segmentButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 2,
    position: "relative",
  },
  activeSegmentButton: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  segmentText: {
    fontSize: 12,
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
  newsLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  newsLoadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#6b7280",
  },
  newsEmpty: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  newsEmptyText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
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
    paddingBottom: 8,
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
    paddingTop: 8,
    paddingBottom: 4,
  },
  supportIcon: {
    marginBottom: 2,
    textShadowColor: "rgba(255, 255, 255, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
    fontFamily: "NotoSans-Bold",
    textAlign: "center",
    marginBottom: 1,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  supportSubtitle: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.9)",
    fontFamily: "NotoSans-Medium",
    textAlign: "center",
  },
  supportContentNew: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  supportTextNew: {
    fontSize: 12,
    color: "#444",
    lineHeight: 16,
    textAlign: "center",
    marginBottom: 8,
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
    paddingVertical: 8,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  primarySupportButtonText: {
    color: "#ff6b6b",
    fontWeight: "700",
    fontSize: 13,
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
    height: 200,
  },
  feltEarthquakeCard: {
    width: 300,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
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
  // Kullanıcı yorumları bölümü
  userCommentsSection: {
    marginBottom: 20,
  },
  userCommentsLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  userCommentsLoadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#6b7280",
  },
  userCommentsContainer: {
    height: 240,
  },
  userCommentCard: {
    width: 320,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  commentEarthquakeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  commentEarthquakeMagnitude: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  commentEarthquakeMagnitudeText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#ffffff",
  },
  commentEarthquakeInfo: {
    flex: 1,
  },
  commentEarthquakeDate: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  commentEarthquakeDepth: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 1,
  },
  commentEarthquakeTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2d3748",
    marginBottom: 10,
    lineHeight: 16,
  },
  commentContentContainer: {
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  commentLabel: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: "600",
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  commentText: {
    fontSize: 13,
    color: "#374151",
    lineHeight: 18,
    fontStyle: "italic",
  },
  commentFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  commentDateText: {
    fontSize: 11,
    color: "#9ca3af",
  },
  editedBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  editedText: {
    fontSize: 10,
    color: "#9ca3af",
    marginLeft: 2,
    fontStyle: "italic",
  },
  viewCommentButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f5f9",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  viewCommentButtonText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
    marginRight: 4,
  },
  userCommentsEmpty: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  userCommentsEmptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
    marginTop: 12,
    marginBottom: 8,
  },
  userCommentsEmptyDescription: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 20,
  },
  // Premium CTA Button Styles
  premiumCTAContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  premiumCTAButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  premiumCTAContent: {
    flex: 1,
    marginRight: 10,
  },
  premiumCTAHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  premiumCTATitle: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
  premiumCTABadge: {
    backgroundColor: "#FFD700",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  premiumCTABadgeText: {
    color: "#2d3748",
    fontSize: 12,
    fontWeight: "600",
  },
  premiumCTASubtitle: {
    color: "#666666",
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  premiumCTAFeatures: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  premiumCTAFeature: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
    marginBottom: 8,
  },
  premiumCTAFeatureText: {
    color: "#666666",
    fontSize: 13,
    marginLeft: 8,
    fontWeight: "500",
  },
  // Risk Analysis Module Styles
  riskAnalysisContainer: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: colors.light.background,
  },
  riskAnalysisCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  riskAnalysisGradient: {
    padding: 20,
  },
  riskAnalysisContent: {
    alignItems: "center",
  },
  riskAnalysisHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  riskAnalysisTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 10,
  },
  riskAnalysisDescription: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 15,
  },
  riskAnalysisFeatures: {
    width: "100%",
  },
  riskAnalysisFeature: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  riskAnalysisFeatureText: {
    fontSize: 13,
    color: "#fff",
    marginLeft: 8,
    fontWeight: "500",
  },
  riskAnalysisButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
  },
  riskAnalysisButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.primary,
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
