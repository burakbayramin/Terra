import React, { useState } from "react";
import { FlashList } from "@shopify/flash-list";
import NewsListItem from "@/components/NewsListItem";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { colors } from "@/constants/colors";
import { useNews } from "@/hooks/useNews";

export default function NewsScreen() {
  const [activeSegment, setActiveSegment] = useState<
    "latest" | "experts" | "analysis"
  >("latest");

  const { data: news = [], isLoading, error, refetch, isFetching } = useNews();

  const filteredNews = news.filter((item) => {
    const categories = Array.isArray(item.category) 
      ? item.category 
      : typeof item.category === 'string' 
        ? (item.category as string).replace(/[{}]/g, '').split(',').map((cat: string) => cat.trim().replace(/"/g, ''))
        : [];
    
    if (activeSegment === "latest") return categories.includes("latest");
    if (activeSegment === "experts") return categories.includes("experts");
    if (activeSegment === "analysis") return categories.includes("analysis");
    return true;
  });

  // Loading durumu için UI
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.mainHeader}>
          <Text style={styles.inboxText}>Haberler</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Haberler yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error durumu için UI
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.mainHeader}>
          <Text style={styles.inboxText}>Haberler</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error instanceof Error ? error.message : "Bir hata oluştu"}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetch()}
          >
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainHeader}>
        <Text style={styles.inboxText}>Haberler</Text>
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
            <Text>Güncel Haberler</Text>
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
            <Text>Analizler</Text>
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
            <Text>Uzman Görüşleri</Text>
          </Text>
        </TouchableOpacity>
      </View>
      <FlashList
        data={filteredNews}
        renderItem={({ item }) => <NewsListItem news={item} />}
        estimatedItemSize={365}
        // YENİ: Pull to refresh
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={() => refetch()}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
    </SafeAreaView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: colors.light.textSecondary,
    fontFamily: "NotoSans-Medium",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#ff0000",
    fontFamily: "NotoSans-Medium",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontFamily: "NotoSans-Medium",
    fontWeight: "600",
  },
});