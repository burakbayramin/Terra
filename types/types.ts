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
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string | null;
  emergency_phone: string | null;
  emergency_contacts: string[] | null;
  safety_score?: number | null;
  has_completed_safety_form: boolean;
  show_full_name_in_profile?: boolean;
  show_full_name_in_comments?: boolean;
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

export interface NotificationSetting {
  id: string;
  name: string;
  isActive: boolean;
  sources: string[]; // ['kandilli', 'afad', 'all'] gibi
  magnitudeRange: {
    min: number;
    max: number;
  };
  location: {
    type: 'all' | 'cities';
    cities?: string[];
  };
  created_at: string;
  updated_at: string;
}

export interface NotificationSource {
  id: string;
  name: string;
  code: string;
  description: string;
}

// Premium Package Types
export enum PremiumPackageType {
  FREE = 'free',
  SUPPORTER = 'supporter', // Seviye 1
  PROTECTOR = 'protector',  // Seviye 2
  SPONSOR = 'sponsor'       // Seviye 3
}

export enum PaymentPeriod {
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}

export interface UserPremiumInfo {
  isPremium: boolean;
  premiumPackageType: PremiumPackageType;
  paymentPeriod: PaymentPeriod;
  firstPaymentDate: string;
  nextPaymentDate: string;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
  isActive: boolean;
  autoRenew: boolean;
}

// Premium Feature Requirements
export interface PremiumFeature {
  id: string;
  name: string;
  description: string;
  requiredLevel: PremiumPackageType;
  location: string; // Screen/component where this feature is used
}

// Premium Features Configuration
export const PREMIUM_FEATURES: PremiumFeature[] = [
  {
    id: 'all-comments',
    name: 'Tüm Yorumları Gör',
    description: 'Deprem detay sayfasında tüm kullanıcı deneyimlerini ve yorumlarını görüntüleyerek topluluk bilgilerine erişim sağlayın',
    requiredLevel: PremiumPackageType.SUPPORTER,
    location: 'earthquake-detail'
  },
  {
    id: 'terra-ai-comment',
    name: 'Terra AI Yorumu',
    description: 'Deprem hakkında AI tarafından oluşturulan detaylı teknik analiz, etki alanı hesaplaması ve güvenlik önerilerini görün',
    requiredLevel: PremiumPackageType.SUPPORTER,
    location: 'earthquake-detail'
  },
  {
    id: 'earthquake-risk-analysis',
    name: 'Deprem Risk Analizi',
    description: 'İl, ilçe, mahalle ve konum bazlı zemin analizi, altyapı sistemleri ve fay hatlarına göre kişiselleştirilmiş risk değerlendirmesi yapın',
    requiredLevel: PremiumPackageType.PROTECTOR,
    location: 'home'
  },
  {
    id: 'detailed-statistics',
    name: 'Detaylı İstatistikler',
    description: 'Gelişmiş deprem istatistikleri, trend analizleri, bölgesel karşılaştırmalar ve gelecek tahmin modellerine erişim',
    requiredLevel: PremiumPackageType.PROTECTOR,
    location: 'home'
  },
  {
    id: 'smart-notification-engine',
    name: 'Akıllı Bildirim Kural Motoru',
    description: 'Kişiselleştirilmiş bildirim kuralları, otomatik filtreleme, öncelik sıralaması ve gelişmiş uyarı sistemleri',
    requiredLevel: PremiumPackageType.SUPPORTER,
    location: 'home'
  },
  {
    id: 'risk-assessment-ai',
    name: 'Risk Değerlendirme AI Yorumu',
    description: 'Risk formu sonuçlarında AI tarafından oluşturulan detaylı analiz, iyileştirme önerileri ve kişiselleştirilmiş güvenlik planları',
    requiredLevel: PremiumPackageType.SUPPORTER,
    location: 'risk-form'
  },
  {
    id: 'terra-ai-daily-questions',
    name: 'Terra AI Günlük 3+ Soru Kullanımı',
    description: 'Günlük AI soru limitini aşın, sınırsız AI desteği alın ve deprem güvenliği konusunda uzman seviyesinde bilgi edinin',
    requiredLevel: PremiumPackageType.SUPPORTER,
    location: 'ai-menu'
  },
  {
    id: 'smart-emergency-route',
    name: 'Akıllı Acil Durum Rotası',
    description: 'Ağ grubunuz için özelleştirilmiş acil durum rotaları oluşturun, kullanıcıların rota seçimi yapmasını sağlayın ve kriz anında otomatik yönlendirme alın',
    requiredLevel: PremiumPackageType.PROTECTOR,
    location: 'network'
  }
];

// Smart Emergency Route Types
export interface SmartRouteSettings {
  id: string;
  network_id: string;
  is_enabled: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface SmartRoute {
  id: string;
  network_id: string;
  name: string;
  description?: string;
  route_type: 'default' | 'family' | 'disabled_friendly' | 'elderly_friendly' | 'custom';
  is_default: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  waypoints?: RouteWaypoint[];
  statistics?: RouteStatistics;
}

export interface RouteWaypoint {
  id: string;
  route_id: string;
  waypoint_type: 'gathering_point' | 'safe_zone' | 'checkpoint';
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  order_index: number;
  estimated_time_minutes?: number;
  distance_meters?: number;
  created_at: string;
}

export interface UserRouteSelection {
  id: string;
  user_id: string;
  network_id: string;
  route_id: string;
  selected_at: string;
  is_active: boolean;
  route?: SmartRoute;
}

export interface UserRouteProgress {
  id: string;
  user_id: string;
  network_id: string;
  route_id: string;
  current_waypoint_id?: string;
  status: 'not_started' | 'in_progress' | 'at_gathering_point' | 'at_safe_zone' | 'completed';
  started_at?: string;
  completed_at?: string;
  current_latitude?: number;
  current_longitude?: number;
  last_updated: string;
  route?: SmartRoute;
  current_waypoint?: RouteWaypoint;
}

export interface RouteStatistics {
  id: string;
  route_id: string;
  network_id: string;
  total_users_selected: number;
  total_completions: number;
  average_completion_time_minutes?: number;
  last_used?: string;
  created_at: string;
  updated_at: string;
}

export interface RouteWithDetails extends SmartRoute {
  waypoints: RouteWaypoint[];
  statistics: RouteStatistics;
  user_selection?: UserRouteSelection;
  user_progress?: UserRouteProgress;
}

export interface MagnitudeRange {
  min: number;
  max: number;
  label: string;
}
