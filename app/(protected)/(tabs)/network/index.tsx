import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  Share,
  Clipboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { colors } from "@/constants/colors";
import { useCreateNetwork, useJoinNetwork, useMyNetworks, useUpdateNetwork, useDeleteNetwork, useNetworkMembers } from "@/hooks/useNetwork";
import { supabase } from "@/lib/supabase";
import Toast from "@/components/Toast";
import PremiumFeatureGate from "@/components/PremiumFeatureGate";

export default function NetworkScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [networkName, setNetworkName] = useState("");
  const [networkDescription, setNetworkDescription] = useState("");
  const [networkCode, setNetworkCode] = useState("");
  const [selectedNetworkType, setSelectedNetworkType] = useState<"family" | "friends" | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Toast state
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'success' as 'success' | 'error' | 'info'
  });

  // Queries
  const { data: myNetworks, isLoading: isLoadingNetworks, refetch: refetchNetworks } = useMyNetworks();

  // Mutations
  const createNetworkMutation = useCreateNetwork();
  const joinNetworkMutation = useJoinNetwork();
  const updateNetworkMutation = useUpdateNetwork();
  const deleteNetworkMutation = useDeleteNetwork();

  // Filter networks by role
  const createdNetworks = myNetworks?.filter(memberData => memberData.role === 'creator') || [];
  const joinedNetworks = myNetworks?.filter(memberData => memberData.role === 'member') || [];

  // Sayfa focus olduğunda verileri yeniden yükle
  useFocusEffect(
    React.useCallback(() => {
      refetchNetworks();
    }, [refetchNetworks])
  );

  // Show toast function
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({
      visible: true,
      message,
      type
    });
  };

  // Hide toast function
  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  // Navigate to network detail
  const navigateToNetworkDetail = (networkId: string) => {
    router.push(`/(protected)/(tabs)/network/${networkId}`);
  };

  const handleCreateNetwork = () => {
    if (!networkName.trim()) {
      showToast("Lütfen ağ adını girin.", "error");
      return;
    }

    // Ağ adını olduğu gibi kullan, otomatik kategori ekleme yapma
    const finalNetworkName = networkName.trim();

    createNetworkMutation.mutate(
      {
        name: finalNetworkName,
        description: networkDescription.trim() || undefined,
        max_members: 50,
      },
      {
        onSuccess: () => {
          setShowCreateModal(false);
          setNetworkName("");
          setNetworkDescription("");
          setSelectedNetworkType(null);
          showToast("Ağınız başarıyla oluşturuldu!");
        },
        onError: (error) => {
          showToast(error.message, "error");
        },
      }
    );
  };

  const handleJoinNetwork = () => {
    if (!networkCode.trim()) {
      showToast("Lütfen ağ kodunu girin.", "error");
      return;
    }

    joinNetworkMutation.mutate(networkCode.trim(), {
      onSuccess: () => {
        setShowJoinModal(false);
        setNetworkCode("");
        setSelectedNetworkType(null);
        showToast("Ağa başarıyla katıldınız!");
      },
      onError: (error) => {
        showToast(error.message, "error");
      },
    });
  };

  const openCreateModal = () => {
    setSelectedNetworkType(null);
    setShowCreateModal(true);
  };

  const openJoinModal = () => {
    setSelectedNetworkType(null);
    setShowJoinModal(true);
  };

  // Get current user
  React.useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
      }
    };
    getCurrentUser();
  }, []);

  // Check if user is network admin
  const isNetworkAdmin = (network: any) => {
    return currentUser && network && currentUser.id === network.creator_id;
  };

  // Check if network is default (Ailem or Arkadaşlarım)
  const isDefaultNetwork = (network: any) => {
    if (!network?.name) return false;
    const name = network.name.toLowerCase();
    return name.includes('aile') || name.includes('arkadaş') || name.includes('friend');
  };

  // Check if network can be modified (admin + not default)
  const canModifyNetwork = (network: any) => {
    return isNetworkAdmin(network) && !isDefaultNetwork(network);
  };

  const handleEditNetwork = (network: any) => {
    setSelectedNetwork(network);
    setEditName(network.name);
    setEditDescription(network.description || "");
    setShowEditModal(true);
  };

  const handleUpdateNetwork = () => {
    if (!editName.trim() || !selectedNetwork) {
      showToast("Lütfen ağ adını girin.", "error");
      return;
    }

    updateNetworkMutation.mutate(
      {
        networkId: selectedNetwork.id,
        updates: {
          name: editName.trim(),
          description: editDescription.trim() || undefined,
        }
      },
      {
        onSuccess: () => {
          setShowEditModal(false);
          setSelectedNetwork(null);
          showToast("Ağ bilgileri güncellendi!");
        },
        onError: (error) => {
          showToast(error.message, "error");
        },
      }
    );
  };

  const handleDeleteNetwork = (network: any) => {
    // Check if trying to delete default network
    if (isDefaultNetwork(network)) {
      showToast("Varsayılan ağlar (Ailem ve Arkadaşlarım) silinemez.", "error");
      return;
    }

    // Show confirmation dialog
    showToast("Ağı silmek istediğinizden emin misiniz?", "info");
    
    // For now, we'll use a simple confirmation
    // In a real app, you might want to use a custom confirmation modal
    deleteNetworkMutation.mutate(network.id, {
      onSuccess: () => {
        showToast("Ağ silindi!");
      },
      onError: (error) => {
        showToast(error.message, "error");
      },
    });
  };

  // Copy network code to clipboard
  const copyNetworkCode = async (networkCode: string) => {
    try {
      await Clipboard.setString(networkCode);
      showToast("Ağ kodu kopyalandı!");
    } catch (error) {
      showToast("Kod kopyalanamadı.", "error");
    }
  };

  // Share network invitation
  const shareNetwork = async (network: any) => {
    try {
      const shareMessage = `🌐 ${network.name} ağına katılmak ister misiniz?\n\n` +
        `Ağ Kodu: ${network.network_code}\n\n` +
        `Bu kodu Terra uygulamasında kullanarak ağa katılabilirsiniz. ` +
        `Acil durumlar için güvenli iletişim kurun!\n\n` +
        `📱 Terra Uygulamasını İndirin:\n` +
        `iOS: https://apps.apple.com/app/terra-earthquake-safety/id1234567890\n` +
        `Android: https://play.google.com/store/apps/details?id=com.terra.earthquakesafety`;

      await Share.share({
        message: shareMessage,
        title: `${network.name} Ağına Davet`,
      });
    } catch (error) {
      showToast("Paylaşım yapılamadı.", "error");
    }
  };

  // Network Card Component
  const NetworkCard = ({ memberData, networkType }: { memberData: any, networkType: 'family' | 'friends' | 'other' }) => {
    const { data: members } = useNetworkMembers(memberData.networks?.id || '');
    const memberCount = members?.length || 0;
    
    const getNetworkIcon = () => {
      switch (networkType) {
        case 'family':
          return "home-heart";
        case 'friends':
          return "account-group";
        default:
          return "account-multiple";
      }
    };

    const getNetworkColor = () => {
      switch (networkType) {
        case 'family':
          return "#FF6B6B";
        case 'friends':
          return "#4ECDC4";
        default:
          return colors.primary;
      }
    };

    return (
      <TouchableOpacity
        style={[styles.networkCard, { borderLeftColor: getNetworkColor() }]}
        onPress={() => navigateToNetworkDetail(memberData.networks?.id || '')}
      >
        <LinearGradient
          colors={[getNetworkColor() + '10', getNetworkColor() + '05']}
          style={styles.cardGradient}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <MaterialCommunityIcons
                name={getNetworkIcon()}
                size={28}
                color={getNetworkColor()}
              />
            </View>
            <View style={styles.cardTitleContainer}>
              <Text style={styles.cardTitle}>{memberData.networks?.name}</Text>
              <View style={styles.cardBadge}>
                <Text style={[styles.cardBadgeText, { color: getNetworkColor() }]}>
                  {memberCount} üye
                </Text>
              </View>
            </View>

          </View>
          
          {(() => {
            // Varsayılan ağlar için özel açıklamalar
            if (networkType === 'family') {
              return (
                                 <Text style={styles.cardDescription}>
                   Ailenizle güvenli iletişim kurun. Acil durumlarda birbirinizi bilgilendirin ve koordinasyon sağlayın.
                 </Text>
              );
            } else if (networkType === 'friends') {
              return (
                                 <Text style={styles.cardDescription}>
                   Sevdiklerinizle güvenli iletişim kurun. Acil durumlarda birbirinizi destekleyin ve sosyal aktiviteleri koordine edin.
                 </Text>
              );
            } else if (memberData.networks?.description) {
              // Diğer ağlar için veritabanından gelen açıklama
              return (
                <Text style={styles.cardDescription}>
                  {memberData.networks.description}
                </Text>
              );
            }
            return null;
          })()}
          
          <View style={styles.cardFooter}>
            <TouchableOpacity
              style={styles.codeButton}
              onPress={() => copyNetworkCode(memberData.networks?.network_code)}
            >
              <Text style={[styles.codeText, { color: getNetworkColor() }]}>
                Kod: {memberData.networks?.network_code}
              </Text>
              <Ionicons name="copy-outline" size={16} color={getNetworkColor()} />
            </TouchableOpacity>
            <Ionicons name="chevron-forward" size={20} color={colors.light.textSecondary} />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <PremiumFeatureGate 
      featureId="network-management"
      fallback={
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <LinearGradient
            colors={[colors.primary, colors.gradientTwo, '#FF8B00']}
            style={styles.premiumGradientBackground}
          >
            {/* Background Pattern */}
            <View style={styles.backgroundPattern}>
              <MaterialCommunityIcons name="account-group" size={120} color="rgba(255,255,255,0.1)" style={styles.patternIcon1} />
              <MaterialCommunityIcons name="shield-account" size={80} color="rgba(255,255,255,0.08)" style={styles.patternIcon2} />
              <MaterialCommunityIcons name="bell-ring" size={60} color="rgba(255,255,255,0.06)" style={styles.patternIcon3} />
            </View>

            <ScrollView contentContainerStyle={styles.premiumFallback} showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={styles.premiumHeader}>
                <View style={styles.premiumIconContainer}>
                  <LinearGradient
                    colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                    style={styles.premiumIconGradient}
                  >
                    <MaterialCommunityIcons name="account-group" size={48} color="#fff" />
                  </LinearGradient>
                </View>
                <Text style={styles.premiumTitle}>Ağ Yönetimi</Text>
                <Text style={styles.premiumSubtitle}>Koruyucu Premium Özellik</Text>
                <View style={styles.premiumBadge}>
                  <Ionicons name="diamond" size={16} color="#FFD700" />
                  <Text style={styles.premiumBadgeText}>PROTECTOR+</Text>
                </View>
              </View>

              {/* Features List */}
              <View style={styles.featuresContainer}>
                <Text style={styles.featuresTitle}>Premium Ağ Özellikleri</Text>
                
                <View style={styles.featuresList}>
                  <View style={styles.featureItem}>
                    <View style={styles.featureIconContainer}>
                      <Ionicons name="cellular-outline" size={24} color="#4ADE80" />
                    </View>
                    <View style={styles.featureContent}>
                      <Text style={styles.featureTitle}>İnternet Bağımsız Bildirimler</Text>
                      <Text style={styles.featureDescription}>
                        Ailenizin güvende veya tehlikede olduğu bildirimini internet bağlantısı olmadan alın
                      </Text>
                    </View>
                  </View>

                  <View style={styles.featureItem}>
                    <View style={styles.featureIconContainer}>
                      <Ionicons name="heart" size={24} color="#F87171" />
                    </View>
                    <View style={styles.featureContent}>
                      <Text style={styles.featureTitle}>Sevdiklerinize Özel Deprem Uyarıları</Text>
                      <Text style={styles.featureDescription}>
                        Sevdiklerinize yakın olan depremleri özel olarak ve öncelikli şekilde alın
                      </Text>
                    </View>
                  </View>

                  <View style={styles.featureItem}>
                    <View style={styles.featureIconContainer}>
                      <Ionicons name="location-outline" size={24} color="#60A5FA" />
                    </View>
                    <View style={styles.featureContent}>
                      <Text style={styles.featureTitle}>Gerçek Zamanlı Konum Takibi</Text>
                      <Text style={styles.featureDescription}>
                        Ağ üyelerinizin anlık konumunu görün ve acil durumda hızla ulaşın
                      </Text>
                    </View>
                  </View>

                  <View style={styles.featureItem}>
                    <View style={styles.featureIconContainer}>
                      <Ionicons name="shield-checkmark-outline" size={24} color="#A78BFA" />
                    </View>
                    <View style={styles.featureContent}>
                      <Text style={styles.featureTitle}>Acil Durum Eylem Planları</Text>
                      <Text style={styles.featureDescription}>
                        Aileniz için özelleştirilmiş acil durum planları oluşturun ve yönetin
                      </Text>
                    </View>
                  </View>

                  <View style={styles.featureItem}>
                    <View style={styles.featureIconContainer}>
                      <Ionicons name="people-outline" size={24} color="#FBBF24" />
                    </View>
                    <View style={styles.featureContent}>
                      <Text style={styles.featureTitle}>Sınırsız Ağ Üyesi</Text>
                      <Text style={styles.featureDescription}>
                        Aile, arkadaş ve iş gruplarınıza sınırsız sayıda üye ekleyin
                      </Text>
                    </View>
                  </View>

                  <View style={styles.featureItem}>
                    <View style={styles.featureIconContainer}>
                      <Ionicons name="analytics-outline" size={24} color="#34D399" />
                    </View>
                    <View style={styles.featureContent}>
                      <Text style={styles.featureTitle}>Güvenlik Analiz Raporları</Text>
                      <Text style={styles.featureDescription}>
                        Ağınızın güvenlik durumu ve risk analizlerini detaylı raporlarla takip edin
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* CTA Section */}
              <View style={styles.ctaSection}>
                <Text style={styles.ctaTitle}>Ailenizin Güvenliği İçin</Text>
                <Text style={styles.ctaDescription}>
                  Sevdiklerinizle güvenli iletişim kurun, acil durumda koordinasyon sağlayın
                </Text>
                
                <TouchableOpacity 
                  style={styles.upgradeButton}
                  onPress={() => router.push('/(protected)/premium-packages')}
                >
                  <LinearGradient
                    colors={[colors.primary, colors.gradientTwo]}
                    style={styles.upgradeButtonGradient}
                  >
                    <Ionicons name="diamond" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.upgradeButtonText}>Koruyucu Paket'e Yükselt</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
                  </LinearGradient>
                </TouchableOpacity>

                <Text style={styles.priceText}>₺49.99/ay'dan başlayan fiyatlarla</Text>
              </View>
            </ScrollView>
          </LinearGradient>
        </View>
      }
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Ağ Yönetimi</Text>
            <Text style={styles.headerSubtitle}>
              Ağlarınızı yönetin ve yeni bağlantılar kurun
            </Text>
          </View>

        {/* Created Networks Section */}
        <View style={styles.networksContainer}>
          <Text style={styles.mainSectionTitle}>Varsayılan Ağlar</Text>
          
          {/* Ailem Network */}
          <View style={styles.networkSection}>
            <Text style={styles.sectionTitle}>👨‍👩‍👧‍👦 Ailem</Text>
            {createdNetworks.filter(network => network.networks?.name?.toLowerCase().includes('aile')).length > 0 ? (
              createdNetworks.filter(network => network.networks?.name?.toLowerCase().includes('aile')).map((memberData) => (
                <NetworkCard key={memberData.id} memberData={memberData} networkType="family" />
              ))
            ) : (
              <View style={styles.emptyNetworkCard}>
                <LinearGradient
                  colors={['#FF6B6B10', '#FF6B6B05']}
                  style={styles.emptyCardGradient}
                >
                  <MaterialCommunityIcons
                    name="home-heart"
                    size={56}
                    color="#FF6B6B"
                  />
                  <Text style={styles.emptyCardTitle}>Ailem</Text>
                  <Text style={styles.emptyCardDescription}>
                    Ailenizle güvenli iletişim kurun. Acil durumlarda birbirinizi bilgilendirin ve koordinasyon sağlayın.
                  </Text>
                </LinearGradient>
              </View>
            )}
          </View>

          {/* Arkadaşlarım Network */}
          <View style={styles.networkSection}>
            <Text style={styles.sectionTitle}>👥 Arkadaşlarım</Text>
            {createdNetworks.filter(network => network.networks?.name?.toLowerCase().includes('arkadaş') || network.networks?.name?.toLowerCase().includes('friend')).length > 0 ? (
              createdNetworks.filter(network => network.networks?.name?.toLowerCase().includes('arkadaş') || network.networks?.name?.toLowerCase().includes('friend')).map((memberData) => (
                <NetworkCard key={memberData.id} memberData={memberData} networkType="friends" />
              ))
            ) : (
              <View style={styles.emptyNetworkCard}>
                <LinearGradient
                  colors={['#4ECDC410', '#4ECDC405']}
                  style={styles.emptyCardGradient}
                >
                  <MaterialCommunityIcons
                    name="account-group"
                    size={56}
                    color="#4ECDC4"
                  />
                  <Text style={styles.emptyCardTitle}>Arkadaş Ağınız</Text>
                  <Text style={styles.emptyCardDescription}>
                    Sevdiklerinizle güvenli iletişim kurun. Acil durumlarda birbirinizi destekleyin ve sosyal aktiviteleri koordine edin.
                  </Text>
                </LinearGradient>
              </View>
            )}
          </View>

          {/* Diğer Networks */}
          <View style={styles.networkSection}>
            <Text style={styles.sectionTitle}>🔗 Diğer Ağlar</Text>
            {createdNetworks.filter(network => 
              !network.networks?.name?.toLowerCase().includes('aile') && 
              !network.networks?.name?.toLowerCase().includes('arkadaş') && 
              !network.networks?.name?.toLowerCase().includes('friend')
            ).length > 0 ? (
              createdNetworks.filter(network => 
                !network.networks?.name?.toLowerCase().includes('aile') && 
                !network.networks?.name?.toLowerCase().includes('arkadaş') && 
                !network.networks?.name?.toLowerCase().includes('friend')
              ).map((memberData) => (
                <NetworkCard key={memberData.id} memberData={memberData} networkType="other" />
              ))
            ) : (
              <View style={styles.emptyNetworkCard}>
                <LinearGradient
                  colors={[colors.primary + '10', colors.primary + '05']}
                  style={styles.emptyCardGradient}
                >
                  <MaterialCommunityIcons
                    name="account-multiple"
                    size={56}
                    color={colors.primary}
                  />
                  <Text style={styles.emptyCardTitle}>Özel Ağlarınız</Text>
                  <Text style={styles.emptyCardDescription}>
                    Kendi özelleştirilmiş ağınızı kurun ve takipte kalın. İş ekibi, spor kulübü, hobi grubu veya özel projeleriniz için güvenli iletişim ağları oluşturun.
                  </Text>
                </LinearGradient>
              </View>
            )}
          </View>

          {/* Create Network Button */}
          <TouchableOpacity
            style={styles.createNetworkButton}
            onPress={() => openCreateModal()}
          >
            <LinearGradient
              colors={[colors.primary, colors.primary + 'CC']}
              style={styles.createButtonGradient}
            >
              <Ionicons name="add-circle" size={24} color="#fff" />
              <Text style={styles.createNetworkButtonText}>Yeni Ağ Oluştur</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Joined Networks Section */}
        <View style={[styles.networksContainer, styles.joinedNetworksContainer]}>
          <Text style={styles.mainSectionTitle}>Katıldığım Ağlar</Text>
          
          {joinedNetworks.length > 0 ? (
            joinedNetworks.map((memberData) => (
              <TouchableOpacity
                key={memberData.id}
                style={styles.joinedNetworkCard}
                onPress={() => navigateToNetworkDetail(memberData.networks?.id || '')}
              >
                <LinearGradient
                  colors={['#667eea10', '#764ba205']}
                  style={styles.joinedCardGradient}
                >
                  <View style={styles.joinedCardHeader}>
                    <View style={styles.joinedCardIcon}>
                      <MaterialCommunityIcons
                        name="account-group"
                        size={24}
                        color="#667eea"
                      />
                    </View>
                    <View style={styles.joinedCardInfo}>
                      <Text style={styles.joinedCardTitle}>{memberData.networks?.name}</Text>
                      {memberData.networks?.description && (
                        <Text style={styles.joinedCardDescription}>
                          {memberData.networks.description}
                        </Text>
                      )}
                      <Text style={styles.joinedCardDate}>
                        Katıldığınız tarih: {new Date(memberData.joined_at).toLocaleDateString('tr-TR')}
                      </Text>
                    </View>
                    <View style={styles.joinedCardStatus}>
                      <View style={styles.memberBadge}>
                        <Text style={styles.memberBadgeText}>Üye</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={colors.light.textSecondary} />
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyJoinedCard}>
              <LinearGradient
                colors={['#667eea10', '#764ba205']}
                style={styles.emptyJoinedGradient}
              >
                <MaterialCommunityIcons
                  name="account-group-outline"
                  size={56}
                  color="#667eea"
                />
                <Text style={styles.emptyJoinedTitle}>Henüz Bir Ağa Katılmadınız</Text>
                <Text style={styles.emptyJoinedDescription}>
                  Mevcut bir ağa katılmak için ağ kodunu kullanın ve yeni bağlantılar kurun
                </Text>
                
                <TouchableOpacity
                  style={styles.joinNetworkButton}
                  onPress={() => openJoinModal()}
                >
                  <LinearGradient
                    colors={['#667eea', '#5a67d8']}
                    style={styles.joinButtonGradient}
                  >
                    <Ionicons name="people" size={20} color="#fff" />
                    <Text style={styles.joinNetworkButtonText}>Ağa Katıl</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          )}
        </View>

        {/* Loading State */}
        {isLoadingNetworks && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Ağlar yükleniyor...</Text>
          </View>
        )}
        </ScrollView>
      </View>

      {/* Create Network Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Yeni Ağ Oluştur</Text>
                <TouchableOpacity
                  onPress={() => setShowCreateModal(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>
                Ağ adınızı girin, otomatik olarak uygun kategoriye eklenecektir
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Ağ adını girin (örn: Aile Ağım, Arkadaş Grubu, İş Ekibi, Spor Kulübü)"
                placeholderTextColor="#999"
                value={networkName}
                onChangeText={setNetworkName}
                maxLength={50}
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Ağ hakkında kısa bir açıklama yazın (opsiyonel)"
                placeholderTextColor="#999"
                value={networkDescription}
                onChangeText={setNetworkDescription}
                multiline
                numberOfLines={3}
                maxLength={200}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowCreateModal(false)}
                >
                  <Text style={styles.cancelButtonText}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleCreateNetwork}
                  disabled={createNetworkMutation.isPending}
                >
                  {createNetworkMutation.isPending ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.confirmButtonText}>Oluştur</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </Modal>

      {/* Join Network Modal */}
      <Modal
        visible={showJoinModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowJoinModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Ağa Katıl</Text>
                <TouchableOpacity
                  onPress={() => setShowJoinModal(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>
                Katılmak istediğiniz ağın kodunu girin
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Ağ kodunu girin (örn: ABC123)"
                placeholderTextColor="#999"
                value={networkCode}
                onChangeText={setNetworkCode}
                maxLength={20}
                autoCapitalize="characters"
              />

              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={20} color={colors.primary} />
                <Text style={styles.infoText}>
                  Ağ kodu, ağ sahibinden alabileceğiniz benzersiz bir koddur
                </Text>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowJoinModal(false)}
                >
                  <Text style={styles.cancelButtonText}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleJoinNetwork}
                  disabled={joinNetworkMutation.isPending}
                >
                  {joinNetworkMutation.isPending ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.confirmButtonText}>Katıl</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </Modal>

      {/* Edit Network Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Ağı Düzenle</Text>
                <TouchableOpacity
                  onPress={() => setShowEditModal(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>
                Ağ bilgilerini güncelleyin
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Ağ adını girin"
                placeholderTextColor="#999"
                value={editName}
                onChangeText={setEditName}
                maxLength={50}
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Ağ hakkında kısa bir açıklama yazın (opsiyonel)"
                value={editDescription}
                onChangeText={setEditDescription}
                multiline
                numberOfLines={3}
                maxLength={200}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowEditModal(false)}
                >
                  <Text style={styles.cancelButtonText}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleUpdateNetwork}
                  disabled={updateNetworkMutation.isPending}
                >
                  {updateNetworkMutation.isPending ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.confirmButtonText}>Güncelle</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </Modal>

      {/* Toast Component */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </PremiumFeatureGate>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: colors.light.background,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.light.textPrimary,
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.light.textSecondary,
    lineHeight: 24,
    fontWeight: "400",
  },
  networksContainer: {
    paddingHorizontal: 20,
    gap: 16,
    paddingBottom: 20,
  },
  networkGroup: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 6,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.02)",
  },
  networkGroupHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    justifyContent: "space-between",
  },
  chevronIcon: {
    marginLeft: "auto",
  },
  networkGroupTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.light.textPrimary,
    marginLeft: 14,
    letterSpacing: -0.3,
  },
  networkGroupContent: {
    gap: 16,
  },
  networkInfo: {
    gap: 8,
  },
  networkDescription: {
    fontSize: 13,
    color: colors.light.textSecondary,
    lineHeight: 18,
    marginBottom: 2,
  },
  networkStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  networkStatusText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  compactButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: "#fff",
    gap: 6,
  },
  compactButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.primary,
  },
  joinButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  joinButtonText: {
    color: "#fff",
  },
  actionButtonsContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  actionButtonx: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: "#fff",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: -0.2,
  },
  joinActionButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  joinActionButtonText: {
    color: "#fff",
  },
  adminActions: {
    flexDirection: "row",
    gap: 8,
    marginRight: 8,
  },
  adminButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  deleteButton: {
    backgroundColor: "#ff4757",
    borderColor: "#ff4757",
    shadowColor: "#ff4757",
    shadowOpacity: 0.2,
  },

  mainSectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.light.textPrimary,
    marginBottom: 12,
    marginTop: 4,
    letterSpacing: -0.4,
  },
  createNetworkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 6,
    marginTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  createNetworkButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    letterSpacing: -0.1,
  },
  joinNetworkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    gap: 8,
    marginTop: 20,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  joinNetworkButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: -0.2,
  },
  joinedNetworksContainer: {
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    margin: 20,
    width: "90%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.light.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.light.textSecondary,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: "#fafafa",
    color: colors.light.textPrimary,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: colors.primary + "10",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.light.textSecondary,
    marginLeft: 8,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    alignItems: "center",
  },
  cancelButtonText: {
    color: colors.light.textSecondary,
    fontSize: 16,
    fontWeight: "500",
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.light.textSecondary,
  },
  networkSection: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.light.textPrimary,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  networkItem: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  networkDetails: {
    marginLeft: 12,
    flex: 1,
  },
  networkName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.light.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  networkCode: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  networkMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  memberCount: {
    fontSize: 13,
    color: colors.light.textSecondary,
    fontWeight: "500",
    backgroundColor: "rgba(0,0,0,0.04)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  codeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.02)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  shareButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  joinDate: {
    fontSize: 12,
    color: colors.light.textSecondary,
  },
  creatorBadge: {
    backgroundColor: "#FFD700",
    color: "#333",
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  noNetworksContainer: {
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
    marginTop: 20,
  },
  noNetworksTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.light.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  noNetworksDescription: {
    fontSize: 14,
    color: colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  networkCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardGradient: {
    flex: 1,
    borderRadius: 16,
    padding: 18,
    justifyContent: "space-between",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
    marginRight: 12,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.light.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  cardBadge: {
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cardBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  deleteActionButton: {
    backgroundColor: "#ff4757",
    borderColor: "#ff4757",
    shadowColor: "#ff4757",
    shadowOpacity: 0.2,
  },
  cardDescription: {
    fontSize: 14,
    color: colors.light.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  codeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.02)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  codeText: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  emptyNetworkCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 32,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.02)",
  },
  emptyCardGradient: {
    flex: 1,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.light.textPrimary,
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptyCardDescription: {
    fontSize: 14,
    color: colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    fontWeight: "400",
  },
  createButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    gap: 8,
  },
  joinedNetworkCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  joinedCardGradient: {
    flex: 1,
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  joinedCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  joinedCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
    marginRight: 12,
  },
  joinedCardInfo: {
    flex: 1,
  },
  joinedCardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.light.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  joinedCardDescription: {
    fontSize: 14,
    color: colors.light.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  joinedCardDate: {
    fontSize: 12,
    color: colors.light.textSecondary,
  },
  joinedCardStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  memberBadge: {
    backgroundColor: colors.primary + "20",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  memberBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  emptyJoinedCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 32,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.02)",
  },
  emptyJoinedGradient: {
    flex: 1,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyJoinedTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.light.textPrimary,
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: -0.3,
    textAlign: "center",
  },
  emptyJoinedDescription: {
    fontSize: 14,
    color: colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    fontWeight: "400",
  },
  joinButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    gap: 8,
  },
  // Premium fallback styles
  premiumGradientBackground: {
    flex: 1,
    position: 'relative',
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  patternIcon1: {
    position: 'absolute',
    top: 50,
    right: -20,
    transform: [{ rotate: '15deg' }],
  },
  patternIcon2: {
    position: 'absolute',
    top: 200,
    left: -10,
    transform: [{ rotate: '-15deg' }],
  },
  patternIcon3: {
    position: 'absolute',
    bottom: 100,
    right: 30,
    transform: [{ rotate: '25deg' }],
  },
  premiumFallback: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  premiumHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  premiumIconContainer: {
    marginBottom: 20,
  },
  premiumIconGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  premiumTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -1,
  },
  premiumSubtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#FFD700',
    gap: 8,
  },
  premiumBadgeText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  featuresContainer: {
    marginBottom: 40,
  },
  featuresTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  featuresList: {
    gap: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
    lineHeight: 22,
  },
  featureDescription: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 22,
  },
  ctaSection: {
    alignItems: 'center',
    paddingTop: 20,
  },
  ctaTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  ctaDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  upgradeButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 16,
  },
  upgradeButtonGradient: {
    paddingVertical: 20,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 280,
  },
  upgradeButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  priceText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    fontWeight: '500',
  },
});