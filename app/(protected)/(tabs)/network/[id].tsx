import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import {
  MaterialCommunityIcons,
  Ionicons,
} from "@expo/vector-icons";
import { colors } from "@/constants/colors";
import { useNetwork, useNetworkMembers } from "@/hooks/useNetwork";

export default function NetworkDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Queries
  const { data: network, isLoading: isLoadingNetwork } = useNetwork(id || '');
  const { data: members, isLoading: isLoadingMembers } = useNetworkMembers(id || '');

  if (isLoadingNetwork) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Ağ bilgileri yükleniyor...</Text>
      </View>
    );
  }

  if (!network) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <MaterialCommunityIcons
          name="account-group-outline"
          size={64}
          color={colors.light.textSecondary}
        />
        <Text style={styles.errorTitle}>Ağ Bulunamadı</Text>
        <Text style={styles.errorDescription}>
          Bu ağ artık mevcut değil veya erişim yetkiniz bulunmuyor.
        </Text>
      </View>
    );
  }

  const renderMember = ({ item }: { item: any }) => (
    <View style={styles.memberCard}>
      <View style={styles.memberInfo}>
        <View style={styles.memberAvatar}>
          <Text style={styles.memberInitial}>
            {(item.profiles?.name || 'U').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.memberDetails}>
          <Text style={styles.memberName}>
            {item.profiles?.name && item.profiles?.surname
              ? `${item.profiles.name} ${item.profiles.surname}`
              : 'İsimsiz Kullanıcı'}
          </Text>
          {item.profiles?.city && (
            <Text style={styles.memberLocation}>
              {item.profiles.city}
              {item.profiles.district && `, ${item.profiles.district}`}
            </Text>
          )}
          {item.profiles?.emergency_phone && (
            <Text style={styles.memberPhone}>{item.profiles.emergency_phone}</Text>
          )}
          <Text style={styles.memberJoinDate}>
            Katıldığı tarih: {new Date(item.joined_at).toLocaleDateString('tr-TR')}
          </Text>
        </View>
      </View>
      <View style={styles.memberStatus}>
        {item.role === 'creator' ? (
          <View style={styles.roleContainer}>
            <MaterialCommunityIcons name="crown" size={16} color="#FFD700" />
            <Text style={styles.roleText}>Yönetici</Text>
          </View>
        ) : (
          <View style={styles.roleContainer}>
            <MaterialCommunityIcons name="account" size={16} color={colors.primary} />
            <Text style={styles.roleText}>Üye</Text>
          </View>
        )}
        {item.profiles?.safety_score && (
          <Text style={styles.safetyScore}>
            Güvenlik Skoru: {item.profiles.safety_score}
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Network Info */}
        <View style={styles.networkHeader}>
          <View style={styles.networkIcon}>
            <MaterialCommunityIcons
              name="account-group"
              size={48}
              color={colors.primary}
            />
          </View>
          <Text style={styles.networkName}>{network.name}</Text>
          {network.description && (
            <Text style={styles.networkDescription}>{network.description}</Text>
          )}
          <View style={styles.networkMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="code" size={16} color={colors.primary} />
              <Text style={styles.metaText}>Kod: {network.network_code}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="people" size={16} color={colors.primary} />
              <Text style={styles.metaText}>
                {members?.length || 0} / {network.max_members} üye
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="calendar" size={16} color={colors.primary} />
              <Text style={styles.metaText}>
                Oluşturulma: {new Date(network.created_at).toLocaleDateString('tr-TR')}
              </Text>
            </View>
          </View>
        </View>

        {/* Members Section */}
        <View style={styles.membersSection}>
          <Text style={styles.sectionTitle}>Ağ Üyeleri</Text>
          
          {isLoadingMembers ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Üyeler yükleniyor...</Text>
            </View>
          ) : members && members.length > 0 ? (
            <FlatList
              data={members}
              keyExtractor={(item) => item.id}
              renderItem={renderMember}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.noMembersContainer}>
              <MaterialCommunityIcons
                name="account-plus-outline"
                size={48}
                color={colors.light.textSecondary}
              />
              <Text style={styles.noMembersTitle}>Henüz Üye Yok</Text>
              <Text style={styles.noMembersDescription}>
                Bu ağda henüz üye bulunmuyor. Ağ kodunu paylaşarak kişileri davet edebilirsiniz.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
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
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.light.textSecondary,
  },
  errorContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 50,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.light.textPrimary,
    marginTop: 20,
    marginBottom: 8,
  },
  errorDescription: {
    fontSize: 16,
    color: colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  networkHeader: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 30,
    backgroundColor: "#fff",
    marginBottom: 20,
  },
  networkIcon: {
    marginBottom: 16,
  },
  networkName: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.light.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  networkDescription: {
    fontSize: 16,
    color: colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  networkMeta: {
    width: "100%",
    gap: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    color: colors.light.textSecondary,
  },
  membersSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.light.textPrimary,
    marginBottom: 16,
  },
  memberCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  memberInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  memberInitial: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.primary,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.light.textPrimary,
    marginBottom: 4,
  },
  memberLocation: {
    fontSize: 14,
    color: colors.light.textSecondary,
    marginBottom: 2,
  },
  memberPhone: {
    fontSize: 14,
    color: colors.primary,
    marginBottom: 2,
  },
  memberJoinDate: {
    fontSize: 12,
    color: colors.light.textSecondary,
  },
  memberStatus: {
    alignItems: "flex-start",
    gap: 6,
  },
  roleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primary + "10",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.primary,
  },
  safetyScore: {
    fontSize: 12,
    color: colors.light.textSecondary,
  },
  noMembersContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  noMembersTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.light.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  noMembersDescription: {
    fontSize: 14,
    color: colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});
