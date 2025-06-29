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
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { formatDistanceToNowStrict } from "date-fns";
import { tr } from "date-fns/locale";
import { news } from "data";
import { colors } from "@/constants/colors";

export default function NewsDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Buradan id'ye göre ilgili haberi buluyoruz
  const item = news.find((n) => n.id === id);

  if (!item) {
    return <Text style={{ padding: 24 }}>Haber Bulunamadı</Text>;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>

        {/* Kategori Chipleri ve Zaman */}
        <View style={styles.headerRow}>
          <View style={styles.categoryRow}>
            {item.category.map((cat, idx) => (
              <View key={idx} style={styles.chip}>
                <Text style={styles.chipText}>{cat}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.timeText}>
            {formatDistanceToNowStrict(new Date(item.createdAt), {
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
        <Text style={styles.snippet}>{item.snippet}</Text>

        {/* Tam İçerik */}
        <View style={styles.contentBox}>
          <Text style={styles.contentText}>{item.content}</Text>
        </View>

        {/* Kaynak */}
        <Text style={styles.sourceText}>Kaynak: {item.source}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 15,
    marginHorizontal: 16,
  },
  categoryRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
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
    textAlign: "right",
    marginHorizontal: 16,
    fontStyle: "italic",
    marginBottom: 18,
    marginTop: 2,
    fontFamily: "NotoSans-Regular",
  },
});
