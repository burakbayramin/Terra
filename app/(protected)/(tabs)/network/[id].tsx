import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  Clipboard,
  Share,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  MaterialCommunityIcons,
  Ionicons,
} from "@expo/vector-icons";
import { colors } from "@/constants/colors";
import { useNetwork, useNetworkMembers, useUpdateNetwork, useDeleteNetwork, useRemoveMember } from "@/hooks/useNetwork";
import { supabase } from "@/lib/supabase";
import Toast from "@/components/Toast";

export default function NetworkDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isNetworkAdmin, setIsNetworkAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState(2); // 0: Üyeler, 1: Bildirimler, 2: Özellikler
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRemoveMemberModal, setShowRemoveMemberModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // Toast state
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'success' as 'success' | 'error' | 'info'
  });

  // Queries
  const { data: network, isLoading: isLoadingNetwork } = useNetwork(id || '');
  const { data: members, isLoading: isLoadingMembers } = useNetworkMembers(id || '');

  // Mutations
  const updateNetworkMutation = useUpdateNetwork();
  const deleteNetworkMutation = useDeleteNetwork();
  const removeMemberMutation = useRemoveMember();

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

  // Get current user and check if admin
  React.useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        // Check if user is network admin
        if (network && user.id === network.creator_id) {
          setIsNetworkAdmin(true);
        }
      }
    };
    getCurrentUser();
  }, [network]);

  // Check if network is default (Ailem or Arkadaşlarım)
  const isDefaultNetwork = (network: any) => {
    if (!network?.name) return false;
    const name = network.name.toLowerCase();
    return name.includes('aile') || name.includes('arkadaş') || name.includes('friend');
  };

  // Check if network can be modified (admin + not default)
  const canModifyNetwork = (network: any) => {
    return isNetworkAdmin && network && !isDefaultNetwork(network);
  };

  // Update edit form when network data changes
  React.useEffect(() => {
    if (network) {
      setEditName(network.name);
      setEditDescription(network.description || "");
    }
  }, [network]);

  // Format network name (Aile Ağım -> Ailem)
  const formatNetworkName = (name: string) => {
    if (name.toLowerCase().includes('aile ağım')) {
      return 'Ailem';
    }
    return name;
  };

  // Get network type and color
  const getNetworkTypeAndColor = (network: any) => {
    if (!network?.name) return { type: 'other', color: colors.primary };
    
    const name = network.name.toLowerCase();
    if (name.includes('aile') || name.includes('family')) {
      return { type: 'family', color: '#FF6B6B' };
    } else if (name.includes('arkadaş') || name.includes('friend')) {
      return { type: 'friends', color: '#4ECDC4' };
    } else {
      return { type: 'other', color: colors.primary };
    }
  };

  // Get network icon
  const getNetworkIcon = (networkType: string) => {
    switch (networkType) {
      case 'family':
        return 'home-heart';
      case 'friends':
        return 'account-group';
      default:
        return 'account-multiple';
    }
  };

  // Get member status
  const getMemberStatus = (member: any) => {
    // Bu kısım Tehlikedeyim modülünden gelen veriyle beslenecek
    // Şimdilik rastgele status gösteriyoruz
    const statuses = ['güvende', 'tehlikede'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    return {
      status: randomStatus,
      color: randomStatus === 'güvende' ? '#2ed573' : '#ff4757',
      icon: randomStatus === 'güvende' ? 'shield-check' as any : 'alert-circle' as any
    };
  };

  // Copy network code
  const copyNetworkCode = async () => {
    if (network?.network_code) {
      try {
        await Clipboard.setString(network.network_code);
        showToast("Ağ kodu kopyalandı!");
      } catch (error) {
        showToast("Kod kopyalanamadı.", "error");
      }
    }
  };

  // Share network invitation
  const shareNetworkInvitation = async () => {
    try {
      const shareMessage = `🌐 ${formatNetworkName(network?.name || '')} ağına katılmak ister misiniz?\n\n` +
        `Ağ Kodu: ${network?.network_code}\n\n` +
        `Bu kodu Terra uygulamasında kullanarak ağa katılabilirsiniz. ` +
        `Acil durumlar için güvenli iletişim kurun!\n\n` +
        `📱 Terra Uygulamasını İndirin:\n` +
        `iOS: https://apps.apple.com/app/terra-earthquake-safety/id1234567890\n` +
        `Android: https://play.google.com/store/apps/details?id=com.terra.earthquakesafety`;

      await Share.share({
        message: shareMessage,
        title: `${formatNetworkName(network?.name || '')} Ağına Davet`,
      });
    } catch (error) {
      showToast("Paylaşım yapılamadı.", "error");
    }
  };

  // Admin functions
  const handleUpdateNetwork = () => {
    if (!editName.trim()) {
      showToast("Lütfen ağ adını girin.", "error");
      return;
    }

    // Check if trying to edit default network
    if (network && isDefaultNetwork(network)) {
      showToast("Varsayılan ağlar (Ailem ve Arkadaşlarım) düzenlenemez.", "error");
      return;
    }

    updateNetworkMutation.mutate(
      {
        networkId: id || '',
        updates: {
          name: editName.trim(),
          description: editDescription.trim() || undefined,
        }
      },
      {
        onSuccess: () => {
          setShowEditModal(false);
          showToast("Ağ bilgileri güncellendi!");
        },
        onError: (error) => {
          showToast(error.message, "error");
        },
      }
    );
  };

  const handleDeleteNetwork = () => {
    // Check if trying to delete default network
    if (network && isDefaultNetwork(network)) {
      showToast("Varsayılan ağlar (Ailem ve Arkadaşlarım) silinemez.", "error");
      return;
    }

    // Show confirmation dialog
    showToast("Ağı silmek istediğinizden emin misiniz?", "info");
    
    // For now, we'll use a simple confirmation
    // In a real app, you might want to use a custom confirmation modal
    deleteNetworkMutation.mutate(id || '', {
      onSuccess: () => {
        showToast("Ağ silindi!");
        router.back();
      },
      onError: (error) => {
        showToast(error.message, "error");
      },
    });
  };

  const handleRemoveMember = (member: any) => {
    setSelectedMember(member);
    setShowRemoveMemberModal(true);
  };

  const confirmRemoveMember = () => {
    if (!selectedMember) return;

    // Show confirmation dialog
    showToast(`${selectedMember?.profiles?.name || 'Bu üyeyi'} ağdan çıkarmak istediğinizden emin misiniz?`, "info");
    
    // For now, we'll use a simple confirmation
    // In a real app, you might want to use a custom confirmation modal
    removeMemberMutation.mutate(
      {
        networkId: id || '',
        userId: selectedMember.user_id,
      },
      {
        onSuccess: () => {
          setShowRemoveMemberModal(false);
          setSelectedMember(null);
          showToast("Üye ağdan çıkarıldı!");
        },
        onError: (error) => {
          showToast(error.message, "error");
        },
      }
    );
  };

  // Tab Navigation Component
  const TabNavigation = () => {
    const tabs = [
      { id: 0, title: "Üyeler", icon: "account-group" },
      { id: 1, title: "Bildirimler", icon: "bell" },
      { id: 2, title: "Özellikler", icon: "cog" },
    ];

    return (
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.activeTab]}
            onPress={() => setActiveTab(tab.id)}
          >
            <MaterialCommunityIcons
              name={tab.icon as any}
              size={20}
              color={activeTab === tab.id ? colors.primary : colors.light.textSecondary}
            />
            <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
              {tab.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };



  // Members Management Component
  const MembersManagement = () => {
    const renderMember = ({ item }: { item: any }) => {
      const isPremium = item.profiles?.premium_status === 'premium' || item.profiles?.premium_status === 'protector';
      const isProtector = item.profiles?.premium_status === 'protector';
      const memberStatus = getMemberStatus(item);
      
      // Tam ismi oluştur (isim + soyisim)
      const fullName = item.profiles?.name && item.profiles?.surname 
        ? `${item.profiles.name} ${item.profiles.surname}`
        : item.profiles?.name || item.profiles?.username || 'İsimsiz Üye';
      
      // Konum bilgisini oluştur
      const location = item.profiles?.city && item.profiles?.district 
        ? `${item.profiles.city}, ${item.profiles.district}`
        : item.profiles?.city || item.profiles?.district || '';
      
      return (
        <View style={[styles.memberCard, isPremium && styles.premiumMemberCard]}>
          <View style={styles.memberHeader}>
            <View style={[styles.memberAvatar, isPremium && styles.premiumAvatar]}>
              <MaterialCommunityIcons
                name="account"
                size={24}
                color={isPremium ? "#FFD700" : colors.primary}
              />
              {isPremium && (
                <View style={styles.premiumIndicator}>
                  <Ionicons name="star" size={12} color="#fff" />
                </View>
              )}
            </View>
            
            <View style={styles.memberInfo}>
              <View style={styles.memberNameRow}>
                <Text style={styles.memberName}>
                  {fullName}
                </Text>
                {isPremium && (
                  <View style={styles.premiumBadge}>
                    <Text style={styles.premiumBadgeText}>
                      {isProtector ? 'Protector' : 'Premium'}
                    </Text>
                  </View>
                )}
              </View>
              
              <View style={styles.memberDetails}>
                {/* Rol */}
                <View style={styles.memberRoleContainer}>
                  <View style={[
                    styles.memberBadge,
                    item.role === 'creator' ? styles.adminBadge : styles.memberBadge
                  ]}>
                    <Text style={[
                      styles.memberBadgeText,
                      item.role === 'creator' ? styles.adminBadgeText : styles.memberBadgeText
                    ]}>
                      {item.role === 'creator' ? 'Yönetici' : 'Üye'}
                    </Text>
                  </View>
                </View>
                
                {/* Premium Seviyesi */}
                {isPremium && (
                  <View style={styles.premiumLevelContainer}>
                    <Ionicons name="diamond" size={14} color="#FFD700" />
                    <Text style={styles.premiumLevelText}>
                      {isProtector ? 'Protector' : 'Premium'}
                    </Text>
                  </View>
                )}
                
                {/* Telefon Numarası */}
                {item.profiles?.phone && (
                  <View style={styles.phoneRow}>
                    <Ionicons name="call" size={14} color={colors.light.textSecondary} />
                    <Text style={styles.phoneText}>{item.profiles.phone}</Text>
                  </View>
                )}
                
                {/* Konum Bilgisi */}
                {location && (
                  <View style={styles.locationRow}>
                    <Ionicons name="location" size={14} color={colors.light.textSecondary} />
                    <Text style={styles.locationText}>{location}</Text>
                  </View>
                )}
              </View>
            </View>
            
            <View style={styles.memberStatus}>
              <View style={[styles.statusIndicator, { backgroundColor: memberStatus.color }]}>
                <MaterialCommunityIcons
                  name={memberStatus.icon as any}
                  size={16}
                  color="#fff"
                />
              </View>
              <Text style={[styles.statusText, { color: memberStatus.color }]}>
                {memberStatus.status}
              </Text>
            </View>
          </View>
          
          {isNetworkAdmin && item.role !== 'creator' && (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveMember(item)}
            >
              <Ionicons name="close-circle" size={24} color="#ff4757" />
            </TouchableOpacity>
          )}
        </View>
      );
    };

    return (
      <View style={styles.tabContent}>
        <View style={styles.membersHeader}>
          <Text style={styles.sectionTitle}>Ağ Üyeleri ({members?.length || 0})</Text>
          <TouchableOpacity style={styles.inviteButton} onPress={() => setShowInviteModal(true)}>
            <Ionicons name="person-add" size={20} color="#fff" />
            <Text style={styles.inviteButtonText}>Davet Et</Text>
          </TouchableOpacity>
        </View>
        
        {isLoadingMembers ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={members}
            renderItem={renderMember}
            keyExtractor={(item) => item.user_id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.membersList}
            style={styles.membersFlatList}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="account-group" size={48} color={colors.light.textSecondary} />
                <Text style={styles.emptyText}>Henüz üye bulunmuyor</Text>
                <Text style={styles.emptySubtext}>Ağa davet etmek için yukarıdaki "Davet Et" butonunu kullanın</Text>
              </View>
            )}
          />
        )}
      </View>
    );
  };

  // Notifications Management Component
  const NotificationsManagement = () => {
    const notificationOptions = [
      {
        id: 'danger',
        title: 'Tehlikedeyim Bildirimlerini Al',
        description: 'Üyelerin acil durum bildirimlerini alın',
        icon: 'alert-circle',
        color: '#ff4757'
      },
      {
        id: 'safe',
        title: 'Güvendeyim Bildirimlerini Al',
        description: 'Üyelerin güvenlik durumu bildirimlerini alın',
        icon: 'shield-check',
        color: '#2ed573'
      },
      {
        id: 'location',
        title: 'Güvenli Konuma Ulaşma Bilgisini Al',
        description: 'Üyelerin güvenli alanlara ulaştığında bildirim alın',
        icon: 'map-marker',
        color: '#3742fa'
      }
    ];

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Bildirim Ayarları</Text>
        <Text style={styles.sectionSubtitle}>
          Ağ üyelerinizden hangi bildirimleri almak istediğinizi seçin
        </Text>
        {notificationOptions.map((option) => (
          <TouchableOpacity key={option.id} style={styles.notificationOption}>
            <View style={[styles.notificationIcon, { backgroundColor: option.color + '20' }]}>
              <MaterialCommunityIcons
                name={option.icon as any}
                size={24}
                color={option.color}
              />
            </View>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>{option.title}</Text>
              <Text style={styles.notificationDescription}>{option.description}</Text>
            </View>
            <TouchableOpacity style={styles.toggleButton}>
              <Ionicons name="toggle" size={24} color={colors.primary} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  // Advanced Features Component
  const AdvancedFeatures = () => {
    const advancedFeatures = [
      {
        id: 'emergency-plan',
        title: 'Acil Durum Eylem Planı Oluştur',
        description: 'Ağınız için detaylı acil durum planı hazırlayın',
        icon: 'clipboard-text',
        color: '#ff6b6b'
      },
      {
        id: 'safe-zones',
        title: 'Güvenli Alanları Ekle',
        description: 'Bölgenizdeki güvenli alanları ağınıza ekleyin',
        icon: 'map-marker-radius',
        color: '#4ecdc4'
      },
      {
        id: 'smart-route',
        title: 'Akıllı Acil Durum Rotası Oluştur',
        description: 'En güvenli kaçış rotalarını planlayın',
        icon: 'map',
        color: '#45b7d1'
      }
    ];

    const handleFeaturePress = (featureId: string) => {
      switch (featureId) {
        case 'safe-zones':
          router.push(`/network/safe-zones?networkId=${id}`);
          break;
        case 'emergency-plan':
          router.push(`/network/emergency-plan?networkId=${id}`);
          break;
        case 'smart-route':
          router.push(`/network/smart-route?networkId=${id}`);
          break;
        default:
          break;
      }
    };

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Gelişmiş Özellikler</Text>
        <Text style={styles.sectionSubtitle}>
          Ağınızın güvenliğini artırmak için gelişmiş özellikleri kullanın
        </Text>
        {advancedFeatures.map((feature) => (
          <TouchableOpacity 
            key={feature.id} 
            style={styles.featureCard}
            onPress={() => handleFeaturePress(feature.id)}
          >
            <View style={[styles.featureIcon, { backgroundColor: feature.color + '20' }]}>
              <MaterialCommunityIcons
                name={feature.icon as any}
                size={28}
                color={feature.color}
              />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.light.textSecondary} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  // Render Tab Content
  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return <MembersManagement />;
      case 1:
        return <NotificationsManagement />;
      case 2:
        return <AdvancedFeatures />;
      default:
        return <MembersManagement />;
    }
  };

  if (isLoadingNetwork) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient
        colors={[getNetworkTypeAndColor(network).color + '10', getNetworkTypeAndColor(network).color + '05']}
        style={[styles.headerGradient, { marginTop: -insets.top }]}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={getNetworkTypeAndColor(network).color} />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <View style={styles.headerTitleRow}>
              <MaterialCommunityIcons
                name={getNetworkIcon(getNetworkTypeAndColor(network).type)}
                size={24}
                color={getNetworkTypeAndColor(network).color}
                style={styles.headerIcon}
              />
              <Text style={styles.headerTitle}>
                {formatNetworkName(network?.name || '')}
              </Text>
            </View>
            
            <Text style={styles.headerSubtitle}>
              {(() => {
                const networkType = getNetworkTypeAndColor(network).type;
                
                // Varsayılan ağlar için özel açıklamalar
                if (networkType === 'family') {
                  return 'Ailenizle güvenli iletişim kurun. Acil durumlarda birbirinizi bilgilendirin ve koordinasyon sağlayın.';
                } else if (networkType === 'friends') {
                  return 'Sevdiklerinizle güvenli iletişim kurun. Acil durumlarda birbirinizi destekleyin ve sosyal aktiviteleri koordine edin.';
                } else if (network?.description) {
                  // Diğer ağlar için veritabanından gelen açıklama
                  return network.description;
                } else {
                  return 'Ağ ile güvenli iletişim kurun';
                }
              })()}
            </Text>
            
            <View style={styles.headerInfo}>
              <View style={styles.headerInfoItem}>
                <View style={[styles.infoIconContainer, { backgroundColor: getNetworkTypeAndColor(network).color + '20' }]}>
                  <Ionicons name="people" size={16} color={getNetworkTypeAndColor(network).color} />
                </View>
                <Text style={styles.headerInfoText}>
                  {members?.length || 0} üye
                </Text>
              </View>
              

              
              <TouchableOpacity style={styles.copyCodeButton} onPress={copyNetworkCode}>
                <View style={[styles.infoIconContainer, { backgroundColor: getNetworkTypeAndColor(network).color + '20' }]}>
                  <Ionicons name="copy-outline" size={16} color={getNetworkTypeAndColor(network).color} />
                </View>
                <Text style={styles.copyCodeText}>
                  {network?.network_code}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {canModifyNetwork(network) && (
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowEditModal(true)}
              >
                <Ionicons name="create-outline" size={20} color={getNetworkTypeAndColor(network).color} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleDeleteNetwork}
              >
                <Ionicons name="trash-outline" size={20} color={getNetworkTypeAndColor(network).color} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* Tab Navigation */}
      <TabNavigation />

      {/* Tab Content */}
      <View style={styles.content}>
        {renderTabContent()}
      </View>

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
                placeholderTextColor="#999"
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

      {/* Remove Member Modal */}
      <Modal
        visible={showRemoveMemberModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRemoveMemberModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Üyeyi Çıkar</Text>
              <TouchableOpacity
                onPress={() => setShowRemoveMemberModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              {selectedMember?.profiles?.name || 'Bu üyeyi'} ağdan çıkarmak istediğinizden emin misiniz?
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowRemoveMemberModal(false)}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={confirmRemoveMember}
                disabled={removeMemberMutation.isPending}
              >
                {removeMemberMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.confirmButtonText}>Çıkar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Invite Modal */}
      <Modal
        visible={showInviteModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ağa Davet Et</Text>
              <TouchableOpacity
                onPress={() => setShowInviteModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              {formatNetworkName(network?.name || '')} ağına davet mesajını paylaşın
            </Text>

            <View style={styles.inviteOptions}>
              <TouchableOpacity
                style={styles.inviteOption}
                onPress={shareNetworkInvitation}
              >
                <Ionicons name="share-social" size={24} color={colors.primary} />
                <Text style={styles.inviteOptionText}>Paylaş</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.inviteOption}
                onPress={copyNetworkCode}
              >
                <Ionicons name="copy" size={24} color={colors.primary} />
                <Text style={styles.inviteOptionText}>Kodu Kopyala</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowInviteModal(false)}
              >
                <Text style={styles.cancelButtonText}>Kapat</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Toast Component */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    marginLeft: 10,
    marginTop: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.light.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.light.textSecondary,
    lineHeight: 24,
    fontWeight: "400",
  },
  headerActions: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tab: {
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    flex: 1,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 12,
    marginTop: 4,
    color: colors.light.textSecondary,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  networkInfoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  networkInfoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  networkInfoLeft: {
    flex: 1,
  },
  networkInfoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.light.textPrimary,
    marginBottom: 4,
  },
  networkInfoDescription: {
    fontSize: 14,
    color: colors.light.textSecondary,
  },
  networkInfoRight: {
    alignItems: "flex-end",
  },
  copyCodeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary + "10",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  networkCode: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
    letterSpacing: 1,
  },
  networkInfoDetails: {
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.light.textSecondary,
    minWidth: 80,
  },
  infoValue: {
    fontSize: 14,
    color: colors.light.textPrimary,
    fontWeight: "500",
  },
  membersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.light.textPrimary,
  },
  inviteButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  inviteButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.light.textSecondary,
    marginBottom: 20,
  },
  membersList: {
    paddingBottom: 20,
  },
  membersFlatList: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.light.textSecondary,
    marginTop: 12,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.light.textSecondary,
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  memberCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  premiumMemberCard: {
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  memberHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  premiumAvatar: {
    backgroundColor: "#FFD70020",
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  premiumIndicator: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#FFD700",
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.light.textPrimary,
  },
  premiumBadge: {
    backgroundColor: "#FFD70010",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  premiumBadgeText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#FFD700",
  },
  memberRole: {
    fontSize: 14,
    color: colors.light.textSecondary,
    marginBottom: 4,
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  phoneText: {
    fontSize: 13,
    color: colors.light.textSecondary,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: colors.light.textSecondary,
  },
  memberStatus: {
    alignItems: "center",
    gap: 4,
  },
  statusIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  removeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    padding: 4,
  },
  notificationOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.light.textPrimary,
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: 14,
    color: colors.light.textSecondary,
  },
  toggleButton: {
    padding: 8,
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.light.textPrimary,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: colors.light.textSecondary,
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
  inviteOptions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  inviteOption: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    backgroundColor: colors.primary + "10",
    borderRadius: 12,
    gap: 8,
  },
  inviteOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
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
  memberRoleContainer: {
    marginTop: 4,
  },
  memberDetails: {
    marginTop: 4,
    gap: 6,
  },
  premiumLevelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  premiumLevelText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFD700",
  },
  memberBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.primary + "20",
  },
  adminBadge: {
    backgroundColor: "#ff6b6b20",
  },
  memberBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  adminBadgeText: {
    color: "#ff6b6b",
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  headerIcon: {
    marginRight: 12,
  },
  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    flexWrap: "wrap",
    gap: 10,
  },
  headerInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 1,
  },
  headerInfoText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.light.textPrimary,
  },
  copyCodeText: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 4,
    color: colors.light.textPrimary,
  },
  infoIconContainer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 5,
  },
});
