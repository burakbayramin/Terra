import { View, Text, StyleSheet, ScrollView } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/colors";

const TermsOfServiceScreen = () => {
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <Ionicons
            name="document-text-outline"
            size={48}
            color={colors.gradientTwo}
            style={{ marginBottom: 10 }}
          />
          <Text style={styles.title}>Hizmet Şartları</Text>
          <Text style={styles.subtitle}>
            Terra uygulamasını kullanarak aşağıdaki hizmet şartlarını kabul
            etmiş olursunuz. Lütfen dikkatlice okuyunuz.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kullanım Koşulları</Text>
          <View style={styles.ruleItem}>
            <Text style={styles.ruleQ}>• Hesap Sorumluluğu</Text>
            <Text style={styles.ruleA}>
              Kullanıcılar, hesaplarının güvenliğinden ve gizliliğinden
              sorumludur. Şifrenizi kimseyle paylaşmayınız.
            </Text>
          </View>
          <View style={styles.ruleItem}>
            <Text style={styles.ruleQ}>• İçerik Paylaşımı</Text>
            <Text style={styles.ruleA}>
              Uygulama üzerinden paylaşılan içeriklerin yasalara ve topluluk
              kurallarına uygun olması gerekmektedir.
            </Text>
          </View>
          <View style={styles.ruleItem}>
            <Text style={styles.ruleQ}>• Hizmetin Kullanımı</Text>
            <Text style={styles.ruleA}>
              Terra, deprem bilinci ve güvenliği amacıyla bilgi ve hizmet sunar.
              Yanıltıcı veya kötüye kullanım yasaktır.
            </Text>
          </View>
          <View style={styles.ruleItem}>
            <Text style={styles.ruleQ}>• Fikri Mülkiyet</Text>
            <Text style={styles.ruleA}>
              Uygulamadaki tüm içerik, tasarım ve yazılım Terra'ya aittir.
              İzinsiz kopyalanamaz veya dağıtılamaz.
            </Text>
          </View>
          <View style={styles.ruleItem}>
            <Text style={styles.ruleQ}>• Sorumluluk Reddi</Text>
            <Text style={styles.ruleA}>
              Sunulan bilgiler bilgilendirme amaçlıdır. Terra, yanlış veya eksik
              bilgilerden sorumlu tutulamaz.
            </Text>
          </View>
          <View style={styles.ruleItem}>
            <Text style={styles.ruleQ}>• Değişiklik Hakkı</Text>
            <Text style={styles.ruleA}>
              Terra, hizmet şartlarını önceden bildirmeksizin değiştirme hakkını
              saklı tutar. Güncellemeleri takip ediniz.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.infoText}>
            Uygulamayı kullanmaya devam ederek hizmet şartlarını kabul etmiş
            sayılırsınız. Daha fazla bilgi için bizimle iletişime
            geçebilirsiniz.
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
  ruleItem: {
    marginBottom: 10,
  },
  ruleQ: {
    fontSize: 15,
    color: colors.light.textPrimary,
    fontFamily: "NotoSans-Bold",
    marginBottom: 2,
  },
  ruleA: {
    fontSize: 14,
    color: colors.light.textSecondary,
    fontFamily: "NotoSans-Regular",
    marginLeft: 8,
    marginBottom: 2,
  },
  infoText: {
    fontSize: 14,
    color: colors.light.textSecondary,
    fontFamily: "NotoSans-Regular",
    textAlign: "center",
  },
});

export default TermsOfServiceScreen;
