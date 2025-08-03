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
import { usePremium } from '@/hooks/usePremium';
import { PremiumFeature, PremiumPackageType } from '@/types/types';

interface PremiumFeatureGateProps {
  featureId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showModal?: boolean;
  onUpgradePress?: () => void;
  compact?: boolean; // Yeni prop: kompakt görünüm için
}

const { width, height } = Dimensions.get('window');

const PremiumFeatureGate: React.FC<PremiumFeatureGateProps> = ({
  featureId,
  children,
  fallback,
  showModal = false, // Changed default to false
  onUpgradePress,
  compact = false
}) => {
  const router = useRouter();
  const { hasAccessToFeature, getFeatureInfo, getCurrentLevel } = usePremium();
  const [modalVisible, setModalVisible] = React.useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  const hasAccess = hasAccessToFeature(featureId);
  const featureInfo = getFeatureInfo(featureId);
  const currentLevel = getCurrentLevel();

  // Premium seviye adlarını Türkçe olarak getir
  const getLevelName = (level: PremiumPackageType): string => {
    switch (level) {
      case PremiumPackageType.FREE:
        return 'Ücretsiz';
      case PremiumPackageType.SUPPORTER:
        return 'Destekleyici';
      case PremiumPackageType.PROTECTOR:
        return 'Koruyucu';
      case PremiumPackageType.SPONSOR:
        return 'Sponsor';
      default:
        return 'Ücretsiz';
    }
  };

  // Gerekli seviye adını getir
  const getRequiredLevelName = (): string => {
    if (!featureInfo) return 'Premium';
    return getLevelName(featureInfo.requiredLevel);
  };

  // Fallback değerleri hazırla
  const getFallbackName = () => {
    if (featureId === 'terra-ai-comment') return 'Terra AI Yorumu';
    if (featureId === 'earthquake-risk-analysis') return 'Deprem Risk Analizi';
    if (featureId === 'detailed-statistics') return 'Detaylı İstatistikler';
    if (featureId === 'all-comments') return 'Tüm Yorumları Gör';
    return 'Premium Özellik';
  };

  const getFallbackDescription = () => {
    if (featureId === 'terra-ai-comment') return 'AI tarafından oluşturulan detaylı teknik analiz ve güvenlik önerileri';
    if (featureId === 'earthquake-risk-analysis') return 'Konum bazlı zemin analizi ve kişiselleştirilmiş risk değerlendirmesi';
    if (featureId === 'detailed-statistics') return 'Gelişmiş istatistikler, trend analizleri ve gelecek tahmin modelleri';
    if (featureId === 'all-comments') return 'Tüm kullanıcı deneyimlerini ve yorumlarını görüntüleyin';
    return 'Bu özellik premium kullanıcılar için ayrılmıştır.';
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

  // Modal göstermek istemiyorsa, sadece kilitli görünüm
  if (!showModal) {
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
                    {featureInfo?.name || getFallbackName()}
                  </Text>
                  <Text 
                    style={styles.compactLockedSubtitle}
                    numberOfLines={1}
                  >
                    {featureInfo?.description || getFallbackDescription()}
                  </Text>
                  {/* Compact modda seviye bilgisi */}
                  {currentLevel !== featureInfo?.requiredLevel && (
                    <Text style={styles.compactLevelInfo}>
                      Gerekli: {getRequiredLevelName()} • Mevcut: {getLevelName(currentLevel)}
                    </Text>
                  )}
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

    // Normal mod için mevcut görünüm
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
                  {featureInfo?.name || getFallbackName()}
                </Text>
              </View>
              <View style={styles.lockedBadge}>
                <Text style={styles.lockedBadgeText}>Premium</Text>
              </View>
            </View>
            <Text style={styles.lockedDescription}>
              {featureInfo?.description || getFallbackDescription()}
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
              {featureId === 'earthquake-risk-analysis' && (
                <View style={styles.lockedFeature}>
                  <Ionicons name="map" size={16} color={colors.success} />
                  <Text style={styles.lockedFeatureText}>Konum Bazlı Zemin Risk Analizi</Text>
                </View>
              )}
              {featureId === 'detailed-statistics' && (
                <View style={styles.lockedFeature}>
                  <Ionicons name="analytics" size={16} color={colors.success} />
                  <Text style={styles.lockedFeatureText}>Detaylı İstatistiksel Analiz</Text>
                </View>
              )}
              {featureId === 'terra-ai-comment' && (
                <View style={styles.lockedFeature}>
                  <Ionicons name="sparkles" size={16} color={colors.success} />
                  <Text style={styles.lockedFeatureText}>AI Tarafından Oluşturulan Özel Yorumlar</Text>
                </View>
              )}
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
                {featureInfo?.name || getFallbackName()}
              </Text>
              <View style={styles.lockedBadge}>
                <Text style={styles.lockedBadgeText}>Premium</Text>
              </View>
            </View>
            <Text style={styles.lockedDescription}>
              {featureInfo?.description || getFallbackDescription()}
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
              {featureId === 'earthquake-risk-analysis' && (
                <View style={styles.lockedFeature}>
                  <Ionicons name="map" size={16} color={colors.success} />
                  <Text style={styles.lockedFeatureText}>Konum Bazlı Zemin Risk Analizi</Text>
                </View>
              )}
              {featureId === 'detailed-statistics' && (
                <View style={styles.lockedFeature}>
                  <Ionicons name="analytics" size={16} color={colors.success} />
                  <Text style={styles.lockedFeatureText}>Detaylı İstatistiksel Analiz</Text>
                </View>
              )}
              {featureId === 'terra-ai-comment' && (
                <View style={styles.lockedFeature}>
                  <Ionicons name="sparkles" size={16} color={colors.success} />
                  <Text style={styles.lockedFeatureText}>AI Tarafından Oluşturulan Özel Yorumlar</Text>
                </View>
              )}
            </View>
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
                    {featureInfo?.name || getFallbackName()}
                  </Text>
                  <Text style={styles.featureDescription}>
                    {featureInfo?.description || getFallbackDescription()}
                  </Text>
                </View>

                <View style={styles.levelInfo}>
                  <View style={styles.levelHeader}>
                    <View style={styles.levelIconContainer}>
                      <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
                    </View>
                    <Text style={styles.levelInfoTitle}>Seviye Gereksinimleri</Text>
                  </View>
                  
                  {/* Gerekli Seviye */}
                  <View style={styles.levelRequirement}>
                    <Text style={styles.levelRequirementLabel}>Gerekli Seviye:</Text>
                    <View style={styles.levelBadge}>
                      <LinearGradient
                        colors={[colors.gradientOne, colors.gradientTwo]}
                        style={styles.levelBadgeGradient}
                      >
                        <Text style={styles.requiredLevel}>{getRequiredLevelName()}</Text>
                      </LinearGradient>
                    </View>
                  </View>
                  
                  {/* Mevcut Seviye */}
                  <View style={styles.levelRequirement}>
                    <Text style={styles.levelRequirementLabel}>Mevcut Seviyeniz:</Text>
                    <View style={[
                      styles.levelBadge, 
                      currentLevel === featureInfo?.requiredLevel && styles.currentLevelBadge
                    ]}>
                      <LinearGradient
                        colors={
                          currentLevel === featureInfo?.requiredLevel 
                            ? [colors.success, colors.success] 
                            : ['#6b7280', '#9ca3af']
                        }
                        style={styles.levelBadgeGradient}
                      >
                        <Text style={[
                          styles.requiredLevel,
                          currentLevel === featureInfo?.requiredLevel && styles.currentLevelText
                        ]}>
                          {getLevelName(currentLevel)}
                        </Text>
                      </LinearGradient>
                    </View>
                  </View>
                  
                  {/* Seviye Farkı Açıklaması */}
                  {currentLevel !== featureInfo?.requiredLevel && (
                    <View style={styles.levelDifference}>
                      <Ionicons 
                        name="information-circle" 
                        size={16} 
                        color={colors.warning} 
                        style={styles.levelDifferenceIcon}
                      />
                      <Text style={styles.levelDifferenceText}>
                        {currentLevel === PremiumPackageType.FREE && featureInfo?.requiredLevel === PremiumPackageType.SUPPORTER && 
                          "Bu özellik için Destekleyici (Premium 1) seviyesine yükseltmeniz gerekiyor."}
                        {currentLevel === PremiumPackageType.FREE && featureInfo?.requiredLevel === PremiumPackageType.PROTECTOR && 
                          "Bu özellik için Koruyucu (Premium 2) seviyesine yükseltmeniz gerekiyor."}
                        {currentLevel === PremiumPackageType.FREE && featureInfo?.requiredLevel === PremiumPackageType.SPONSOR && 
                          "Bu özellik için Sponsor (Premium 3) seviyesine yükseltmeniz gerekiyor."}
                        {currentLevel === PremiumPackageType.SUPPORTER && featureInfo?.requiredLevel === PremiumPackageType.PROTECTOR && 
                          "Bu özellik için Koruyucu (Premium 2) seviyesine yükseltmeniz gerekiyor."}
                        {currentLevel === PremiumPackageType.SUPPORTER && featureInfo?.requiredLevel === PremiumPackageType.SPONSOR && 
                          "Bu özellik için Sponsor (Premium 3) seviyesine yükseltmeniz gerekiyor."}
                        {currentLevel === PremiumPackageType.PROTECTOR && featureInfo?.requiredLevel === PremiumPackageType.SPONSOR && 
                          "Bu özellik için Sponsor (Premium 3) seviyesine yükseltmeniz gerekiyor."}
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
                      <Text style={styles.benefitText}>İl, İlçe, Mahalle Seçimi</Text>
                    </View>
                    <View style={styles.benefitItem}>
                      <View style={styles.benefitIcon}>
                        <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                      </View>
                      <Text style={styles.benefitText}>Gelişmiş özellikler</Text>
                    </View>
                    {featureId === 'earthquake-risk-analysis' && (
                      <View style={styles.benefitItem}>
                        <View style={styles.benefitIcon}>
                          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                        </View>
                        <Text style={styles.benefitText}>Detaylı Risk Analizi</Text>
                      </View>
                    )}
                    {featureId === 'detailed-statistics' && (
                      <View style={styles.benefitItem}>
                        <View style={styles.benefitIcon}>
                          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                        </View>
                        <Text style={styles.benefitText}>Detaylı İstatistiksel Analiz</Text>
                      </View>
                    )}
                    {featureId === 'terra-ai-comment' && (
                      <View style={styles.benefitItem}>
                        <View style={styles.benefitIcon}>
                          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                        </View>
                        <Text style={styles.benefitText}>AI Tarafından Oluşturulan Özel Yorumlar</Text>
                      </View>
                    )}
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