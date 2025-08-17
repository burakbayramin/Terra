import { queryClient } from "@/providers/QueryProvider";
import { supabase } from "@/lib/supabase";
import { News, Profile } from "@/types/types";
import { User } from "@supabase/supabase-js";

// Auth user prefetch fonksiyonu
export const prefetchAuthUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error("Auth prefetch error:", error);
      return null;
    }
    
    if (user) {
      // Auth user'ı cache'e set et
      queryClient.setQueryData(["auth-user"], user);
      console.log("Auth user prefetched successfully");
    }
    
    return user;
  } catch (error) {
    console.error("Auth user prefetch hatası:", error);
    return null;
  }
};

// Haber prefetch fonksiyonu
export const prefetchNews = async () => {
  try {
    await queryClient.prefetchQuery({
      queryKey: ["news"],
      queryFn: async (): Promise<News[]> => {
        const { data, error } = await supabase
          .from("news")
          .select(
            "id, title, snippet, content, image, created_at, category, source, earthquake_id"
          )
          .order("created_at", { ascending: false });

        if (error) {
          throw new Error("Haberler alınamadı.");
        }

        return data || [];
      },
      staleTime: 1000 * 60 * 30, // 30 dakika
      gcTime: 1000 * 60 * 60, // 60 dakika
    });
    
    console.log("News prefetched successfully");
  } catch (error) {
    console.error("News prefetch hatası:", error);
  }
};

// Profile prefetch fonksiyonu
export const prefetchProfile = async (userId?: string) => {
  try {
    // Eğer userId verilmemişse, auth'dan al
    let effectiveUserId = userId;
    
    if (!effectiveUserId) {
      // Cache'den auth user'ı kontrol et
      const cachedUser = queryClient.getQueryData<User>(["auth-user"]);
      
      if (cachedUser) {
        effectiveUserId = cachedUser.id;
      } else {
        // Cache'de yoksa auth'dan al
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log("No authenticated user for profile prefetch");
          return;
        }
        effectiveUserId = user.id;
      }
    }

    // Profile bilgilerini prefetch et
    const profileData = await queryClient.prefetchQuery({
      queryKey: ["profile", effectiveUserId],
      queryFn: async (): Promise<Profile | null> => {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", effectiveUserId)
          .single();

        if (error && error.code !== "PGRST116") {
          throw new Error("Profil bilgileri alınamadı.");
        }

        return data;
      },
      staleTime: 1000 * 60 * 30, // 30 dakika
      gcTime: 1000 * 60 * 60, // 60 dakika
    });

    // Subscription plan bilgisi için ayrı prefetch
    // Profile data'yı cache'den al
    const cachedProfile = queryClient.getQueryData<Profile>(["profile", effectiveUserId]);
    
    if (cachedProfile?.subscription_plan_id) {
      await queryClient.prefetchQuery({
        queryKey: ["subscription-plan", cachedProfile.subscription_plan_id],
        queryFn: async () => {
          const { data } = await supabase
            .from("subscription_plans")
            .select("name")
            .eq("id", cachedProfile.subscription_plan_id)
            .eq("is_active", true)
            .single();
          
          return data || { name: "FREE" };
        },
        staleTime: 1000 * 60 * 60, // 1 saat
        gcTime: 1000 * 60 * 120, // 2 saat
      });
    }

    console.log("Profile data prefetched successfully");
  } catch (error) {
    console.error("Profile prefetch error:", error);
  }
};

// Ana prefetch fonksiyonu
export const prefetchCriticalData = async () => {
  try {
    // Önce auth user'ı prefetch et ve bekle
    const user = await prefetchAuthUser();
    
    // Paralel olarak diğer verileri prefetch et
    const prefetchPromises = [
      prefetchNews(),
      // Auth user varsa profile'ı da prefetch et
      user ? prefetchProfile(user.id) : Promise.resolve(),
    ];

    // Promise.allSettled kullanarak bir hata olsa bile diğerleri devam etsin
    const results = await Promise.allSettled(prefetchPromises);

    // Hataları logla
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        const prefetchNames = ["news", "profile"];
        console.error(`Prefetch ${prefetchNames[index]} başarısız:`, result.reason);
      }
    });
    
    return user; // Auth user'ı return et (opsiyonel kullanım için)
  } catch (error) {
    console.error("Critical data prefetch error:", error);
  }
};

// Background refresh için helper
export const setupBackgroundRefresh = () => {
  // Her 15 dakikada bir haberleri sessizce güncelle
  const newsInterval = setInterval(() => {
    queryClient.invalidateQueries({
      queryKey: ["news"],
      refetchType: "active", // Sadece aktif query'leri güncelle
    });
  }, 15 * 60 * 1000);

  // Her 30 dakikada bir profile'ı güncelle (eğer user login ise)
  const profileInterval = setInterval(() => {
    const cachedUser = queryClient.getQueryData<User>(["auth-user"]);
    if (cachedUser) {
      queryClient.invalidateQueries({
        queryKey: ["profile", cachedUser.id],
        refetchType: "active",
      });
    }
  }, 30 * 60 * 1000);

  // Cleanup fonksiyonu
  return () => {
    clearInterval(newsInterval);
    clearInterval(profileInterval);
  };
};

// Auth state değişimlerinde prefetch için helper
export const handleAuthStateChange = async (event: string, userId?: string) => {
  if (event === 'SIGNED_IN' && userId) {
    // Login olduğunda profile'ı prefetch et
    await prefetchProfile(userId);
  } else if (event === 'SIGNED_OUT') {
    // Logout olduğunda profile cache'lerini temizle
    queryClient.removeQueries({ queryKey: ["profile"] });
    queryClient.removeQueries({ queryKey: ["subscription-plan"] });
  }
};