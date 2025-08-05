import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  MaterialCommunityIcons,
  Ionicons,
} from "@expo/vector-icons";
import { colors } from "@/constants/colors";
import { 
  useSmartRoute,
  useRouteWaypoints,
  useCreateRouteWaypoint,
  useUpdateRouteWaypoint,
  useDeleteRouteWaypoint,
  useUpdateSmartRoute,
  useDeleteSmartRoute,
  useUserRouteProgress,
  useUpdateRouteProgress
} from "@/hooks/useSmartRoute";
import { supabase } from "@/lib/supabase";
import Toast from "@/components/Toast";

export default function RouteDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id, networkId } = useLocalSearchParams<{ id: string; networkId: string }>();

  // Fallback insets değerleri
  const safeInsets = {
    top: insets?.top || 0,
    bottom: insets?.bottom || 0,
    left: insets?.left || 0,
    right: insets?.right || 0,
  };

  // State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isNetworkAdmin, setIsNetworkAdmin] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddWaypointModal, setShowAddWaypointModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [waypointName, setWaypointName] = useState("");
  const [waypointDescription, setWaypointDescription] = useState("");
  const [waypointType, setWaypointType] = useState<'gathering_point' | 'safe_zone' | 'checkpoint'>('gathering_point');
  const [waypointLatitude, setWaypointLatitude] = useState("");
  const [waypointLongitude, setWaypointLongitude] = useState("");

  // Toast state
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'success' as 'success' | 'error' | 'info'
  });

  // Queries
  const { data: route, isLoading: isLoadingRoute } = useSmartRoute(id || '');
  const { data: waypoints, isLoading: isLoadingWaypoints } = useRouteWaypoints(id || '');
  const { data: userProgress } = useUserRouteProgress(networkId || '');

  // Mutations
  const updateRouteMutation = useUpdateSmartRoute();
  const deleteRouteMutation = useDeleteSmartRoute();
  const createWaypointMutation = useCreateRouteWaypoint();
  const updateWaypointMutation = useUpdateRouteWaypoint();
  const deleteWaypointMutation = useDeleteRouteWaypoint();
  const updateProgressMutation = useUpdateRouteProgress();

  // Get current user and check if admin
  React.useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        // Check if user is network admin (simplified check)
        setIsNetworkAdmin(true); // TODO: Implement proper admin check
      }
    };
    getCurrentUser();
  }, []);

  // Set edit values when route loads
  React.useEffect(() => {
    if (route) {
      setEditName(route.name);
      setEditDescription(route.description || '');
    }
  }, [route]);

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

  // Get route type info
  const getRouteTypeInfo = (type: string) => {
    switch (type) {
      case 'family':
        return { name: 'Aile Rotası', icon: 'account-group', color: '#4ECDC4' };
      case 'disabled_friendly':
        return { name: 'Engelli Dostu', icon: 'wheelchair-accessibility', color: '#FF6B6B' };
      case 'elderly_friendly':
        return { name: 'Yaşlı Dostu', icon: 'account-heart', color: '#45B7D1' };
      case 'custom':
        return { name: 'Özel Rota', icon: 'map-marker-path', color: '#96CEB4' };
      default:
        return { name: 'Varsayılan Rota', icon: 'map', color: '#667EEA' };
    }
  };

  // Get waypoint type info
  const getWaypointTypeInfo = (type: string) => {
    switch (type) {
      case 'gathering_point':
        return { name: 'Toplanma Noktası', icon: 'account-group', color: '#4ECDC4' };
      case 'safe_zone':
        return { name: 'Güvenli Alan', icon: 'shield-check', color: '#45B7D1' };
      case 'checkpoint':
        return { name: 'Kontrol Noktası', icon: 'map-marker-check', color: '#FF6B6B' };
      default:
        return { name: 'Nokta', icon: 'map-marker', color: '#999' };
    }
  };

  // Update route
  const handleUpdateRoute = async () => {
    if (!editName.trim() || !id) {
      showToast('Lütfen rota adını girin', 'error');
      return;
    }

    try {
      await updateRouteMutation.mutateAsync({
        id,
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      });

      setShowEditModal(false);
      showToast('Rota başarıyla güncellendi', 'success');
    } catch (error) {
      showToast('Rota güncellenirken bir hata oluştu', 'error');
    }
  };

  // Delete route
  const handleDeleteRoute = async () => {
    if (!id) return;

    try {
      await deleteRouteMutation.mutateAsync(id);
      showToast('Rota başarıyla silindi', 'success');
      router.back();
    } catch (error) {
      showToast('Rota silinirken bir hata oluştu', 'error');
    }
  };

  // Add waypoint
  const handleAddWaypoint = async () => {
    if (!waypointName.trim() || !waypointLatitude || !waypointLongitude || !id) {
      showToast('Lütfen tüm alanları doldurun', 'error');
      return;
    }

    const lat = parseFloat(waypointLatitude);
    const lng = parseFloat(waypointLongitude);

    if (isNaN(lat) || isNaN(lng)) {
      showToast('Geçerli koordinatlar girin', 'error');
      return;
    }

    try {
      await createWaypointMutation.mutateAsync({
        route_id: id,
        waypoint_type: waypointType,
        name: waypointName.trim(),
        description: waypointDescription.trim() || undefined,
        latitude: lat,
        longitude: lng,
        order_index: (waypoints?.length || 0) + 1,
      });

      setShowAddWaypointModal(false);
      setWaypointName("");
      setWaypointDescription("");
      setWaypointType('gathering_point');
      setWaypointLatitude("");
      setWaypointLongitude("");
      showToast('Nokta başarıyla eklendi', 'success');
    } catch (error) {
      showToast('Nokta eklenirken bir hata oluştu', 'error');
    }
  };

  // Start route navigation
  const handleStartNavigation = async () => {
    if (!networkId || !id) return;

    try {
      await updateProgressMutation.mutateAsync({
        networkId,
        routeId: id,
        status: 'in_progress',
      });

      showToast('Rota navigasyonu başlatıldı', 'success');
      // TODO: Navigate to map view with route
    } catch (error) {
      showToast('Navigasyon başlatılırken bir hata oluştu', 'error');
    }
  };

  if (isLoadingRoute || isLoadingWaypoints) {
    return (
      <View style={[styles.container, { paddingTop: safeInsets.top + 20 }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!route) {
    return (
      <View style={[styles.container, { paddingTop: safeInsets.top + 20 }]}>
        <Text style={styles.errorText}>Rota bulunamadı</Text>
      </View>
    );
  }

  const typeInfo = getRouteTypeInfo(route.route_type);

  return (
    <View style={styles.container}>
      {/* Header */}
              <LinearGradient
          colors={[typeInfo.color + '10', typeInfo.color + '05']}
          style={[styles.headerGradient, { paddingTop: safeInsets.top + 20 }]}
        >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={typeInfo.color} />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <View style={styles.headerTitleRow}>
              <MaterialCommunityIcons
                name={typeInfo.icon as any}
                size={24}
                color={typeInfo.color}
                style={styles.headerIcon}
              />
              <Text style={styles.headerTitle}>{route.name}</Text>
            </View>
            
            <Text style={styles.headerSubtitle}>
              {route.description || `${typeInfo.name} - ${waypoints?.length || 0} nokta`}
            </Text>
          </View>
          
          {isNetworkAdmin && (
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowEditModal(true)}
              >
                <Ionicons name="create-outline" size={20} color={typeInfo.color} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowDeleteModal(true)}
              >
                <Ionicons name="trash-outline" size={20} color={typeInfo.color} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </LinearGradient>

      <ScrollView 
        style={[styles.content, { paddingBottom: safeInsets.bottom }]} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Route Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Rota Bilgileri</Text>
          </View>
          
          <View style={styles.routeInfoCard}>
            <View style={styles.routeInfoRow}>
              <MaterialCommunityIcons name="map-marker-path" size={20} color={typeInfo.color} />
              <Text style={styles.routeInfoLabel}>Rota Türü:</Text>
              <Text style={styles.routeInfoValue}>{typeInfo.name}</Text>
            </View>
            
            <View style={styles.routeInfoRow}>
              <MaterialCommunityIcons name="map-marker-multiple" size={20} color={typeInfo.color} />
              <Text style={styles.routeInfoLabel}>Nokta Sayısı:</Text>
              <Text style={styles.routeInfoValue}>{waypoints?.length || 0}</Text>
            </View>
            
            <View style={styles.routeInfoRow}>
              <MaterialCommunityIcons name="calendar" size={20} color={typeInfo.color} />
              <Text style={styles.routeInfoLabel}>Oluşturulma:</Text>
              <Text style={styles.routeInfoValue}>
                {new Date(route.created_at).toLocaleDateString('tr-TR')}
              </Text>
            </View>
          </View>
        </View>

        {/* Waypoints */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Rota Noktaları</Text>
            {isNetworkAdmin && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowAddWaypointModal(true)}
              >
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            )}
          </View>

          {waypoints && waypoints.length > 0 ? (
            waypoints.map((waypoint, index) => {
              const waypointTypeInfo = getWaypointTypeInfo(waypoint.waypoint_type);
              
              return (
                <View key={waypoint.id} style={styles.waypointCard}>
                  <View style={styles.waypointHeader}>
                    <View style={[styles.waypointIcon, { backgroundColor: waypointTypeInfo.color + '20' }]}>
                      <MaterialCommunityIcons
                        name={waypointTypeInfo.icon as any}
                        size={20}
                        color={waypointTypeInfo.color}
                      />
                    </View>
                    <View style={styles.waypointInfo}>
                      <Text style={styles.waypointName}>{waypoint.name}</Text>
                      <Text style={styles.waypointType}>{waypointTypeInfo.name}</Text>
                      {waypoint.description && (
                        <Text style={styles.waypointDescription}>{waypoint.description}</Text>
                      )}
                    </View>
                    <View style={styles.waypointOrder}>
                      <Text style={styles.waypointOrderText}>{index + 1}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.waypointDetails}>
                    <Text style={styles.waypointCoordinates}>
                      {waypoint.latitude.toFixed(6)}, {waypoint.longitude.toFixed(6)}
                    </Text>
                    {waypoint.estimated_time_minutes && (
                      <Text style={styles.waypointTime}>
                        ~{waypoint.estimated_time_minutes} dk
                      </Text>
                    )}
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyWaypointsCard}>
              <MaterialCommunityIcons name="map-marker-off" size={48} color="#ccc" />
              <Text style={styles.emptyWaypointsTitle}>Henüz Nokta Eklenmemiş</Text>
              <Text style={styles.emptyWaypointsDescription}>
                Rotaya nokta ekleyerek acil durum planınızı tamamlayın
              </Text>
            </View>
          )}
        </View>

        {/* Navigation Button */}
        {userProgress?.status === 'not_started' && (
          <TouchableOpacity
            style={styles.navigationButton}
            onPress={handleStartNavigation}
          >
            <LinearGradient
              colors={[typeInfo.color, typeInfo.color + 'CC']}
              style={styles.navigationButtonGradient}
            >
              <MaterialCommunityIcons name="navigation" size={24} color="#fff" />
              <Text style={styles.navigationButtonText}>Rotayı Başlat</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Progress Status */}
        {userProgress && userProgress.status !== 'not_started' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>İlerleme Durumu</Text>
            </View>
            
            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <MaterialCommunityIcons name="progress-clock" size={24} color={typeInfo.color} />
                <Text style={styles.progressStatus}>
                  {userProgress.status === 'in_progress' && 'Yolda'}
                  {userProgress.status === 'at_gathering_point' && 'Toplanma Noktasında'}
                  {userProgress.status === 'at_safe_zone' && 'Güvenli Alanda'}
                  {userProgress.status === 'completed' && 'Tamamlandı'}
                </Text>
              </View>
              
              {userProgress.current_waypoint && (
                <Text style={styles.progressWaypoint}>
                  Mevcut Nokta: {userProgress.current_waypoint.name}
                </Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Edit Route Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={[styles.modalOverlay, { 
          paddingTop: safeInsets.top, 
          paddingBottom: safeInsets.bottom 
        }]}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rotayı Düzenle</Text>
              <TouchableOpacity
                onPress={() => setShowEditModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Rota adı"
              placeholderTextColor="#999"
              value={editName}
              onChangeText={setEditName}
              maxLength={50}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Rota açıklaması (opsiyonel)"
              placeholderTextColor="#999"
              value={editDescription}
              onChangeText={setEditDescription}
              multiline
              numberOfLines={3}
              maxLength={200}
            />

            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleUpdateRoute}
              disabled={updateRouteMutation.isPending}
            >
              {updateRouteMutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.modalButtonText}>Güncelle</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Waypoint Modal */}
      <Modal
        visible={showAddWaypointModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddWaypointModal(false)}
      >
        <View style={[styles.modalOverlay, { 
          paddingTop: safeInsets.top, 
          paddingBottom: safeInsets.bottom 
        }]}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nokta Ekle</Text>
              <TouchableOpacity
                onPress={() => setShowAddWaypointModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Nokta adı"
              placeholderTextColor="#999"
              value={waypointName}
              onChangeText={setWaypointName}
              maxLength={50}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Açıklama (opsiyonel)"
              placeholderTextColor="#999"
              value={waypointDescription}
              onChangeText={setWaypointDescription}
              multiline
              numberOfLines={2}
              maxLength={100}
            />

            <Text style={styles.modalSubtitle}>Nokta Türü</Text>
            <View style={styles.waypointTypeOptions}>
              {[
                { type: 'gathering_point', name: 'Toplanma Noktası', icon: 'account-group' },
                { type: 'safe_zone', name: 'Güvenli Alan', icon: 'shield-check' },
                { type: 'checkpoint', name: 'Kontrol Noktası', icon: 'map-marker-check' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.type}
                  style={[
                    styles.waypointTypeOption,
                    waypointType === option.type && styles.waypointTypeOptionSelected
                  ]}
                  onPress={() => setWaypointType(option.type as any)}
                >
                  <MaterialCommunityIcons
                    name={option.icon as any}
                    size={20}
                    color={waypointType === option.type ? '#fff' : '#666'}
                  />
                  <Text style={[
                    styles.waypointTypeOptionText,
                    waypointType === option.type && styles.waypointTypeOptionTextSelected
                  ]}>
                    {option.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.coordinatesContainer}>
              <TextInput
                style={[styles.input, styles.coordinateInput]}
                placeholder="Enlem"
                placeholderTextColor="#999"
                value={waypointLatitude}
                onChangeText={setWaypointLatitude}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, styles.coordinateInput]}
                placeholder="Boylam"
                placeholderTextColor="#999"
                value={waypointLongitude}
                onChangeText={setWaypointLongitude}
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleAddWaypoint}
              disabled={createWaypointMutation.isPending}
            >
              {createWaypointMutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.modalButtonText}>Ekle</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={[styles.modalOverlay, { 
          paddingTop: safeInsets.top, 
          paddingBottom: safeInsets.bottom 
        }]}>
          <View style={styles.deleteModalContent}>
            <MaterialCommunityIcons name="alert-circle" size={48} color="#FF6B6B" />
            <Text style={styles.deleteModalTitle}>Rotayı Sil</Text>
            <Text style={styles.deleteModalDescription}>
              Bu rotayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </Text>
            
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={styles.deleteModalButtonCancel}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.deleteModalButtonCancelText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteModalButtonDelete}
                onPress={handleDeleteRoute}
                disabled={deleteRouteMutation.isPending}
              >
                {deleteRouteMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.deleteModalButtonDeleteText}>Sil</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
    backgroundColor: '#f8f9fa',
    paddingTop: 0,
  },
  headerGradient: {
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  headerContent: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  headerIcon: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginLeft: 15,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#45B7D1',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  routeInfoLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    marginRight: 10,
    minWidth: 80,
  },
  routeInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  waypointCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  waypointHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  waypointIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  waypointInfo: {
    flex: 1,
  },
  waypointName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  waypointType: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  waypointDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  waypointOrder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waypointOrderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  waypointDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  waypointCoordinates: {
    fontSize: 12,
    color: '#999',
  },
  waypointTime: {
    fontSize: 12,
    color: '#999',
  },
  emptyWaypointsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyWaypointsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyWaypointsDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  navigationButton: {
    marginBottom: 30,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  navigationButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  navigationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressStatus: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },
  progressWaypoint: {
    fontSize: 14,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  waypointTypeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  waypointTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
    marginBottom: 10,
  },
  waypointTypeOptionSelected: {
    backgroundColor: '#45B7D1',
  },
  waypointTypeOptionText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  waypointTypeOptionTextSelected: {
    color: '#fff',
  },
  coordinatesContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  coordinateInput: {
    flex: 1,
    marginRight: 10,
  },
  modalButton: {
    backgroundColor: '#45B7D1',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    maxWidth: 300,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  deleteModalDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    width: '100%',
  },
  deleteModalButtonCancel: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
    alignItems: 'center',
  },
  deleteModalButtonCancelText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteModalButtonDelete: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
  },
  deleteModalButtonDeleteText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 50,
  },
}); 