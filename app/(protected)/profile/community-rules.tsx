import { View, Text, StyleSheet, ScrollView } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CommunityRulesScreen = () => {
  const insets = useSafeAreaInsets();
  
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <Ionicons
            name="people-circle-outline"
            size={48}
            color={colors.gradientTwo}
            style={{ marginBottom: 10 }}
          />
          <Text style={styles.title}>Topluluk Kuralları</Text>
          <Text style={styles.subtitle}>
            Terra topluluğu olarak güvenli, saygılı ve destekleyici bir ortam
            oluşturmak önceliğimizdir. Lütfen aşağıdaki kurallara uyunuz.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kurallar</Text>
          <View style={styles.ruleItem}>
            <Text style={styles.ruleQ}>• Saygı ve Nezaket</Text>
            <Text style={styles.ruleA}>
              Tüm kullanıcılara karşı saygılı ve nazik olun. Hakaret, tehdit
              veya ayrımcılığa izin verilmez.
            </Text>
          </View>
          <View style={styles.ruleItem}>
            <Text style={styles.ruleQ}>• Güvenlik ve Gizlilik</Text>
            <Text style={styles.ruleA}>
              Kişisel bilgilerinizi ve başkalarının gizliliğini koruyun.
              Başkalarının izni olmadan kişisel bilgi paylaşmayın.
            </Text>
          </View>
          <View style={styles.ruleItem}>
            <Text style={styles.ruleQ}>• Doğru Bilgi Paylaşımı</Text>
            <Text style={styles.ruleA}>
              Yanıltıcı, yanlış veya doğrulanmamış bilgi paylaşmaktan kaçının.
              Bilgi kaynağınızı belirtmeye özen gösterin.
            </Text>
          </View>
          <View style={styles.ruleItem}>
            <Text style={styles.ruleQ}>• Yardımlaşma ve Destek</Text>
            <Text style={styles.ruleA}>
              Topluluk üyelerine yardımcı olun, soruları yanıtlayın ve
              destekleyici olun.
            </Text>
          </View>
          <View style={styles.ruleItem}>
            <Text style={styles.ruleQ}>• Uygunsuz İçerik</Text>
            <Text style={styles.ruleA}>
              Küfür, şiddet, nefret söylemi, spam veya reklam içeren paylaşımlar
              yasaktır.
            </Text>
          </View>
          <View style={styles.ruleItem}>
            <Text style={styles.ruleQ}>• Yasalara Uygunluk</Text>
            <Text style={styles.ruleA}>
              Tüm paylaşımlarınızda yürürlükteki yasalara ve uygulama
              politikalarına uyun.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.infoText}>
            Kurallara uymayan kullanıcılar uyarılabilir veya topluluktan
            uzaklaştırılabilir. Güvenli ve pozitif bir ortam için katkınız çok
            önemli!
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

export default CommunityRulesScreen;
