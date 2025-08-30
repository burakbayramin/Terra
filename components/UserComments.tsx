import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useEarthquakes } from "@/hooks/useEarthquakes";
import { colors } from "@/constants/colors";
import { Earthquake } from "@/types/types";

interface UserCommentsProps {
  sectionStyles?: any;
}

const UserComments: React.FC<UserCommentsProps> = ({ sectionStyles }) => {
  const router = useRouter();
  const { user } = useAuth();
  const { data: earthquakes = [] } = useEarthquakes();

  // Kullanıcının yorumları
  const { data: userComments, isLoading: isLoadingComments } = useQuery({
    queryKey: ["user-comments", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("earthquake_comments")
        .select(
          `
          id,
          comment,
          created_at,
          is_edited,
          edited_at,
          earthquake_id
        `
        )
        .eq("profile_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching user comments:", error);
        return [];
      }

      // Manually fetch earthquake details for each comment
      const commentsWithEarthquakes = await Promise.all(
        (data || []).map(async (comment) => {
          // Find earthquake data from the existing earthquakes
          const earthquake = earthquakes.find(
            (eq: Earthquake) => eq.id === comment.earthquake_id
          );

          return {
            ...comment,
            earthquake: earthquake || null,
          };
        })
      );

      return commentsWithEarthquakes;
    },
    enabled: !!user?.id && earthquakes.length > 0,
    staleTime: 5 * 60 * 1000, // 5 dakika fresh
  });

  const getMagnitudeColor = (magnitude: number) => {
    if (magnitude >= 5.0) return "#FF4444";
    if (magnitude >= 4.0) return "#FF8800";
    if (magnitude >= 3.0) return "#FFB800";
    return "#4CAF50";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCommentDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "Az önce yorum yaptım";
    if (diffHours < 24) return `${diffHours} saat önce yorum yaptım`;
    if (diffDays < 7) return `${diffDays} gün önce yorum yaptım`;

    return (
      date.toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "short",
      }) + " tarihinde yorum yaptım"
    );
  };

  if (!user) return null;

  return (
    <View
      style={[styles.userCommentsSection, sectionStyles?.userCommentsSection]}
    >
      <Text style={[styles.sectionTitle, sectionStyles?.sectionTitle]}>
        Yaptığım Yorumlar
      </Text>

      {isLoadingComments ? (
        <View
          style={[
            styles.userCommentsLoading,
            sectionStyles?.userCommentsLoading,
          ]}
        >
          <ActivityIndicator size="small" color={colors.primary} />
          <Text
            style={[
              styles.userCommentsLoadingText,
              sectionStyles?.userCommentsLoadingText,
            ]}
          >
            Yorumlar yükleniyor...
          </Text>
        </View>
      ) : userComments && userComments.length > 0 ? (
        <View
          style={[
            styles.userCommentsContainer,
            sectionStyles?.userCommentsContainer,
          ]}
        >
          <FlashList
            data={userComments}
            horizontal
            showsHorizontalScrollIndicator={false}
            estimatedItemSize={352}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{}}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.userCommentCard, sectionStyles?.userCommentCard]}
                activeOpacity={0.8}
                onPress={() =>
                  router.push(
                    `/(protected)/(tabs)/earthquakes/${item.earthquake_id}`
                  )
                }
              >
                {/* Deprem Bilgileri Header */}
                <View
                  style={[
                    styles.commentEarthquakeHeader,
                    sectionStyles?.commentEarthquakeHeader,
                  ]}
                >
                  <View
                    style={[
                      styles.commentEarthquakeMagnitude,
                      sectionStyles?.commentEarthquakeMagnitude,
                      {
                        backgroundColor: getMagnitudeColor(
                          item.earthquake?.mag || 0
                        ),
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.commentEarthquakeMagnitudeText,
                        sectionStyles?.commentEarthquakeMagnitudeText,
                      ]}
                    >
                      {item.earthquake?.mag?.toFixed(1) || "0.0"}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.commentEarthquakeInfo,
                      sectionStyles?.commentEarthquakeInfo,
                    ]}
                  >
                    <Text
                      style={[
                        styles.commentEarthquakeDate,
                        sectionStyles?.commentEarthquakeDate,
                      ]}
                    >
                      {formatDate(item.earthquake?.date || item.created_at)}
                    </Text>
                    <Text
                      style={[
                        styles.commentEarthquakeDepth,
                        sectionStyles?.commentEarthquakeDepth,
                      ]}
                    >
                      {item.earthquake?.depth || 0} km derinlik
                    </Text>
                  </View>
                </View>

                {/* Deprem Başlığı */}
                <Text
                  style={[
                    styles.commentEarthquakeTitle,
                    sectionStyles?.commentEarthquakeTitle,
                  ]}
                  numberOfLines={2}
                >
                  {item.earthquake?.title || "Bilinmeyen Deprem"}
                </Text>

                {/* Yorum İçeriği */}
                <View
                  style={[
                    styles.commentContentContainer,
                    sectionStyles?.commentContentContainer,
                  ]}
                >
                  <View
                    style={[styles.commentHeader, sectionStyles?.commentHeader]}
                  >
                    <Ionicons
                      name="chatbubble"
                      size={14}
                      color={colors.primary}
                    />
                    <Text
                      style={[styles.commentLabel, sectionStyles?.commentLabel]}
                    >
                      Yorumum:
                    </Text>
                  </View>
                  <Text
                    style={[styles.commentText, sectionStyles?.commentText]}
                    numberOfLines={3}
                  >
                    {item.comment}
                  </Text>
                </View>

                {/* Footer */}
                <View
                  style={[styles.commentFooter, sectionStyles?.commentFooter]}
                >
                  <Text
                    style={[
                      styles.commentDateText,
                      sectionStyles?.commentDateText,
                    ]}
                  >
                    {formatCommentDate(item.created_at)}
                  </Text>
                  {item.is_edited && (
                    <View
                      style={[styles.editedBadge, sectionStyles?.editedBadge]}
                    >
                      <Ionicons
                        name="create-outline"
                        size={12}
                        color="#9ca3af"
                      />
                      <Text
                        style={[styles.editedText, sectionStyles?.editedText]}
                      >
                        düzenlendi
                      </Text>
                    </View>
                  )}
                </View>

                {/* View Details Button */}
                <TouchableOpacity
                  style={[
                    styles.viewCommentButton,
                    sectionStyles?.viewCommentButton,
                  ]}
                  onPress={() =>
                    router.push(
                      `/(protected)/(tabs)/earthquakes/${item.earthquake_id}`
                    )
                  }
                >
                  <Text
                    style={[
                      styles.viewCommentButtonText,
                      sectionStyles?.viewCommentButtonText,
                    ]}
                  >
                    Detayları Gör
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={14}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            )}
          />
        </View>
      ) : (
        <View
          style={[styles.userCommentsEmpty, sectionStyles?.userCommentsEmpty]}
        >
          <Ionicons name="chatbubbles-outline" size={48} color="#cbd5e0" />
          <Text
            style={[
              styles.userCommentsEmptyTitle,
              sectionStyles?.userCommentsEmptyTitle,
            ]}
          >
            Henüz yorum yapmadınız
          </Text>
          <Text
            style={[
              styles.userCommentsEmptyDescription,
              sectionStyles?.userCommentsEmptyDescription,
            ]}
          >
            Deprem detaylarına giderek deneyimlerinizi ve düşüncelerinizi
            paylaşabilirsiniz
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  userCommentsSection: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    marginHorizontal: 16,
    color: "#1a202c",
  },
  userCommentsLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  userCommentsLoadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#6b7280",
  },
  userCommentsContainer: {
    paddingLeft: 16,
  },
  userCommentCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 340,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  commentEarthquakeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  commentEarthquakeMagnitude: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  commentEarthquakeMagnitudeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  commentEarthquakeInfo: {
    flex: 1,
  },
  commentEarthquakeDate: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 2,
  },
  commentEarthquakeDepth: {
    fontSize: 12,
    color: "#6b7280",
  },
  commentEarthquakeTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a202c",
    marginBottom: 12,
    lineHeight: 18,
  },
  commentContentContainer: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  commentLabel: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
    marginLeft: 6,
  },
  commentText: {
    fontSize: 13,
    color: "#374151",
    lineHeight: 18,
  },
  commentFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  commentDateText: {
    fontSize: 11,
    color: "#9ca3af",
  },
  editedBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  editedText: {
    fontSize: 11,
    color: "#9ca3af",
    marginLeft: 4,
  },
  viewCommentButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  viewCommentButtonText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
    marginRight: 6,
  },
  userCommentsEmpty: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  userCommentsEmptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginTop: 12,
    marginBottom: 8,
  },
  userCommentsEmptyDescription: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
  },
});

export default UserComments;
