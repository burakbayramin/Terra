import React, { useState } from "react";
import { FlashList } from "@shopify/flash-list";
import NewsListItem from "@/components/NewsListItem";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/constants/colors";
import { useNews } from "@/hooks/useNews";
import { News } from "@/types/types";
import { Ionicons } from "@expo/vector-icons";

export default function NewsScreen() {
  const [activeSegment, setActiveSegment] = useState<
    "latest" | "expert_opinions"
  >("latest");

  const { data: news = [], isLoading, error, refetch, isFetching } = useNews(activeSegment);
  const insets = useSafeAreaInsets();

  // Loading durumu için UI
  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Haberler</Text>
          <Text style={styles.headerSubtitle}>Güncel deprem ve afet haberleri</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Haberler yükleniyor...</Text>
          <Text style={styles.loadingSubtext}>
            {activeSegment === 'latest' 
              ? 'NewsAPI\'den deprem haberleri getiriliyor...' 
              : 'Uzman yorumları getiriliyor...'
            }
          </Text>
        </View>
      </View>
    );
  }

  // Error durumu için UI
  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Haberler</Text>
          <Text style={styles.headerSubtitle}>Güncel deprem ve afet haberleri</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
          <Text style={styles.errorText}>
            {error instanceof Error ? error.message : "Bir hata oluştu"}
          </Text>
          <Text style={styles.errorSubtext}>
            NewsAPI'den veri alınamadı. Lütfen internet bağlantınızı kontrol edin.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetch()}
          >
            <Ionicons name="refresh" size={20} color="#ffffff" />
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const newsData = news as News[];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Haberler</Text>
        <Text style={styles.headerSubtitle}>Güncel deprem ve afet haberleri</Text>
      </View>

      {/* Segmented Control */}
      <View style={styles.segmentedControlContainer}>
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              activeSegment === "latest" && styles.activeSegmentButton,
            ]}
            onPress={() => setActiveSegment("latest")}
          >
            <Ionicons 
              name="time-outline" 
              size={16} 
              color={activeSegment === "latest" ? "#ffffff" : colors.light.textSecondary} 
            />
            <Text
              style={[
                styles.segmentText,
                activeSegment === "latest" && styles.activeSegmentText,
              ]}
            >
              Güncel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              activeSegment === "expert_opinions" && styles.activeSegmentButton,
            ]}
            onPress={() => setActiveSegment("expert_opinions")}
          >
            <Ionicons 
              name="people-circle-outline" 
              size={16} 
              color={activeSegment === "expert_opinions" ? "#ffffff" : colors.light.textSecondary} 
            />
            <Text
              style={[
                styles.segmentText,
                activeSegment === "expert_opinions" && styles.activeSegmentText,
              ]}
            >
              Uzman Yorumları
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Results Count */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {newsData.length} haber bulundu
        </Text>
        <Text style={styles.sourceText}>
          {activeSegment === 'latest' 
            ? 'Türk haber kaynaklarından deprem haberleri'
            : 'Deprem uzmanlarından güncel yorumlar'
          }
        </Text>
        {activeSegment === 'expert_opinions' && (
          <View style={styles.expertInfoContainer}>
            <Text style={styles.expertInfoText}>
              Aranan uzmanlar: Yoshinori Moriwaki, Naci Görür, Celâl Şengör, Şener Üşümezsoy
            </Text>
            <Text style={styles.expertSearchInfo}>
              Arama terimleri: Uzman isimleri + "deprem AND (uzman OR profesör OR prof OR doktor)"
            </Text>
            {newsData.length === 0 && (
              <Text style={styles.noResultsInfo}>
                Sonuç bulunamadı. Lütfen daha sonra tekrar deneyin veya farklı bir sekme seçin.
              </Text>
            )}
          </View>
        )}
      </View>

      {/* News List */}
      <FlashList
        data={newsData}
        renderItem={({ item }) => <NewsListItem news={item} />}
        estimatedItemSize={365}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
        // Pull to refresh
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={() => refetch()}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        // Empty state
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="newspaper-outline" size={64} color={colors.light.textSecondary} />
            <Text style={styles.emptyTitle}>Haber bulunamadı</Text>
            <Text style={styles.emptySubtitle}>
              {activeSegment === 'latest' 
                ? 'Bu kategoride henüz haber yok'
                : 'Uzman yorumları bulunamadı'
              }
            </Text>
            <Text style={styles.emptySubtext}>
              NewsAPI'den veri alınamadı veya bu kategoride haber bulunamadı.
            </Text>
            {activeSegment === 'expert_opinions' && (
              <View style={styles.emptyExpertInfo}>
                <Text style={styles.emptyExpertText}>
                  Aranan uzmanlar:
                </Text>
                <Text style={styles.emptyExpertNames}>
                  • Yoshinori Moriwaki{'\n'}
                  • Naci Görür{'\n'}
                  • Celâl Şengör{'\n'}
                  • Şener Üşümezsoy
                </Text>
                <Text style={styles.emptyExpertNote}>
                  Bu uzmanların son yorumları henüz NewsAPI'de bulunamadı.
                </Text>
              </View>
            )}
          </View>
        }
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.light.background,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "NotoSans-Bold",
    color: colors.light.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: "NotoSans-Regular",
    color: colors.light.textSecondary,
  },
  segmentedControlContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: colors.light.surface,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  activeSegmentButton: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  segmentText: {
    fontSize: 14,
    color: colors.light.textSecondary,
    fontFamily: "NotoSans-Medium",
    fontWeight: "600",
  },
  activeSegmentText: {
    color: "#ffffff",
    fontFamily: "NotoSans-Medium",
    fontWeight: "600",
  },
  resultsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  resultsText: {
    fontSize: 14,
    color: colors.light.textSecondary,
    fontFamily: "NotoSans-Regular",
    marginBottom: 4,
  },
  sourceText: {
    fontSize: 12,
    color: colors.primary,
    fontFamily: "NotoSans-Regular",
    fontStyle: "italic",
    marginBottom: 4,
  },
  expertInfoContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: colors.light.surface,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  expertInfoText: {
    fontSize: 11,
    color: colors.light.textSecondary,
    fontFamily: "NotoSans-Regular",
    marginBottom: 4,
  },
  expertSearchInfo: {
    fontSize: 10,
    color: colors.light.textSecondary,
    fontFamily: "NotoSans-Regular",
    opacity: 0.8,
    marginBottom: 4,
  },
  noResultsInfo: {
    fontSize: 11,
    color: colors.error,
    fontFamily: "NotoSans-Medium",
    fontStyle: "italic",
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
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: colors.light.textSecondary,
    fontFamily: "NotoSans-Regular",
    textAlign: "center",
    opacity: 0.7,
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
    marginBottom: 12,
  },
  errorSubtext: {
    fontSize: 14,
    color: colors.light.textSecondary,
    fontFamily: "NotoSans-Regular",
    textAlign: "center",
    marginBottom: 24,
    opacity: 0.7,
    lineHeight: 20,
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "NotoSans-Bold",
    color: colors.light.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: "NotoSans-Regular",
    color: colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: "NotoSans-Regular",
    color: colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    opacity: 0.7,
    marginBottom: 16,
  },
  emptyExpertInfo: {
    alignItems: "center",
    padding: 16,
    backgroundColor: colors.light.surface,
    borderRadius: 12,
    marginTop: 8,
  },
  emptyExpertText: {
    fontSize: 14,
    fontFamily: "NotoSans-Medium",
    color: colors.light.textPrimary,
    marginBottom: 8,
  },
  emptyExpertNames: {
    fontSize: 12,
    fontFamily: "NotoSans-Regular",
    color: colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 8,
  },
  emptyExpertNote: {
    fontSize: 11,
    fontFamily: "NotoSans-Regular",
    color: colors.light.textSecondary,
    textAlign: "center",
    fontStyle: "italic",
    opacity: 0.8,
  },
});