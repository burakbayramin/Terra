// NewsDetailScreen.tsx - Mevcut dosyanızı bu şekilde güncelleyin
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Pressable,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Entypo } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { formatDistanceToNowStrict } from "date-fns";
import { tr } from "date-fns/locale";
import { colors } from "@/constants/colors";
import { useNewsById } from "@/hooks/useNews"; // YENİ IMPORT
import React from "react";

export default function NewsDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // ESKİ useState'leri silin, yerine bu hook'u kullanın
  const { data: news, isLoading, error, refetch, isFetching } = useNewsById(id!);

  // Loading durumu
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Haber yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error durumu
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error instanceof Error ? error.message : "Bir hata oluştu"}
          </Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => refetch()}
          >
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Haber bulunamadı durumu
  if (!news) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Haber bulunamadı</Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Geri Dön</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
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
            ).map((cat, idx) => (
              <View key={idx} style={styles.chip}>
                <Text style={styles.chipText}>{cat}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.timeText}>
            {formatDistanceToNowStrict(new Date(news.created_at), {
              locale: tr,
              addSuffix: true,
            })}
          </Text>
        </View>

        {/* Başlık */}
        <Text style={styles.title}>{news.title}</Text>

        {/* Kapak Görseli */}
        {!!news.image && (
          <Image
            source={{ uri: news.image }}
            style={styles.image}
            resizeMode="cover"
          />
        )}

        {/* Tam İçerik */}
        <View style={styles.contentBox}>
          <Text style={styles.contentText}>{news.content}</Text>
        </View>

        {/* Kaynak ve Deprem Bilgisi */}
        <View
          style={{
            marginHorizontal: 0,
            marginBottom: 18,
            marginTop: 2,
            paddingHorizontal: 16,
          }}
        >
          <Text
            style={[
              styles.sourceText,
              { marginBottom: 8, textAlign: "left", paddingLeft: 10 },
            ]}
          >
            Kaynak: {news.source}
          </Text>
          {news.earthquake_id && (
            <Pressable
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.primary,
                borderRadius: 20,
                paddingVertical: 8,
                paddingHorizontal: 18,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 4,
                elevation: 2,
                alignSelf: "flex-start",
              }}
              onPress={() => router.push("/earthquakes")}
            >
              <Entypo
                name="info-with-circle"
                size={20}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text
                style={{
                  color: "#fff",
                  fontSize: 15,
                  fontFamily: "NotoSans-Bold",
                }}
              >
                Deprem Bilgisine Git
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles aynı kalıyor - hiçbir şey değiştirmeyin
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
    marginTop: 10,
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 30,
    marginHorizontal: 16,
  },
  categoryRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  chip: {
    borderColor: colors.primary,
    borderWidth: 1.5,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 3,
    paddingHorizontal: 10,
    marginRight: 3,
    marginBottom: 2,
  },
  chipText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "500",
    fontFamily: "NotoSans-Medium",
  },
  timeText: {
    fontSize: 12,
    color: colors.light.textSecondary,
    fontFamily: "NotoSans-Regular",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.light.textPrimary,
    marginTop: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    letterSpacing: 0.1,
    fontFamily: "NotoSans-Bold",
  },
  image: {
    width: "90%",
    alignSelf: "center",
    height: 210,
    borderRadius: 14,
    marginBottom: 15,
    backgroundColor: "#f2f2f2",
    marginTop: 6,
  },
  snippet: {
    fontSize: 15,
    color: "#444",
    marginHorizontal: 35,
    marginBottom: 10,
    marginTop: 2,
    fontWeight: "500",
    fontFamily: "NotoSans-Medium",
  },
  contentBox: {
    marginHorizontal: 16,
    backgroundColor: "#f8f8f8",
    padding: 13,
    borderRadius: 10,
    marginBottom: 12,
    marginTop: 4,
  },
  contentText: {
    fontSize: 15,
    color: "#222",
    lineHeight: 22,
    fontFamily: "NotoSans-Regular",
  },
  sourceText: {
    fontSize: 13,
    color: colors.light.textPrimary,
    fontStyle: "italic",
    fontFamily: "NotoSans-Regular",
  },
});