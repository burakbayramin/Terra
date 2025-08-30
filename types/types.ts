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
  safety_score?: number | null;
  has_completed_safety_form: boolean;
  username?: string | null;
  subscription_plan_id?: string | null;
  subscription_status?: string | null;
  subscription_start_date?: string | null;
  subscription_end_date?: string | null;
  auto_renew?: boolean | null;
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

export interface LocationData {
  latitude: number;
  longitude: number;
}

// Premium Package Types - matches subscription_plans.name constraint
export enum PremiumPackageType {
  FREE = 'FREE',
  SUPPORTER = 'SUPPORTER',     // Seviye 1
  PROTECTOR = 'PROTECTOR',     // Seviye 2
  SPONSOR = 'SPONSOR'          // Seviye 3
}

// Payment Period - matches subscription_plans.billing_period constraint
export enum PaymentPeriod {
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}

// Subscription Status - matches profiles.subscription_status
export enum SubscriptionStatus {
  FREE = 'free',
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  PENDING = 'pending'
}

// Subscription Plan - matches subscription_plans table
export interface SubscriptionPlan {
  id: string; // uuid
  name: PremiumPackageType;
  billing_period: PaymentPeriod;
  price: number; // numeric(10,2)
  features: PremiumFeature[] | null; // jsonb
  duration_in_days: number;
  is_active: boolean;
  created_at: string; // timestamp with time zone
}

// User Profile with Premium Info - matches profiles table
export interface UserProfile {
  id: string; // uuid
  updated_at: string | null;
  name: string | null;
  surname: string | null;
  city: string | null;
  district: string | null;
  created_at: string;
  emergency_phone: string | null;
  latitude: number | null;
  longitude: number | null;
  safety_score: number; // smallint default 100
  has_completed_safety_form: boolean;
  username: string | null;
  subscription_plan_id: string | null; // uuid reference to subscription_plans
  subscription_status: SubscriptionStatus;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  auto_renew: boolean;
  address: string | null;
}

// Derived Premium Info from User Profile and Subscription Plan
export interface UserPremiumInfo {
  isPremium: boolean;
  premiumPackageType: PremiumPackageType;
  paymentPeriod: PaymentPeriod | null;
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
  isActive: boolean;
  autoRenew: boolean;
  subscriptionStatus: SubscriptionStatus;
  price?: number;
  durationInDays?: number;
}

// Premium Feature for jsonb storage in subscription_plans.features
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
  },
  {
    id: 'network-management',
    name: 'Ağ Yönetimi',
    description: 'Aileniz ve sevdiklerinizle güvenli iletişim kurun, acil durum planları oluşturun ve koordinasyon sağlayın',
    requiredLevel: PremiumPackageType.PROTECTOR,
    location: 'network'
  }
];

// Helper function to derive UserPremiumInfo from UserProfile and SubscriptionPlan
export function deriveUserPremiumInfo(
  profile: UserProfile,
  subscriptionPlan?: SubscriptionPlan | null
): UserPremiumInfo {
  const isPremium = profile.subscription_status !== 'free' && 
                    profile.subscription_status !== null &&
                    profile.subscription_plan_id !== null;
  
  return {
    isPremium,
    premiumPackageType: subscriptionPlan?.name || PremiumPackageType.FREE,
    paymentPeriod: subscriptionPlan?.billing_period || null,
    subscriptionStartDate: profile.subscription_start_date,
    subscriptionEndDate: profile.subscription_end_date,
    isActive: profile.subscription_status === 'active',
    autoRenew: profile.auto_renew,
    subscriptionStatus: profile.subscription_status || SubscriptionStatus.FREE,
    price: subscriptionPlan?.price,
    durationInDays: subscriptionPlan?.duration_in_days
  };
}


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
  route_type:
    | "default"
    | "family"
    | "disabled_friendly"
    | "elderly_friendly"
    | "custom";
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
  waypoint_type: "gathering_point" | "safe_zone" | "checkpoint";
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
  status:
    | "not_started"
    | "in_progress"
    | "at_gathering_point"
    | "at_safe_zone"
    | "completed";
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

// Task Types
export interface Task {
  id: string;
  title: string;
  snippet: string;
  description: string;
  icon: string;
  category: "profile" | "education" | "safety" | "community" | "feedback";
  isCompleted?: boolean;
  completedAt?: string;
  priority?: number;
}

export type TaskCategory = Task["category"];
