import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface SecurityWarningProps {
  securityScore: number;
  hasCompletedSafetyForm: boolean;
  showWarning: boolean;
  onClose: () => void;
}

const SecurityWarningComponent: React.FC<SecurityWarningProps> = ({
  securityScore,
  hasCompletedSafetyForm,
  showWarning,
  onClose,
}) => {
  const router = useRouter();

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

  // Güvenlik uyarı mesajı fonksiyonu
  const getSecurityWarningMessage = (score: number): string => {
    if (score >= 70) {
      const messages = [
        "İyi hazırlık seviyesindesiniz ancak mükemmelliğe ulaşmak için acil durum çantası hazırlayın, aile planı oluşturun ve risk değerlendirmesini tekrarlayın.",
        "Deprem hazırlığınız iyi ancak yeterli değil. Evinizin güvenliğini artırın ve toplanma alanlarını öğrenin.",
        "Hazırlık seviyeniz iyi. Deprem sigortası yaptırın, eğitim alın ve hazırlık seviyenizi mükemmelliğe ulaştırın."
      ];
      return messages[Math.floor(Math.random() * messages.length)];
    } else if (score >= 55) {
      const messages = [
        "Orta risk seviyesindesiniz. Acil durum çantası hazırlayın, aile planı oluşturun ve risk değerlendirmesini tekrarlayın.",
        "Deprem hazırlığınız yeterli değil. Evinizin güvenliğini artırın ve toplanma alanlarını öğrenin.",
        "Risk orta seviyede. Deprem sigortası yaptırın, eğitim alın ve hazırlık seviyenizi artırın."
      ];
      return messages[Math.floor(Math.random() * messages.length)];
    } else if (score >= 40) {
      const messages = [
        "Yüksek risk altındasınız! Deprem hazırlık eğitimi alın, evinizi güçlendirin ve acil durum planınızı uygulayın.",
        "Hazırlık seviyeniz kritik. Acil durum çantası hazırlayın, aile planı oluşturun ve güvenli alan belirleyin.",
        "Deprem karşısında güvencesizsiniz. Evinizin güvenliğini kontrol edin ve acil durum eğitimi alın."
      ];
      return messages[Math.floor(Math.random() * messages.length)];
    } else if (score >= 25) {
      const messages = [
        "Çok yüksek risk altındasınız! Deprem hazırlık eğitimi alın ve evinizi güçlendirin.",
        "Kritik seviyedesiniz. Deprem karşısında savunmasızsınız. Profesyonel yardım alın ve hemen harekete geçin.",
        "Maksimum risk altındasınız! Acil durum eğitimi ve ev güçlendirme için profesyonel destek alın."
      ];
      return messages[Math.floor(Math.random() * messages.length)];
    } else {
      const messages = [
        "Maksimum risk altındasınız! Acil durum eğitimi ve ev güçlendirme için profesyonel destek alın.",
        "Kritik seviyedesiniz. Deprem karşısında tamamen savunmasızsınız. Hemen profesyonel yardım alın.",
        "Çok yüksek risk! Deprem karşısında hiçbir hazırlığınız yok. Acil müdahale gerekli."
      ];
      return messages[Math.floor(Math.random() * messages.length)];
    }
  };

  // Component görünür değilse null döndür
  if (!showWarning || !hasCompletedSafetyForm || securityScore >= 85) {
    return null;
  }

  return (
    <TouchableOpacity
      style={[
        styles.securityWarningContainer,
        {
          backgroundColor: `${getScoreColor(securityScore)}15`, // %15 opacity
          borderLeftColor: getScoreColor(securityScore),
          borderColor: `${getScoreColor(securityScore)}30`, // %30 opacity
        }
      ]}
      activeOpacity={0.9}
      onPress={() => {
        if (hasCompletedSafetyForm) {
          router.push("/(protected)/risk-form?showResults=true");
        } else {
          router.push("/(protected)/risk-form");
        }
      }}
    >
      <View style={styles.securityWarningContent}>
        <Ionicons 
          name="information-circle" 
          size={18} 
          color={getScoreColor(securityScore)} 
        />
        <View style={styles.securityWarningTextContainer}>
          <Text style={styles.securityWarningText}>
            {getSecurityWarningMessage(securityScore)}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.securityWarningCloseButton}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={16} color="#2d3748" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  securityWarningContainer: {
    marginHorizontal: 8,
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: "rgba(0, 0, 0, 0.1)",
  },
  securityWarningContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    gap: 8,
    minHeight: 60,
  },
  securityWarningText: {
    flex: 1,
    fontSize: 13,
    color: "#2d3748",
    lineHeight: 18,
    fontWeight: "500",
  },
  securityWarningTextContainer: {
    flex: 1,
    flexDirection: "column",
    gap: 2,
    justifyContent: "center",
  },
  securityWarningCloseButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
});

export default SecurityWarningComponent;
