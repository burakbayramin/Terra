import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ScrollView,
} from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/colors";

const SUPPORT_EMAIL = "destek@terraapp.com";
const SUPPORT_URL = "https://terraapp.com/support";

const SupportScreen = () => {
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <Ionicons
            name="help-circle-outline"
            size={48}
            color={colors.gradientTwo}
            style={{ marginBottom: 10 }}
          />
          <Text style={styles.title}>Destek Merkezi</Text>
          <Text style={styles.subtitle}>
            Yardıma mı ihtiyacınız var? Sıkça sorulan sorulara göz atabilir veya
            bizimle iletişime geçebilirsiniz.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sıkça Sorulan Sorular</Text>
          <View style={styles.faqItem}>
            <Text style={styles.faqQ}>• Terra nedir?</Text>
            <Text style={styles.faqA}>
              Terra, deprem bilinci ve güvenliği için topluluk odaklı bir mobil
              uygulamadır.
            </Text>
          </View>
          <View style={styles.faqItem}>
            <Text style={styles.faqQ}>• Hesabımı nasıl güncellerim?</Text>
            <Text style={styles.faqA}>
              Profil sayfasından bilgilerinizi güncelleyebilirsiniz.
            </Text>
          </View>
          <View style={styles.faqItem}>
            <Text style={styles.faqQ}>• Destek almak için ne yapmalıyım?</Text>
            <Text style={styles.faqA}>
              Aşağıdaki iletişim seçeneklerinden birini kullanarak bize
              ulaşabilirsiniz.
            </Text>
          </View>
          <View style={styles.faqItem}>
            <Text style={styles.faqQ}>• Şifremi unuttum, ne yapmalıyım?</Text>
            <Text style={styles.faqA}>
              Giriş ekranındaki "Şifremi Unuttum" seçeneğini kullanarak yeni
              şifre talep edebilirsiniz.
            </Text>
          </View>
          <View style={styles.faqItem}>
            <Text style={styles.faqQ}>
              • Uygulama bildirimlerini nasıl açıp kapatabilirim?
            </Text>
            <Text style={styles.faqA}>
              Profil &gt; Bildirimler bölümünden bildirim ayarlarını
              değiştirebilirsiniz.
            </Text>
          </View>
          <View style={styles.faqItem}>
            <Text style={styles.faqQ}>
              • Deprem analizlerine nereden ulaşabilirim?
            </Text>
            <Text style={styles.faqA}>
              Ana menüdeki "Analizler" sekmesinden güncel deprem analizlerine
              ulaşabilirsiniz.
            </Text>
          </View>
          <View style={styles.faqItem}>
            <Text style={styles.faqQ}>
              • Topluluk kurallarını nereden görebilirim?
            </Text>
            <Text style={styles.faqA}>
              Profil &gt; Destek ve Politikalar bölümünden Topluluk Kuralları'na
              ulaşabilirsiniz.
            </Text>
          </View>
          <View style={styles.faqItem}>
            <Text style={styles.faqQ}>
              • Geri bildirimimi nasıl iletebilirim?
            </Text>
            <Text style={styles.faqA}>
              Destek sayfasındaki iletişim seçeneklerini kullanarak bize geri
              bildirim gönderebilirsiniz.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bize Ulaşın</Text>
          <TouchableOpacity
            style={styles.contactButton}
            activeOpacity={0.8}
            onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
          >
            <Ionicons
              name="mail"
              size={20}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.contactButtonText}>E-posta ile Destek</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.contactButton, styles.secondaryButton]}
            activeOpacity={0.8}
            onPress={() => Linking.openURL(SUPPORT_URL)}
          >
            <Ionicons
              name="globe-outline"
              size={20}
              color={colors.gradientTwo}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.secondaryButtonText}>Web Sitesi</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.infoText}>
            Terra uygulaması topluluk katkılarıyla geliştirilmektedir. Geri
            bildirimleriniz bizim için çok değerli!
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    color: colors.gradientTwo,
    fontFamily: "NotoSans-Bold",
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: colors.light.textSecondary,
    fontFamily: "NotoSans-Regular",
    textAlign: "center",
    marginBottom: 2,
  },
  section: {
    marginBottom: 28,
    backgroundColor: colors.light.surface,
    borderRadius: 14,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    color: colors.gradientTwo,
    fontFamily: "NotoSans-Bold",
    marginBottom: 10,
  },
  faqItem: {
    marginBottom: 10,
  },
  faqQ: {
    fontSize: 15,
    color: colors.light.textPrimary,
    fontFamily: "NotoSans-Bold",
    marginBottom: 2,
  },
  faqA: {
    fontSize: 14,
    color: colors.light.textSecondary,
    fontFamily: "NotoSans-Regular",
    marginLeft: 8,
    marginBottom: 2,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.gradientTwo,
    paddingVertical: 13,
    borderRadius: 10,
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: colors.gradientTwo,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 5,
    elevation: 2,
  },
  contactButtonText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "NotoSans-Bold",
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: colors.gradientTwo,
  },
  secondaryButtonText: {
    color: colors.gradientTwo,
    fontSize: 15,
    fontFamily: "NotoSans-Bold",
    fontWeight: "700",
  },
  infoText: {
    fontSize: 14,
    color: colors.light.textSecondary,
    fontFamily: "NotoSans-Regular",
    textAlign: "center",
  },
});

export default SupportScreen;
