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
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { colors } from "@/constants/colors";
import { Divider } from "react-native-paper";

export default function ProfileScreen() {
  const router = useRouter();
  const profileCompletionPercentage = 75;
  const missionCompletionPercentage = 15;
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile Section with Gradient */}
        <LinearGradient
          colors={[colors.gradientOne, colors.gradientTwo]}
          style={styles.profileSection}
        >
          <View style={styles.profileImageContainer}>
            <Image
              source={{ uri: "https://picsum.photos/300/200" }}
              style={styles.profileImage}
            />
          </View>
          <Text style={styles.userName}>Burak Bayramin</Text>
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
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={styles.iconContainer}>
                  <FontAwesome5 name="tasks" size={20} color="#666" />
                </View>
                <Text style={styles.menuItemText}>Görevler</Text>
              </View>
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
          </View>

          {/* Personalization Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Kişiselleştirmeler</Text>

            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name="moon-outline" size={20} color="#666" />
                </View>
                <Text style={styles.menuItemText}>Karanlık Mod</Text>
              </View>
              {/* <Switch
              value={isDarkMode}
              onValueChange={setIsDarkMode}
              trackColor={{ false: "#E5E5E5", true: "#007AFF" }}
              thumbColor={isDarkMode ? "#FFFFFF" : "#FFFFFF"}
            /> */}
            </View>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name="globe-outline" size={20} color="#666" />
                </View>
                <Text style={styles.menuItemText}>Dil</Text>
              </View>
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
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={styles.iconContainer}>
                  <FontAwesome5 name="tasks" size={20} color="#666" />
                </View>
                <Text style={styles.menuItemText}>Topluluk Kuralları</Text>
              </View>
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
            </TouchableOpacity>
          </View>
        </View>
        <Divider style={styles.divider} />

        <View style={styles.supportContainer}>
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

        
        {/* Katkıda Bulun viewinin altına iletişim bölümü eklendi */}
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
                // İletişim formuna yönlendirme veya mail açma işlemi
              }}
            >
              <Text style={styles.contactButtonText}>İletişime Geç</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.signOutContainer}>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={() => supabase.auth.signOut()}
            activeOpacity={0.8}
          >
            <Text style={styles.signOutButtonText}>Sign Out</Text>
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
    backgroundColor: "#f8f9fa",
  },
  signOutButton: {
    backgroundColor: colors.gradientTwo, // gradientTwo rengi
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
    marginVertical: 20,
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
});
