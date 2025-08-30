import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  Image,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome6 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase'; // Supabase client'ınızı import edin

// Veritabanı ile uyumlu plan tipleri
export enum SubscriptionPlanType {
  FREE = 'FREE',
  SUPPORTER = 'SUPPORTER',
  PROTECTOR = 'PROTECTOR',
  SPONSOR = 'SPONSOR'
}

// Feature tanımları için interface
interface PremiumFeature {
  id: string;
  name: string;
  description: string;
  requiredPlan: SubscriptionPlanType;
}

// Premium özellikler listesi
const PREMIUM_FEATURES: Record<string, PremiumFeature> = {
  'terra-ai-comment': {
    id: 'terra-ai-comment',
    name: 'Terra AI Yorumu',
    description: 'AI tarafından oluşturulan detaylı teknik analiz ve güvenlik önerileri',
    requiredPlan: SubscriptionPlanType.SUPPORTER
  },
  'earthquake-risk-analysis': {
    id: 'earthquake-risk-analysis',
    name: 'Deprem Risk Analizi',
    description: 'Konum bazlı zemin analizi ve kişiselleştirilmiş risk değerlendirmesi',
    requiredPlan: SubscriptionPlanType.PROTECTOR
  },
  'detailed-statistics': {
    id: 'detailed-statistics',
    name: 'Detaylı İstatistikler',
    description: 'Gelişmiş istatistikler, trend analizleri ve gelecek tahmin modelleri',
    requiredPlan: SubscriptionPlanType.PROTECTOR
  },
  'all-comments': {
    id: 'all-comments',
    name: 'Tüm Yorumları Gör',
    description: 'Tüm kullanıcı deneyimlerini ve yorumlarını görüntüleyin',
    requiredPlan: SubscriptionPlanType.SUPPORTER
  }
};

// Plan hiyerarşisi
const PLAN_HIERARCHY = {
  [SubscriptionPlanType.FREE]: 0,
  [SubscriptionPlanType.SUPPORTER]: 1,
  [SubscriptionPlanType.PROTECTOR]: 2,
  [SubscriptionPlanType.SPONSOR]: 3
};

interface PremiumFeatureGateProps {
  featureId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showModal?: boolean;
  onUpgradePress?: () => void;
  compact?: boolean;
}

const { width, height } = Dimensions.get('window');

