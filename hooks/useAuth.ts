// hooks/useAuth.ts
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { User, Session, AuthError } from "@supabase/supabase-js";

// Auth ile ilgili türler
export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface SignUpData {
  email: string;
  password: string;
  fullName?: string;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  });

  // Auth state değişikliklerini dinle
  useEffect(() => {
    // Mevcut session'ı kontrol et
    const getSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Session error:", error);
          setAuthState((prev) => ({
            ...prev,
            loading: false,
            error: error.message,
          }));
          return;
        }

        setAuthState((prev) => ({
          ...prev,
          session,
          user: session?.user ?? null,
          loading: false,
          error: null,
        }));
      } catch (error) {
        console.error("Get session error:", error);
        setAuthState((prev) => ({
          ...prev,
          loading: false,
          error: "Oturum bilgileri alınamadı",
        }));
      }
    };

    getSession();

    // Auth state değişikliklerini dinle
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id);

      setAuthState((prev) => ({
        ...prev,
        session,
        user: session?.user ?? null,
        loading: false,
        error: null,
      }));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Giriş yapma
  const signIn = async ({
    email,
    password,
  }: SignInData): Promise<{ error?: string }> => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        const errorMessage = getAuthErrorMessage(error);
        setAuthState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        return { error: errorMessage };
      }

      // Başarılı giriş - state otomatik güncellenecek
      return {};
    } catch (error) {
      const errorMessage = "Beklenmeyen bir hata oluştu";
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return { error: errorMessage };
    }
  };

  // Kayıt olma
  const signUp = async ({
    email,
    password,
    fullName,
  }: SignUpData): Promise<{ error?: string }> => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName || "",
          },
        },
      });

      if (error) {
        const errorMessage = getAuthErrorMessage(error);
        setAuthState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        return { error: errorMessage };
      }

      // Email doğrulama gerekiyorsa
      if (data.user && !data.session) {
        setAuthState((prev) => ({ ...prev, loading: false }));
        return { error: "Lütfen email adresinizi doğrulayın" };
      }

      return {};
    } catch (error) {
      const errorMessage = "Beklenmeyen bir hata oluştu";
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return { error: errorMessage };
    }
  };

  const signOut = async (): Promise<{ error?: string }> => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }));

      const { error } = await supabase.auth.signOut();

      if (error) {
        const errorMessage = getAuthErrorMessage(error);
        setAuthState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        return { error: errorMessage };
      }

      return {};
    } catch (error) {
      const errorMessage = "Çıkış yapılırken hata oluştu";
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return { error: errorMessage };
    }
  };

  // Şifre sıfırlama
  const resetPassword = async (email: string): Promise<{ error?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: "your-app://reset-password", // Deep link'inizi buraya yazın
        }
      );

      if (error) {
        const errorMessage = getAuthErrorMessage(error);
        return { error: errorMessage };
      }

      return {};
    } catch (error) {
      return { error: "Şifre sıfırlama maili gönderilemedi" };
    }
  };

  // Profil güncelleme
  const updateProfile = async (updates: {
    full_name?: string;
    avatar_url?: string;
  }): Promise<{ error?: string }> => {
    try {
      if (!authState.user) {
        return { error: "Giriş yapmalısınız" };
      }

      const { error } = await supabase.auth.updateUser({
        data: updates,
      });

      if (error) {
        const errorMessage = getAuthErrorMessage(error);
        return { error: errorMessage };
      }

      return {};
    } catch (error) {
      return { error: "Profil güncellenemedi" };
    }
  };

  return {
    // State
    ...authState,

    // Computed values
    isAuthenticated: !!authState.user,
    isLoading: authState.loading,

    // Actions
    signIn,
    signUp,
    // signOut,
    resetPassword,
    updateProfile,

    // Utility
    clearError: () => setAuthState((prev) => ({ ...prev, error: null })),
  };
};

// Auth hata mesajlarını Türkçeye çevir
const getAuthErrorMessage = (error: AuthError): string => {
  switch (error.message) {
    case "Invalid login credentials":
      return "Geçersiz email veya şifre";
    case "Email not confirmed":
      return "Email adresinizi doğrulamanız gerekiyor";
    case "User already registered":
      return "Bu email adresi zaten kayıtlı";
    case "Password should be at least 6 characters":
      return "Şifre en az 6 karakter olmalıdır";
    case "Invalid email":
      return "Geçersiz email adresi";
    case "Email rate limit exceeded":
      return "Çok fazla deneme. Lütfen bekleyin";
    case "Signup is disabled":
      return "Kayıt işlemi şu anda devre dışı";
    default:
      return error.message || "Bilinmeyen bir hata oluştu";
  }
};