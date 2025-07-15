import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { News } from '@/types/types';

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
  });
};

export const useNewsById = (id: string) => {
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
  });
};