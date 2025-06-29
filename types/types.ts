export type News = {
  id: string;
  title: string;
  snippet: string;
  content: string;
  image: string;
  createdAt: string;
  category: string[];
  source: string;
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


