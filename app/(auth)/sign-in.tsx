import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "@/constants/colors";

export default function SignInScreen() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={[colors.gradientOne, colors.gradientTwo]}
      style={styles.background}
    >
      <View style={styles.topContainer}>
        <Text style={styles.title}>Terra</Text>
        <Text style={styles.subtitle}>Birlikte Güvendeyiz.</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.buttonWhite}>
          <Ionicons
            name="logo-google"
            size={20}
            color="#000"
            style={styles.icon}
          />
          <Text style={styles.buttonTextDark}>Google ile Giriş Yap</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonDark}>
          <Ionicons
            name="logo-apple"
            size={20}
            color="#fff"
            style={styles.icon}
          />
          <Text style={styles.buttonTextLight}>Apple ile Giriş Yap</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.buttonRed}
          onPress={() => router.push("/(auth)/sign-in-email")}
        >
          <Ionicons name="mail" size={20} color="#fff" style={styles.icon} />
          <Text style={styles.buttonTextLight}>E-posta ile Devam Et</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footerText}>
        <Text style={styles.footerLabel}>Hesabın yok mu? </Text>
        <Link href="/(auth)/sign-up">
          <Text style={styles.footerLinkText}>Kayıt ol</Text>
        </Link>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  topContainer: {
    marginTop: "90%",
    zIndex: 1,
  },
  title: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 4,
    fontFamily: "NotoSans-Bold",
  },
  subtitle: {
    fontSize: 16,
    color: "#ffffffaa",
    fontFamily: "NotoSans-Bold",
  },
  buttonContainer: {
    flex: 1,
    justifyContent: "flex-end",
    marginBottom: 40,
  },
  buttonWhite: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    marginBottom: 12,
    elevation: 4,
  },
  buttonDark: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(17,17,17,0.9)",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    marginBottom: 12,
    elevation: 4,
  },
  buttonRed: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonTextLight: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
    fontFamily: "NotoSans-Medium",
    letterSpacing: 0.3,
  },
  buttonTextDark: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
    fontFamily: "NotoSans-Medium",
  },
  icon: {
    marginRight: 8,
  },
  footerText: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 50,
  },
  footerLabel: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "NotoSans-Regular",
  },
  footerLinkText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "bold",
    textDecorationLine: "underline",
    fontFamily: "NotoSans-Bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  bottomSheet: {
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 36,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    fontFamily: "NotoSans-Regular",
  },
  inputContainer: {
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorField: {
    color: "crimson",
    marginTop: 4,
    fontFamily: "NotoSans-Regular",
  },
  errorRoot: {
    color: "crimson",
    marginBottom: 12,
    fontFamily: "NotoSans-Regular",
  },
  sheetButton: {
    backgroundColor: "#D43F30",
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 8,
  },
  sheetButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "NotoSans-Regular",
  },
});
