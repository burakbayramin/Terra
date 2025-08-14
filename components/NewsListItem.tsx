import { News } from "@/types/types";
import { formatDistanceToNowStrict, isToday } from "date-fns";
import { tr } from "date-fns/locale";
import { View, Text, Image, Pressable, StyleSheet, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/colors";

type NewsCardProps = {
  news: News;
  isDetailed?: boolean;
};

import React from "react";

export default function NewsListItem({ news, isDetailed }: NewsCardProps) {
  const isNewsToday = isToday(new Date(news.created_at));
  const isNewsApiArticle = news.url && news.url.startsWith('http');

  const handlePress = () => {
    if (isNewsApiArticle && news.url) {
      // NewsAPI makaleleri için harici link aç
      Linking.openURL(news.url);
    } else {
      // Yerel haberler için detay sayfasına git
      // Bu durumda Link bileşeni otomatik olarak çalışacak
    }
  };

  return (
    <Pressable style={styles.card} onPress={handlePress}>
      {/* Header with Category and Time */}
      <View style={styles.headerRow}>
        <View style={styles.categoryRow}>
          {news.category.slice(0, 2).map((cat, idx) => (
            <View key={idx} style={styles.chip}>
              <Text style={styles.chipText}>{cat}</Text>
            </View>
          ))}
          {news.category.length > 2 && (
            <View style={styles.moreChip}>
              <Text style={styles.moreChipText}>+{news.category.length - 2}</Text>
            </View>
          )}
          {isNewsToday && (
            <View style={styles.latestChip}>
              <Ionicons name="time" size={12} color="#ffffff" />
              <Text style={styles.latestChipText}>Latest</Text>
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
      <Text style={styles.title} numberOfLines={2}>
        {news.title}
      </Text>

      {/* Image with better styling */}
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

      {/* Snippet */}
      <Text style={styles.snippet} numberOfLines={isDetailed ? undefined : 3}>
        {news.snippet}
      </Text>

      {/* Footer with Source */}
      <View style={styles.footerRow}>
        <View style={styles.sourceContainer}>
          <Ionicons name="newspaper-outline" size={16} color={colors.primary} />
          <Text style={styles.sourceText}>{news.source}</Text>
          {news.author && (
            <Text style={styles.authorText}> • {news.author}</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.light.background,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.light.surface,
    gap: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  categoryRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "nowrap",
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
  chipText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
    fontFamily: "NotoSans-Medium",
    letterSpacing: 0.2,
  },
  moreChip: {
    backgroundColor: colors.light.surface,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.light.surface,
  },
  moreChipText: {
    fontSize: 12,
    color: colors.light.textSecondary,
    fontWeight: "600",
    fontFamily: "NotoSans-Medium",
  },
  latestChip: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  latestChipText: {
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
    fontSize: 20,
    fontWeight: "bold",
    color: colors.light.textPrimary,
    lineHeight: 26,
    letterSpacing: 0.15,
    fontFamily: "NotoSans-Bold",
  },
  imageContainer: {
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: colors.light.surface,
    minHeight: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    backgroundColor: colors.light.surface,
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  snippet: {
    fontSize: 16,
    color: colors.light.textSecondary,
    lineHeight: 24,
    fontFamily: "NotoSans-Regular",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  sourceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  sourceText: {
    fontSize: 14,
    color: colors.primary,
    fontStyle: "italic",
    fontFamily: "NotoSans-Medium",
    letterSpacing: 0.1,
  },
  authorText: {
    fontSize: 12,
    color: colors.light.textSecondary,
    fontFamily: "NotoSans-Regular",
    fontStyle: "italic",
  },
});
