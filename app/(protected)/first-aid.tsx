import React from "react";
import { colors } from "@/constants/colors";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const firstAidExamples = [
  {
    icon: "medkit-outline",
    title: "Kanama",
    description:
      "Kanayan bölgeye temiz bir bezle baskı uygulayın. Kanama durmazsa tıbbi yardım çağırın.",
    steps: [
      "Ellerinizi yıkayın ve eldiven kullanın.",
      "Temiz bir bezle kanayan bölgeye baskı yapın.",
      "Kanama durmazsa ikinci bir bez ekleyin, bezi kaldırmayın.",
      "Tıbbi yardım çağırın.",
    ],
  },
  {
    icon: "flame-outline",
    title: "Yanık",
    description:
      "Yanık bölgeyi en az 10 dakika soğuk su altında tutun. Krem veya diş macunu sürmeyin.",
    steps: [
      "Yanık bölgeyi soğuk suyla yıkayın.",
      "Yanan bölgeyi temiz tutun, patlatmayın.",
      "Yara üzerine hiçbir madde sürmeyin.",
      "Geniş yanıklarda tıbbi yardım alın.",
    ],
  },
  {
    icon: "heart-outline",
    title: "Bayılma",
    description:
      "Kişiyi sırt üstü yatırın, ayaklarını hafifçe yukarı kaldırın. Sıkı giysileri gevşetin.",
    steps: [
      "Kişiyi güvenli bir yere yatırın.",
      "Ayaklarını 30 cm kadar yukarı kaldırın.",
      "Sıkı giysileri gevşetin.",
      "Kişi kendine gelmezse tıbbi yardım çağırın.",
    ],
  },
  {
    icon: "home-outline",
    title: "Enkaz Altında Kalma",
    description:
      "Enkaz altında kalan kişiye ulaşamıyorsanız, profesyonel ekipleri bekleyin. Kişiyle iletişim kurabiliyorsanız sakinleştirin ve hareket etmemesini söyleyin.",
    steps: [
      "Kişiyle sesli iletişim kurmaya çalışın.",
      "Panik yapmamasını ve hareket etmemesini söyleyin.",
      "Üzerine ağırlık yapan cisimleri kaldırmaya çalışmayın.",
      "112 ve AFAD ekiplerine bilgi verin.",
    ],
  },
  {
    icon: "bandage-outline",
    title: "Kırık ve Çıkıklar",
    description:
      "Deprem sırasında düşme veya çarpma sonucu kırık/çıkık oluşabilir. Yaralı bölgeyi sabitleyin, hareket ettirmeyin.",
    steps: [
      "Yaralı bölgeyi hareketsiz tutun.",
      "Mümkünse atel veya sert bir cisimle sabitleyin.",
      "Bölgeyi yukarıda tutmaya çalışın.",
      "Tıbbi yardım gelene kadar bekleyin.",
    ],
  },
  {
    icon: "alert-circle-outline",
    title: "Şok",
    description:
      "Deprem sonrası kişilerde şok gelişebilir. Kişiyi sakinleştirin, sıcak tutun ve yardım çağırın.",
    steps: [
      "Kişiyi yere yatırın ve ayaklarını hafifçe kaldırın.",
      "Üzerini örtüp sıcak tutun.",
      "Su veya yiyecek vermeyin.",
      "Tıbbi yardım çağırın.",
    ],
  },
];

const FirstAidPage: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Ionicons name="medkit" size={32} color={colors.gradientTwo} />
            <Text style={styles.title}>İlk Yardım Bilgileri</Text>
          </View>
          {/* <Text style={styles.subtitle}>
            Acil durumlarda temel ilk yardım uygulamaları
          </Text> */}
        </View>

        {firstAidExamples.map((item, idx) => (
          <View key={idx} style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons
                name={item.icon as any}
                size={28}
                color={colors.primary}
              />
              <Text style={styles.cardTitle}>{item.title}</Text>
            </View>
            <Text style={styles.cardDescription}>{item.description}</Text>
            <View style={styles.cardSteps}>
              {item.steps.map((step, i) => (
                <View key={i} style={styles.stepRow}>
                  <Ionicons
                    name="ellipse"
                    size={8}
                    color={colors.gradientTwo}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>Önemli Notlar:</Text>
          <Text style={styles.instructionText}>
            • Panik yapmayın, önce kendi güvenliğinizi sağlayın.
          </Text>
          <Text style={styles.instructionText}>
            • Durumu hızlıca değerlendirin ve gerekiyorsa 112'yi arayın.
          </Text>
          <Text style={styles.instructionText}>
            • Bilginiz yoksa müdahale etmeyin, profesyonel yardım bekleyin.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.light.textPrimary,
    fontFamily: "NotoSans-Bold",
  },
  subtitle: {
    fontSize: 14,
    color: colors.light.textSecondary,
    fontFamily: "NotoSans-Regular",
  },
  card: {
    backgroundColor: colors.light.background,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.primary,
    fontFamily: "NotoSans-Medium",
  },
  cardDescription: {
    fontSize: 14,
    color: colors.light.textSecondary,
    marginBottom: 8,
    fontFamily: "NotoSans-Regular",
  },
  cardSteps: {
    marginLeft: 8,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  stepText: {
    fontSize: 13,
    color: colors.light.textPrimary,
    fontFamily: "NotoSans-Regular",
  },
  instructions: {
    backgroundColor: "#fef3c7",
    borderColor: colors.gradientTwo,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#92400e",
    marginBottom: 8,
    fontFamily: "NotoSans-Medium",
  },
  instructionText: {
    fontSize: 12,
    color: "#b45309",
    marginBottom: 4,
    fontFamily: "NotoSans-Regular",
  },
});

export default FirstAidPage;
