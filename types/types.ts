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
  total_last_day: number;
  total_last_week: number;
  total_last_month: number;
  mag3_plus_last_day: number;
  mag3_plus_last_week: number;
  mag3_plus_last_month: number;
  mag4_plus_last_day: number;
  mag4_plus_last_week: number;
  mag4_plus_last_month: number;
  mag5_plus_last_day: number;
  mag5_plus_last_week: number;
  mag5_plus_last_month: number;
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
  updated_at: string | null;
  name: string | null;
  surname: string | null;
  city: string | null;
  district: string | null;
  created_at: string | null;
  emergency_phone: string | null;
  safety_score?: number | null;
  has_completed_safety_form: boolean;
}

export interface EarthquakeFeltReport {
  id: string;
  profile_id: string;
  earthquake_id: string;
  created_at: string;
}

export interface FeltReportStats {
  total_reports: number;
  user_has_reported: boolean;
}

export interface PremiumPackage {
  id: string;
  name: string;
  price: number;
  currency: string;
  period: 'monthly' | 'yearly';
  features: string[];
  isPopular?: boolean;
  isCurrent?: boolean;
}

export interface UserSubscription {
  packageId: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  autoRenew: boolean;
}
