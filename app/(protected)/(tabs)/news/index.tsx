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
import LoadingView from "@/components/LoadingView";
import ErrorView from "@/components/ErrorView";

export default function NewsScreen() {
  const [activeSegment, setActiveSegment] = useState<
    "latest" | "experts" | "analysis"
  >("latest");

  const {
    data: news = [],
    isLoading,
    error,
    refetch,
    isFetching,
    isRefetching, // Pull to refresh için
  } = useNews();

  const insets = useSafeAreaInsets();

  // ÖNEMLİ: Sadece veri yoksa ve yükleniyorsa loading göster
  const showLoading = isLoading && news.length === 0;
  const showError = error && news.length === 0;

  const filteredNews = news.filter((item) => {
    return item.category?.includes(activeSegment) || false;
  });

  // Loading durumu - SADECE veri yoksa göster
  if (showLoading) {
    return <LoadingView />;
  }

  // Error durumu - SADECE veri yoksa göster
  if (showError) {
    return (
      <ErrorView
        message={error instanceof Error ? error.message : undefined}
        onRetry={refetch}
      />
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.mainHeader}>
        <Text style={styles.inboxText}>Haberler</Text>
        {/* Opsiyonel: Arka planda güncelleme göstergesi */}
        {isFetching && !isRefetching && (
          <View style={styles.backgroundRefreshIndicator}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}
      </View>

      <View style={styles.segmentedControl}>
        <TouchableOpacity
          style={[
            styles.segmentButton,
            activeSegment === "latest" && styles.activeSegmentButton,
          ]}
          onPress={() => setActiveSegment("latest")}
        >
          <Text
            style={[
              styles.segmentText,
              activeSegment === "latest" && styles.activeSegmentText,
            ]}
          >
            Güncel Haberler
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.segmentButton,
            activeSegment === "analysis" && styles.activeSegmentButton,
          ]}
          onPress={() => setActiveSegment("analysis")}
        >
          <Text
            style={[
              styles.segmentText,
              activeSegment === "analysis" && styles.activeSegmentText,
            ]}
          >
            Analizler
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.segmentButton,
            activeSegment === "experts" && styles.activeSegmentButton,
          ]}
          onPress={() => setActiveSegment("experts")}
        >
          <Text
            style={[
              styles.segmentText,
              activeSegment === "experts" && styles.activeSegmentText,
            ]}
          >
            Uzman Görüşleri
          </Text>
        </TouchableOpacity>
      </View>

      {/* Veri varsa göster, yoksa boş mesaj */}
      {filteredNews.length > 0 ? (
        <FlashList
          data={filteredNews}
          renderItem={({ item }) => <NewsListItem news={item} />}
          estimatedItemSize={365}
          contentContainerStyle={{ paddingBottom: insets.bottom }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching} // isFetching yerine isRefetching
              onRefresh={() => refetch()}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Bu kategoride henüz haber bulunmuyor
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.surface,
  },
  mainHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    marginBottom: 15,
    marginTop: 15,
  },
  inboxText: {
    fontSize: 25,
    fontFamily: "NotoSans-Bold",
    flex: 1,
    textAlign: "center",
  },
  segmentedControl: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.light.surface,
    marginBottom: 10,
    paddingHorizontal: 15,
  },
  segmentButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    position: "relative",
  },
  activeSegmentButton: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  segmentText: {
    fontSize: 14,
    color: colors.light.textSecondary,
    fontFamily: "NotoSans-Medium",
    fontWeight: "500",
  },
  activeSegmentText: {
    color: colors.light.textPrimary,
    fontFamily: "NotoSans-Medium",
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: colors.light.textSecondary,
    fontFamily: "NotoSans-Medium",
    textAlign: "center",
  },
  backgroundRefreshIndicator: {
    position: "absolute",
    right: 15,
    top: "50%",
    transform: [{ translateY: -10 }],
  },
});
