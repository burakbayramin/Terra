import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { News } from '@/types/types';

// Mevcut useNews hook'u aynı kalır
export const useNews = () => {
  return useQuery({
    queryKey: ['news'],
    queryFn: async (): Promise<News[]> => {
      const { data, error } = await supabase
        .from("news")
        .select("id, title, snippet, content, image, created_at, category, source, earthquake_id")
        .order('created_at', { ascending: false });
      
      if (error) {
        throw new Error("Haberler alınamadı.");
      }
      
      return data || [];
    },
    staleTime: 1000 * 60 * 30, // 30 dakika
    gcTime: 1000 * 60 * 60, // 60 dakika
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

// Güncellenen useNewsById hook'u - initialData parametresi eklendi
export const useNewsById = (id: string, initialData?: News) => {
  return useQuery({
    queryKey: ['news', id],
    queryFn: async (): Promise<News> => {
      const { data, error } = await supabase
        .from("news")
        .select("id, title, snippet, content, image, created_at, category, source, earthquake_id")
        .eq("id", id)
        .single();
      
      if (error) {
        throw new Error("Haber detayı alınamadı.");
      }
      
      if (!data) {
        throw new Error("Haber bulunamadı");
      }
      
      return data;
    },
    enabled: !!id,
    
    // InitialData olarak cache'den gelen veriyi kullan
    initialData: initialData,
    
    // Ayarlar
    staleTime: 1000 * 60 * 30, // 30 dakika
    gcTime: 1000 * 60 * 60, // 60 dakika
    
    // Cache'de veri varsa ilk mount'ta refetch yapma
    refetchOnMount: !initialData,
    refetchOnWindowFocus: false,
  });
};