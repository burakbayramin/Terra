import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { UserSubscription, PremiumPackage } from '@/types/types';

export const usePremium = () => {
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserSubscription = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setUserSubscription(null);
        return;
      }

      // Burada gerçek veritabanı sorgusu yapılacak
      // Şimdilik mock data kullanıyoruz
      const mockSubscription: UserSubscription = {
        packageId: 'free',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 gün sonra
        isActive: true,
        autoRenew: false,
      };

      setUserSubscription(mockSubscription);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToPackage = async (packageId: string) => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Kullanıcı girişi yapılmamış');
      }

      // Burada gerçek ödeme işlemi ve abonelik oluşturma yapılacak
      // Şimdilik mock işlem yapıyoruz
      const newSubscription: UserSubscription = {
        packageId,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        autoRenew: true,
      };

      setUserSubscription(newSubscription);
      return { success: true };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Abonelik işlemi başarısız');
      return { success: false, error: err instanceof Error ? err.message : 'Bir hata oluştu' };
    } finally {
      setIsLoading(false);
    }
  };

  const cancelSubscription = async () => {
    try {
      setIsLoading(true);
      
      if (!userSubscription) {
        throw new Error('Aktif abonelik bulunamadı');
      }

      // Burada gerçek abonelik iptal işlemi yapılacak
      const updatedSubscription: UserSubscription = {
        ...userSubscription,
        autoRenew: false,
      };

      setUserSubscription(updatedSubscription);
      return { success: true };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Abonelik iptal işlemi başarısız');
      return { success: false, error: err instanceof Error ? err.message : 'Bir hata oluştu' };
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentPackage = (): PremiumPackage | null => {
    if (!userSubscription) return null;

    const packages: PremiumPackage[] = [
      {
        id: 'free',
        name: 'Free Package',
        price: 0,
        currency: '₺',
        period: 'monthly',
        features: [
          'Temel deprem bildirimleri',
          'Sınırlı harita görüntüleme',
          'Reklamlar',
          'Temel istatistikler',
          'Sınırlı haber erişimi',
        ],
      },
      {
        id: 'supporter',
        name: 'Supporter Package',
        price: 29.99,
        currency: '₺',
        period: 'monthly',
        features: [
          'Reklamsız deneyim',
          'Gelişmiş deprem bildirimleri',
          'Tam harita erişimi',
          'Detaylı istatistikler',
          'Öncelikli haber erişimi',
          'Özel bildirim sesleri',
        ],
      },
      {
        id: 'protector',
        name: 'Protector Package',
        price: 49.99,
        currency: '₺',
        period: 'monthly',
        features: [
          'Supporter özellikleri',
          'Gelişmiş güvenlik özellikleri',
          'Acil durum planları',
          'Kişiselleştirilmiş risk analizi',
          '7/24 destek',
          'Aile üyeleri için ek hesaplar',
        ],
      },
      {
        id: 'sponsor',
        name: 'Sponsor Package',
        price: 99.99,
        currency: '₺',
        period: 'monthly',
        features: [
          'Protector özellikleri',
          'Özel araştırma raporları',
          'Öncelikli müşteri desteği',
          'Beta özelliklerine erken erişim',
          'Özel etkinliklere davet',
          'Uygulama geliştirme sürecinde söz hakkı',
        ],
      },
    ];

    return packages.find(pkg => pkg.id === userSubscription.packageId) || null;
  };

  const hasFeature = (featureName: string): boolean => {
    const currentPackage = getCurrentPackage();
    if (!currentPackage) return false;

    // Free package için özel kontroller
    if (currentPackage.id === 'free') {
      const freeFeatures = [
        'Temel deprem bildirimleri',
        'Sınırlı harita görüntüleme',
        'Temel istatistikler',
        'Sınırlı haber erişimi',
      ];
      return freeFeatures.includes(featureName);
    }

    // Premium paketler için feature kontrolü
    return currentPackage.features.includes(featureName);
  };

  useEffect(() => {
    fetchUserSubscription();
  }, []);

  return {
    userSubscription,
    currentPackage: getCurrentPackage(),
    isLoading,
    error,
    subscribeToPackage,
    cancelSubscription,
    hasFeature,
    refetch: fetchUserSubscription,
  };
}; 