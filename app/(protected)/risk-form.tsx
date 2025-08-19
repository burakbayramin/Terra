import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "@/constants/colors";
import { useAuth } from "@/hooks/useAuth";
import { useSafetyScore, useUpdateProfile } from "@/hooks/useProfile";
import { usePremium } from "@/hooks/usePremium";
import PremiumFeatureGate from "@/components/PremiumFeatureGate";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";

interface Option {
  label: string;
  scoreChange: number;
}

interface Question {
  question: string;
  options: Option[];
}

interface Category {
  name: string;
  questions: Question[];
}

const RiskForm = () => {
  const router = useRouter();
  const { showResults } = useLocalSearchParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: currentSafetyScore = 0, isLoading: isLoadingSafetyScore } =
    useSafetyScore(user?.id || "");
  const updateProfileMutation = useUpdateProfile();
  
  // Premium hook'u
  const { hasAccessToFeature } = usePremium();

  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [currentScore, setCurrentScore] = useState(100);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingScore, setIsSavingScore] = useState(false);

  // If showResults parameter is present and user has completed the form, show results directly
  useEffect(() => {
    if (showResults === "true" && currentSafetyScore > 0) {
      setCurrentScore(currentSafetyScore);
      setIsCompleted(true);
    }
  }, [showResults, currentSafetyScore]);

  // Güvenlik skoru renk fonksiyonu
  const getScoreColor = (score: number): string => {
    // Negatif değerleri 0 olarak kabul et
    const safeScore = Math.max(0, score);
    
    if (safeScore >= 85) return "#27ae60"; // Koyu Yeşil
    if (safeScore >= 70) return "#2ecc71"; // Açık Yeşil
    if (safeScore >= 55) return "#f1c40f"; // Sarı
    if (safeScore >= 40) return "#f39c12"; // Koyu Sarı/Altın
    if (safeScore >= 25) return "#e67e22"; // Turuncu
    if (safeScore >= 10) return "#e74c3c"; // Kırmızı
    return "#c0392b"; // Koyu Kırmızı
  };

  const riskData: { initialScore: number; categories: Category[] } = {
    initialScore: 100,
    categories: [
      {
        name: "Eğitim Durumu",
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
            question:
              "Deprem öncesi, anı ve sonrası davranışları biliyor musunuz?",
            options: [
              { label: "Evet", scoreChange: 0 },
              { label: "Hayır", scoreChange: -5 },
              { label: "Emin değilim", scoreChange: -5 },
            ],
          },
        ],
      },
      {
        name: "Bina ve Mahalli Durum",
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
        name: "Konum",
        questions: [
          {
            question:
              "Aktif fay hattına 5 km'den daha yakın bir bölgede misiniz?",
            options: [
              { label: "Hayır", scoreChange: 0 },
              { label: "Evet", scoreChange: -5 },
              { label: "Bilmiyorum", scoreChange: -5 },
            ],
          },
          {
            question: "Yaşadığınız bölge sıvılaşma riski taşıyor mu?",
            options: [
              { label: "Hayır", scoreChange: -3 },
              { label: "Evet", scoreChange: -5 },
              { label: "Bilmiyorum", scoreChange: -3 },
            ],
          },
          {
            question: "Binanızın çevresinde yüksek riskli yapılar var mı?",
            options: [
              { label: "Hayır", scoreChange: 0 },
              { label: "Evet", scoreChange: -3 },
            ],
          },
        ],
      },
      {
        name: "Acil Durum Çantası",
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
          {
            question:
              "Çantanızda kimlik fotokopisi ve önemli belgeler mevcut mu?",
            options: [
              { label: "Evet", scoreChange: 0 },
              { label: "Hayır", scoreChange: -2 },
            ],
          },
        ],
      },
      {
        name: "Acil Durum Planı",
        questions: [
          {
            question:
              "Aile bireyleriyle belirlenmiş bir toplanma planınız var mı?",
            options: [
              { label: "Evet", scoreChange: 0 },
              { label: "Hayır", scoreChange: -5 },
            ],
          },
          {
            question:
              "Acil durumda ulaşacağınız kişilerin iletişim bilgileri elinizde mevcut mu?",
            options: [
              { label: "Evet", scoreChange: 0 },
              { label: "Hayır", scoreChange: -3 },
            ],
          },
          {
            question: "Apartman/acil çıkış planı görülebilir yerde mi?",
            options: [
              { label: "Evet", scoreChange: 0 },
              { label: "Hayır", scoreChange: -2 },
            ],
          },
        ],
      },
      {
        name: "Acil Toplanma Alanı",
        questions: [
          {
            question: "Size en yakın toplanma alanını biliyor musunuz?",
            options: [
              { label: "Evet", scoreChange: 0 },
              { label: "Hayır", scoreChange: -5 },
            ],
          },
          {
            question: "O alana yürüyerek ulaşmanız ne kadar sürer?",
            options: [
              { label: "5-10 dakika", scoreChange: 0 },
              { label: "10 dakika üzeri", scoreChange: -2 },
            ],
          },
          {
            question: "Toplanma alanı düzenli mi, güvenli mi?",
            options: [
              { label: "Evet", scoreChange: 0 },
              { label: "Hayır", scoreChange: -3 },
              { label: "Bilmiyorum", scoreChange: -3 },
            ],
          },
        ],
      },
      {
        name: "Deprem Anı Davranış",
        questions: [
          {
            question:
              "Deprem anında 'çök-kapan-tutun' davranışını uygulayabilir misiniz?",
            options: [
              { label: "Evet", scoreChange: 0 },
              { label: "Hayır", scoreChange: -5 },
            ],
          },
          {
            question:
              "Sarsıntı bitmeden dışarı çıkmam gerektiğini düşünüyorum.",
            options: [
              { label: "Katılmıyorum", scoreChange: 0 },
              { label: "Katılıyorum", scoreChange: -5 },
            ],
          },
          {
            question: "Deprem sırasında ilk yaptığınız şey nedir?",
            options: [
              { label: "Güvenli pozisyon almak", scoreChange: 0 },
              { label: "Pencereden bakmak", scoreChange: -5 },
              { label: "Koşmak", scoreChange: -5 },
            ],
          },
        ],
      },
      {
        name: "Ağır Eşyalar Sabit mi?",
        questions: [
          {
            question:
              "Evdeki büyük mobilyalar (dolap, kitaplık vb.) sabitlenmiş mi?",
            options: [
              { label: "Evet", scoreChange: 0 },
              { label: "Hayır", scoreChange: -5 },
            ],
          },
          {
            question: "Üst raflarda ağır ve cam eşyalar var mı?",
            options: [
              { label: "Hayır", scoreChange: 0 },
              { label: "Evet", scoreChange: -3 },
            ],
          },
          {
            question: "Yatakların çevresinde devrilebilecek eşyalar var mı?",
            options: [
              { label: "Hayır", scoreChange: 0 },
              { label: "Evet", scoreChange: -3 },
            ],
          },
        ],
      },
      {
        name: "Fay Hattına Mesafe",
        questions: [
          {
            question: "Eviniz fay hattına 5 km'den daha yakın mı?",
            options: [
              { label: "Hayır", scoreChange: 0 },
              { label: "Evet", scoreChange: -5 },
            ],
          },
          {
            question:
              "Konumunuza özel riskli fay hattı bilgisine sahip misiniz?",
            options: [
              { label: "Evet", scoreChange: 0 },
              { label: "Hayır", scoreChange: -2 },
            ],
          },
          {
            question: "Fay hattı bölgesinde yapılaşma sınırlı mı?",
            options: [
              { label: "Evet", scoreChange: 0 },
              { label: "Hayır", scoreChange: -3 },
              { label: "Bilmiyorum", scoreChange: -3 },
            ],
          },
        ],
      },
      {
        name: "İlk Yardım Eğitimi",
        questions: [
          {
            question: "Temel ilk yardım eğitimi aldınız mı?",
            options: [
              { label: "Evet", scoreChange: 0 },
              { label: "Hayır", scoreChange: -5 },
            ],
          },
          {
            question: "Ailede ilk yardım bilgisi olan biri var mı?",
            options: [
              { label: "Evet", scoreChange: 0 },
              { label: "Hayır", scoreChange: -3 },
            ],
          },
          {
            question: "İlk yardım çantanız var mı?",
            options: [
              { label: "Evet", scoreChange: 0 },
              { label: "Hayır", scoreChange: -2 },
            ],
          },
        ],
      },
    ],
  };

  const totalQuestions = riskData.categories.reduce(
    (total, category) => total + category.questions.length,
    0
  );
  const currentQuestionNumber = answers.length + 1;
  const currentCategory = riskData.categories[currentCategoryIndex];
  const currentQuestion = currentCategory?.questions[currentQuestionIndex];



  const handleAnswer = async (optionIndex: number) => {
    setIsLoading(true);

    const selectedOption = currentQuestion.options[optionIndex];
    const newScore = Math.max(0, Math.min(100, currentScore + selectedOption.scoreChange));
    const newAnswers = [...answers, optionIndex];

    setAnswers(newAnswers);
    setCurrentScore(newScore);

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Move to next question
    if (currentQuestionIndex < currentCategory.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (currentCategoryIndex < riskData.categories.length - 1) {
      setCurrentCategoryIndex(currentCategoryIndex + 1);
      setCurrentQuestionIndex(0);
    } else {
      // Form completed - save the safety score
      await saveSafetyScore(newScore);
      setIsCompleted(true);
    }

    setIsLoading(false);
  };

  const saveSafetyScore = async (formScore: number) => {
    if (!user?.id) return;

    setIsSavingScore(true);
    try {
      // Calculate final score: current safety score + form result
      const finalScore = Math.max(0, Math.min(100, formScore));

      // First, try to upsert the profile to ensure it exists
      const { error: upsertError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          safety_score: finalScore,
          has_completed_safety_form: true,
          updated_at: new Date().toISOString(),
        });

      if (upsertError) {
        throw upsertError;
      }

      // Invalidate and refetch all related queries
      await queryClient.invalidateQueries({
        queryKey: ["safetyScore", user.id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["safetyFormCompletion", user.id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["profile", user.id],
      });

      Alert.alert("Başarılı", `Güvenlik skorunuz güncellendi: %${finalScore}`, [
        { text: "Tamam" },
      ]);
    } catch (error) {
      console.error("Error saving safety score:", error);
      Alert.alert("Hata", "Güvenlik skoru güncellenirken bir hata oluştu.", [
        { text: "Tamam" },
      ]);
    } finally {
      setIsSavingScore(false);
    }
  };

  const resetForm = () => {
    setCurrentCategoryIndex(0);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setCurrentScore(100);
    setIsCompleted(false);
  };

  const getRiskLevel = (score: number): string => {
    // Negatif değerleri 0 olarak kabul et
    const safeScore = Math.max(0, score);
    
    if (safeScore >= 80) return "Düşük Risk";
    if (safeScore >= 60) return "Orta Risk";
    if (safeScore >= 40) return "Yüksek Risk";
    return "Çok Yüksek Risk";
  };

  const getRiskMessage = (score: number): string => {
    // Negatif değerleri 0 olarak kabul et
    const safeScore = Math.max(0, score);
    
    if (safeScore >= 80)
      return "Tebrikler! Deprem riskine karşı iyi hazırlıklısınız.";
    if (safeScore >= 60)
      return "Deprem hazırlığınız orta seviyede. Bazı konularda iyileştirme yapabilirsiniz.";
    if (safeScore >= 40)
      return "Deprem riskine karşı hazırlığınızı artırmanız önerilir.";
    return "Acil olarak deprem hazırlığı konusunda önlemler almanız gerekiyor.";
  };

  const getCorrectAnswersCount = (): number => {
    let correctCount = 0;
    let questionIndex = 0;

    riskData.categories.forEach((category) => {
      category.questions.forEach((question) => {
        if (questionIndex < answers.length) {
          const selectedOptionIndex = answers[questionIndex];
          const selectedOption = question.options[selectedOptionIndex];
          // Eğer scoreChange 0 ise doğru cevap olarak sayıyoruz
          if (selectedOption && selectedOption.scoreChange === 0) {
            correctCount++;
          }
        }
        questionIndex++;
      });
    });

    return correctCount;
  };

  // If user is not logged in, show error
  if (!user) {
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
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons
            name="account-alert"
            size={64}
            color="#e74c3c"
          />
          <Text style={styles.errorTitle}>Giriş Yapmanız Gerekiyor</Text>
          <Text style={styles.errorMessage}>
            Risk değerlendirme formunu kullanabilmek için önce giriş yapmanız
            gerekiyor.
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push("/(auth)/sign-in")}
          >
            <Text style={styles.loginButtonText}>Giriş Yap</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isCompleted) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Risk Değerlendirme Sonucu</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.resultContainer}>
            <LinearGradient
              colors={[getScoreColor(currentScore), getScoreColor(currentScore)]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.scoreContainer}
            >
              <MaterialCommunityIcons
                name="shield-check"
                size={48}
                color="#fff"
                style={styles.scoreIcon}
              />
              <Text style={styles.scoreTitle}>Güvenlik Skorunuz</Text>
              {isSavingScore ? (
                <ActivityIndicator
                  size="large"
                  color="#fff"
                  style={{ marginVertical: 20 }}
                />
              ) : (
                <>
                  <Text style={styles.scoreValue}>%{currentScore}</Text>
                  <Text style={styles.riskLevel}>
                    {getRiskLevel(currentScore)}
                  </Text>
                  {/* {currentSafetyScore !== currentScore && (
                    <Text style={styles.previousScore}>
                      Önceki: %{currentSafetyScore}
                    </Text>
                  )} */}
                </>
              )}
            </LinearGradient>

            <View style={styles.messageContainer}>
              <Text style={styles.messageText}>
                {getRiskMessage(currentScore)}
              </Text>
            </View>

            {/* AI Risk Assessment Comment - Premium Özellik */}
            <PremiumFeatureGate featureId="risk-assessment-ai">
              <View style={styles.aiCommentContainer}>
                <View style={styles.aiCommentHeader}>
                  <Ionicons name="sparkles-outline" size={20} color={colors.primary} />
                  <Text style={styles.aiCommentTitle}>Terra AI Risk Analizi</Text>
                </View>
                <View style={styles.aiCommentContent}>
                  <Text style={styles.aiCommentText}>
                    Skorunuz {currentScore} olarak hesaplandı. Bu skor, deprem güvenliği konusundaki hazırlık seviyenizi gösteriyor. 
                    {currentScore >= 80 
                      ? " Mükemmel! Deprem güvenliği konusunda çok iyi hazırlıklısınız. Bu seviyeyi korumaya devam edin."
                      : currentScore >= 60
                      ? " İyi! Ancak bazı alanlarda iyileştirme yapabilirsiniz. Özellikle eğitim ve hazırlık konularına odaklanın."
                      : currentScore >= 40
                      ? " Orta seviyede hazırlıklısınız. Deprem güvenliği konusunda daha fazla bilgi edinmeniz ve hazırlık yapmanız önerilir."
                      : " Düşük seviyede hazırlıklısınız. Acil olarak deprem güvenliği konusunda eğitim almanız ve hazırlık yapmanız kritik önem taşıyor."
                    }
                  </Text>
                </View>
              </View>
            </PremiumFeatureGate>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{totalQuestions}</Text>
                <Text style={styles.statLabel}>Toplam Soru</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {riskData.categories.length}
                </Text>
                <Text style={styles.statLabel}>Kategori</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {getCorrectAnswersCount()}
                </Text>
                <Text style={styles.statLabel}>Doğru Cevap</Text>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.resetButton} onPress={resetForm}>
                <MaterialCommunityIcons
                  name="refresh"
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.resetButtonText}>Tekrar Değerlendir</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.homeButton}
                onPress={() => router.back()}
              >
                <LinearGradient
                  colors={[colors.gradientOne, colors.gradientTwo]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.homeButtonGradient}
                >
                  <Ionicons name="home" size={20} color="#fff" />
                  <Text style={styles.homeButtonText}>Ana Sayfaya Dön</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
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

      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>
            Soru {currentQuestionNumber} / {totalQuestions}
          </Text>
          <Text style={styles.categoryText}>{currentCategory.name}</Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${(currentQuestionNumber / totalQuestions) * 100}%` },
            ]}
          />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{currentQuestion?.question}</Text>
        </View>

        <View style={styles.optionsContainer}>
          {currentQuestion?.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.optionButton}
              onPress={() => handleAnswer(index)}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={styles.optionText}>{option.label}</Text>
              )}
            </TouchableOpacity>
          ))}
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
  scrollView: {
    flex: 1,
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
  scoreChip: {
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
  scoreText: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "NotoSans-Bold",
  },
  progressContainer: {
    paddingHorizontal: 15,
    paddingVertical: 20,
    backgroundColor: colors.light.background,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.light.textSecondary,
    fontFamily: "NotoSans-Medium",
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
    fontFamily: "NotoSans-Bold",
  },
  progressBar: {
    height: 6,
    backgroundColor: "#e9ecef",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  questionContainer: {
    paddingHorizontal: 15,
    paddingVertical: 20,
  },
  questionText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.light.textPrimary,
    fontFamily: "NotoSans-Bold",
    lineHeight: 26,
    textAlign: "center",
  },
  optionsContainer: {
    paddingHorizontal: 15,
    paddingBottom: 30,
  },
  optionButton: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  optionText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.light.textPrimary,
    fontFamily: "NotoSans-Medium",
    textAlign: "center",
  },
  resultContainer: {
    paddingHorizontal: 15,
    paddingBottom: 30,
  },
  scoreContainer: {
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
    textShadowColor: "rgba(255, 255, 255, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  riskLevel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "NotoSans-Bold",
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  previousScore: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.8)",
    fontFamily: "NotoSans-Medium",
    marginTop: 8,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  messageContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  messageText: {
    fontSize: 15,
    color: "#444",
    lineHeight: 22,
    textAlign: "center",
    fontFamily: "NotoSans-Regular",
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 16,
    paddingVertical: 20,
    marginBottom: 20,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.primary,
    fontFamily: "NotoSans-Bold",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    fontFamily: "NotoSans-Medium",
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 15,
  },
  actionButtons: {
    gap: 12,
  },
  resetButton: {
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
  resetButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
    fontFamily: "NotoSans-Bold",
  },
  homeButton: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: colors.gradientTwo,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  homeButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "NotoSans-Bold",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.light.textPrimary,
    fontFamily: "NotoSans-Bold",
    marginTop: 20,
    marginBottom: 12,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 16,
    color: colors.light.textSecondary,
    fontFamily: "NotoSans-Regular",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
  },
  loginButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "NotoSans-Bold",
  },
  // AI Comment Styles
  aiCommentContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  aiCommentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  aiCommentTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.light.textPrimary,
    marginLeft: 8,
  },
  aiCommentContent: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
  },
  aiCommentText: {
    fontSize: 14,
    color: colors.light.textSecondary,
    lineHeight: 20,
  },
});

export default RiskForm;
