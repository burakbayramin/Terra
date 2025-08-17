import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { useEffect } from "react";

// Current user'ı cache'den alan hook
export const useAuth = () => {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async (): Promise<User | null> => {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error("Auth error:", error);
        return null;
      }
      
      return user;
    },
    staleTime: Infinity, // Hiç stale olmasın
    gcTime: Infinity, // Cache'den hiç silinmesin
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Auth state listener - sadece bir kez kurulur
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Login olduğunda cache'i güncelle
          queryClient.setQueryData(['auth-user'], session?.user || null);
        } else if (event === 'SIGNED_OUT') {
          // Logout olduğunda cache'i temizle
          queryClient.removeQueries({ queryKey: ['auth-user'] });
          queryClient.clear(); // Tüm cache'i temizle
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [queryClient]);

  return {
    user,
    isLoading,
    userId: user?.id,
  };
};