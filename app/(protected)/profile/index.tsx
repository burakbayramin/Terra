import {
  View,
  Text,
  StyleSheet,
  Button,
  Image,
  TouchableOpacity,
  Switch,
  ScrollView,
  Linking,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { LinearGradient } from "expo-linear-gradient";
import {
  Ionicons,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { colors } from "@/constants/colors";
import { Divider } from "react-native-paper";
import { useSafetyScore, useSafetyFormCompletion, useProfileCompletion } from "@/hooks/useProfile";
import { useProfile as useProfileData } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { usePremium } from "@/hooks/usePremium";
import { PremiumPackageType } from "@/types/types";

// Animated Progress Bar Component
const AnimatedProgressBar = ({ percentage }: { percentage: number }) => {
  const animatedWidth = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: percentage,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [percentage, animatedWidth]);

  return (
    <View style={styles.miniProgressBar}>
      <Animated.View
        style={[
          styles.miniProgressFill,
          { 
            width: animatedWidth.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }),
            backgroundColor: percentage === 100 ? '#27ae60' : 'white',
          },
        ]}
      />
    </View>
  );
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, getUserId } = useAuth();
  const queryClient = useQueryClient();
  const { data: safetyScore = 0 } = useSafetyScore(user?.id || "");
  const { data: hasCompletedForm = false, isLoading: isLoadingFormCompletion } = useSafetyFormCompletion(user?.id || "");
  const { data: profileCompletion = { percentage: 0, completedFields: 0, totalFields: 6 } } = useProfileCompletion(user?.id || "");
  const { getCurrentLevel } = usePremium();
  const { profile } = useProfileData();
  
  // Premium seviye adını getir
  const getPremiumLevelName = (level: PremiumPackageType): string => {
    switch (level) {
      case PremiumPackageType.FREE:
        return 'Katılımcı (Ücretsiz)';
      case PremiumPackageType.SUPPORTER:
        return 'Destekleyici (Premium 1)';
      case PremiumPackageType.PROTECTOR:
        return 'Koruyucu (Premium 2)';
      case PremiumPackageType.SPONSOR:
        return 'Sponsor (Premium 3)';
      default:
        return 'Katılımcı (Ücretsiz)';
    }
  };
  
  // Check if form is completed (even if score is 0, it means assessment was done)
  const isFormCompleted = hasCompletedForm;
  const missionCompletionPercentage = 15;
  const insets = useSafeAreaInsets();

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

  // Risk değerlendirme buton rengi fonksiyonu
  const getRiskButtonColors = (isCompleted: boolean, score: number): [string, string] => {
    if (!isCompleted) {
      return ["#f8f9fa", "#e9ecef"]; // Gri gradient - değerlendirme yapılmamış
    }
    
    // Değerlendirme tamamlanmış, skora göre renk belirle
    if (score >= 80) return ["#27ae60", "#2ecc71"]; // Yeşil gradient
    if (score >= 60) return ["#f39c12", "#f1c40f"]; // Sarı gradient
    if (score >= 40) return ["#e67e22", "#f39c12"]; // Turuncu gradient
    return ["#e74c3c", "#c0392b"]; // Kırmızı gradient (0-39 arası)
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={{ paddingBottom: insets.bottom }}
      >
        {/* Profile Section with Gradient */}
        <LinearGradient
          colors={[colors.gradientOne, colors.gradientTwo]}
          style={styles.profileSection}
        >
          <View style={styles.profileImageContainer}>
            <Image
              source={require("@/assets/images/profile.png")}
              style={styles.profileImage}
            />
          </View>
          <Text style={styles.userName}>
            {profile?.show_full_name_in_profile && profile?.name && profile?.surname 
              ? `${profile.name} ${profile.surname}`
              : getUserId() || 'Kullanıcı'
            }
          </Text>

          {/* Premium Status */}
          <View style={styles.premiumStatusContainer}>
            <TouchableOpacity
              style={styles.premiumStatusChip}
              activeOpacity={0.7}
              onPress={() => router.push("/(protected)/premium-packages")}
            >
              <Ionicons
                name="star"
                size={16}
                color="#FFD700"
              />
              <Text style={styles.premiumStatusText}>
                Üyelik Seviyesi: {getPremiumLevelName(getCurrentLevel())}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Security Score Chip - Only show if assessment is completed and has a score > 0 */}
          {isFormCompleted && safetyScore > 0 && (
            <View style={styles.securityScoreContainer}>
              <TouchableOpacity
                style={[
                  styles.securityScoreChip,
                  { borderColor: getScoreColor(safetyScore) },
                ]}
                activeOpacity={0.7}
                onPress={() => {
                  // router.push("/(protected)/security-score");
                }}
              >
                <MaterialCommunityIcons
                  name="shield-check"
                  size={16}
                  color={getScoreColor(safetyScore)}
                />
                <Text
                  style={[
                    styles.securityScoreText,
                    { color: getScoreColor(safetyScore) },
                  ]}
                >
                  % {safetyScore}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.chipContainer}>
            <TouchableOpacity 
              style={styles.profileCompletionChip}
              onPress={() => {
                // Invalidate profile completion cache before navigating
                queryClient.invalidateQueries({
                  queryKey: ["profileCompletion", user?.id],
                });
                router.push("/profile/profile-settings");
              }}
              activeOpacity={0.7}
            >
              <AnimatedProgressBar percentage={profileCompletion.percentage} />
              <Text style={[
                styles.profileCompletionText,
                profileCompletion.percentage === 100 && { color: '#27ae60', fontWeight: 'bold' }
              ]}>
                {profileCompletion.percentage === 100 
                  ? 'Profil Tamamlandı!' 
                  : `Profili tamamla %${profileCompletion.percentage}`
                }
              </Text>
            </TouchableOpacity>
            <View style={styles.profileCompletionChip}>
              <AnimatedProgressBar percentage={missionCompletionPercentage} />
              <Text style={styles.profileCompletionText}>
                Görevleri tamamla %{missionCompletionPercentage}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Menu Container */}
        <View style={styles.menuContainer}>
          {/* Account Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Hesap</Text>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name="person-outline" size={20} color="#666" />
                </View>
                <Text style={styles.menuItemText}>Profil</Text>
              </View>
              <TouchableOpacity
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
                onPress={() => router.push("/profile/profile-settings")}
              ></TouchableOpacity>
            </TouchableOpacity>

            {/* <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={styles.iconContainer}>
                  <FontAwesome5 name="tasks" size={20} color="#666" />
                </View>
                <Text style={styles.menuItemText}>Görevler</Text>
              </View>
            </TouchableOpacity> */}

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons
                    name="notifications-outline"
                    size={20}
                    color="#666"
                  />
                </View>
                <Text style={styles.menuItemText}>Bildirimler</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons
                    name="diamond-outline"
                    size={20}
                    color="#666"
                  />
                </View>
                <Text style={styles.menuItemText}>Premium Paketler</Text>
              </View>
              <TouchableOpacity
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
                onPress={() => router.push("/(protected)/premium-packages")}
              ></TouchableOpacity>
            </TouchableOpacity>

            <View style={styles.riskAssessmentContainer}>
              <TouchableOpacity
                style={styles.riskAssessmentButton}
                onPress={() => {
                  // Invalidate cache before navigating
                  queryClient.invalidateQueries({
                    queryKey: ["safetyScore", user?.id],
                  });
                  queryClient.invalidateQueries({
                    queryKey: ["safetyFormCompletion", user?.id],
                  });
                  queryClient.invalidateQueries({
                    queryKey: ["profile", user?.id],
                  });
                  router.push("/profile/risk-assessment");
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={getRiskButtonColors(isFormCompleted, safetyScore)}
                  style={styles.riskAssessmentGradient}
                >
                  <View style={styles.riskAssessmentContent}>
                    <View style={styles.riskAssessmentLeft}>
                      <View style={[
                        styles.riskAssessmentIconContainer,
                        { backgroundColor: isFormCompleted ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.05)" }
                      ]}>
                        <MaterialCommunityIcons
                          name={isFormCompleted ? "shield-check" : "clipboard-check-outline"}
                          size={24}
                          color={isFormCompleted ? "#fff" : "#666"}
                        />
                      </View>
                      <View style={styles.riskAssessmentTextContainer}>
                        <Text style={[
                          styles.riskAssessmentTitle,
                          { color: isFormCompleted ? "#fff" : "#1a1a1a" }
                        ]}>
                          Risk Değerlendirme
                        </Text>
                        <Text style={[
                          styles.riskAssessmentSubtitle,
                          { color: isFormCompleted ? "rgba(255, 255, 255, 0.8)" : "#666" }
                        ]}>
                          {isFormCompleted ? `Güvenlik Skoru: %${safetyScore}` : "Değerlendirme bekleniyor"}
                        </Text>
                      </View>
                    </View>
                    
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={24}
                      color={isFormCompleted ? "#fff" : "#666"}
                    />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Kişiselleştirmeler</Text>

            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name="moon-outline" size={20} color="#666" />
                </View>
                <Text style={styles.menuItemText}>Karanlık Mod</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name="globe-outline" size={20} color="#666" />
                </View>
                <Text style={styles.menuItemText}>Dil</Text>
              </View>
            </TouchableOpacity>
          </View> */}

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Destek ve Politikalar</Text>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name="person-outline" size={20} color="#666" />
                </View>
                <Text style={styles.menuItemText}>Hizmet Şartları</Text>
              </View>
              <TouchableOpacity
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
                onPress={() => router.push("/profile/terms-of-service")}
              ></TouchableOpacity>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={styles.iconContainer}>
                  <FontAwesome5 name="tasks" size={20} color="#666" />
                </View>
                <Text style={styles.menuItemText}>Topluluk Kuralları</Text>
              </View>
              <TouchableOpacity
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
                onPress={() => router.push("/profile/community-rules")}
              ></TouchableOpacity>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons
                    name="notifications-outline"
                    size={20}
                    color="#666"
                  />
                </View>
                <Text style={styles.menuItemText}>Destek</Text>
              </View>
              <TouchableOpacity
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
                onPress={() => router.push("/profile/support")}
              ></TouchableOpacity>
            </TouchableOpacity>
          </View>
        </View>
        <Divider style={styles.divider} />

        {/* <View style={styles.supportContainer}>
          <Text style={styles.statsTitle}>Geliştiricilere Destek Ol</Text>
          <View style={styles.supportContentImproved}>
            <Text style={styles.supportTextImproved}>
              Terra uygulaması topluluk katkılarıyla geliştirilmektedir. Deprem
              bilinci ve güvenliği için daha iyi özellikler geliştirmemize
              yardımcı olabilirsiniz.
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
                Linking.openURL('mailto:info@terraapp.io');
              }}
            >
              <Text style={styles.contactButtonText}>İletişime Geç</Text>
            </TouchableOpacity>
          </View>
        </View> */}

        <View style={styles.signOutContainer}>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={async () => {
              const { error } = await supabase.auth.signOut();
              if (error) {
                console.log("Sign out error:", error.message);
              } else {
                // Başarılı çıkış sonrası yönlendirme veya başka bir işlem
                console.log("Sign out successful");
              }
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.signOutButtonText}>Çıkış Yap</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: 30,
    width: "100%",
  },
  profileImageContainer: {
    marginBottom: 15,
    padding: 3,
    paddingTop: 50,
    borderRadius: 55,
    // backgroundColor: "rgba(255, 255, 255, 0.2)",
    // shadowColor: "#000",
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.2,
    // shadowRadius: 4,
    // elevation: 5,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "white",
  },
  userName: {
    color: "white",
    fontSize: 24,
    fontFamily: "NotoSans-Bold",
    marginBottom: 5,
  },
  premiumStatusContainer: {
    marginBottom: 10,
  },
  premiumStatusChip: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  premiumStatusText: {
    color: "white",
    fontSize: 14,
    fontFamily: "NotoSans-Medium",
    marginLeft: 8,
  },
  chipContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
    gap: 10,
  },
  profileCompletionChip: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  profileCompletionText: {
    color: "white",
    fontSize: 12,
    fontFamily: "NotoSans-Medium",
    marginLeft: 5,
  },
  miniProgressBar: {
    width: 30,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 2,
    overflow: "hidden",
  },
  miniProgressFill: {
    height: "100%",
    backgroundColor: "white",
    borderRadius: 2,
  },
  menuContainer: {
    flex: 1,
    backgroundColor: colors.light.background,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionContainer: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "NotoSans-Bold",
    color: "#1a1a1a",
    marginBottom: 15,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 24,
    alignItems: "center",
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 15,
    color: "#1a1a1a",
    fontFamily: "NotoSans-Regular",
  },
  signOutContainer: {
    padding: 20,
    backgroundColor: colors.light.background,
  },
  signOutButton: {
    backgroundColor: colors.gradientTwo,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.gradientTwo,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 1,
    marginHorizontal: 40,
  },
  signOutButtonText: {
    color: "white",
    fontSize: 15,
    fontFamily: "NotoSans-Bold",
    letterSpacing: 0.5,
  },
  divider: {
    height: 3,
    backgroundColor: colors.light.surface,
    marginHorizontal: 12,
    marginVertical: 10,
    borderRadius: 10,
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
  contactButton: {
    marginTop: 12,
    backgroundColor: "#2196F3", // Mavi renk kullanıyoruz iletişim için
    flex: 0,
    width: "100%",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  statsTitle: {
    fontSize: 18,
    fontFamily: "NotoSans-Bold",
    color: colors.gradientTwo,
    textAlign: "center",
    marginBottom: 10,
    marginTop: 2,
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
  securityScoreContainer: {
    alignItems: "center",
    marginBottom: 15,
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
  riskAssessmentContainer: {
    marginBottom: 15,
  },
  riskAssessmentButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: colors.gradientTwo,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  riskAssessmentGradient: {
    padding: 20,
  },
  riskAssessmentContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  riskAssessmentLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  riskAssessmentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  riskAssessmentTextContainer: {
    flex: 1,
  },
  riskAssessmentTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "NotoSans-Bold",
    marginBottom: 4,
  },
  riskAssessmentSubtitle: {
    fontSize: 14,
    fontFamily: "NotoSans-Regular",
  },
});
