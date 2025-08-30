import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome6 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';
import { usePremium } from '@/hooks/usePremium';
import { PremiumPackageType, PaymentPeriod } from '@/types/types';

const { width } = Dimensions.get('window');

interface Package {
  id: PremiumPackageType;
  name: string;
  displayName: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  isPopular?: boolean;
  level: number;
  icon: string;
  gradient: readonly [string, string];
  badgeColor: string;
}

const packages: Package[] = [
  {
    id: PremiumPackageType.FREE,
    name: 'FREE', // Database expects this exact value
    displayName: 'Ücretsiz Paket',
    description: 'Temel özelliklerle başlayın',
    monthlyPrice: 0,
    yearlyPrice: 0,
    level: 0,
    icon: 'shield-outline',
    gradient: ['#94A3B8', '#64748B'] as const,
    badgeColor: colors.premium?.silver || '#94A3B8',
    features: [
      'Temel deprem bildirimleri',
      'Sınırlı harita görüntüleme',
      'Temel istatistikler',
      'Sınırlı haber erişimi',
      'Reklamlar',
    ],
  },
  {
    id: PremiumPackageType.SUPPORTER,
    name: 'SUPPORTER', // Database expects this exact value
    displayName: 'Destekleyici Paket',
    description: 'Premium özelliklerin kapısını aralayın',
    monthlyPrice: 29.99,
    yearlyPrice: 299.99,
    level: 1,
    isPopular: false,
    icon: 'star',
    gradient: [colors.gradientOne || '#4A90E2', colors.gradientTwo || '#7B68EE'] as const,
    badgeColor: colors.premium?.gold || '#FFD700',
    features: [
      'Reklamsız deneyim',
      'Tüm yorumları görüntüleme',
      'Terra AI deprem yorumları',
      'Akıllı bildirim kural motoru',
      'Risk değerlendirme AI yorumu',
      'Limitsiz AI Soru Hakkı',
      'Öncelikli haber erişimi',
    ],
  },
  {
    id: PremiumPackageType.PROTECTOR,
    name: 'PROTECTOR', // Database expects this exact value
    displayName: 'Koruyucu Paket',
    description: 'Gelişmiş güvenlik ve analiz araçları',
    monthlyPrice: 49.99,
    yearlyPrice: 499.99,
    level: 2,
    isPopular: true,
    icon: 'shield-checkmark',
    gradient: [colors.gradientOne || '#4A90E2', colors.gradientTwo || '#7B68EE'],
    badgeColor: colors.premium?.gold || '#FFD700',
    features: [
      'Destekleyici özellikleri',
      'Deprem risk analizi',
      'Detaylı istatistikler',
      'Gelişmiş güvenlik özellikleri',
      'Acil durum planları',
      'Kişiselleştirilmiş risk analizi',
      '7/24 destek',
    ],
  },
  {
    id: PremiumPackageType.SPONSOR,
    name: 'SPONSOR', // Database expects this exact value
    displayName: 'Sponsor Paket',
    description: 'En üst düzey özellikler ve ayrıcalıklar',
    monthlyPrice: 99.99,
    yearlyPrice: 999.99,
    level: 3,
    icon: 'diamond',
    gradient: [colors.gradientOne || '#4A90E2', colors.gradientTwo || '#7B68EE'],
    badgeColor: colors.premium?.gold || '#FFD700',
    features: [
      'Koruyucu özellikleri',
      'Özel araştırma raporları',
      'Öncelikli müşteri desteği',
      'Beta özelliklerine erken erişim',
      'Özel etkinliklere davet',
      'Uygulama geliştirme sürecinde söz hakkı',
      'Aile üyeleri için ek hesaplar',
    ],
  },
];

