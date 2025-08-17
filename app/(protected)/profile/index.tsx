import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import React from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "@/constants/colors";
import { Divider } from "react-native-paper";
import { useProfile, useSubscriptionPlanName } from "@/hooks/useProfiles";
import { Ionicons } from "@expo/vector-icons";
import { FontAwesome5 } from "@expo/vector-icons";

import LoadingView from "@/components/LoadingView";
import AnimatedProgressBar from "@/components/AnimatedProgressBar";

export default function ProfileScreen() {
  const router = useRouter();

  // useAuth'a gerek yok, useProfile zaten userId verilmezse
  // otomatik olarak auth user'ı kullanıyor
  const { data: profile, isLoading } = useProfile(); // userId parametresi yok

  const { data: planData } = useSubscriptionPlanName(
    profile?.subscription_plan_id
  );

  // Profile'dan direkt hesaplanan değerler
  const safetyScore = profile?.safety_score || 0;
  const hasCompletedForm = profile?.has_completed_safety_form || false;
  const currentPlan = planData?.name || "FREE";

  // Null fields hesaplama - profile'dan direkt
  const calculateNullFields = () => {
    if (!profile) return 7;

    const fields = [
      profile.name,
      profile.surname,
      profile.city,
      profile.district,
      profile.emergency_phone,
      profile.username,
      profile.address,
    ];

    return fields.filter(
      (field) => !field || field.toString().trim().length === 0
    ).length;
  };

  const nullFieldsCount = calculateNullFields();
  const profileCompletionPercentage = Math.round(
    ((7 - nullFieldsCount) / 7) * 100
  );
  const missionCompletionPercentage = 15;

  if (isLoading && !profile) {
    return <LoadingView />;
  }

  // Email gösterimi için helper
  const getUserDisplayName = () => {
    if (profile?.username) {
      return profile.username;
    }
    if (profile?.name && profile?.surname) {
      return `${profile.name} ${profile.surname}`;
    }
    return "Terra Kullanıcısı";
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <LinearGradient
          colors={
            currentPlan === "FREE"
              ? [colors.gradientOne, colors.gradientTwo]
              : currentPlan === "SUPPORTER"
              ? ["#FFD700", "#FFA500", "#FFD700"]
              : currentPlan === "PROTECTOR"
              ? ["#FF5700", "#FF8C00", "#FF5700"]
              : currentPlan === "SPONSOR"
              ? ["#8A2BE2", "#9370DB", "#8A2BE2"]
              : [colors.gradientOne, colors.gradientTwo]
          }
          style={[
            styles.profileSection,
            currentPlan !== "FREE" && styles.premiumProfileSection,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Profile Image */}
          <View style={styles.profileImageContainer}>
            <View style={styles.profileImageWrapper}>
              <Image
                source={require("@/assets/images/profile.png")}
                style={styles.profileImage}
              />

              {/* Premium Badge */}
              {currentPlan !== "FREE" && (
                <View
                  style={[
                    styles.premiumBadge,
                    currentPlan === "SUPPORTER" && styles.supporterBadge,
                    currentPlan === "PROTECTOR" && styles.protectorBadge,
                    currentPlan === "SPONSOR" && styles.sponsorBadge,
                  ]}
                >
                  <Text style={styles.premiumBadgeText}>{currentPlan}</Text>
                </View>
              )}
            </View>
          </View>

          {/* User Name */}
          <Text style={styles.userName}>{getUserDisplayName()}</Text>

          {/* Progress Chips */}
          <View style={styles.chipContainer}>
            {profileCompletionPercentage < 100 && (
              <TouchableOpacity
                style={styles.profileCompletionChip}
                onPress={() => router.push("/profile/profile-settings")}
                activeOpacity={0.7}
              >
                <AnimatedProgressBar percentage={profileCompletionPercentage} />
                <Text style={styles.profileCompletionText}>
                  {`Profili tamamla %${profileCompletionPercentage}`}
                </Text>
              </TouchableOpacity>
            )}
            <View style={styles.profileCompletionChip}>
              <AnimatedProgressBar percentage={missionCompletionPercentage} />
              <Text style={styles.profileCompletionText}>
                Görevleri tamamla %{missionCompletionPercentage}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.menuContainer}>
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
                    color={currentPlan === "FREE" ? "#FFD700" : "#666"}
                  />
                </View>
                <Text style={styles.menuItemText}>Premium Paketler</Text>
              </View>
              {currentPlan === "FREE" && (
                <View style={styles.premiumUpgradeChip}>
                  <Text style={styles.premiumUpgradeText}>Yükselt</Text>
                </View>
              )}
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
          </View>

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

        {/* Sign Out */}
        <View style={styles.signOutContainer}>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={async () => {
              await supabase.auth.signOut();
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
    paddingVertical: 40,
    width: "100%",
  },
  premiumProfileSection: {
    position: "relative",
    overflow: "hidden",
  },
  supporterProfileSection: {
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 15,
  },
  protectorProfileSection: {
    shadowColor: "#FF5700",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 15,
  },
  sponsorProfileSection: {
    shadowColor: "#8A2BE2",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 15,
  },
  premiumSectionDecoration: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.1,
  },
  premiumSectionDecorationTop: {
    top: -100,
    right: -100,
  },
  premiumSectionDecorationBottom: {
    bottom: -100,
    left: -100,
  },
  supporterSectionDecoration: {
    backgroundColor: "#FFD700",
  },
  protectorSectionDecoration: {
    backgroundColor: "#FF5700",
  },
  sponsorSectionDecoration: {
    backgroundColor: "#8A2BE2",
  },
  premiumSectionBorder: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    overflow: "hidden",
  },
  premiumSectionBorderGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  profileImageContainer: {
    marginBottom: 15,
    padding: 3,
    paddingTop: 35,
    borderRadius: 55,
  },
  premiumProfileContainer: {
    position: "relative",
    padding: 20,
    borderRadius: 75,
    marginTop: -20,
    marginBottom: 5,
  },
  supporterProfileContainer: {
    backgroundColor: "rgba(255, 215, 0, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.2)",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  protectorProfileContainer: {
    backgroundColor: "rgba(255, 87, 0, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 87, 0, 0.2)",
    shadowColor: "#FF5700",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  sponsorProfileContainer: {
    backgroundColor: "rgba(138, 43, 226, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(138, 43, 226, 0.2)",
    shadowColor: "#8A2BE2",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  premiumBackgroundPattern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 75,
    overflow: "hidden",
  },
  premiumBackgroundGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 75,
  },
  premiumDecorations: {
    position: "absolute",
    top: 15,
    right: 15,
    flexDirection: "row",
    gap: 6,
  },
  premiumDecorationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  supporterDecorationDot: {
    backgroundColor: "#FFD700",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 3,
  },
  protectorDecorationDot: {
    backgroundColor: "#FF5700",
    shadowColor: "#FF5700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 3,
  },
  sponsorDecorationDot: {
    backgroundColor: "#8A2BE2",
    shadowColor: "#8A2BE2",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 3,
  },
  profileImageWrapper: {
    position: "relative",
    borderRadius: 55,
    padding: 4,
  },
  premiumFrameOverlay: {
    position: "absolute",
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 63,
    zIndex: 1,
  },
  supporterFrameOverlay: {
    backgroundColor: "transparent",
    borderWidth: 0,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 12,
  },
  protectorFrameOverlay: {
    backgroundColor: "transparent",
    borderWidth: 0,
    shadowColor: "#FF5700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 12,
  },
  sponsorFrameOverlay: {
    backgroundColor: "transparent",
    borderWidth: 0,
    shadowColor: "#8A2BE2",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 12,
  },
  premiumFrameInner: {
    position: "absolute",
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
    borderRadius: 59,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  premiumFrameGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 63,
  },
  supporterFrame: {
    backgroundColor: "transparent",
    borderWidth: 0,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  protectorFrame: {
    backgroundColor: "transparent",
    borderWidth: 0,
    shadowColor: "#FF5700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sponsorFrame: {
    backgroundColor: "transparent",
    borderWidth: 0,
    shadowColor: "#8A2BE2",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  premiumBadge: {
    position: "absolute",
    bottom: -8,
    right: -8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 3,
  },
  supporterBadge: {
    backgroundColor: "#FFD700",
  },
  protectorBadge: {
    backgroundColor: "#FF5700",
  },
  sponsorBadge: {
    backgroundColor: "#8A2BE2",
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#fff",
    fontFamily: "NotoSans-Bold",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "white",
    zIndex: 2,
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
  menuContainer: {
    flex: 1,
    backgroundColor: colors.light.background,
    paddingHorizontal: 25,
    paddingTop: 10,
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
    paddingBottom: 70,
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
  premiumUpgradeChip: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  premiumUpgradeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: "NotoSans-Bold",
  },
  completedProfileChip: {
    backgroundColor: "rgba(39, 174, 96, 0.3)",
    borderWidth: 1,
    borderColor: "rgba(39, 174, 96, 0.5)",
  },
  missionChip: {
    backgroundColor: "rgba(255, 215, 0, 0.3)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.5)",
  },
  missionChipText: {
    color: "white",
    fontSize: 12,
    fontFamily: "NotoSans-Medium",
    marginLeft: 5,
  },
});
