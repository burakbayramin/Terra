import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "@/constants/colors";
import { useAuth } from "@/hooks/useAuth";
import { useSafetyScore, useSafetyFormCompletion } from "@/hooks/useProfile";
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useQueryClient } from "@tanstack/react-query";

interface RiskAssessmentData {
  hasCompleted: boolean;
  safetyScore: number;
  answers: number[];
  recommendations: string[];
}

const RiskAssessmentScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: safetyScore = 0, isLoading: isLoadingSafetyScore } = useSafetyScore(user?.id || "");
  const { data: hasCompletedForm = false, isLoading: isLoadingFormCompletion } = useSafetyFormCompletion(user?.id || "");
  
  const [riskData, setRiskData] = useState<RiskAssessmentData>({
    hasCompleted: false,
    safetyScore: 0,
    answers: [],
    recommendations: []
  });
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<string>("");
  const [showAIRecommendations, setShowAIRecommendations] = useState(false);

  // Risk assessment questions data (same as in risk-form.tsx)
  const riskQuestions = [
    {
      category: "Eğitim Durumu",
      questions: [
        {
          question: "Daha önce deprem eğitimi aldınız mı?",
          options: [
            { label: "Evet", scoreChange: 0 },
            { label: "Hayır", scoreChange: -5 },
          ],
        },
        {
          question: "Deprem tatbikatına hiç katıldınız mı?",
          options: [
            { label: "Evet", scoreChange: 0 },
            { label: "Hayır", scoreChange: -3 },
          ],
        },
        {
          question: "Deprem öncesi, anı ve sonrası davranışları biliyor musunuz?",
          options: [
            { label: "Evet", scoreChange: 0 },
            { label: "Hayır", scoreChange: -5 },
            { label: "Emin değilim", scoreChange: -5 },
          ],
        },
      ],
    },
    {
      category: "Bina ve Mahalli Durum",
      questions: [
        {
          question: "Binanız ne zaman yapıldı?",
          options: [
            { label: "2000 sonrası", scoreChange: 0 },
            { label: "2000 öncesi", scoreChange: -7 },
          ],
        },
        {
          question: "Binanızda gözle görülür çatlaklar var mı?",
          options: [
            { label: "Hayır", scoreChange: 0 },
            { label: "Evet", scoreChange: -10 },
          ],
        },
        {
          question: "Zemin etüdü yapılmış mı?",
          options: [
            { label: "Evet", scoreChange: 0 },
            { label: "Hayır", scoreChange: -5 },
            { label: "Bilmiyorum", scoreChange: -5 },
          ],
        },
      ],
    },
    {
      category: "Acil Durum Çantası",
      questions: [
        {
          question: "Hazırda bir acil durum çantanız var mı?",
          options: [
            { label: "Evet", scoreChange: 0 },
            { label: "Hayır", scoreChange: -5 },
          ],
        },
        {
          question: "Çantanızda en az 3 günlük su ve gıda var mı?",
          options: [
            { label: "Evet", scoreChange: 0 },
            { label: "Hayır", scoreChange: -3 },
            { label: "Emin değilim", scoreChange: -3 },
          ],
        },
      ],
    },
  ];

  useEffect(() => {
    // Check if user has completed risk assessment (even if score is 0)
    if (hasCompletedForm) {
      setRiskData(prev => ({
        ...prev,
        hasCompleted: true,
        safetyScore: safetyScore
      }));
    }
  }, [hasCompletedForm, safetyScore]);

  const getScoreColor = (score: number): string => {
    if (score >= 80) return "#27ae60";
    if (score >= 60) return "#f39c12";
    if (score >= 40) return "#e67e22";
    return "#e74c3c";
  };

  const getRiskLevel = (score: number): string => {
    if (score >= 80) return "Düşük Risk";
    if (score >= 60) return "Orta Risk";
    if (score >= 40) return "Yüksek Risk";
    return "Çok Yüksek Risk";
  };

  const getRiskMessage = (score: number): string => {
    if (score >= 80) return "Tebrikler! Deprem riskine karşı iyi hazırlıklısınız.";
    if (score >= 60) return "Deprem hazırlığınız orta seviyede. Bazı konularda iyileştirme yapabilirsiniz.";
    if (score >= 40) return "Deprem riskine karşı hazırlığınızı artırmanız önerilir.";
    return "Acil olarak deprem hazırlığı konusunda önlemler almanız gerekiyor.";
  };

  const generateAIRecommendations = async () => {
    if (!user) return;

    setIsLoadingAI(true);
    try {
      const genAI = new GoogleGenerativeAI("AIzaSyA9gguZnXbvAcOmVvDxTm1vNVeIqOYfejA");
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

      const prompt = `
        Kullanıcının deprem risk değerlendirme skoru: %${riskData.safetyScore}
        Risk seviyesi: ${getRiskLevel(riskData.safetyScore)}
        
        Bu kullanıcı için deprem güvenliği konusunda 3-4 adet pratik ve uygulanabilir öneri ver. 
        Her öneri 1-2 cümle olsun ve şu kategorilerde olsun:
        1. Eğitim ve bilinçlendirme
        2. Ev güvenliği
        3. Acil durum hazırlığı
        4. Aile planlaması
        
        Önerileri Türkçe olarak, madde madde ver. Her maddeyi yeni satırda başlat.
        Yanıtı sadece önerilerle sınırla, başka açıklama ekleme.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      setAiRecommendations(text);
      setShowAIRecommendations(true);
    } catch (error) {
      console.error('AI öneriler oluşturma hatası:', error);
      Alert.alert("Hata", "AI önerileri oluşturulurken bir hata oluştu.");
    } finally {
      setIsLoadingAI(false);
    }
  };

  const getRecommendations = (score: number): string[] => {
    const recommendations: string[] = [];
    
    if (score < 80) {
      recommendations.push("Deprem eğitimi alarak bilgi seviyenizi artırın.");
    }
    if (score < 70) {
      recommendations.push("Acil durum çantanızı hazırlayın ve düzenli kontrol edin.");
    }
    if (score < 60) {
      recommendations.push("Evdeki ağır eşyaları sabitleyin ve güvenli alanlar belirleyin.");
    }
    if (score < 50) {
      recommendations.push("Aile bireyleriyle acil durum planı yapın.");
    }
    if (score < 40) {
      recommendations.push("Binanızın deprem dayanıklılığını kontrol ettirin.");
    }

    return recommendations;
  };

  if (isLoadingSafetyScore || isLoadingFormCompletion) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Risk Değerlendirme</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {!riskData.hasCompleted ? (
          // Not completed state
          <View style={styles.notCompletedContainer}>
            <LinearGradient
              colors={[colors.gradientOne, colors.gradientTwo]}
              style={styles.notCompletedCard}
            >
              <MaterialCommunityIcons
                name="clipboard-check-outline"
                size={64}
                color="#fff"
                style={styles.notCompletedIcon}
              />
              <Text style={styles.notCompletedTitle}>
                Risk Değerlendirmesini Tamamla
              </Text>
              <Text style={styles.notCompletedDescription}>
                Deprem riskinizi değerlendirmek ve güvenlik skorunuzu öğrenmek için 
                kısa bir anket doldurun.
              </Text>
              
                             <View style={styles.progressContainer}>
                 <View style={styles.progressBar}>
                   <View style={[styles.progressFill, { width: "0%" }]} />
                 </View>
                 <Text style={styles.progressText}>Henüz başlanmadı</Text>
               </View>

              <TouchableOpacity
                style={styles.startButton}
                onPress={() => router.push("/(protected)/risk-form")}
                activeOpacity={0.8}
              >
                <Text style={styles.startButtonText}>Değerlendirmeyi Başlat</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </TouchableOpacity>
            </LinearGradient>
          </View>
        ) : (
          // Completed state
          <View style={styles.completedContainer}>
            {/* Score Display */}
            <LinearGradient
              colors={[colors.gradientOne, colors.gradientTwo]}
              style={styles.scoreCard}
            >
              <MaterialCommunityIcons
                name="shield-check"
                size={48}
                color="#fff"
                style={styles.scoreIcon}
              />
              <Text style={styles.scoreTitle}>Güvenlik Skorunuz</Text>
              <Text style={styles.scoreValue}>%{riskData.safetyScore}</Text>
              <Text style={styles.riskLevel}>{getRiskLevel(riskData.safetyScore)}</Text>
              
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${riskData.safetyScore}%`,
                        backgroundColor: getScoreColor(riskData.safetyScore)
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>{riskData.safetyScore}% Tamamlandı</Text>
              </View>
            </LinearGradient>

            {/* Risk Message */}
            <View style={styles.messageCard}>
              <Text style={styles.messageText}>{getRiskMessage(riskData.safetyScore)}</Text>
            </View>

            {/* Manual Recommendations */}
            <View style={styles.recommendationsCard}>
              <Text style={styles.recommendationsTitle}>Öneriler</Text>
              {getRecommendations(riskData.safetyScore).map((recommendation, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <MaterialCommunityIcons
                    name="lightbulb-outline"
                    size={16}
                    color={colors.primary}
                    style={styles.recommendationIcon}
                  />
                  <Text style={styles.recommendationText}>{recommendation}</Text>
                </View>
              ))}
            </View>

            {/* AI Recommendations Button */}
            <TouchableOpacity
              style={styles.aiButton}
              onPress={generateAIRecommendations}
              disabled={isLoadingAI}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.gradientOne, colors.gradientTwo]}
                style={styles.aiButtonGradient}
              >
                {isLoadingAI ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="robot"
                      size={20}
                      color="#fff"
                    />
                    <Text style={styles.aiButtonText}>
                      Terra AI Risk Skoru Değerlendirmesi
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* AI Recommendations Display */}
            {showAIRecommendations && aiRecommendations && (
              <View style={styles.aiRecommendationsCard}>
                <View style={styles.aiHeader}>
                  <MaterialCommunityIcons
                    name="robot"
                    size={24}
                    color={colors.primary}
                  />
                  <Text style={styles.aiTitle}>AI Önerileri</Text>
                </View>
                <Text style={styles.aiRecommendationsText}>{aiRecommendations}</Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.retakeButton}
                onPress={() => {
                  // Invalidate cache before navigating to form
                  queryClient.invalidateQueries({
                    queryKey: ["safetyScore", user?.id],
                  });
                  queryClient.invalidateQueries({
                    queryKey: ["safetyFormCompletion", user?.id],
                  });
                  queryClient.invalidateQueries({
                    queryKey: ["profile", user?.id],
                  });
                  router.push("/(protected)/risk-form");
                }}
              >
                <MaterialCommunityIcons
                  name="refresh"
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.retakeButtonText}>Tekrar Değerlendir</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.light.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.light.textPrimary,
    fontFamily: "NotoSans-Bold",
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.light.textSecondary,
    fontFamily: "NotoSans-Regular",
  },
  notCompletedContainer: {
    padding: 20,
  },
  notCompletedCard: {
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    shadowColor: colors.gradientTwo,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  notCompletedIcon: {
    marginBottom: 20,
  },
  notCompletedTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "NotoSans-Bold",
    textAlign: "center",
    marginBottom: 12,
  },
  notCompletedDescription: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    fontFamily: "NotoSans-Regular",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
  },
  progressContainer: {
    width: "100%",
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    fontFamily: "NotoSans-Medium",
    textAlign: "center",
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    gap: 8,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "NotoSans-Bold",
  },
  completedContainer: {
    padding: 20,
  },
  scoreCard: {
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: colors.gradientTwo,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  scoreIcon: {
    marginBottom: 12,
  },
  scoreTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.9)",
    fontFamily: "NotoSans-Medium",
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: "800",
    color: "#fff",
    fontFamily: "NotoSans-Bold",
    marginBottom: 8,
  },
  riskLevel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "NotoSans-Bold",
    marginBottom: 20,
  },
  messageCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  messageText: {
    fontSize: 16,
    color: "#444",
    lineHeight: 24,
    textAlign: "center",
    fontFamily: "NotoSans-Regular",
  },
  recommendationsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.light.textPrimary,
    fontFamily: "NotoSans-Bold",
    marginBottom: 16,
  },
  recommendationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  recommendationIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  recommendationText: {
    flex: 1,
    fontSize: 15,
    color: "#444",
    lineHeight: 22,
    fontFamily: "NotoSans-Regular",
  },
  aiButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: colors.gradientTwo,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  aiButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  aiButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "NotoSans-Bold",
  },
  aiRecommendationsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  aiTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.light.textPrimary,
    fontFamily: "NotoSans-Bold",
    marginLeft: 8,
  },
  aiRecommendationsText: {
    fontSize: 15,
    color: "#444",
    lineHeight: 22,
    fontFamily: "NotoSans-Regular",
  },
  actionButtons: {
    gap: 12,
  },
  retakeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: colors.primary,
    gap: 8,
  },
  retakeButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
    fontFamily: "NotoSans-Bold",
  },
});

export default RiskAssessmentScreen; 