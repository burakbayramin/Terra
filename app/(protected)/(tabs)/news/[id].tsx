import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Pressable,
  SafeAreaView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Entypo } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { formatDistanceToNowStrict } from "date-fns";
import { tr } from "date-fns/locale";
import { colors } from "@/constants/colors";
import { supabase } from "@/lib/supabase";
import { News } from "@/types/types";
import React from "react";

export default function NewsDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [news, setNews] = React.useState<News[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("news")
        .select(
          "id, title, snippet, content, image, created_at, category, source, earthquake_id"
        );
      if (error) {
        setError("Depremler alınamadı.");
        setNews([]);
      } else {
        setNews(data || []);
      }
      setLoading(false);
    };
    fetchNews();
  }, []);

  const item = news.find((n) => n.id.toString() === id);

  if (!item) {
    return <Text style={{ padding: 24 }}>Haber Bulunamadı</Text>;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        <View style={styles.headerRow}>
          <View style={styles.categoryRow}>
            {(Array.isArray(item.category)
              ? item.category
              : typeof item.category === "string"
              ? (item.category as string)
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
            {formatDistanceToNowStrict(new Date(item.created_at), {
              locale: tr,
              addSuffix: true,
            })}
          </Text>
        </View>

        {/* Başlık */}
        <Text style={styles.title}>{item.title}</Text>

        {/* Kapak Görseli */}
        {!!item.image && (
          <Image
            source={{ uri: item.image }}
            style={styles.image}
            resizeMode="cover"
          />
        )}

        {/* Snippet */}
        {/* <Text style={styles.snippet}>{item.snippet}</Text> */}

        {/* ...existing code... */}

        {/* Tam İçerik */}
        <View style={styles.contentBox}>
          <Text style={styles.contentText}>{item.content}</Text>
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
            Kaynak: {item.source}
          </Text>
          {item.earthquake_id && (
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

const styles = StyleSheet.create({
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