export default function PremiumPackagesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { 
    getCurrentLevel, 
    isPremium, 
    updatePremiumLevel,
    loading,
    error 
  } = usePremium();
  const [selectedPeriod, setSelectedPeriod] = useState<PaymentPeriod>(PaymentPeriod.MONTHLY);
  const [subscribing, setSubscribing] = useState(false);
  const currentLevel = getCurrentLevel();

  const handleSubscribe = async (packageId: PremiumPackageType) => {
    const selectedPackage = packages.find(p => p.id === packageId);
    if (!selectedPackage) return;

    Alert.alert(
      'Abonelik',
      `${selectedPackage.displayName} paketine abone olmak istediğinizden emin misiniz?`,
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Abone Ol',
          onPress: async () => {
            setSubscribing(true);
            try {
              // Update the premium level
              await updatePremiumLevel(packageId);
              Alert.alert('Başarılı', 'Aboneliğiniz başarıyla oluşturuldu!');
            } catch (err) {
              Alert.alert('Hata', 'Abonelik oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
            } finally {
              setSubscribing(false);
            }
          },
        },
      ]
    );
  };

  const getPrice = (package_: Package) => {
    return selectedPeriod === PaymentPeriod.MONTHLY 
      ? package_.monthlyPrice 
      : package_.yearlyPrice;
  };

  const getPeriodText = () => {
    return selectedPeriod === PaymentPeriod.MONTHLY ? 'ay' : 'yıl';
  };

  const isCurrentPackage = (packageId: PremiumPackageType) => {
    return currentLevel === packageId;
  };

  const canUpgrade = (packageLevel: number) => {
    const currentLevelNumber = packages.find(p => p.id === currentLevel)?.level || 0;
    return packageLevel > currentLevelNumber;
  };

  // Show loading indicator if premium data is loading
  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { paddingTop: insets.top }]}>
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Stack.Screen
        options={{
          title: 'Premium Paketler',
          headerTitleStyle: {
            fontFamily: 'NotoSans-Bold',
          },
          headerTintColor: colors.light?.textPrimary || '#000',
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <LinearGradient
          colors={[colors.gradientOne || '#4A90E2', colors.gradientTwo || '#7B68EE']}
          style={styles.heroSection}
        >
          <View style={styles.heroContent}>
            <View style={styles.heroIconContainer}>
              <Ionicons 
                name="star" 
                size={48} 
                color="#fff" 
              />
            </View>
            <Text style={styles.heroTitle}>Premium'a Geçin</Text>
            <Text style={styles.heroSubtitle}>
              Gelişmiş özellikler ve reklamsız deneyim için premium paketlerimizi keşfedin
            </Text>
          </View>
        </LinearGradient>

        {/* Error message if any */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Payment Period Selector */}
        <View style={styles.periodSelectorContainer}>
          <View style={styles.periodSelector}>
            <TouchableOpacity
              style={[
                styles.periodButton,
                selectedPeriod === PaymentPeriod.MONTHLY && styles.periodButtonActive
              ]}
              onPress={() => setSelectedPeriod(PaymentPeriod.MONTHLY)}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === PaymentPeriod.MONTHLY && styles.periodButtonTextActive
              ]}>
                Aylık
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.periodButton,
                selectedPeriod === PaymentPeriod.YEARLY && styles.periodButtonActive
              ]}
              onPress={() => setSelectedPeriod(PaymentPeriod.YEARLY)}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === PaymentPeriod.YEARLY && styles.periodButtonTextActive
              ]}>
                Yıllık
              </Text>
              <View style={styles.savingsBadge}>
                <Text style={styles.savingsBadgeText}>%17 İndirim</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Packages */}
        <View style={styles.packagesContainer}>
          {packages.map((package_) => (
            <View key={package_.id} style={styles.packageCard}>
              {package_.isPopular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>En Popüler</Text>
                </View>
              )}
              
              <LinearGradient
                colors={package_.gradient}
                style={styles.packageHeader}
              >
                <View style={styles.packageHeaderContent}>
                  <View style={styles.packageIconContainer}>
                    <Ionicons 
                      name={package_.icon as any} 
                      size={32} 
                      color="#fff" 
                    />
                  </View>
                  <Text style={styles.packageName}>{package_.displayName}</Text>
                  <Text style={styles.packageDescription}>{package_.description}</Text>
                </View>
              </LinearGradient>

              <View style={styles.packageBody}>
                <View style={styles.priceContainer}>
                  <Text style={styles.priceLabel}>Fiyat</Text>
                  <Text style={styles.priceValue}>
                    {getPrice(package_) === 0 ? 'Ücretsiz' : `₺${getPrice(package_)}/${getPeriodText()}`}
                  </Text>
                </View>

                <View style={styles.featuresContainer}>
                  <Text style={styles.featuresTitle}>Özellikler</Text>
                  {package_.features.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <Ionicons 
                        name="checkmark-circle" 
                        size={16} 
                        color={colors.success || '#4CAF50'} 
                      />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[
                    styles.subscribeButton,
                    isCurrentPackage(package_.id) && styles.currentPackageButton,
                    (!canUpgrade(package_.level) || subscribing) && styles.disabledButton
                  ]}
                  onPress={() => handleSubscribe(package_.id)}
                  disabled={isCurrentPackage(package_.id) || !canUpgrade(package_.level) || subscribing}
                >
                  <LinearGradient
                    colors={isCurrentPackage(package_.id) 
                        ? ['#94A3B8', '#64748B'] as const
                        : [colors.gradientOne || '#4A90E2', colors.gradientTwo || '#7B68EE'] as const
                      }
                    style={styles.subscribeButtonGradient}
                  >
                    <Text style={styles.subscribeButtonText}>
                      {subscribing 
                        ? 'İşleniyor...'
                        : isCurrentPackage(package_.id) 
                          ? 'Mevcut Paket' 
                          : canUpgrade(package_.level) 
                            ? 'Abone Ol' 
                            : 'Yetersiz Seviye'
                      }
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Premium paketlerimiz ile güvenliğinizi artırın ve reklamsız deneyim yaşayın.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light?.background || '#f5f5f5',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.light?.textSecondary || '#666',
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  heroContent: {
    alignItems: 'center',
  },
  heroIconContainer: {
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  errorContainer: {
    backgroundColor: '#fee',
    padding: 16,
    margin: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fcc',
  },
  errorText: {
    color: '#c00',
    fontSize: 14,
    textAlign: 'center',
  },
  periodSelectorContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: colors.light?.surface || '#fff',
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
  periodButtonActive: {
    backgroundColor: colors.primary || '#4A90E2',
  },
  periodButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.light?.textSecondary || '#666',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  savingsBadge: {
    position: 'absolute',
    top: -8,
    right: 8,
    backgroundColor: colors.success || '#4CAF50',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  savingsBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  packagesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  packageCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: colors.premium?.gold || '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  popularBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2d3748',
  },
  packageHeader: {
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  packageHeaderContent: {
    alignItems: 'center',
  },
  packageIconContainer: {
    marginBottom: 12,
  },
  packageName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  packageDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  packageBody: {
    padding: 20,
  },
  priceContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.light?.surface || '#f0f0f0',
  },
  priceLabel: {
    fontSize: 14,
    color: colors.light?.textSecondary || '#666',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary || '#4A90E2',
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.light?.textPrimary || '#000',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: colors.light?.textSecondary || '#666',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  subscribeButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  currentPackageButton: {
    opacity: 0.7,
  },
  disabledButton: {
    opacity: 0.5,
  },
  subscribeButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: colors.light?.textSecondary || '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});