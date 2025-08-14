import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { News } from '@/types/types';
import { newsApiService, NewsApiArticle } from '@/lib/newsApi';

// NewsAPI makalelerini News tipine dönüştür
const transformNewsApiArticle = (article: NewsApiArticle): News => {
  return {
    id: article.url, // URL'i ID olarak kullan
    title: article.title,
    snippet: article.description || article.content?.substring(0, 200) || '',
    content: article.content || article.description || '',
    image: article.urlToImage || '',
    created_at: article.publishedAt,
    category: ['latest'], // Varsayılan kategori
    source: article.source.name,
    earthquake_id: null, // NewsAPI'de bu bilgi yok
    url: article.url,
    author: article.author
  };
};

export const useNews = (category: 'latest' | 'expert_opinions' = 'latest') => {
  return useQuery({
    queryKey: ['news', category],
    queryFn: async (): Promise<News[]> => {
      try {
        // NewsAPI'den deprem haberlerini getir
        const response = await newsApiService.getEarthquakeNewsByCategory(category);
        
        // Makaleleri News tipine dönüştür
        const transformedNews = response.articles.map(transformNewsApiArticle);
        
        return transformedNews;
      } catch (error) {
        console.error('NewsAPI Error:', error);
        
        // Fallback olarak Supabase'den veri çek
        try {
          const { data, error: supabaseError } = await supabase
            .from("news")
            .select("id, title, snippet, content, image, created_at, category, source, earthquake_id")
            .order('created_at', { ascending: false });
          
          if (supabaseError) {
            throw new Error("Haberler alınamadı.");
          }
          
          return data || [];
        } catch (fallbackError) {
          throw new Error("Haberler alınamadı. Lütfen internet bağlantınızı kontrol edin.");
        }
      }
    },
    staleTime: 5 * 60 * 1000, // 5 dakika
    gcTime: 10 * 60 * 1000, // 10 dakika
  });
};

export const useNewsById = (id: string) => {
  return useQuery({
    queryKey: ['news', id],
    queryFn: async (): Promise<News> => {
      // Eğer ID bir URL ise (NewsAPI'den geliyorsa)
      if (id.startsWith('http')) {
        // URL'den haber bilgilerini çekmeye çalış
        // Bu durumda basit bir fallback döndür
        return {
          id: id,
          title: 'Haber Detayı',
          snippet: 'Bu haber detayı için orijinal kaynağı ziyaret edin.',
          content: 'Bu haber detayı için orijinal kaynağı ziyaret edin.',
          image: '',
          created_at: new Date().toISOString(),
          category: ['latest'],
          source: 'NewsAPI',
          earthquake_id: null,
          url: id
        };
      }
      
      // Supabase'den veri çek
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

// Yeni: Tüm Türk kaynaklarından deprem haberlerini getir
export const useAllTurkishEarthquakeNews = (page: number = 1) => {
  return useQuery({
    queryKey: ['turkish-earthquake-news', page],
    queryFn: async (): Promise<News[]> => {
      try {
        const response = await newsApiService.getAllTurkishEarthquakeNews(page);
        return response.articles.map(transformNewsApiArticle);
      } catch (error) {
        console.error('NewsAPI Error:', error);
        throw new Error("Türk haber kaynaklarından veriler alınamadı.");
      }
    },
    staleTime: 5 * 60 * 1000, // 5 dakika
    gcTime: 10 * 60 * 1000, // 10 dakika
  });
};

// Yeni: Belirli bir kaynaktan deprem haberlerini getir
export const useEarthquakeNewsFromSource = (source: string, page: number = 1) => {
  return useQuery({
    queryKey: ['earthquake-news-source', source, page],
    queryFn: async (): Promise<News[]> => {
      try {
        const response = await newsApiService.getEarthquakeNewsFromSource(source, page);
        return response.articles.map(transformNewsApiArticle);
      } catch (error) {
        console.error('NewsAPI Error:', error);
        throw new Error(`${source} kaynağından veriler alınamadı.`);
      }
    },
    staleTime: 5 * 60 * 1000, // 5 dakika
    gcTime: 10 * 60 * 1000, // 10 dakika
    enabled: !!source,
  });
};