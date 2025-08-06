import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Dimensions,
  StatusBar,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { colors } from "@/constants/colors";

const { width, height } = Dimensions.get("window");

// Form validation schema
const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "E-posta adresi gerekli")
    .email("Geçerli bir e-posta adresi girin")
    .max(254, "E-posta adresi çok uzun"),
});

type ForgotPasswordFields = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  // States
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const router = useRouter();

  // Form setup
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ForgotPasswordFields>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
    mode: "onChange",
  });

  // Keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        // Handle keyboard show if needed
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        // Handle keyboard hide if needed
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  // Get localized error message
  const getLocalizedErrorMessage = (error: any): string => {
    const errorMessages: Record<string, string> = {
      "User not found": "Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı.",
      "Invalid email": "Geçersiz e-posta adresi.",
      "Email rate limit exceeded":
        "E-posta gönderim limiti aşıldı. Lütfen daha sonra tekrar deneyin.",
      "Network error":
        "İnternet bağlantısı hatası. Lütfen bağlantınızı kontrol edin.",
    };

    // Handle network errors
    if (
      error?.message?.includes("fetch") ||
      error?.message?.includes("network")
    ) {
      return errorMessages["Network error"];
    }

    return (
      errorMessages[error?.message] ||
      error?.message ||
      "Beklenmeyen bir hata oluştu."
    );
  };

  // Form submission handler
  const onSubmit = async (data: ForgotPasswordFields) => {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        data.email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (error) {
        setErrorMsg(getLocalizedErrorMessage(error));
      } else {
        // Success
        setSuccessMsg(
          "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen e-posta kutunuzu kontrol edin."
        );
      }
    } catch (err: any) {
      console.error("Password reset error:", err);
      setErrorMsg(getLocalizedErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

      <View style={styles.gradient}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
            {/* Back Button */}
            {/* <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              disabled={loading}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={colors.light.textPrimary}
              />
            </TouchableOpacity> */}

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Şifremi Unuttum</Text>
              <Text style={styles.subtitle}>
                Şifrenizi sıfırlamak için e-posta adresinizi girin
              </Text>
            </View>

            {/* Form Container */}
            <View style={styles.formContainer}>
              <View style={styles.form}>
                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>E-posta</Text>
                  <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View
                        style={[
                          styles.inputWrapper,
                          errors.email && styles.inputWrapperError,
                          value && styles.inputWrapperFocused,
                        ]}
                      >
                        <Ionicons
                          name="mail-outline"
                          size={20}
                          color={value ? colors.primary : "#666"}
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={styles.input}
                          placeholder="ornek@email.com"
                          placeholderTextColor="#666"
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                          autoComplete="email"
                          editable={!loading}
                          returnKeyType="done"
                          onSubmitEditing={handleSubmit(onSubmit)}
                        />
                        {value && !errors.email && (
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color="#4CAF50"
                          />
                        )}
                      </View>
                    )}
                  />
                  {errors.email && (
                    <Text style={styles.errorText}>{errors.email.message}</Text>
                  )}
                </View>

                {/* Success Message */}
                {successMsg && (
                  <View style={styles.successContainer}>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#4CAF50"
                    />
                    <Text style={styles.successMessage}>{successMsg}</Text>
                  </View>
                )}

                {/* Error Message */}
                {errorMsg && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={20} color="#ff6b6b" />
                    <Text style={styles.errorMessage}>{errorMsg}</Text>
                  </View>
                )}

                {/* Submit Button */}
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    (!isValid || loading) && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmit(onSubmit)}
                  disabled={!isValid || loading}
                >
                  {loading ? (
                    <ActivityIndicator color="black" size="small" />
                  ) : (
                    <>
                      <Text style={styles.submitButtonText}>
                        Şifremi Sıfırla
                      </Text>
                      <Ionicons name="arrow-forward" size={20} color="white" />
                    </>
                  )}
                </TouchableOpacity>

                {/* Sign In Link */}
                <TouchableOpacity
                  style={styles.signInContainer}
                  onPress={handleBack}
                  disabled={loading}
                >
                  <Text style={styles.signInText}>Giriş sayfasına dön</Text>
                </TouchableOpacity>
              </View>
            </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
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
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    minHeight: height - 100,
  },
  backButton: {
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 10,
    padding: 10,
  },
  header: {
    alignItems: "center",
    marginTop: 80,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.light.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: colors.light.textSecondary,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  formContainer: {
    borderRadius: 20,
    overflow: "hidden",
  },
  form: {
    padding: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    color: colors.light.textPrimary,
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.light.textPrimary,
    paddingHorizontal: 16,
    height: 56,
  },
  inputWrapperFocused: {
    borderColor: colors.light.textPrimary,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  inputWrapperError: {
    borderColor: colors.gradientTwo,
    backgroundColor: "rgba(239, 28, 25, 0.1)",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: colors.light.textPrimary,
    fontSize: 16,
    height: "100%",
  },
  errorText: {
    color: colors.gradientTwo,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  successContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  successMessage: {
    color: "#4CAF50",
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 28, 25, 0.1)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorMessage: {
    color: colors.gradientTwo,
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButtonDisabled: {
    backgroundColor: "#F0F0F0",
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginRight: 8,
  },
  signInContainer: {
    alignItems: "center",
  },
  signInText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "500",
  },
});
