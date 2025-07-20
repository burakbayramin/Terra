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
  region: string;
  faultline: string;
}

export interface EarthquakeStats {
  total: {
    lastDay: number;
    lastWeek: number;
    lastMonth: number;
  };
  // mag3Plus: {
  //   lastDay: number;
  //   lastWeek: number;
  //   lastMonth: number;
  // };
  // mag4Plus: {
  //   lastDay: number;
  //   lastWeek: number;
  //   lastMonth: number;
  // };
  // mag5Plus: {
  //   lastDay: number;
  //   lastWeek: number;
  //   lastMonth: number;
  // };
}

export interface City {
  id: number;
  name: string;
}

export interface District {
  id: number;
  name: string;
}

export interface Profile {
  id: string;
  name: string;
  surname: string;
  building_age: number | null;
  building_type: number | null;
  city: string | null;
  district: string | null;
  updated_at: string;
}