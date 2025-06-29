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
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 15,
    marginHorizontal: 12,
    marginVertical: 7,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    gap: 7,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  categoryRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "nowrap", // Tüm chip'lerin tek satırda kalmasını sağlar
  },
  chip: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 3,
    paddingHorizontal: 10,
    marginRight: 3,
    marginBottom: 2,
  },
  chipText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "500",
    fontFamily: "NotoSans-Medium",
  },
  timeText: {
    fontSize: 12,
    color: "#999",
    fontFamily: "NotoSans-Regular",
  },
  title: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 3,
    marginTop: 2,
    letterSpacing: 0.1,
    fontFamily: "NotoSans-Bold",
  },
  image: {
    width: "100%",
    height: 180,
    borderRadius: 13,
    marginVertical: 4,
    backgroundColor: "#f2f2f2",
  },
  snippet: {
    fontSize: 14,
    color: "#444",
    marginVertical: 2,
    fontFamily: "NotoSans-Regular",
  },
  footerRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sourceText: {
    fontSize: 13,
    color: "#888",
    fontStyle: "italic",
    fontFamily: "NotoSans-Regular",
  },
});
