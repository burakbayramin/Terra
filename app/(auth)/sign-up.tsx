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
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import NetInfo from "@react-native-community/netinfo";
import { supabase } from "@/lib/supabase";
import { colors } from "@/constants/colors";

const { width, height } = Dimensions.get("window");

// Form validation schema
const signUpSchema = z
  .object({
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
    confirmPassword: z.string().min(1, "Şifrenizi tekrar girin"),
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: "Kullanım şartlarını kabul etmeniz gerekiyor",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Şifreler eşleşmiyor",
    path: ["confirmPassword"],
  });

type SignUpFields = z.infer<typeof signUpSchema>;

export default function SignUp() {
  // States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  // const [keyboardVisible, setKeyboardVisible] = useState(false);
  // const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const router = useRouter();

  // Form setup
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid },
  } = useForm<SignUpFields>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      termsAccepted: false,
    },
    mode: "onChange",
  });

  const watchedEmail = watch("email");
  const watchedPassword = watch("password");
  const watchedConfirmPassword = watch("confirmPassword");

  // Network connectivity check
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? false);
    });

    return () => unsubscribe();
  }, []);

  // useEffect(() => {
  //   if (registrationSuccess) {
  //     const timer = setTimeout(() => {
  //       //TODO burada bir ayarlama gerekebilir
  //       setRegistrationSuccess(false);
  //     }, 3500);

  //     return () => clearTimeout(timer);
  //   }
  // }, [registrationSuccess]);

  // Get localized error message
  const getLocalizedErrorMessage = (error: any): string => {
    const errorMessages: Record<string, string> = {
      "User already registered": "Bu e-posta adresi zaten kayıtlı",
      "Email already in use": "Bu e-posta adresi zaten kullanımda",
      "Password should be at least 8 characters":
        "Şifre en az 8 karakter olmalıdır",
      "Invalid email": "Geçersiz e-posta adresi",
      "Too many requests":
        "Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin.",
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
  const onSubmit = async (data: SignUpFields) => {
    if (!isConnected) {
      setErrorMsg("İnternet bağlantısı yok. Lütfen bağlantınızı kontrol edin.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email.trim().toLowerCase(),
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setErrorMsg(getLocalizedErrorMessage(error));
      } else {
        // Success - show verification message
        // setRegistrationSuccess(true);
        reset();
      }
    } catch (err: any) {
      console.error("Sign up error:", err);
      setErrorMsg(getLocalizedErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Handle sign in navigation
  const handleSignIn = () => {
    router.push("/(auth)/sign-in-email");
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Toggle confirm password visibility
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Success message display
  // if (registrationSuccess) {
  //   return (
  //     <SafeAreaView style={styles.container}>
  //       <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
  //       <View style={styles.gradient}>
  //         <View style={styles.successContainer}>
  //           <Ionicons
  //             name="checkmark-circle"
  //             size={80}
  //             color={colors.primary}
  //           />
  //           <Text style={styles.successTitle}>Kayıt Başarılı!</Text>
  //           <Text style={styles.successMessage}>
  //             E-posta adresinize bir doğrulama bağlantısı gönderdik. Lütfen
  //             hesabınızı doğrulamak için e-postanızı kontrol edin.
  //           </Text>
  //           {/* <TouchableOpacity
  //             style={styles.signInButton}
  //             onPress={handleSignIn}
  //           >
  //             <Text style={styles.signInButtonText}>Giriş Sayfasına Dön</Text>
  //             <Ionicons name="arrow-forward" size={20} color="white" />
  //           </TouchableOpacity> */}
  //         </View>
  //       </View>
  //     </SafeAreaView>
  //   );
  // }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

      <View style={styles.gradient}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              styles.scrollContentKeyboard,
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Hesap Oluştur</Text>
              <Text style={styles.subtitle}>
                Yeni bir hesap oluşturarak başlayın
              </Text>
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
                          autoComplete="new-password"
                          editable={!loading}
                          returnKeyType="next"
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

                {/* Confirm Password Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Şifre Tekrar</Text>
                  <Controller
                    control={control}
                    name="confirmPassword"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View
                        style={[
                          styles.inputWrapper,
                          errors.confirmPassword && styles.inputWrapperError,
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
                          secureTextEntry={!showConfirmPassword}
                          autoComplete="new-password"
                          editable={!loading}
                          returnKeyType="done"
                        />
                        <TouchableOpacity
                          onPress={toggleConfirmPasswordVisibility}
                          style={styles.eyeIcon}
                          disabled={!value}
                        >
                          <Ionicons
                            name={
                              showConfirmPassword
                                ? "eye-off-outline"
                                : "eye-outline"
                            }
                            size={20}
                            color={value ? colors.primary : "#666"}
                          />
                        </TouchableOpacity>
                      </View>
                    )}
                  />
                  {errors.confirmPassword && (
                    <Text style={styles.errorText}>
                      {errors.confirmPassword.message}
                    </Text>
                  )}
                </View>

                {/* Terms and Conditions */}
                <View style={styles.termsContainer}>
                  <Controller
                    control={control}
                    name="termsAccepted"
                    render={({ field: { onChange, value } }) => (
                      <TouchableOpacity
                        style={styles.termsRow}
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
                        <Text style={styles.termsText}>
                          <Text>Kullanım şartlarını ve </Text>
                          <Text
                            style={styles.termsLink}
                            onPress={() =>
                              router.push("/(auth)/privacy-policy")
                            }
                          >
                            gizlilik politikasını{" "}
                          </Text>
                          <Text>kabul ediyorum</Text>
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                  {errors.termsAccepted && (
                    <Text style={styles.errorText}>
                      {errors.termsAccepted.message}
                    </Text>
                  )}
                </View>

                {/* Error Message */}
                {errorMsg && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={20} color="#ff6b6b" />
                    <Text style={styles.errorMessage}>{errorMsg}</Text>
                  </View>
                )}

                {/* Sign Up Button */}
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
                      <Text style={styles.signInButtonText}>Kayıt Ol</Text>
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

                {/* Sign In Link */}
                <TouchableOpacity
                  style={styles.signUpContainer}
                  onPress={handleSignIn}
                  disabled={loading}
                >
                  <Text style={styles.signUpText}>
                    Zaten bir hesabınız var mı?{" "}
                    <Text style={styles.signUpLink}>Giriş Yapın</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
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
  termsContainer: {
    marginBottom: 24,
  },
  termsRow: {
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
  termsText: {
    color: colors.light.textPrimary,
    fontSize: 14,
    flex: 1,
  },
  termsLink: {
    color: colors.primary,
    textDecorationLine: "underline",
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
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.light.textPrimary,
    marginTop: 20,
    marginBottom: 16,
    textAlign: "center",
  },
  successMessage: {
    fontSize: 16,
    color: colors.light.textSecondary,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
});
