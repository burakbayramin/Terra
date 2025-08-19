import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  MaterialCommunityIcons,
  Ionicons,
} from "@expo/vector-icons";
import * as Location from "expo-location";
import { colors } from "@/constants/colors";
import Toast from "@/components/Toast";
import { useSafeZones, useCreateSafeZone, useUpdateSafeZone, useDeleteSafeZone, SafeZone } from "@/hooks/useSafeZones";
import PremiumFeatureGate from "@/components/PremiumFeatureGate";

export default function SafeZonesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { networkId } = useLocalSearchParams<{ networkId: string }>();

  // State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedZone, setSelectedZone] = useState<SafeZone | null>(null);
  const [zoneName, setZoneName] = useState("");
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Toast state
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'success' as 'success' | 'error' | 'info'
  });

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

  // Queries and mutations
  const { data: safeZones = [], isLoading, error, refetch } = useSafeZones(networkId || '');
  const createSafeZoneMutation = useCreateSafeZone();
  const updateSafeZoneMutation = useUpdateSafeZone();
  const deleteSafeZoneMutation = useDeleteSafeZone();

  // Get current location
  const getCurrentLocation = async () => {
    try {
      setIsGettingLocation(true);
      
      // Dummy location for testing - remove this when ready for production
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate delay
      
      setCurrentLocation({
        latitude: 41.0082 + (Math.random() - 0.5) * 0.01, // Random location around Istanbul
        longitude: 28.9784 + (Math.random() - 0.5) * 0.01,
      });

      showToast('Konum alındı!', 'success');

      // Uncomment this when ready for production
      /*
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showToast('Konum izni gerekli', 'error');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      showToast('Konum alındı!', 'success');
      */
    } catch (error) {
      console.error('Error getting location:', error);
      showToast('Konum alınamadı', 'error');
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Add safe zone
  const addSafeZone = async () => {
    if (!zoneName.trim()) {
      showToast('Lütfen güvenli alan adını girin', 'error');
      return;
    }

    if (!currentLocation) {
      showToast('Lütfen önce konum alın', 'error');
      return;
    }

    createSafeZoneMutation.mutate(
      {
        name: zoneName.trim(),
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        network_id: networkId || '',
      },
      {
        onSuccess: () => {
          showToast('Güvenli alan eklendi!', 'success');
          setShowAddModal(false);
          setZoneName("");
          setCurrentLocation(null);
        },
        onError: (error) => {
          showToast(error.message, 'error');
        },
      }
    );
  };

  // Edit safe zone
  const editSafeZone = async () => {
    if (!selectedZone || !zoneName.trim()) {
      showToast('Lütfen güvenli alan adını girin', 'error');
      return;
    }

    updateSafeZoneMutation.mutate(
      {
        id: selectedZone.id,
        name: zoneName.trim(),
      },
      {
        onSuccess: () => {
          showToast('Güvenli alan güncellendi!', 'success');
          setShowEditModal(false);
          setSelectedZone(null);
          setZoneName("");
        },
        onError: (error) => {
          showToast(error.message, 'error');
        },
      }
    );
  };

  // Delete safe zone
  const deleteSafeZone = async (zone: SafeZone) => {
    Alert.alert(
      'Güvenli Alanı Sil',
      `${zone.name} güvenli alanını silmek istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => {
            deleteSafeZoneMutation.mutate(zone.id, {
              onSuccess: () => {
                showToast('Güvenli alan silindi!', 'success');
              },
              onError: (error) => {
                showToast(error.message, 'error');
              },
            });
          },
        },
      ]
    );
  };

  // Open edit modal
  const openEditModal = (zone: SafeZone) => {
    setSelectedZone(zone);
    setZoneName(zone.name);
    setShowEditModal(true);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Render safe zone item
  const renderSafeZone = ({ item }: { item: SafeZone }) => (
    <View style={styles.zoneCard}>
      <View style={styles.zoneHeader}>
        <View style={styles.zoneIcon}>
          <MaterialCommunityIcons
            name="map-marker-radius"
            size={24}
            color={colors.primary}
          />
        </View>
        
        <View style={styles.zoneInfo}>
          <Text style={styles.zoneName}>{item.name}</Text>
          <Text style={styles.zoneCreator}>
            {item.creator_name} tarafından eklendi
          </Text>
          <Text style={styles.zoneDate}>
            {formatDate(item.created_at)}
          </Text>
        </View>
      </View>

      <View style={styles.zoneCoordinates}>
        <Text style={styles.coordinatesText}>
          {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}
        </Text>
      </View>

      <View style={styles.zoneActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => openEditModal(item)}
        >
          <Ionicons name="create-outline" size={20} color={colors.primary} />
          <Text style={styles.actionButtonText}>Düzenle</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => deleteSafeZone(item)}
        >
          <Ionicons name="trash-outline" size={20} color="#ff4757" />
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Sil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );



  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient
        colors={[colors.primary + '10', colors.primary + '05']}
        style={[styles.headerGradient, { marginTop: -insets.top }]}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Güvenli Alanlar</Text>
            <Text style={styles.headerSubtitle}>
              Ağınızdaki güvenli alanları yönetin
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.contentHeader}>
          <Text style={styles.sectionTitle}>
            Güvenli Alanlar ({safeZones.length})
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Ekle</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons
              name="alert-circle"
              size={48}
              color="#ff4757"
            />
            <Text style={styles.errorText}>Güvenli alanlar yüklenirken hata oluştu</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => router.replace(router.asPath)}
            >
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={safeZones}
            renderItem={renderSafeZone}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.zonesList}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons
                  name="map-marker-radius"
                  size={48}
                  color={colors.light.textSecondary}
                />
                <Text style={styles.emptyText}>Henüz güvenli alan bulunmuyor</Text>
                <Text style={styles.emptySubtext}>
                  İlk güvenli alanınızı eklemek için yukarıdaki "Ekle" butonunu kullanın
                </Text>
              </View>
            )}
          />
        )}
      </View>

      {/* Add Safe Zone Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Güvenli Alan Ekle</Text>
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Güvenli olduğunu düşündüğünüz alanı ekleyin
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Güvenli alan adını girin"
              placeholderTextColor="#999"
              value={zoneName}
              onChangeText={setZoneName}
              maxLength={50}
            />

            <View style={styles.locationSection}>
              <Text style={styles.locationLabel}>Konum</Text>
              
              {currentLocation ? (
                <View style={styles.locationInfo}>
                  <Ionicons name="checkmark-circle" size={20} color="#2ed573" />
                  <Text style={styles.locationText}>
                    Konum alındı: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.getLocationButton}
                  onPress={getCurrentLocation}
                  disabled={isGettingLocation}
                >
                  {isGettingLocation ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="location" size={20} color="#fff" />
                      <Text style={styles.getLocationButtonText}>Konum Al</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
                             <TouchableOpacity
                 style={styles.confirmButton}
                 onPress={addSafeZone}
                 disabled={!zoneName.trim() || !currentLocation || createSafeZoneMutation.isPending}
               >
                 {createSafeZoneMutation.isPending ? (
                   <ActivityIndicator color="#fff" size="small" />
                 ) : (
                   <Text style={styles.confirmButtonText}>Ekle</Text>
                 )}
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Safe Zone Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Güvenli Alanı Düzenle</Text>
              <TouchableOpacity
                onPress={() => setShowEditModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Güvenli alan adını güncelleyin
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Güvenli alan adını girin"
              placeholderTextColor="#999"
              value={zoneName}
              onChangeText={setZoneName}
              maxLength={50}
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
                 onPress={editSafeZone}
                 disabled={!zoneName.trim() || updateSafeZoneMutation.isPending}
               >
                 {updateSafeZoneMutation.isPending ? (
                   <ActivityIndicator color="#fff" size="small" />
                 ) : (
                   <Text style={styles.confirmButtonText}>Güncelle</Text>
                 )}
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
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 16,
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  contentHeader: {
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
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  zonesList: {
    paddingBottom: 20,
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ff4757",
    marginTop: 12,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  zoneCard: {
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
  zoneHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  zoneIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  zoneInfo: {
    flex: 1,
  },
  zoneName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.light.textPrimary,
    marginBottom: 4,
  },
  zoneCreator: {
    fontSize: 14,
    color: colors.light.textSecondary,
    marginBottom: 2,
  },
  zoneDate: {
    fontSize: 12,
    color: colors.light.textSecondary,
  },
  zoneCoordinates: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  coordinatesText: {
    fontSize: 14,
    color: colors.light.textSecondary,
    fontFamily: "monospace",
  },
  zoneActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.primary + "10",
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.primary,
  },
  deleteButton: {
    backgroundColor: "#ff475710",
  },
  deleteButtonText: {
    color: "#ff4757",
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
  locationSection: {
    marginBottom: 20,
  },
  locationLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.light.textPrimary,
    marginBottom: 8,
  },
  getLocationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  getLocationButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2ed57320",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  locationText: {
    fontSize: 14,
    color: colors.light.textPrimary,
    flex: 1,
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
}); 