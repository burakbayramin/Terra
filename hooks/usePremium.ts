import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { 
  UserPremiumInfo, 
  PremiumPackageType, 
  PaymentPeriod,
  PremiumFeature,
  PREMIUM_FEATURES
} from '@/types/types';

export const usePremium = () => {
  const { user } = useAuth();
  const [premiumInfo, setPremiumInfo] = useState<UserPremiumInfo | null>(null);
  const [loading, setLoading] = useState(false); // Changed to false since we're not loading from DB

  // Premium seviye karşılaştırma fonksiyonu
  const isLevelSufficient = (userLevel: PremiumPackageType, requiredLevel: PremiumPackageType): boolean => {
    const levels = {
      [PremiumPackageType.FREE]: 0,
      [PremiumPackageType.SUPPORTER]: 1,
      [PremiumPackageType.PROTECTOR]: 2,
      [PremiumPackageType.SPONSOR]: 3
    };
    
    return levels[userLevel] >= levels[requiredLevel];
  };

  // Statik premium bilgilerini ayarla (veritabanı hatası nedeniyle)
  const setupStaticPremiumInfo = () => {
    if (!user) {
      setPremiumInfo(null);
      return;
    }

    // Şimdilik statik olarak Katılımcı paket ayarla
    // Daha sonra bu değer profil ekranından güncellenebilir
    setPremiumInfo({
      isPremium: false,
      premiumPackageType: PremiumPackageType.FREE, // Katılımcı (Ücretsiz)
      paymentPeriod: PaymentPeriod.MONTHLY,
      firstPaymentDate: '',
      nextPaymentDate: '',
      subscriptionStartDate: '',
      subscriptionEndDate: '',
      isActive: false,
      autoRenew: false
    });
  };

  // Belirli bir özelliğe erişim kontrolü
  const hasAccessToFeature = (featureId: string): boolean => {
    if (!premiumInfo || !premiumInfo.isPremium) {
      return false;
    }

    const feature = PREMIUM_FEATURES.find(f => f.id === featureId);
    if (!feature) {
      return true; // Tanımlanmamış özellikler varsayılan olarak erişilebilir
    }

    return isLevelSufficient(premiumInfo.premiumPackageType, feature.requiredLevel);
  };

  // Belirli bir seviyeye erişim kontrolü
  const hasAccessToLevel = (requiredLevel: PremiumPackageType): boolean => {
    if (!premiumInfo || !premiumInfo.isPremium) {
      return false;
    }

    return isLevelSufficient(premiumInfo.premiumPackageType, requiredLevel);
  };

  // Premium özellik bilgisini getir
  const getFeatureInfo = (featureId: string): PremiumFeature | null => {
    return PREMIUM_FEATURES.find(f => f.id === featureId) || null;
  };

  // Kullanıcının mevcut seviyesini getir
  const getCurrentLevel = (): PremiumPackageType => {
    return premiumInfo?.premiumPackageType || PremiumPackageType.FREE;
  };

  // Premium durumunu kontrol et
  const isPremium = (): boolean => {
    return premiumInfo?.isPremium || false;
  };

  // Abonelik aktif mi kontrol et
  const isSubscriptionActive = (): boolean => {
    return premiumInfo?.isActive || false;
  };

  // Premium seviyesini güncelle (profil ekranından çağrılabilir)
  const updatePremiumLevel = (newLevel: PremiumPackageType) => {
    if (premiumInfo) {
      setPremiumInfo({
        ...premiumInfo,
        premiumPackageType: newLevel,
        isPremium: newLevel !== PremiumPackageType.FREE
      });
    }
  };

  useEffect(() => {
    setupStaticPremiumInfo();
  }, [user]);

  return {
    premiumInfo,
    loading,
    hasAccessToFeature,
    hasAccessToLevel,
    getFeatureInfo,
    getCurrentLevel,
    isPremium,
    isSubscriptionActive,
    updatePremiumLevel, // Yeni fonksiyon
    PREMIUM_FEATURES
  };
}; 