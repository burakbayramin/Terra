import { News } from "@/types/types";
import { Link } from "expo-router";
import { formatDistanceToNowStrict } from "date-fns";
import { tr } from "date-fns/locale";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { colors } from "@/constants/colors";

type NewsCardProps = {
  news: News;
  isDetailed?: boolean;
};

export default function NewsListItem({ news, isDetailed }: NewsCardProps) {
  return (
    <Link href={`/news/${news.id}`} asChild>
      <Pressable style={styles.card}>
        {/* HEADER */}
        <View style={styles.headerRow}>
          <View style={styles.categoryRow}>
            {news.category.map((cat, idx) => (
              <View key={idx} style={styles.chip}>
                <Text style={styles.chipText}>{cat}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.timeText}>
            {formatDistanceToNowStrict(new Date(news.createdAt), {
              locale: tr,
              addSuffix: true,
            })}
          </Text>
        </View>
        {/* TITLE */}
        <Text style={styles.title} numberOfLines={2}>
          {news.title}
        </Text>

        {/* IMAGE */}
        {!!news.image && (
          <Image
            source={{ uri: news.image }}
            style={styles.image}
            resizeMode="cover"
          />
        )}

        {/* SNIPPET */}
        <Text style={styles.snippet} numberOfLines={isDetailed ? undefined : 3}>
          {news.snippet}
        </Text>
        {/* Kaynak */}
        <View style={styles.footerRow}>
          <Text style={styles.sourceText}>{news.source}</Text>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.light.background,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 9,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.light.surface,
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
  },
  chip: {
    backgroundColor: colors.light.background,
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginRight: 4,
    marginBottom: 2,
    borderWidth: 1.5,
    borderColor: colors.primary,
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  chipText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
    fontFamily: "NotoSans-Medium",
    letterSpacing: 0.2,
  },
  timeText: {
    fontSize: 12,
    color: colors.light.textSecondary,
    fontFamily: "NotoSans-Regular",
    marginLeft: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.light.textPrimary,
    marginBottom: 5,
    marginTop: 3,
    letterSpacing: 0.15,
    fontFamily: "NotoSans-Bold",
  },
  image: {
    width: "100%",
    height: 180,
    borderRadius: 15,
    marginVertical: 6,
    backgroundColor: colors.light.surface,
    borderWidth: 1,
    borderColor: colors.light.surface,
  },
  snippet: {
    fontSize: 15,
    color: colors.light.textSecondary,
    marginVertical: 4,
    fontFamily: "NotoSans-Regular",
    lineHeight: 21,
  },
  footerRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sourceText: {
    fontSize: 13,
    color: colors.primary,
    fontStyle: "italic",
    fontFamily: "NotoSans-Regular",
    letterSpacing: 0.1,
  },
});
