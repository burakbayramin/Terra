export type News = {
  id: string;
  title: string;
  snippet: string;
  content: string;
  image: string;
  created_at: string;
  category: string[];
  source: string;
  earthquake_id?: string | null;
};

export interface Earthquake {
  id: string;
  provider: string;
  title: string;
  date: string;
  mag: number;
  depth: number;
  longitude: number;
  latitude: number;
}

export interface EarthquakeStats {
  total: {
    lastDay: number;
    lastWeek: number;
    lastMonth: number;
  };
  mag3Plus: {
    lastDay: number;
    lastWeek: number;
    lastMonth: number;
  };
  mag4Plus: {
    lastDay: number;
    lastWeek: number;
    lastMonth: number;
  };
  mag5Plus: {
    lastDay: number;
    lastWeek: number;
    lastMonth: number;
  };
}
