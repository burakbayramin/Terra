import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { PremiumPackage } from '@/types/types';
import { Ionicons } from '@expo/vector-icons';
import { usePremium } from '@/hooks/usePremium';

const { width } = Dimensions.get('window');

export default function PremiumPackagesScreen() {
  const router = useRouter();
  const { currentPackage, subscribeToPackage, isLoading } = usePremium();
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  const premiumPackages: PremiumPackage[] = [
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
      isCurrent: currentPackage?.id === 'free',
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
      isCurrent: currentPackage?.id === 'supporter',
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
      isPopular: true,
      isCurrent: currentPackage?.id === 'protector',
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
      isCurrent: currentPackage?.id === 'sponsor',
    },
  ];

  const getYearlyPrice = (monthlyPrice: number) => {
    return Math.round(monthlyPrice * 10); // %17 indirim (12 ay yerine 10 ay)
  };

  const handlePackageSelect = (packageId: string) => {
    setSelectedPackage(packageId);
  };

  const handleSubscribe = async () => {
    if (!selectedPackage) {
      Alert.alert('Hata', 'Lütfen bir paket seçin');
      return;
    }

    const selectedPkg = premiumPackages.find(pkg => pkg.id === selectedPackage);
    if (!selectedPkg) return;

    Alert.alert(
      'Abonelik Onayı',
      `${selectedPkg.name} paketine abone olmak istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Abone Ol', 
          onPress: async () => {
            const result = await subscribeToPackage(selectedPackage);
            if (result.success) {
              Alert.alert('Başarılı', 'Aboneliğiniz başarıyla oluşturuldu!');
              router.back();
            } else {
              Alert.alert('Hata', result.error || 'Abonelik işlemi başarısız');
            }
          }
        }
      ]
    );
  };

  const renderPackageCard = (pkg: PremiumPackage) => {
    const price = selectedPeriod === 'yearly' ? getYearlyPrice(pkg.price) : pkg.price;
    const isSelected = selectedPackage === pkg.id;
    const isCurrent = pkg.isCurrent;

    return (
      <TouchableOpacity
        key={pkg.id}
        style={[
          styles.packageCard,
          isSelected && styles.selectedCard,
          pkg.isPopular && styles.popularCard,
        ]}
        onPress={() => handlePackageSelect(pkg.id)}
        disabled={isCurrent}
      >
        {pkg.isPopular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>En Popüler</Text>
          </View>
        )}
        
        {isCurrent && (
          <View style={styles.currentBadge}>
            <Text style={styles.currentText}>Mevcut Plan</Text>
          </View>
        )}

        <View style={styles.packageHeader}>
          <Text style={styles.packageName}>{pkg.name}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.currency}>{pkg.currency}</Text>
            <Text style={styles.price}>{price}</Text>
            <Text style={styles.period}>
              /{selectedPeriod === 'yearly' ? 'yıl' : 'ay'}
            </Text>
          </View>
          {selectedPeriod === 'yearly' && pkg.price > 0 && (
            <Text style={styles.savingsText}>
              %17 tasarruf
            </Text>
          )}
        </View>

        <View style={styles.featuresContainer}>
          {pkg.features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Ionicons 
                name="checkmark-circle" 
                size={20} 
                color={colors.primary} 
              />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {isSelected && !isCurrent && (
          <View style={styles.selectedIndicator}>
            <Ionicons name="checkmark" size={24} color="white" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Premium Paketler</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Paketler yükleniyor...</Text>
          </View>
        ) : (
          <>
            <View style={styles.introSection}>
              <Text style={styles.introTitle}>Güvenliğiniz İçin En İyi Seçenekler</Text>
              <Text style={styles.introSubtitle}>
                Premium paketlerimiz ile deprem güvenliğinizi artırın ve gelişmiş özelliklere erişim sağlayın.
              </Text>
            </View>

        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === 'monthly' && styles.activePeriodButton,
            ]}
            onPress={() => setSelectedPeriod('monthly')}
          >
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === 'monthly' && styles.activePeriodButtonText,
            ]}>
              Aylık
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === 'yearly' && styles.activePeriodButton,
            ]}
            onPress={() => setSelectedPeriod('yearly')}
          >
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === 'yearly' && styles.activePeriodButtonText,
            ]}>
              Yıllık
            </Text>
            <View style={styles.yearlyBadge}>
              <Text style={styles.yearlyBadgeText}>%17 İndirim</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.packagesContainer}>
          {premiumPackages.map(renderPackageCard)}
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
            <Text style={styles.infoText}>Güvenli ödeme</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="refresh" size={20} color={colors.primary} />
            <Text style={styles.infoText}>İstediğiniz zaman iptal</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="help-circle" size={20} color={colors.primary} />
            <Text style={styles.infoText}>7/24 destek</Text>
          </View>
            </View>
          </>
        )}
      </ScrollView>

      {selectedPackage && !premiumPackages.find(pkg => pkg.id === selectedPackage)?.isCurrent && (
        <View style={styles.bottomContainer}>
          <TouchableOpacity style={styles.subscribeButton} onPress={handleSubscribe}>
            <Text style={styles.subscribeButtonText}>Abone Ol</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.surface,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.light.textPrimary,
  },
  placeholder: {
    width: 34,
  },
  content: {
    flex: 1,
  },
  introSection: {
    padding: 20,
    alignItems: 'center',
  },
  introTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.light.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  introSubtitle: {
    fontSize: 16,
    color: colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  periodSelector: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: colors.light.surface,
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    position: 'relative',
  },
  activePeriodButton: {
    backgroundColor: colors.primary,
  },
  periodButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.light.textSecondary,
  },
  activePeriodButtonText: {
    color: 'white',
  },
  yearlyBadge: {
    position: 'absolute',
    top: -8,
    right: 10,
    backgroundColor: '#FFD700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  yearlyBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  packagesContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  packageCard: {
    backgroundColor: colors.light.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedCard: {
    borderColor: colors.primary,
    backgroundColor: '#FFF5F2',
  },
  popularCard: {
    borderColor: '#FFD700',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  currentBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  packageHeader: {
    marginBottom: 20,
  },
  packageName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.light.textPrimary,
    marginBottom: 10,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currency: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginHorizontal: 4,
  },
  period: {
    fontSize: 16,
    color: colors.light.textSecondary,
  },
  savingsText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 4,
  },
  featuresContainer: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    color: colors.light.textPrimary,
    flex: 1,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoSection: {
    marginTop: 30,
    marginBottom: 20,
    paddingHorizontal: 20,
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 16,
    color: colors.light.textSecondary,
  },
  bottomContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.light.surface,
  },
  subscribeButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  subscribeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    fontSize: 16,
    color: colors.light.textSecondary,
  },
}); 