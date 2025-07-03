import React, { useState } from "react";
import { news } from "data";
import { FlashList } from "@shopify/flash-list";
import NewsListItem from "@/components/NewsListItem";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { colors } from "@/constants/colors";

export default function NewsScreen() {
  const [activeSegment, setActiveSegment] = useState<
    "latest" | "experts" | "analysis"
  >("latest");

  const filteredNews = news.filter((item) => {
    if (activeSegment === "latest") return item.category.includes("latest");
    if (activeSegment === "experts") return item.category.includes("experts");
    if (activeSegment === "analysis") return item.category.includes("analysis");
    return true;
  });

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
  // notificationBadge: {
  //   position: "absolute",
  //   top: -5,
  //   right: 35,
  //   backgroundColor: "red",
  //   borderRadius: 10,
  //   width: 20,
  //   height: 20,
  //   justifyContent: "center",
  //   alignItems: "center",
  // },
  // notificationBadgeText: {
  //   color: "white",
  //   fontSize: 12,
  //   fontWeight: "bold",
  // },
});
