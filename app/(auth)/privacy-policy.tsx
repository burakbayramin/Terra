import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/colors";

const { width, height } = Dimensions.get("window");

export default function PrivacyPolicy() {
  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <View style={styles.gradient}>
        {/* <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.light.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Gizlilik Politikası</Text>
          <View style={styles.placeholder} />
        </View> */}

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentContainer}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Terra Uygulaması Gizlilik Politikası
              </Text>
              <Text style={styles.lastUpdated}>
                Son güncelleme: 24 Haziran 2025
              </Text>

              <Text style={styles.paragraph}>
                Terra uygulamasını kullandığınız için teşekkür ederiz.
                Gizliliğinizi korumak en önemli önceliklerimizden biridir. Bu
                gizlilik politikası, hizmetlerimizi kullandığınızda
                bilgilerinizi nasıl topladığımızı, kullandığımızı ve
                koruduğumuzu açıklar.
              </Text>

              <Text style={styles.subTitle}>Toplanan Bilgiler</Text>
              <Text style={styles.paragraph}>
                <Text style={styles.bold}>Kişisel Bilgiler:</Text> Uygulamamıza
                kaydolduğunuzda e-posta adresinizi ve şifrenizi topluyoruz.
                Profil bilgilerinizi güncellerseniz, adınız, profiliniz ve
                tercihleriniz gibi bilgileri de saklayabiliriz.
              </Text>

              <Text style={styles.paragraph}>
                <Text style={styles.bold}>Konum Verileri:</Text> Terra
                uygulaması, deprem ve doğal afet bilgilerini göstermek için
                konumunuzu kullanabilir. Konum verisi yalnızca izin verdiğinizde
                toplanır ve yerel olarak işlenir.
              </Text>

              <Text style={styles.paragraph}>
                <Text style={styles.bold}>Kullanım Verileri:</Text> Uygulamamızı
                nasıl kullandığınız hakkında istatistiksel veriler
                toplayabiliriz. Bu, görüntülediğiniz sayfalar, tıkladığınız
                özellikler ve uygulamada geçirdiğiniz süre gibi bilgileri
                içerir.
              </Text>

              <Text style={styles.subTitle}>Veri Kullanımı</Text>
              <Text style={styles.paragraph}>
                Topladığımız bilgileri aşağıdaki amaçlarla kullanırız:
              </Text>

              <Text style={styles.bulletPoint}>
                • Hesabınızı oluşturmak ve yönetmek
              </Text>
              <Text style={styles.bulletPoint}>
                • Size en yakın deprem ve doğal afet bilgilerini sunmak
              </Text>
              <Text style={styles.bulletPoint}>
                • Hizmetlerimizi iyileştirmek ve özelleştirmek
              </Text>
              <Text style={styles.bulletPoint}>
                • Teknik sorunları gidermek ve güvenliği sağlamak
              </Text>
              <Text style={styles.bulletPoint}>
                • Yasal yükümlülüklerimizi yerine getirmek
              </Text>

              <Text style={styles.subTitle}>Veri Paylaşımı</Text>
              <Text style={styles.paragraph}>
                Kişisel bilgilerinizi aşağıdaki durumlarda paylaşabiliriz:
              </Text>

              <Text style={styles.bulletPoint}>
                • Yasal gerekliliklere uymak için (mahkeme kararları vb.)
              </Text>
              <Text style={styles.bulletPoint}>
                • Hizmet sağlayıcılarımızla (barındırma, analiz vb.)
              </Text>
              <Text style={styles.bulletPoint}>
                • Acil durumlarda can güvenliğini korumak için
              </Text>
              <Text style={styles.bulletPoint}>• Sizin açık izninizle</Text>

              <Text style={styles.subTitle}>Veri Güvenliği</Text>
              <Text style={styles.paragraph}>
                Bilgilerinizi korumak için endüstri standardı güvenlik önlemleri
                kullanıyoruz. Ancak, internet üzerinden hiçbir veri aktarımı
                veya depolama sistemi %100 güvenli değildir. Bilgilerinizi
                korumak için her türlü makul önlemi alsak da, mutlak güvenlik
                garanti edilemez.
              </Text>

              <Text style={styles.subTitle}>Çocukların Gizliliği</Text>
              <Text style={styles.paragraph}>
                Hizmetlerimiz 13 yaşın altındaki çocuklara yönelik değildir ve
                bilerek 13 yaşın altındaki çocuklardan kişisel bilgi toplamayız.
              </Text>

              <Text style={styles.subTitle}>Politika Değişiklikleri</Text>
              <Text style={styles.paragraph}>
                Bu gizlilik politikasını zaman zaman güncelleyebiliriz.
                Değişiklikler olduğunda, bu sayfada yeni bir "son güncelleme"
                tarihi belirteceğiz. Önemli değişiklikler olduğunda, uygulama
                içi bildirim veya e-posta yoluyla sizi bilgilendireceğiz.
              </Text>

              <Text style={styles.subTitle}>İletişim</Text>
              <Text style={styles.paragraph}>
                Bu gizlilik politikası hakkında sorularınız veya endişeleriniz
                varsa, lütfen info@terraapp.com adresinden bizimle iletişime
                geçin.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.light.textPrimary,
    textAlign: "center",
  },
  placeholder: {
    width: 40, // Same width as back button for balance
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  contentContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.light.textPrimary,
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 14,
    color: colors.light.textSecondary,
    marginBottom: 20,
    fontStyle: "italic",
  },
  subTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.primary,
    marginTop: 24,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 16,
    color: colors.light.textPrimary,
    lineHeight: 24,
    marginBottom: 16,
  },
  bulletPoint: {
    fontSize: 16,
    color: colors.light.textPrimary,
    lineHeight: 24,
    marginBottom: 8,
    paddingLeft: 8,
  },
  bold: {
    fontWeight: "600",
  },
});
