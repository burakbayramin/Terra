import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome,
} from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "@/hooks/useLocation";
import { colors } from "@/constants/colors";
import { supabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface NetworkMember {
  id: string;
  name: string;
  phone: string;
  email?: string;
  is_online: boolean;
  last_seen: string;
  notification_preferences: {
    receive_emergency: boolean;
    receive_location: boolean;
    silent_mode: boolean;
  };
}

interface Network {
  id: string;
  name: string;
  owner_id: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  notification_settings: {
    emergency_alerts: boolean;
    location_sharing: boolean;
    sound_enabled: boolean;
    vibration_enabled: boolean;
    auto_location: boolean;
  };
  members: NetworkMember[];
}

export default function NetworkScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { getAndSaveLocation } = useLocation();
  const queryClient = useQueryClient();

  // State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null);
  const [networkName, setNetworkName] = useState("");
  const [networkDescription, setNetworkDescription] = useState("");
  const [newMemberPhone, setNewMemberPhone] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch user's networks
  const { data: networks, isLoading: isLoadingNetworks } = useQuery({
    queryKey: ["user-networks", user?.id],
    queryFn: async (): Promise<Network[]> => {
      if (!user?.id) return [];

      console.log('Fetching networks for user:', user.id);

      const { data, error } = await supabase
        .from("user_networks")
        .select(`
          id,
          name,
          owner_id,
          description,
          is_active,
          created_at,
          notification_settings,
          network_members (
            id,
            name,
            phone,
            email,
            is_online,
            last_seen,
            notification_preferences
          )
        `)
        .eq("owner_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error('Networks fetch error:', error);
        throw new Error(`Ağ bilgileri alınamadı: ${error.message}`);
      }

      console.log('Networks data fetched:', data);
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Create network mutation
  const createNetworkMutation = useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      console.log('Creating network with name:', name, 'user ID:', user?.id);
      
      // Check if user already has 3 networks
      if (networks && networks.length >= 3) {
        throw new Error("Maksimum 3 ağ oluşturabilirsiniz.");
      }
      
      const { data, error } = await supabase
        .from("user_networks")
        .insert({
          name,
          description,
          owner_id: user?.id,
          notification_settings: {
            emergency_alerts: true,
            location_sharing: true,
            sound_enabled: true,
            vibration_enabled: true,
            auto_location: true
          }
        })
        .select()
        .single();

      if (error) {
        console.error('Network creation error:', error);
        throw new Error(`Ağ oluşturulamadı: ${error.message}`);
      }
      
      console.log('Network created successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-networks", user?.id] });
      setShowCreateModal(false);
      setNetworkName("");
      Alert.alert("Başarılı", "Ağınız başarıyla oluşturuldu!");
    },
    onError: (error) => {
      Alert.alert("Hata", error.message);
    },
  });

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: async ({ networkId, name, phone }: { networkId: string; name: string; phone: string }) => {
      const { data, error } = await supabase
        .from("network_members")
        .insert({
          network_id: networkId,
          name,
          phone,
          notification_preferences: {
            receive_emergency: true,
            receive_location: true,
            silent_mode: false
          }
        })
        .select()
        .single();

      if (error) throw new Error("Üye eklenemedi.");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-networks", user?.id] });
      setShowAddMemberModal(false);
      setNewMemberName("");
      setNewMemberPhone("");
      Alert.alert("Başarılı", "Üye başarıyla eklendi!");
    },
    onError: (error) => {
      Alert.alert("Hata", error.message);
    },
  });

  // Send emergency notification
  const sendEmergencyNotification = async (network: Network) => {
    if (!network?.members || network.members.length === 0) {
      Alert.alert("Uyarı", "Bu ağda henüz üye bulunmuyor.");
      return;
    }

    Alert.alert(
      "Acil Durum Bildirimi",
      `${network.name} ağındaki tüm üyelere acil durum bildirimi göndermek istediğinizden emin misiniz?`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Gönder",
          style: "destructive",
          onPress: async () => {
            try {
              setIsLoading(true);
              
              // Get current location
              const location = await getAndSaveLocation();
              
              // Send notification to all network members
              const { error } = await supabase
                .from("emergency_notifications")
                .insert({
                  network_id: network.id,
                  sender_id: user?.id,
                  message: "Tehlikedeyim! Acil yardım gerekli.",
                  latitude: location?.latitude || 0,
                  longitude: location?.longitude || 0,
                  sent_at: new Date().toISOString(),
                });

              if (error) throw new Error("Bildirim gönderilemedi.");

              Alert.alert(
                "Bildirim Gönderildi",
                `${network.name} ağındaki tüm üyelere acil durum bildirimi gönderildi.`
              );
            } catch (error) {
              Alert.alert("Hata", "Bildirim gönderilemedi.");
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCreateNetwork = () => {
    if (!networkName.trim()) {
      Alert.alert("Uyarı", "Lütfen ağ adını girin.");
      return;
    }
    createNetworkMutation.mutate({
      name: networkName.trim(),
      description: networkDescription.trim() || undefined
    });
  };

  const handleAddMember = () => {
    if (!selectedNetwork) {
      Alert.alert("Uyarı", "Lütfen bir ağ seçin.");
      return;
    }
    if (!newMemberName.trim() || !newMemberPhone.trim()) {
      Alert.alert("Uyarı", "Lütfen tüm alanları doldurun.");
      return;
    }
    addMemberMutation.mutate({
      networkId: selectedNetwork.id,
      name: newMemberName.trim(),
      phone: newMemberPhone.trim(),
    });
  };

  const renderMember = ({ item }: { item: NetworkMember }) => (
    <View style={styles.memberCard}>
      <View style={styles.memberInfo}>
        <View style={styles.memberAvatar}>
          <Text style={styles.memberInitial}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.memberDetails}>
          <Text style={styles.memberName}>{item.name}</Text>
          <Text style={styles.memberPhone}>{item.phone}</Text>
        </View>
      </View>
      <View style={styles.memberStatus}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: item.is_online ? "#4CAF50" : "#9E9E9E" },
          ]}
        />
        <Text style={styles.statusText}>
          {item.is_online ? "Çevrimiçi" : "Çevrimdışı"}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Ağım</Text>
          <Text style={styles.headerSubtitle}>
            Acil durumlar için güvenlik ağınızı yönetin
          </Text>
        </View>

        {isLoadingNetworks ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Ağ bilgileri yükleniyor...</Text>
          </View>
        ) : networks && networks.length > 0 ? (
          // Has networks - Show list
          <View style={styles.networksContainer}>
            {/* Networks List */}
            <FlatList
              data={networks}
              keyExtractor={(item) => item.id}
              renderItem={({ item: network }) => (
                <View style={styles.networkCard}>
                  <View style={styles.networkHeader}>
                    <MaterialCommunityIcons
                      name="account-group"
                      size={32}
                      color={colors.primary}
                    />
                    <View style={styles.networkDetails}>
                      <Text style={styles.networkName}>{network.name}</Text>
                      {network.description && (
                        <Text style={styles.networkDescription}>{network.description}</Text>
                      )}
                      <Text style={styles.networkMembers}>
                        {network.members?.length || 0} üye
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.settingsButton}
                      onPress={() => {
                        setSelectedNetwork(network);
                        setShowSettingsModal(true);
                      }}
                    >
                      <Ionicons name="settings-outline" size={20} color={colors.primary} />
                    </TouchableOpacity>
                  </View>

                  {/* Emergency Button for this network */}
                  <TouchableOpacity
                    style={styles.emergencyButton}
                    onPress={() => sendEmergencyNotification(network)}
                    disabled={isLoading}
                  >
                    <LinearGradient
                      colors={["#e74c3c", "#c0392b"]}
                      style={styles.emergencyGradient}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <>
                          <Ionicons name="warning" size={20} color="#fff" />
                          <Text style={styles.emergencyButtonText}>
                            Acil Durum Bildirimi
                          </Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Members Preview */}
                  <View style={styles.membersPreview}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>Üyeler</Text>
                      <TouchableOpacity
                        style={styles.addMemberButton}
                        onPress={() => {
                          setSelectedNetwork(network);
                          setShowAddMemberModal(true);
                        }}
                      >
                        <Ionicons name="add" size={16} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                    {network.members && network.members.length > 0 ? (
                      <View style={styles.membersList}>
                        {network.members.slice(0, 3).map((member) => (
                          <View key={member.id} style={styles.memberPreview}>
                            <View style={styles.memberAvatar}>
                              <Text style={styles.memberInitial}>
                                {member.name.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                            <Text style={styles.memberName}>{member.name}</Text>
                          </View>
                        ))}
                        {network.members.length > 3 && (
                          <Text style={styles.moreMembersText}>
                            +{network.members.length - 3} daha
                          </Text>
                        )}
                      </View>
                    ) : (
                      <Text style={styles.noMembersText}>Henüz üye yok</Text>
                    )}
                  </View>
                </View>
              )}
              style={styles.networksList}
            />

            {/* Create New Network Button */}
            {networks.length < 3 && (
              <TouchableOpacity
                style={styles.createNewNetworkButton}
                onPress={() => setShowCreateModal(true)}
              >
                <LinearGradient
                  colors={[colors.gradientOne, colors.gradientTwo]}
                  style={styles.gradientButton}
                >
                  <MaterialCommunityIcons name="plus" size={24} color="#fff" />
                  <Text style={styles.createNetworkButtonText}>Yeni Ağ Oluştur</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          // No networks - Create one
          <View style={styles.noNetworkContainer}>
            <MaterialCommunityIcons
              name="account-group-outline"
              size={80}
              color={colors.primary}
              style={styles.noNetworkIcon}
            />
            <Text style={styles.noNetworkTitle}>Henüz Ağınız Yok</Text>
            <Text style={styles.noNetworkSubtitle}>
              Acil durumlar için güvenlik ağınızı oluşturun ve sevdiklerinizi ekleyin
            </Text>
            <TouchableOpacity
              style={styles.createNetworkButton}
              onPress={() => setShowCreateModal(true)}
            >
              <LinearGradient
                colors={[colors.gradientOne, colors.gradientTwo]}
                style={styles.gradientButton}
              >
                <MaterialCommunityIcons name="plus" size={24} color="#fff" />
                <Text style={styles.createNetworkButtonText}>Ağ Oluştur</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Create Network Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ağ Oluştur</Text>
              <TouchableOpacity
                onPress={() => setShowCreateModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Acil durumlar için güvenlik ağınızı oluşturun
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Ağ Adı (örn: Aile Ağım)"
              value={networkName}
              onChangeText={setNetworkName}
              maxLength={50}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Açıklama (opsiyonel)"
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
        </View>
      </Modal>

      {/* Add Member Modal */}
      <Modal
        visible={showAddMemberModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddMemberModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Üye Ekle</Text>
              <TouchableOpacity
                onPress={() => setShowAddMemberModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Ağınıza yeni üye ekleyin
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Ad Soyad"
              value={newMemberName}
              onChangeText={setNewMemberName}
              maxLength={50}
            />

            <TextInput
              style={styles.input}
              placeholder="Telefon Numarası"
              value={newMemberPhone}
              onChangeText={setNewMemberPhone}
              keyboardType="phone-pad"
              maxLength={15}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddMemberModal(false)}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleAddMember}
                disabled={addMemberMutation.isPending}
              >
                {addMemberMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.confirmButtonText}>Ekle</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.light.textPrimary,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.light.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.light.textSecondary,
  },
  noNetworkContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 50,
  },
  noNetworkIcon: {
    marginBottom: 24,
  },
  noNetworkTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.light.textPrimary,
    marginBottom: 12,
    textAlign: "center",
  },
  noNetworkSubtitle: {
    fontSize: 16,
    color: colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  createNetworkButton: {
    width: "100%",
  },
  gradientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  createNetworkButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  networksContainer: {
    paddingHorizontal: 20,
  },
  networksList: {
    marginBottom: 20,
  },
  networkCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  networkContainer: {
    paddingHorizontal: 20,
  },
  networkInfoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  networkHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  networkDetails: {
    marginLeft: 16,
    flex: 1,
  },
  networkName: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.light.textPrimary,
    marginBottom: 4,
  },
  networkMembers: {
    fontSize: 14,
    color: colors.light.textSecondary,
  },
  networkDescription: {
    fontSize: 12,
    color: colors.light.textSecondary,
    marginTop: 2,
    marginBottom: 4,
  },
  settingsButton: {
    padding: 8,
  },
  membersPreview: {
    marginTop: 16,
  },
  memberPreview: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  moreMembersText: {
    fontSize: 12,
    color: colors.primary,
    fontStyle: "italic",
  },
  createNewNetworkButton: {
    marginTop: 20,
  },
  emergencyButton: {
    marginBottom: 24,
  },
  emergencyGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  emergencyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  membersSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.light.textPrimary,
  },
  addMemberButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  membersList: {
    marginTop: 8,
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  memberInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  memberInitial: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.primary,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.light.textPrimary,
    marginBottom: 2,
  },
  memberPhone: {
    fontSize: 14,
    color: colors.light.textSecondary,
  },
  memberStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: colors.light.textSecondary,
  },
  noMembersContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  noMembersText: {
    fontSize: 16,
    color: colors.light.textSecondary,
    marginBottom: 16,
  },
  addFirstMemberButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.primary + "20",
  },
  addFirstMemberText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "500",
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
}); 