// Kullanıcı subscription bilgilerini almak için hook
const useUserSubscription = () => {
  const [userPlan, setUserPlan] = React.useState<SubscriptionPlanType>(SubscriptionPlanType.FREE);
  const [isLoading, setIsLoading] = React.useState(true);
  const [subscriptionDetails, setSubscriptionDetails] = React.useState<any>(null);

  React.useEffect(() => {
    fetchUserSubscription();
  }, []);

  const fetchUserSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUserPlan(SubscriptionPlanType.FREE);
        setIsLoading(false);
        return;
      }

      // Profile tablosundan subscription bilgilerini al
      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          *,
          subscription_plans (
            id,
            name,
            billing_period,
            price,
            features,
            duration_in_days
          )
        `)
        .eq('id', user.id)
        .single();

      if (error || !profile) {
        console.error('Profile fetch error:', error);
        setUserPlan(SubscriptionPlanType.FREE);
        setIsLoading(false);
        return;
      }

      // Subscription durumunu kontrol et
      if (profile.subscription_status === 'active' && 
          profile.subscription_end_date && 
          new Date(profile.subscription_end_date) > new Date()) {
        // Aktif subscription var
        const planName = profile.subscription_plans?.name || SubscriptionPlanType.FREE;
        setUserPlan(planName as SubscriptionPlanType);
        setSubscriptionDetails(profile.subscription_plans);
      } else {
        // Subscription süresi dolmuş veya yok
        setUserPlan(SubscriptionPlanType.FREE);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Subscription check error:', error);
      setUserPlan(SubscriptionPlanType.FREE);
      setIsLoading(false);
    }
  };

  return { userPlan, isLoading, subscriptionDetails, refetch: fetchUserSubscription };
};

const PremiumFeatureGate: React.FC<PremiumFeatureGateProps> = ({
  featureId,
  children,
  fallback,
  showModal = false,
  onUpgradePress,
  compact = false
}) => {
  const router = useRouter();
  const { userPlan, isLoading } = useUserSubscription();
  const [modalVisible, setModalVisible] = React.useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  // Feature bilgisini al
  const featureInfo = PREMIUM_FEATURES[featureId];
  
  // Erişim kontrolü
  const hasAccess = React.useMemo(() => {
    if (!featureInfo) return true; // Feature tanımlı değilse erişim ver
    
    const userPlanLevel = PLAN_HIERARCHY[userPlan];
    const requiredPlanLevel = PLAN_HIERARCHY[featureInfo.requiredPlan];
    
    return userPlanLevel >= requiredPlanLevel;
  }, [userPlan, featureInfo]);

  // Premium seviye adlarını Türkçe olarak getir
  const getPlanDisplayName = (plan: SubscriptionPlanType): string => {
    switch (plan) {
      case SubscriptionPlanType.FREE:
        return 'Ücretsiz';
      case SubscriptionPlanType.SUPPORTER:
        return 'Destekleyici';
      case SubscriptionPlanType.PROTECTOR:
        return 'Koruyucu';
      case SubscriptionPlanType.SPONSOR:
        return 'Sponsor';
      default:
        return 'Ücretsiz';
    }
  };

  // Premium paket sayfasına yönlendir
  const handleUpgradePress = () => {
    if (onUpgradePress) {
      onUpgradePress();
    } else {
      router.push('/(protected)/premium-packages');
    }
    setModalVisible(false);
  };

  // Modal açıldığında animasyon
  React.useEffect(() => {
    if (modalVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [modalVisible]);


  // Eğer erişim varsa, normal içeriği göster
  if (hasAccess) {
    return <>{children}</>;
  }

  // Eğer fallback belirtilmişse, onu göster
  if (fallback) {
    return <>{fallback}</>;
  }

  // Compact mod için özel görünüm
  if (compact) {
    return (
      <View style={styles.compactLockedContainer}>
        <TouchableOpacity
          style={styles.compactLockedButton}
          activeOpacity={0.8}
          onPress={handleUpgradePress}
        >
          <View style={styles.compactLockedContent}>
            <View style={styles.compactLockedLeft}>
              <View style={styles.compactLockedIconContainer}>
                <LinearGradient
                  colors={[colors.gradientOne, colors.gradientTwo]}
                  style={styles.compactIconGradient}
                >
                  <Ionicons 
                    name="star" 
                    size={16} 
                    color="#fff" 
                  />
                </LinearGradient>
              </View>
              <View style={styles.compactLockedTextContainer}>
                <Text 
                  style={styles.compactLockedTitle}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {featureInfo?.name}
                </Text>
                <Text 
                  style={styles.compactLockedSubtitle}
                  numberOfLines={1}
                >
                  {featureInfo?.description}
                </Text>
                <Text style={styles.compactLevelInfo}>
                  Gerekli: {getPlanDisplayName(featureInfo?.requiredPlan)} • Mevcut: {getPlanDisplayName(userPlan)}
                </Text>
              </View>
            </View>
            <View style={styles.compactLockedRight}>
              <View style={styles.compactLockedBadge}>
                <Text style={styles.compactLockedBadgeText}>Premium</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  // Modal göstermek istemiyorsa, sadece kilitli görünüm
  if (!showModal) {
    return (
      <View style={styles.lockedContainer}>
        <TouchableOpacity
          style={styles.lockedButton}
          activeOpacity={0.8}
          onPress={handleUpgradePress}
        >
          <View style={styles.lockedContent}>
            <View style={styles.lockedHeader}>
              <View style={styles.lockedLeftSection}>
                <View style={styles.lockedIconContainer}>
                  <LinearGradient
                    colors={[colors.gradientOne, colors.gradientTwo]}
                    style={styles.iconGradient}
                  >
                    <Ionicons 
                      name="star" 
                      size={24} 
                      color="#fff" 
                    />
                  </LinearGradient>
                </View>
                <Text 
                  style={styles.lockedTitle}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {featureInfo?.name}
                </Text>
              </View>
              <View style={styles.lockedBadge}>
                <Text style={styles.lockedBadgeText}>Premium</Text>
              </View>
            </View>
            <Text style={styles.lockedDescription}>
              {featureInfo?.description}
            </Text>
            <View style={styles.lockedFeatures}>
              <View style={styles.lockedFeature}>
                <Ionicons name="shield-checkmark" size={16} color={colors.success} />
                <Text style={styles.lockedFeatureText}>Gelişmiş Özellikler</Text>
              </View>
              <View style={styles.lockedFeature}>
                <Ionicons name="close-circle" size={16} color={colors.success} />
                <Text style={styles.lockedFeatureText}>Reklamsız Deneyim</Text>
              </View>
            </View>
          </View>
          <Ionicons name="arrow-forward" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
    );
  }

  // Modal ile premium özellik kilidi
  return (
    <>
      <TouchableOpacity 
        style={styles.lockedContainer}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <TouchableOpacity
          style={styles.lockedButton}
          activeOpacity={0.8}
          onPress={() => setModalVisible(true)}
        >
          <View style={styles.lockedContent}>
            <View style={styles.lockedHeader}>
              <View style={styles.lockedIconContainer}>
                <LinearGradient
                  colors={[colors.gradientOne, colors.gradientTwo]}
                  style={styles.iconGradient}
                >
                  <Ionicons 
                    name="star" 
                    size={24} 
                    color="#fff" 
                  />
                </LinearGradient>
              </View>
              <Text 
                style={styles.lockedTitle}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {featureInfo?.name}
              </Text>
              <View style={styles.lockedBadge}>
                <Text style={styles.lockedBadgeText}>Premium</Text>
              </View>
            </View>
            <Text style={styles.lockedDescription}>
              {featureInfo?.description}
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={20} color={colors.primary} />
        </TouchableOpacity>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={() => setModalVisible(false)}
      >
        <Animated.View 
          style={[
            styles.modalOverlay,
            { opacity: fadeAnim }
          ]}
        >
          <Animated.View 
            style={[
              styles.modalContent,
              { transform: [{ scale: scaleAnim }] }
            ]}
          >
            <LinearGradient
              colors={['#fff', '#f8fafc']}
              style={styles.modalGradient}
            >
              {/* Header */}
              <View style={styles.modalHeader}>
                <LinearGradient
                  colors={[colors.gradientOne, colors.gradientTwo]}
                  style={styles.modalHeaderGradient}
                >
                  <View style={styles.modalHeaderContent}>
                    <View style={styles.modalIconContainer}>
                      <Ionicons 
                        name="star" 
                        size={40} 
                        color="#fff" 
                      />
                    </View>
                    <Text style={styles.modalTitle}>Premium Özellik</Text>
                    <Text style={styles.modalSubtitle}>Gelişmiş deneyim için</Text>
                  </View>
                </LinearGradient>
              </View>

              {/* Body */}
              <View style={styles.modalBody}>
                <View style={styles.featureInfo}>
                  <Text style={styles.featureName}>
                    {featureInfo?.name}
                  </Text>
                  <Text style={styles.featureDescription}>
                    {featureInfo?.description}
                  </Text>
                </View>

                <View style={styles.levelInfo}>
                  <View style={styles.levelHeader}>
                    <View style={styles.levelIconContainer}>
                      <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
                    </View>
                    <Text style={styles.levelInfoTitle}>Paket Gereksinimleri</Text>
                  </View>
                  
                  {/* Gerekli Paket */}
                  <View style={styles.levelRequirement}>
                    <Text style={styles.levelRequirementLabel}>Gerekli Paket:</Text>
                    <View style={styles.levelBadge}>
                      <LinearGradient
                        colors={[colors.gradientOne, colors.gradientTwo]}
                        style={styles.levelBadgeGradient}
                      >
                        <Text style={styles.requiredLevel}>
                          {getPlanDisplayName(featureInfo?.requiredPlan)}
                        </Text>
                      </LinearGradient>
                    </View>
                  </View>
                  
                  {/* Mevcut Paket */}
                  <View style={styles.levelRequirement}>
                    <Text style={styles.levelRequirementLabel}>Mevcut Paketiniz:</Text>
                    <View style={[
                      styles.levelBadge,
                      userPlan === featureInfo?.requiredPlan && styles.currentLevelBadge
                    ]}>
                      <LinearGradient
                        colors={
                          userPlan === featureInfo?.requiredPlan 
                            ? [colors.success, colors.success] 
                            : ['#6b7280', '#9ca3af']
                        }
                        style={styles.levelBadgeGradient}
                      >
                        <Text style={[
                          styles.requiredLevel,
                          userPlan === featureInfo?.requiredPlan && styles.currentLevelText
                        ]}>
                          {getPlanDisplayName(userPlan)}
                        </Text>
                      </LinearGradient>
                    </View>
                  </View>
                  
                  {/* Paket Yükseltme Mesajı */}
                  {userPlan !== featureInfo?.requiredPlan && (
                    <View style={styles.levelDifference}>
                      <Ionicons 
                        name="information-circle" 
                        size={16} 
                        color={colors.warning} 
                        style={styles.levelDifferenceIcon}
                      />
                      <Text style={styles.levelDifferenceText}>
                        Bu özelliği kullanabilmek için {getPlanDisplayName(featureInfo?.requiredPlan)} paketine yükseltmeniz gerekiyor.
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.benefitsContainer}>
                  <Text style={styles.benefitsTitle}>Premium Avantajları</Text>
                  <View style={styles.benefitsList}>
                    <View style={styles.benefitItem}>
                      <View style={styles.benefitIcon}>
                        <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                      </View>
                      <Text style={styles.benefitText}>Gelişmiş özellikler</Text>
                    </View>
                    <View style={styles.benefitItem}>
                      <View style={styles.benefitIcon}>
                        <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                      </View>
                      <Text style={styles.benefitText}>Reklamsız deneyim</Text>
                    </View>
                    <View style={styles.benefitItem}>
                      <View style={styles.benefitIcon}>
                        <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                      </View>
                      <Text style={styles.benefitText}>Öncelikli destek</Text>
                    </View>
                    <View style={styles.benefitItem}>
                      <View style={styles.benefitIcon}>
                        <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                      </View>
                      <Text style={styles.benefitText}>7/24 erişim</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Footer */}
              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => setModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelButtonText}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.upgradeModalButton}
                  onPress={handleUpgradePress}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[colors.gradientOne, colors.gradientTwo]}
                    style={styles.upgradeModalButtonGradient}
                  >
                    <Ionicons name="sparkles" size={18} color="#fff" />
                    <Text style={styles.upgradeModalButtonText}>Premium'a Geç</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        </Animated.View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // Compact mod stilleri
  compactLockedContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  compactLockedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    minHeight: 60,
  },
  compactLockedContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactLockedLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginRight: 8,
    paddingTop: 2,
  },
  compactLockedIconContainer: {
    marginRight: 10,
    marginTop: 2,
  },
  compactIconGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  compactLockedTextContainer: {
    flex: 1,
    marginRight: 8,
    flexShrink: 1,
  },
  compactLockedTitle: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 3,
    flex: 1,
    flexShrink: 1,
  },
  compactLockedSubtitle: {
    color: '#666666',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  compactLevelInfo: {
    color: colors.warning,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
    lineHeight: 14,
  },
  compactLockedRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactLockedBadge: {
    backgroundColor: '#FFD700',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  compactLockedBadgeText: {
    color: '#2d3748',
    fontSize: 11,
    fontWeight: '600',
  },
  // Normal mod stilleri
  lockedContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  lockedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  lockedContent: {
    flex: 1,
    marginRight: 10,
  },
  lockedHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingRight: 2,
    justifyContent: 'space-between',
  },
  lockedLeftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  lockedIconContainer: {
    marginRight: 8,
  },
  iconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  lockedTitle: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
    flexShrink: 1,
  },
  lockedBadge: {
    backgroundColor: '#FFD700',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginLeft: 1,
    marginRight: 2,
    alignSelf: 'flex-start',
  },
  lockedBadgeText: {
    color: '#2d3748',
    fontSize: 10,
    fontWeight: '500',
  },
  lockedDescription: {
    color: '#666666',
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  lockedFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  lockedFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 8,
  },
  lockedFeatureText: {
    color: '#666666',
    fontSize: 13,
    marginLeft: 8,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'transparent',
    borderRadius: 24,
    margin: 20,
    width: width - 40,
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 24,
    },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 24,
  },
  modalGradient: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  modalHeader: {
    overflow: 'hidden',
  },
  modalHeaderGradient: {
    paddingVertical: 36,
    paddingHorizontal: 28,
  },
  modalHeaderContent: {
    alignItems: 'center',
  },
  modalIconContainer: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  modalBody: {
    padding: 28,
  },
  featureInfo: {
    marginBottom: 28,
  },
  featureName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.light.textPrimary,
    marginBottom: 10,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 16,
    color: colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  levelInfo: {
    backgroundColor: 'rgba(255, 87, 0, 0.08)',
    padding: 24,
    borderRadius: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 87, 0, 0.12)',
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelIconContainer: {
    marginRight: 12,
  },
  levelInfoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.light.textPrimary,
  },
  levelBadge: {
    marginBottom: 12,
  },
  levelBadgeGradient: {
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
  },
  requiredLevel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  currentLevel: {
    fontSize: 15,
    color: colors.light.textSecondary,
  },
  levelRequirement: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  levelRequirementLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.light.textPrimary,
    flex: 1,
  },
  currentLevelBadge: {
    // Mevcut seviye badge'i için özel stil
  },
  currentLevelText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  levelDifference: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.2)',
  },
  levelDifferenceIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  levelDifferenceText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
    flex: 1,
  },
  benefitsContainer: {
    marginTop: 8,
  },
  benefitsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.light.textPrimary,
    marginBottom: 20,
  },
  benefitsList: {
    gap: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitIcon: {
    marginRight: 16,
  },
  benefitText: {
    fontSize: 16,
    color: colors.light.textSecondary,
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    padding: 28,
    paddingTop: 0,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.light.surface,
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.light.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  upgradeModalButton: {
    flex: 2,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  upgradeModalButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  upgradeModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PremiumFeatureGate;