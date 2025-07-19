import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Image,
} from "react-native";
import { Divider } from "react-native-paper";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState, useRef } from "react";
import { useRouter } from "expo-router";
import { useSharedValue } from "react-native-reanimated";
import { ICarouselInstance } from "react-native-reanimated-carousel";
import { colors } from "@/constants/colors";
import EarthquakeCarousel from "@/components/EarthquakeCarousel";
import { Earthquake } from "@/types/types";
import { news } from "data";
import EarthquakeStat from "@/components/EarthquakeStats";
import { FlashList } from "@shopify/flash-list";
import { LinearGradient } from "expo-linear-gradient";

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
const CARD_HEIGHT = width * 0.5; // Adjust height based on width for better responsiveness

export default function HomeScreen() {
  const router = useRouter();
  const [activeSegment, setActiveSegment] = useState<
    "afad" | "kandilli" | "usgs"
  >("kandilli");
  const carouselRef = useRef<ICarouselInstance | null>(null);
  const progress = useSharedValue(0);

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

  // Dummy stats for earthquake statistics
  const stats = {
    total: {
      lastDay: 12,
      lastWeek: 37,
      lastMonth: 142,
    },
    mag3Plus: {
      lastDay: 8,
      lastWeek: 24,
      lastMonth: 89,
    },
    mag4Plus: {
      lastDay: 3,
      lastWeek: 12,
      lastMonth: 45,
    },
  };

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
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
          <EarthquakeStat {...stats} />
          <Divider style={styles.divider} />
          {/* Quick Access Buttons */}
          <Text style={styles.sectionTitle}>Hızlı Erişim</Text>
          <View style={styles.quickAccessContainer}>
            <TouchableOpacity
              style={[styles.quickAccessButton, { backgroundColor: "#e74c3c" }]}
              activeOpacity={0.8}
              onPress={() => {
                router.push("/(protected)/what-to-do-earthquake");
              }}
            >
              <MaterialCommunityIcons
                name="home-alert"
                size={28}
                color="#fff"
                style={{ marginBottom: 4 }}
              />
              <Text style={styles.quickAccessText}>
                Deprem Esnası ve Sonrası
              </Text>
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
            <Text style={styles.statsTitle}>Depremzedelere Destek Ol</Text>
            <View style={styles.supportContentImproved}>
              <Text style={styles.supportTextImproved}>
                Depremden etkilenenlere yardım etmek için çeşitli kuruluşlara
                bağışta bulunabilir veya gönüllü olabilirsiniz. Küçük bir destek
                bile büyük bir fark yaratabilir.
              </Text>
              <View style={styles.supportButtonsRowImproved}>
                <TouchableOpacity
                  style={styles.supportButtonImproved}
                  activeOpacity={0.8}
                  onPress={() => {
                    // Bağış sayfasına yönlendirme
                  }}
                >
                  <View style={styles.supportButtonInner}>
                    <Ionicons
                      name="hand-left"
                      size={18}
                      color="#fff"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.supportButtonTextImproved}>
                      Bağış Yap
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.supportButtonImproved,
                    styles.secondarySupportButtonImproved,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => {
                    // Gönüllü olma sayfasına yönlendirme
                  }}
                >
                  <View style={styles.supportButtonInner}>
                    <Ionicons
                      name="people"
                      size={18}
                      color={colors.gradientTwo}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.secondarySupportButtonTextImproved}>
                      Gönüllü Ol
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.supportContainer}>
            <Text style={styles.statsTitle}>Geliştiricilere Destek Ol</Text>
            <View style={styles.supportContentImproved}>
              <Text style={styles.supportTextImproved}>
                Terra uygulaması topluluk katkılarıyla geliştirilmektedir.
                Deprem bilinci ve güvenliği için daha iyi özellikler
                geliştirmemize yardımcı olabilirsiniz.
              </Text>
              <View style={styles.supportButtonsRowImproved}>
                <TouchableOpacity
                  style={styles.supportButtonImproved}
                  activeOpacity={0.8}
                >
                  <View style={styles.supportButtonInner}>
                    <Ionicons
                      name="heart"
                      size={18}
                      color="#fff"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.supportButtonTextImproved}>
                      Bağış Yap
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.supportButtonImproved,
                    styles.secondarySupportButtonImproved,
                  ]}
                  activeOpacity={0.8}
                >
                  <View style={styles.supportButtonInner}>
                    <Ionicons
                      name="code-slash"
                      size={18}
                      color={colors.gradientTwo}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.secondarySupportButtonTextImproved}>
                      Katkıda Bulun
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Katkıda Bulun viewinin altına iletişim bölümü eklendi */}
          <View style={styles.contactContainer}>
            <Text style={styles.statsTitle}>İletişime Geç</Text>
            <View style={styles.contactContent}>
              <Text style={styles.contactText}>
                Sorularınız, önerileriniz veya geri bildirimleriniz için bizimle
                iletişime geçebilirsiniz.
              </Text>
              <TouchableOpacity
                style={styles.contactMainButton}
                activeOpacity={0.7}
                onPress={() => {
                  // İletişim formuna yönlendirme veya mail açma işlemi
                }}
              >
                <Text style={styles.contactButtonText}>İletişime Geç</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    flex: 1,
    textAlign: "center",
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
  secondarySupportButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "green",
  },
  secondarySupportButtonImproved: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: colors.gradientTwo,
  },
  secondarySupportButtonTextImproved: {
    color: colors.gradientTwo,
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
  contactContainer: {
    paddingHorizontal: 12,
    paddingBottom: 30,
  },
  contactContent: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    shadowColor: colors.gradientTwo,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
    marginTop: 8,
  },
  contactText: {
    fontSize: 15,
    color: "#444",
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 18,
    fontFamily: "NotoSans-Regular",
  },
  contactMainButton: {
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
  contactButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
    fontFamily: "NotoSans-Bold",
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
