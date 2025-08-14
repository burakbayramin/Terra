// NewsDetailScreen.tsx - Mevcut dosyanızı bu şekilde güncelleyin
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { formatDistanceToNowStrict, isToday } from "date-fns";
import { tr } from "date-fns/locale";
import { colors } from "@/constants/colors";
import { useNewsById } from "@/hooks/useNews"; // YENİ IMPORT
import React from "react";

export default function NewsDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // ESKİ useState'leri silin, yerine bu hook'u kullanın
  const {
    data: news,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useNewsById(id!);

  // Loading durumu
  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Haber Detayı</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Haber yükleniyor...</Text>
        </View>
      </View>
    );
  }

  // Error durumu
  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Haber Detayı</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
          <Text style={styles.errorText}>
            {error instanceof Error ? error.message : "Bir hata oluştu"}
          </Text>
          <Pressable style={styles.retryButton} onPress={() => refetch()}>
            <Ionicons name="refresh" size={20} color="#ffffff" />
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Haber bulunamadı durumu
  if (!news) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Haber Detayı</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="newspaper-outline" size={64} color={colors.light.textSecondary} />
          <Text style={styles.errorText}>Haber bulunamadı</Text>
          <Pressable style={styles.retryButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#ffffff" />
            <Text style={styles.retryButtonText}>Geri Dön</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const isNewsToday = isToday(new Date(news.created_at));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.light.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Haber Detayı</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
        // YENİ: Pull to refresh
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={() => refetch()}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Category and Time Header */}
        <View style={styles.headerRow}>
          <View style={styles.categoryRow}>
            {(Array.isArray(news.category)
              ? news.category
              : typeof news.category === "string"
              ? (news.category as string)
                  .replace(/[{}]/g, "")
                  .split(",")
                  .map((cat: string) => cat.trim().replace(/"/g, ""))
              : []
            ).slice(0, 3).map((cat, idx) => (
              <View key={idx} style={styles.chip}>
                <Text style={styles.chipText}>{cat}</Text>
              </View>
            ))}
            {isNewsToday && (
              <View style={styles.hotChip}>
                <Ionicons name="flame" size={12} color="#ffffff" />
                <Text style={styles.hotChipText}>Yeni</Text>
              </View>
            )}
          </View>
          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={14} color={colors.light.textSecondary} />
            <Text style={styles.timeText}>
              {formatDistanceToNowStrict(new Date(news.created_at), {
                locale: tr,
                addSuffix: true,
              })}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>{news.title}</Text>

        {/* Cover Image */}
        {!!news.image && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: news.image }}
              style={styles.image}
              resizeMode="cover"
              onError={(error) => console.log('Image loading error:', error)}
            />
            <View style={styles.imageOverlay} />
          </View>
        )}

        {/* Content */}
        <View style={styles.contentBox}>
          <Text style={styles.contentText}>{news.content}</Text>
        </View>

        {/* Source and Earthquake Info */}
        <View style={styles.footerSection}>
          <View style={styles.sourceContainer}>
            <Ionicons name="newspaper-outline" size={16} color={colors.primary} />
            <Text style={styles.sourceText}>Kaynak: {news.source}</Text>
          </View>
          
          {news.earthquake_id && (
            <Pressable
              style={styles.earthquakeButton}
              onPress={() => router.push("/earthquakes")}
            >
              <Ionicons
                name="information-circle-outline"
                size={20}
                color="#ffffff"
              />
              <Text style={styles.earthquakeButtonText}>
                Deprem Bilgisine Git
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// Styles aynı kalıyor - hiçbir şey değiştirmeyin
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.surface,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.light.surface,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "NotoSans-Bold",
    color: colors.light.textPrimary,
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    color: colors.light.textSecondary,
    fontFamily: "NotoSans-Medium",
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    fontFamily: "NotoSans-Medium",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "NotoSans-Medium",
    fontWeight: "600",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  categoryRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
  },
  chip: {
    backgroundColor: colors.primaryLight,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  hotChip: {
    backgroundColor: colors.error,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  chipText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
    fontFamily: "NotoSans-Medium",
    letterSpacing: 0.2,
  },
  hotChipText: {
    fontSize: 12,
    color: "#ffffff",
    fontWeight: "600",
    fontFamily: "NotoSans-Medium",
    letterSpacing: 0.2,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: colors.light.textSecondary,
    fontFamily: "NotoSans-Regular",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.light.textPrimary,
    marginHorizontal: 20,
    marginBottom: 20,
    lineHeight: 30,
    letterSpacing: 0.1,
    fontFamily: "NotoSans-Bold",
  },
  imageContainer: {
    position: "relative",
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    backgroundColor: colors.light.surface,
    minHeight: 250,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: 250,
    borderRadius: 20,
    backgroundColor: colors.light.surface,
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  contentBox: {
    marginHorizontal: 20,
    backgroundColor: colors.light.surface,
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  contentText: {
    fontSize: 16,
    color: colors.light.textPrimary,
    lineHeight: 26,
    fontFamily: "NotoSans-Regular",
  },
  footerSection: {
    marginHorizontal: 20,
    gap: 16,
  },
  sourceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.light.surface,
    borderRadius: 12,
  },
  sourceText: {
    fontSize: 14,
    color: colors.primary,
    fontStyle: "italic",
    fontFamily: "NotoSans-Medium",
    letterSpacing: 0.1,
  },
  earthquakeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    alignSelf: "flex-start",
  },
  earthquakeButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "NotoSans-Bold",
    fontWeight: "600",
  },
});
