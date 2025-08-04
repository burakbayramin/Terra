import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "@/constants/colors";
import { useCreateNetwork, useJoinNetwork, useMyNetworks } from "@/hooks/useNetwork";

export default function NetworkScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [networkName, setNetworkName] = useState("");
  const [networkDescription, setNetworkDescription] = useState("");
  const [networkCode, setNetworkCode] = useState("");

  // Queries
  const { data: myNetworks, isLoading: isLoadingNetworks } = useMyNetworks();

  // Mutations
  const createNetworkMutation = useCreateNetwork();
  const joinNetworkMutation = useJoinNetwork();

  // Filter networks by role
  const createdNetworks = myNetworks?.filter(memberData => memberData.role === 'creator') || [];
  const joinedNetworks = myNetworks?.filter(memberData => memberData.role === 'member') || [];

  // Navigate to network detail
  const navigateToNetworkDetail = (networkId: string) => {
    router.push(`/(protected)/(tabs)/network/${networkId}`);
  };

  const handleCreateNetwork = () => {
    if (!networkName.trim()) {
      Alert.alert("Uyarı", "Lütfen ağ adını girin.");
      return;
    }

    createNetworkMutation.mutate(
      {
        name: networkName.trim(),
        description: networkDescription.trim() || undefined,
        max_members: 50,
      },
      {
        onSuccess: () => {
          setShowCreateModal(false);
          setNetworkName("");
          setNetworkDescription("");
          Alert.alert("Başarılı", "Ağınız başarıyla oluşturuldu!");
        },
        onError: (error) => {
          Alert.alert("Hata", error.message);
        },
      }
    );
  };

  const handleJoinNetwork = () => {
    if (!networkCode.trim()) {
      Alert.alert("Uyarı", "Lütfen ağ kodunu girin.");
      return;
    }

    joinNetworkMutation.mutate(networkCode.trim(), {
      onSuccess: () => {
        setShowJoinModal(false);
        setNetworkCode("");
        Alert.alert("Başarılı", "Ağa başarıyla katıldınız!");
      },
      onError: (error) => {
        Alert.alert("Hata", error.message);
      },
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Ağ Yönetimi</Text>
          <Text style={styles.headerSubtitle}>
            Yeni bir ağ oluşturun veya mevcut bir ağa katılın
          </Text>
        </View>

        {/* Main Options */}
        <View style={styles.optionsContainer}>
          {/* Create Network Option */}
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => setShowCreateModal(true)}
          >
            <View style={styles.optionIcon}>
              <MaterialCommunityIcons
                name="account-group-outline"
                size={48}
                color={colors.primary}
              />
            </View>
            <Text style={styles.optionTitle}>Ağ Oluştur</Text>
            <Text style={styles.optionDescription}>
              Yeni bir güvenlik ağı oluşturun ve arkadaşlarınızı davet edin
            </Text>
            <View style={styles.optionButton}>
              <LinearGradient
                colors={[colors.gradientOne, colors.gradientTwo]}
                style={styles.gradientButton}
              >
                <Text style={styles.optionButtonText}>Oluştur</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </LinearGradient>
            </View>
          </TouchableOpacity>

          {/* Join Network Option */}
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => setShowJoinModal(true)}
          >
            <View style={styles.optionIcon}>
              <MaterialCommunityIcons
                name="account-plus-outline"
                size={48}
                color={colors.primary}
              />
            </View>
            <Text style={styles.optionTitle}>Ağa Katıl</Text>
            <Text style={styles.optionDescription}>
              Mevcut bir ağın kodunu girerek o ağa katılın
            </Text>
            <View style={styles.optionButton}>
              <LinearGradient
                colors={[colors.gradientOne, colors.gradientTwo]}
                style={styles.gradientButton}
              >
                <Text style={styles.optionButtonText}>Katıl</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </LinearGradient>
            </View>
          </TouchableOpacity>
        </View>

        {/* Loading State */}
        {isLoadingNetworks && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Ağlar yükleniyor...</Text>
          </View>
        )}

        {/* My Created Networks */}
        {!isLoadingNetworks && createdNetworks.length > 0 && (
          <View style={styles.networkSection}>
            <Text style={styles.sectionTitle}>Oluşturduğum Ağlar</Text>
            {createdNetworks.map((memberData) => (
              <TouchableOpacity
                key={memberData.id}
                style={styles.networkItem}
                onPress={() => navigateToNetworkDetail(memberData.networks?.id || '')}
              >
                <View style={styles.networkInfo}>
                  <MaterialCommunityIcons
                    name="crown"
                    size={24}
                    color="#FFD700"
                  />
                  <View style={styles.networkDetails}>
                    <Text style={styles.networkName}>{memberData.networks?.name}</Text>
                    {memberData.networks?.description && (
                      <Text style={styles.networkDescription}>
                        {memberData.networks.description}
                      </Text>
                    )}
                    <Text style={styles.networkCode}>
                      Kod: {memberData.networks?.network_code}
                    </Text>
                  </View>
                </View>
                <View style={styles.networkStatus}>
                  <Text style={styles.creatorBadge}>Yönetici</Text>
                  <Ionicons name="chevron-forward" size={20} color={colors.light.textSecondary} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* My Joined Networks */}
        {!isLoadingNetworks && joinedNetworks.length > 0 && (
          <View style={styles.networkSection}>
            <Text style={styles.sectionTitle}>Katıldığım Ağlar</Text>
            {joinedNetworks.map((memberData) => (
              <TouchableOpacity
                key={memberData.id}
                style={styles.networkItem}
                onPress={() => navigateToNetworkDetail(memberData.networks?.id || '')}
              >
                <View style={styles.networkInfo}>
                  <MaterialCommunityIcons
                    name="account-group"
                    size={24}
                    color={colors.primary}
                  />
                  <View style={styles.networkDetails}>
                    <Text style={styles.networkName}>{memberData.networks?.name}</Text>
                    {memberData.networks?.description && (
                      <Text style={styles.networkDescription}>
                        {memberData.networks.description}
                      </Text>
                    )}
                    <Text style={styles.joinDate}>
                      Katıldığınız tarih: {new Date(memberData.joined_at).toLocaleDateString('tr-TR')}
                    </Text>
                  </View>
                </View>
                <View style={styles.networkStatus}>
                  <Text style={styles.memberBadge}>Üye</Text>
                  <Ionicons name="chevron-forward" size={20} color={colors.light.textSecondary} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* No Networks Message */}
        {!isLoadingNetworks && createdNetworks.length === 0 && joinedNetworks.length === 0 && (
          <View style={styles.noNetworksContainer}>
            <MaterialCommunityIcons
              name="account-group-outline"
              size={64}
              color={colors.light.textSecondary}
            />
            <Text style={styles.noNetworksTitle}>Henüz Ağınız Yok</Text>
            <Text style={styles.noNetworksDescription}>
              Yukarıdaki seçenekleri kullanarak yeni bir ağ oluşturun veya mevcut bir ağa katılın
            </Text>
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
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
                placeholder="Ağ Kodu"
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
  optionsContainer: {
    paddingHorizontal: 20,
    gap: 20,
  },
  optionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  optionIcon: {
    marginBottom: 16,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.light.textPrimary,
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  optionButton: {
    width: "100%",
  },
  gradientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  optionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
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
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.light.textPrimary,
    marginBottom: 16,
  },
  networkItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  networkInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
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
  },
  networkDescription: {
    fontSize: 14,
    color: colors.light.textSecondary,
    marginBottom: 4,
  },
  networkCode: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "500",
  },
  joinDate: {
    fontSize: 12,
    color: colors.light.textSecondary,
  },
  networkStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  memberBadge: {
    backgroundColor: colors.primary + "20",
    color: colors.primary,
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
});