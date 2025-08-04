import {
  View,
  Text,
  StyleSheet,
  Button,
  SafeAreaView,
  Image,
  TouchableOpacity,
  Switch,
  ScrollView,
} from "react-native";
import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  Ionicons,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { colors } from "@/constants/colors";
import { Divider } from "react-native-paper";

export default function ProfileScreen() {
  const router = useRouter();
  const profileCompletionPercentage = 75;
  const missionCompletionPercentage = 15;
  const [securityScore] = useState(78);

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

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        bounces={false}
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
          <Text style={styles.userName}>Burak Bayramin</Text>

          {/* Security Score Chip */}
          <View style={styles.securityScoreContainer}>
            <TouchableOpacity
              style={[
                styles.securityScoreChip,
                { borderColor: getScoreColor(securityScore) },
              ]}
              activeOpacity={0.7}
              onPress={() => {
                // router.push("/(protected)/security-score");
              }}
            >
              <MaterialCommunityIcons
                name="shield-check"
                size={16}
                color={getScoreColor(securityScore)}
              />
              <Text
                style={[
                  styles.securityScoreText,
                  { color: getScoreColor(securityScore) },
                ]}
              >
                % {securityScore}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.chipContainer}>
            <View style={styles.profileCompletionChip}>
              <View style={styles.miniProgressBar}>
                <View
                  style={[
                    styles.miniProgressFill,
                    { width: `${profileCompletionPercentage}%` },
                  ]}
                />
              </View>
              <Text style={styles.profileCompletionText}>
                Profili tamamla %{profileCompletionPercentage}
              </Text>
            </View>
            <View style={styles.profileCompletionChip}>
              <View style={styles.miniProgressBar}>
                <View
                  style={[
                    styles.miniProgressFill,
                    { width: `${missionCompletionPercentage}%` },
                  ]}
                />
              </View>
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
});
