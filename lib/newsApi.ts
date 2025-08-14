import AsyncStorage from '@react-native-async-storage/async-storage';

const NEWS_API_KEY = 'ee120e6e42564270b76116ab32e49e89';
const NEWS_API_BASE_URL = 'https://newsapi.org/v2';

// Günlük istek limiti kontrolü
const DAILY_REQUEST_LIMIT = 100;
const UPDATE_TIMES = ['09:00', '15:00', '21:00']; // Günlük güncelleme saatleri

export interface NewsApiArticle {
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

export interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: NewsApiArticle[];
}

export interface NewsApiError {
  status: string;
  code: string;
  message: string;
}

// Cache ve istek sayacı için interface
interface CacheData {
  data: NewsApiResponse;
  timestamp: number;
  requestCount: number;
}

interface DailyRequestCount {
  date: string;
  count: number;
}

// Türk haber kaynakları
const TURKISH_NEWS_SOURCES = [
  'hurriyet.com.tr',
  'milliyet.com.tr',
  'sozcu.com.tr',
  'cumhuriyet.com.tr',
  'evrensel.net',
  'birgun.net',
  't24.com.tr',
  'diken.com.tr',
  'duvar.com.tr',
  'gazeteduvar.com.tr',
  'trthaber.com',
  'aa.com.tr',
  'anadoluajansi.com.tr',
  'iha.com.tr',
  'dha.com.tr',
  'anlatilaninotesi.com.tr',
  'sputniknews.com',
  'haberturk.com',
  'cnnturk.com',
  'ntv.com.tr',
  'ensonhaber.com',
  'internethaber.com'
];

// Deprem ile ilgili anahtar kelimeler
const EARTHQUAKE_KEYWORDS = [
  'deprem',
  'earthquake',
  'sismik',
  'seismic',
  'afet',
  'disaster',
  'kandilli',
  'kandilli rasathanesi',
  'afad',
  'acil durum',
  'emergency',
  'yıkım',
  'destruction',
  'yardım',
  'aid',
  'kurtarma',
  'rescue',
  'hasar',
  'damage',
  'tsunami',
  'artçı',
  'aftershock'
];

// Deprem uzmanları - daha kapsamlı arama için
const EARTHQUAKE_EXPERTS = [
  'Yoshinori Moriwaki',
  'Naci Görür',
  'Celâl Şengör',
  'Şener Üşümezsoy',
  'Prof. Dr. Naci Görür',
  'Prof. Dr. Celâl Şengör',
  'Prof. Dr. Şener Üşümezsoy',
  'Prof. Naci Görür',
  'Prof. Celâl Şengör',
  'Prof. Şener Üşümezsoy'
];

class NewsApiService {
  private apiKey: string;
  private baseUrl: string;
  private cache: Map<string, CacheData> = new Map();
  private dailyRequestCount: DailyRequestCount | null = null;

  constructor() {
    this.apiKey = NEWS_API_KEY;
    this.baseUrl = NEWS_API_BASE_URL;
    this.loadDailyRequestCount();
  }

