import React, { useState, useEffect, useCallback } from "react";
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
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import NetInfo from "@react-native-community/netinfo";
import { supabase } from "@/lib/supabase";
import { colors } from "@/constants/colors";

const { width, height } = Dimensions.get("window");

// Form validation schema
const signInSchema = z.object({
  email: z
    .string()
    .min(1, "E-posta adresi gerekli")
    .email("Geçerli bir e-posta adresi girin")
    .max(254, "E-posta adresi çok uzun"),
  password: z
    .string()
    .min(8, "Şifre en az 8 karakter olmalı")
    .max(128, "Şifre çok uzun")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermeli"
    ),
  rememberMe: z.boolean().optional(),
});

type SignInFields = z.infer<typeof signInSchema>;

// Constants
const STORAGE_KEYS = {
  REMEMBERED_EMAIL: "@auth/remembered_email",
  REMEMBER_ENABLED: "@auth/remember_enabled",
} as const;

export default function SignInWithEmail() {
  // States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const router = useRouter();

  // Form setup
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<SignInFields>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
    mode: "onChange",
  });

  const watchedEmail = watch("email");
  const watchedPassword = watch("password");

  // Network connectivity check
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? false);
    });

    return () => unsubscribe();
  }, []);

  // Keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  // Focus effect for session and data loading
  useFocusEffect(
    useCallback(() => {
      initializeComponent();
    }, [])
  );

  // Initialize component
  const initializeComponent = async () => {
    try {
      // Load saved data
      await Promise.all([loadRememberedEmail()]);
    } catch (error) {
      console.error("Initialization error:", error);
    }
  };

  // Load remembered email
  const loadRememberedEmail = async () => {
    try {
      const [rememberedEmail, rememberEnabled] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.REMEMBERED_EMAIL),
        AsyncStorage.getItem(STORAGE_KEYS.REMEMBER_ENABLED),
      ]);

      if (rememberedEmail && rememberEnabled === "true") {
        setValue("email", rememberedEmail);
        setValue("rememberMe", true);
      }
    } catch (error) {
      console.error("Load remembered email error:", error);
    }
  };

  // Save/remove email based on remember me
  const handleRememberEmail = async (email: string, remember: boolean) => {
    try {
      if (remember) {
        await AsyncStorage.multiSet([
          [STORAGE_KEYS.REMEMBERED_EMAIL, email],
          [STORAGE_KEYS.REMEMBER_ENABLED, "true"],
        ]);
      } else {
        await AsyncStorage.multiRemove([
          STORAGE_KEYS.REMEMBERED_EMAIL,
          STORAGE_KEYS.REMEMBER_ENABLED,
        ]);
      }
    } catch (error) {
      console.error("Remember email error:", error);
    }
  };

  // Get localized error message
  const getLocalizedErrorMessage = (error: any): string => {
    const errorMessages: Record<string, string> = {
      "Invalid login credentials": "E-posta veya şifre hatalı",
      "Email not confirmed":
        "E-posta adresiniz henüz doğrulanmamış. Lütfen e-posta kutunuzu kontrol edin.",
      "Too many requests":
        "Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin.",
      "Email rate limit exceeded":
        "E-posta gönderim limiti aşıldı. Lütfen daha sonra tekrar deneyin.",
      "Signup disabled": "Yeni kayıt işlemi şu anda devre dışı.",
      "User not found": "Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı.",
      "Invalid email": "Geçersiz e-posta adresi.",
      "Password should be at least 6 characters":
        "Şifre en az 6 karakter olmalıdır.",
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
  const onSubmit = async (data: SignInFields) => {
    if (!isConnected) {
      setErrorMsg("İnternet bağlantısı yok. Lütfen bağlantınızı kontrol edin.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email.trim().toLowerCase(),
        password: data.password,
      });

      if (error) {
        setErrorMsg(getLocalizedErrorMessage(error));
      } else {
        // Success
        await handleRememberEmail(data.email, data.rememberMe || false);

        // Clear form
        reset();

        // Auth provider will handle navigation automatically
      }
    } catch (err: any) {
      console.error("Sign in error:", err);
      setErrorMsg(getLocalizedErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };
  // Handle forgot password
  const handleForgotPassword = () => {
    router.push("/(auth)/forgot-password");
  };
  // Handle sign up navigation
  const handleSignUp = () => {
    router.push("/(auth)/sign-up");
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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
              contentContainerStyle={[
                styles.scrollContent,
                keyboardVisible && styles.scrollContentKeyboard,
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Hoş Geldiniz</Text>
              <Text style={styles.subtitle}>Hesabınıza giriş yapın</Text>
            </View>

            {/* Form Container */}
            <View style={styles.formContainer}>
              <View style={styles.form}>
                {/* Network Status */}
                {!isConnected && (
                  <View style={styles.networkWarning}>
                    <Ionicons name="wifi-outline" size={20} color="#ff6b6b" />
                    <Text style={styles.networkWarningText}>
                      İnternet bağlantısı yok
                    </Text>
                  </View>
                )}

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
                          returnKeyType="next"
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

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Şifre</Text>
                  <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View
                        style={[
                          styles.inputWrapper,
                          errors.password && styles.inputWrapperError,
                          value && styles.inputWrapperFocused,
                        ]}
                      >
                        <Ionicons
                          name="lock-closed-outline"
                          size={20}
                          color={value ? colors.primary : "#666"}
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={styles.input}
                          placeholder="••••••••"
                          placeholderTextColor="#666"
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          secureTextEntry={!showPassword}
                          autoComplete="password"
                          editable={!loading}
                          returnKeyType="done"
                          onSubmitEditing={handleSubmit(onSubmit)}
                        />
                        <TouchableOpacity
                          onPress={togglePasswordVisibility}
                          style={styles.eyeIcon}
                          disabled={!value}
                        >
                          <Ionicons
                            name={
                              showPassword ? "eye-off-outline" : "eye-outline"
                            }
                            size={20}
                            color={value ? colors.primary : "#666"}
                          />
                        </TouchableOpacity>
                      </View>
                    )}
                  />
                  {errors.password && (
                    <Text style={styles.errorText}>
                      {errors.password.message}
                    </Text>
                  )}
                </View>

                {/* Remember Me & Forgot Password */}
                <View style={styles.optionsContainer}>
                  <Controller
                    control={control}
                    name="rememberMe"
                    render={({ field: { onChange, value } }) => (
                      <TouchableOpacity
                        style={styles.rememberMeContainer}
                        onPress={() => onChange(!value)}
                        disabled={loading}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            value && styles.checkboxChecked,
                          ]}
                        >
                          {value && (
                            <Ionicons
                              name="checkmark"
                              size={16}
                              color="white"
                            />
                          )}
                        </View>
                        <Text style={styles.rememberMeText}>Beni Hatırla</Text>
                      </TouchableOpacity>
                    )}
                  />

                  <TouchableOpacity
                    onPress={handleForgotPassword}
                    disabled={loading}
                    style={styles.forgotPasswordButton}
                  >
                    <Text style={styles.forgotPasswordText}>
                      Şifremi Unuttum?
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Error Message */}
                {errorMsg && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={20} color="#ff6b6b" />
                    <Text style={styles.errorMessage}>{errorMsg}</Text>
                  </View>
                )}

                {/* Sign In Button */}
                <TouchableOpacity
                  style={[
                    styles.signInButton,
                    (!isValid || loading || !isConnected) &&
                      styles.signInButtonDisabled,
                  ]}
                  onPress={handleSubmit(onSubmit)}
                  disabled={!isValid || loading || !isConnected}
                >
                  {loading ? (
                    <ActivityIndicator color="black" size="small" />
                  ) : (
                    <>
                      <Text style={styles.signInButtonText}>Giriş Yap</Text>
                      <Ionicons name="arrow-forward" size={20} color="white" />
                    </>
                  )}
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>veya</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Sign Up Link */}
                <TouchableOpacity
                  style={styles.signUpContainer}
                  onPress={handleSignUp}
                  disabled={loading}
                >
                  <Text style={styles.signUpText}>
                    Hesabınız yok mu?{" "}
                    <Text style={styles.signUpLink}>Kayıt Olun</Text>
                  </Text>
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
    justifyContent: "center",
    padding: 20,
    minHeight: height - 100,
  },
  scrollContentKeyboard: {
    justifyContent: "flex-start",
    paddingTop: 50,
  },
  header: {
    alignItems: "center",
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
  },
  formContainer: {
    borderRadius: 20,
    overflow: "hidden",
    // backgroundColor: "black",
  },
  form: {
    padding: 24,
  },
  networkWarning: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 28, 25, 0.1)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  networkWarningText: {
    color: colors.gradientTwo,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  lockoutWarning: {
    backgroundColor: "rgba(239, 28, 25, 0.1)",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: "center",
  },
  lockoutWarningText: {
    color: colors.gradientTwo,
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
    textAlign: "center",
  },
  lockoutTimeText: {
    color: colors.gradientTwo,
    fontSize: 14,
    marginTop: 4,
    textAlign: "center",
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
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    color: colors.gradientTwo,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  optionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  rememberMeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.light.textPrimary,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  rememberMeText: {
    color: colors.light.textPrimary,
    fontSize: 14,
  },
  forgotPasswordButton: {
    padding: 4,
  },
  forgotPasswordText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "500",
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
  attemptsWarning: {
    backgroundColor: "rgba(255, 87, 0, 0.1)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  attemptsWarningText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "500",
  },
  signInButton: {
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
  signInButtonDisabled: {
    backgroundColor: "#F0F0F0",
    shadowOpacity: 0,
    elevation: 0,
  },
  signInButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginRight: 8,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.light.textPrimary,
  },
  dividerText: {
    color: colors.light.textSecondary,
    fontSize: 14,
    marginHorizontal: 16,
  },
  signUpContainer: {
    alignItems: "center",
  },
  signUpText: {
    color: colors.light.textSecondary,
    fontSize: 16,
  },
  signUpLink: {
    color: colors.primary,
    fontWeight: "600",
  },
});