  // Günlük istek sayısını yükle
  private async loadDailyRequestCount(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('newsApi_dailyRequestCount');
      if (stored) {
        this.dailyRequestCount = JSON.parse(stored);
        
        // Eğer farklı bir günse, sayacı sıfırla
        const today = new Date().toDateString();
        if (this.dailyRequestCount.date !== today) {
          this.dailyRequestCount = { date: today, count: 0 };
          await this.saveDailyRequestCount();
        }
      } else {
        this.dailyRequestCount = { date: new Date().toDateString(), count: 0 };
        await this.saveDailyRequestCount();
      }
    } catch (error) {
      console.error('Daily request count load error:', error);
      this.dailyRequestCount = { date: new Date().toDateString(), count: 0 };
    }
  }

  // Günlük istek sayısını kaydet
  private async saveDailyRequestCount(): Promise<void> {
    try {
      if (this.dailyRequestCount) {
        await AsyncStorage.setItem('newsApi_dailyRequestCount', JSON.stringify(this.dailyRequestCount));
      }
    } catch (error) {
      console.error('Daily request count save error:', error);
    }
  }

  // İstek sayısını artır ve kontrol et
  private async incrementRequestCount(): Promise<boolean> {
    if (!this.dailyRequestCount) {
      await this.loadDailyRequestCount();
    }

    if (this.dailyRequestCount && this.dailyRequestCount.count >= DAILY_REQUEST_LIMIT) {
      console.warn('Daily request limit reached! Cannot make more API calls today.');
      return false;
    }

    if (this.dailyRequestCount) {
      this.dailyRequestCount.count++;
      await this.saveDailyRequestCount();
    }
    return true;
  }

  // Güncelleme zamanı gelip gelmediğini kontrol et
  private shouldUpdateData(category: string): boolean {
    const cacheKey = `news_${category}`;
    const cached = this.cache.get(cacheKey);
    
    if (!cached) {
      return true; // Cache yoksa güncelle
    }

    const now = new Date();
    const cacheTime = new Date(cached.timestamp);
    const hoursSinceUpdate = (now.getTime() - cacheTime.getTime()) / (1000 * 60 * 60);

    // Güncelleme saatlerini kontrol et
    const currentTime = now.toTimeString().slice(0, 5);
    const isUpdateTime = UPDATE_TIMES.includes(currentTime);

    // Eğer güncelleme saati ise ve son güncellemeden 6 saat geçtiyse güncelle
    if (isUpdateTime && hoursSinceUpdate >= 6) {
      return true;
    }

    // Cache 12 saatten eskiyse güncelle
    if (hoursSinceUpdate >= 12) {
      return true;
    }

    return false;
  }

  // Cache'den veri getir
  private getCachedData(category: string): NewsApiResponse | null {
    const cacheKey = `news_${category}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      // Cache'deki istek sayısını da güncelle
      cached.requestCount++;
      this.cache.set(cacheKey, cached);
      return cached.data;
    }
    
    return null;
  }

  // Veriyi cache'e kaydet
  private saveToCache(category: string, data: NewsApiResponse): void {
    const cacheKey = `news_${category}`;
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      requestCount: 1
    });
  }

  // Günlük istek sayısını getir
  public getDailyRequestCount(): number {
    return this.dailyRequestCount?.count || 0;
  }

  // Kalan istek sayısını getir
  public getRemainingRequests(): number {
    return Math.max(0, DAILY_REQUEST_LIMIT - (this.dailyRequestCount?.count || 0));
  }

  // Cache istatistiklerini getir
  public getCacheStats(): { totalCached: number; totalRequests: number } {
    let totalRequests = 0;
    this.cache.forEach(item => {
      totalRequests += item.requestCount;
    });

    return {
      totalCached: this.cache.size,
      totalRequests
    };
  }

  // Cache'i temizle
  public clearCache(): void {
    this.cache.clear();
    console.log('NewsAPI cache cleared');
  }

  // Deprem haberlerini getir
  async getEarthquakeNews(page: number = 1, pageSize: number = 20): Promise<NewsApiResponse> {
    try {
      const query = EARTHQUAKE_KEYWORDS.join(' OR ');
      const url = `${this.baseUrl}/everything?` +
        `q=${encodeURIComponent(query)}` +
        `&language=tr` +
        `&sortBy=publishedAt` +
        `&page=${page}` +
        `&pageSize=${pageSize}` +
        `&apiKey=${this.apiKey}`;

      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData: NewsApiError = await response.json();
        throw new Error(`NewsAPI Error: ${errorData.message || response.statusText}`);
      }

      const data: NewsApiResponse = await response.json();
      return data;
    } catch (error) {
      console.error('NewsAPI Error:', error);
      throw error;
    }
  }

  // Belirli bir kaynaktan deprem haberlerini getir
  async getEarthquakeNewsFromSource(source: string, page: number = 1, pageSize: number = 20): Promise<NewsApiResponse> {
    try {
      const query = EARTHQUAKE_KEYWORDS.join(' OR ');
      const url = `${this.baseUrl}/everything?` +
        `q=${encodeURIComponent(query)}` +
        `&domains=${source}` +
        `&language=tr` +
        `&sortBy=publishedAt` +
        `&page=${page}` +
        `&pageSize=${pageSize}` +
        `&apiKey=${this.apiKey}`;

      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData: NewsApiError = await response.json();
        throw new Error(`NewsAPI Error: ${errorData.message || response.statusText}`);
      }

      const data: NewsApiResponse = await response.json();
      return data;
    } catch (error) {
      console.error('NewsAPI Error:', error);
      throw error;
    }
  }

  // Tüm Türk kaynaklarından deprem haberlerini getir
  async getAllTurkishEarthquakeNews(page: number = 1, pageSize: number = 20): Promise<NewsApiResponse> {
    try {
      const query = EARTHQUAKE_KEYWORDS.join(' OR ');
      const domains = TURKISH_NEWS_SOURCES.join(',');
      
      const url = `${this.baseUrl}/everything?` +
        `q=${encodeURIComponent(query)}` +
        `&domains=${domains}` +
        `&language=tr` +
        `&sortBy=publishedAt` +
        `&page=${page}` +
        `&pageSize=${pageSize}` +
        `&apiKey=${this.apiKey}`;

      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData: NewsApiError = await response.json();
        throw new Error(`NewsAPI Error: ${errorData.message || response.statusText}`);
      }

      const data: NewsApiResponse = await response.json();
      return data;
    } catch (error) {
      console.error('NewsAPI Error:', error);
      throw error;
    }
  }

  // Kategori bazlı deprem haberlerini getir (Akıllı cache ile)
  async getEarthquakeNewsByCategory(category: string, page: number = 1, pageSize: number = 20): Promise<NewsApiResponse> {
    // Önce cache'den veri getirmeyi dene
    const cachedData = this.getCachedData(category);
    if (cachedData && !this.shouldUpdateData(category)) {
      console.log(`Using cached data for category: ${category}`);
      return cachedData;
    }

    // Güncelleme gerekli, API isteği yap
    if (!(await this.incrementRequestCount())) {
      // İstek limiti aşıldı, cache'den veri döndür
      if (cachedData) {
        console.warn('Daily limit reached, using cached data');
        return cachedData;
      }
      throw new Error('Daily request limit reached and no cached data available');
    }

    try {
      let query = '';
      
      switch (category) {
        case 'latest':
          query = EARTHQUAKE_KEYWORDS.slice(0, 8).join(' OR '); // Ana deprem terimleri
          break;
        case 'expert_opinions':
          // Uzman isimleri ile daha kapsamlı arama yap
          const expertQueries = EARTHQUAKE_EXPERTS.map(expert => `"${expert}"`).join(' OR ');
          query = `${expertQueries} OR (deprem AND (uzman OR profesör OR prof OR doktor OR dr))`;
          break;
        default:
          query = EARTHQUAKE_KEYWORDS.join(' OR ');
      }

      const url = `${this.baseUrl}/everything?` +
        `q=${encodeURIComponent(query)}` +
        `&language=tr` +
        `&sortBy=publishedAt` +
        `&page=${page}` +
        `&pageSize=${pageSize}` +
        `&apiKey=${this.apiKey}`;

      console.log(`Making API request for category: ${category}. Daily requests: ${this.getDailyRequestCount()}/${DAILY_REQUEST_LIMIT}`);

      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData: NewsApiError = await response.json();
        throw new Error(`NewsAPI Error: ${errorData.message || response.statusText}`);
      }

      const data: NewsApiResponse = await response.json();
      
      // Veriyi cache'e kaydet
      this.saveToCache(category, data);
      
      return data;
    } catch (error) {
      console.error('NewsAPI Error:', error);
      
      // Hata durumunda cache'den veri döndür
      if (cachedData) {
        console.log('API error, using cached data');
        return cachedData;
      }
      
      throw error;
    }
  }

  // Haber kaynaklarını getir
  async getNewsSources(): Promise<any> {
    try {
      const url = `${this.baseUrl}/sources?` +
        `country=tr` +
        `&apiKey=${this.apiKey}`;

      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData: NewsApiError = await response.json();
        throw new Error(`NewsAPI Error: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('NewsAPI Error:', error);
      throw error;
    }
  }
}

export const newsApiService = new NewsApiService();
export default newsApiService; 