import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from "react-native";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/colors";
import { useEarthquakeComments } from "@/hooks/useEarthquakeComments";
import { useEarthquakeById } from "@/hooks/useEarthquakes";
import { useAuth } from "@/hooks/useAuth";

const getMagnitudeColor = (magnitude: number) => {
  if (magnitude >= 5.0) return "#FF4444";
  if (magnitude >= 4.0) return "#FF8800";
  if (magnitude >= 3.0) return "#FFB800";
  return "#4CAF50";
};

const getMagnitudeLabel = (magnitude: number) => {
  if (magnitude >= 5.0) return "Güçlü";
  if (magnitude >= 4.0) return "Orta";
  if (magnitude >= 3.0) return "Hafif";
  return "Zayıf";
};

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  if (diffHours < 1) return "Az önce";
  if (diffHours < 24) return `${diffHours} saat önce`;
  if (diffDays < 7) return `${diffDays} gün önce`;
  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Comment Item Component
const CommentItem = ({ comment, onEdit, onDelete, isOwnComment }: any) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <View style={styles.commentItem}>
      <View style={styles.commentHeader}>
        <View style={styles.commentUserInfo}>
          <View style={styles.commentAvatar}>
            <Text style={styles.commentAvatarText}>
              {comment.profiles?.full_name?.charAt(0)?.toUpperCase() || "U"}
            </Text>
          </View>
          <View>
            <Text style={styles.commentUserName}>
              {comment.profiles?.full_name || "Anonim Kullanıcı"}
            </Text>
            <Text style={styles.commentDate}>
              {formatDate(comment.created_at)}
              {comment.is_edited && (
                <Text style={styles.editedLabel}> • düzenlendi</Text>
              )}
            </Text>
          </View>
        </View>
        {isOwnComment && (
          <TouchableOpacity
            onPress={() => setShowActions(!showActions)}
            style={styles.commentMenuButton}
          >
            <Ionicons name="ellipsis-horizontal" size={18} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>
      
      <Text style={styles.commentText}>{comment.comment}</Text>
      
      {showActions && isOwnComment && (
        <View style={styles.commentActions}>
          <TouchableOpacity
            onPress={() => {
              setShowActions(false);
              onEdit(comment);
            }}
            style={styles.commentActionButton}
          >
            <Ionicons name="create-outline" size={16} color="#3b82f6" />
            <Text style={styles.commentActionText}>Düzenle</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setShowActions(false);
              onDelete(comment.id);
            }}
            style={styles.commentActionButton}
          >
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
            <Text style={[styles.commentActionText, { color: "#ef4444" }]}>Sil</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default function AllCommentsScreen() {
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  console.log('AllCommentsScreen - all params:', params);
  console.log('AllCommentsScreen - earthquakeId:', params.earthquakeId);
  console.log('AllCommentsScreen - earthquakeTitle:', params.earthquakeTitle);
  
  const earthquakeId = params.earthquakeId as string;
  const earthquakeTitle = params.earthquakeTitle as string;

  // Earthquake verilerini al
  const {
    data: earthquake,
    isLoading: isLoadingEarthquake,
    error: earthquakeError,
  } = useEarthquakeById(earthquakeId);
  

  const [newComment, setNewComment] = useState("");
  const [editingComment, setEditingComment] = useState<any>(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);

  const {
    comments,
    isLoading,
    addComment,
    updateComment,
    deleteComment,
    isAddingComment,
    isUpdatingComment,
    error: commentsError,
  } = useEarthquakeComments(earthquakeId as string);

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      Alert.alert("Uyarı", "Lütfen bir yorum yazın.");
      return;
    }

    try {
      await addComment(newComment.trim());
      setNewComment("");
      Alert.alert("Başarılı", "Yorumunuz eklendi.");
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? `Hata: ${error.message}` 
        : "Yorum eklenirken bilinmeyen hata oluştu.";
      Alert.alert("Hata", errorMessage);
    }
  };

  const handleEditComment = (comment: any) => {
    setEditingComment(comment);
    setEditCommentText(comment.comment);
    setShowEditModal(true);
  };

  const handleUpdateComment = async () => {
    if (!editCommentText.trim()) {
      Alert.alert("Uyarı", "Lütfen bir yorum yazın.");
      return;
    }

    try {
      await updateComment(editingComment.id, editCommentText.trim());
      setShowEditModal(false);
      setEditingComment(null);
      setEditCommentText("");
      Alert.alert("Başarılı", "Yorumunuz güncellendi.");
    } catch (error) {
      Alert.alert(
        "Hata",
        error instanceof Error ? error.message : "Yorum güncellenirken hata oluştu."
      );
    }
  };

  const handleDeleteComment = (commentId: string) => {
    Alert.alert(
      "Yorumu Sil",
      "Bu yorumu silmek istediğinizden emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteComment(commentId);
              Alert.alert("Başarılı", "Yorum silindi.");
            } catch (error) {
              Alert.alert(
                "Hata",
                error instanceof Error ? error.message : "Yorum silinirken hata oluştu."
              );
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a365d" />
      
      <Stack.Screen
        options={{
          title: "Tüm Yorumlar",
          headerStyle: { backgroundColor: "#1a365d" },
          headerTintColor: "#ffffff",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      />

      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            {isLoadingEarthquake ? (
              <View style={styles.magnitudeSection}>
                <View style={styles.magnitudeDisplay}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
                <View style={styles.earthquakeInfo}>
                  <Text style={styles.earthquakeTitle}>Yükleniyor...</Text>
                  <Text style={styles.commentCount}>
                    {comments?.length || 0} yorum
                  </Text>
                </View>
              </View>
            ) : earthquake ? (
              <View style={styles.magnitudeSection}>
                <View style={styles.magnitudeDisplay}>
                  <Text style={[styles.magnitudeNumber, { color: getMagnitudeColor(earthquake.mag) }]}>
                    {earthquake.mag.toFixed(1)}
                  </Text>
                  <View style={[styles.magnitudeBadge, { backgroundColor: `${getMagnitudeColor(earthquake.mag)}15` }]}>
                    <Text style={[styles.magnitudeBadgeText, { color: getMagnitudeColor(earthquake.mag) }]}>
                      {getMagnitudeLabel(earthquake.mag)}
                    </Text>
                  </View>
                </View>
                <View style={styles.earthquakeInfo}>
                  <Text style={styles.earthquakeTitle}>
                    {earthquake.title}
                  </Text>
                  <Text style={styles.commentCount}>
                    {comments?.length || 0} yorum
                  </Text>
                </View>
              </View>
            ) : (
              <>
                <Text style={styles.headerTitle}>
                  {earthquakeTitle || "Deprem Yorumları"}
                </Text>
                <Text style={styles.commentCount}>
                  {comments?.length || 0} yorum
                </Text>
              </>
            )}
          </View>

          {/* Add Comment */}
          <View style={styles.addCommentContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Bu deprem hakkında yorumunuzu yazın..."
              placeholderTextColor="#9ca3af"
              value={newComment}
              onChangeText={setNewComment}
              multiline
              maxLength={500}
              textAlignVertical="top"
            />
            <View style={styles.commentInputFooter}>
              <Text style={styles.characterCount}>
                {newComment.length}/500
              </Text>
              <TouchableOpacity
                style={[
                  styles.submitCommentButton,
                  (!newComment.trim() || isAddingComment) && styles.submitCommentButtonDisabled,
                ]}
                onPress={handleAddComment}
                disabled={!newComment.trim() || isAddingComment}
              >
                {isAddingComment ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="send" size={16} color="#ffffff" />
                    <Text style={styles.submitCommentButtonText}>Gönder</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Comments List */}
          <View style={styles.commentsList}>
            {isLoading ? (
              <View style={styles.commentsLoading}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.commentsLoadingText}>Yorumlar yükleniyor...</Text>
              </View>
            ) : comments && comments.length > 0 ? (
              comments.map((comment: any) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onEdit={handleEditComment}
                  onDelete={handleDeleteComment}
                  isOwnComment={comment.is_own_comment}
                />
              ))
            ) : (
              <View style={styles.noCommentsContainer}>
                <Ionicons name="chatbubbles-outline" size={48} color="#cbd5e0" />
                <Text style={styles.noCommentsText}>
                  Henüz yorum yapılmamış
                </Text>
                <Text style={styles.noCommentsSubtext}>
                  Bu deprem hakkındaki düşüncelerinizi paylaşın!
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Edit Comment Modal */}
        <Modal
          visible={showEditModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowEditModal(false)}
        >
          <View style={styles.editModalContainer}>
            <View style={styles.editModalHeader}>
              <TouchableOpacity
                onPress={() => setShowEditModal(false)}
                style={styles.editModalCloseButton}
              >
                <Text style={styles.editModalCloseText}>İptal</Text>
              </TouchableOpacity>
              <Text style={styles.editModalTitle}>Yorumu Düzenle</Text>
              <TouchableOpacity
                onPress={handleUpdateComment}
                style={[
                  styles.editModalSaveButton,
                  (!editCommentText.trim() || isUpdatingComment) && styles.editModalSaveButtonDisabled,
                ]}
                disabled={!editCommentText.trim() || isUpdatingComment}
              >
                {isUpdatingComment ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={styles.editModalSaveText}>Kaydet</Text>
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.editModalContent}>
              <TextInput
                style={styles.editCommentInput}
                value={editCommentText}
                onChangeText={setEditCommentText}
                multiline
                maxLength={500}
                placeholder="Yorumunuzu yazın..."
                placeholderTextColor="#9ca3af"
                autoFocus
                textAlignVertical="top"
              />
              <Text style={styles.editCharacterCount}>
                {editCommentText.length}/500
              </Text>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 10,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2d3748",
    marginBottom: 4,
  },
  magnitudeSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  magnitudeDisplay: {
    alignItems: "center",
    marginRight: 20,
  },
  magnitudeNumber: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#2d3748",
  },
  magnitudeBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  magnitudeBadgeText: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "600",
  },
  earthquakeInfo: {
    flex: 1,
  },
  earthquakeTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2d3748",
    marginBottom: 4,
    lineHeight: 24,
  },
  commentCount: {
    fontSize: 14,
    color: "#6b7280",
  },
  addCommentContainer: {
    backgroundColor: "#ffffff",
    margin: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: "#2d3748",
    minHeight: 80,
    maxHeight: 120,
    textAlignVertical: "top",
  },
  commentInputFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  characterCount: {
    fontSize: 12,
    color: "#6b7280",
  },
  submitCommentButton: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  submitCommentButtonDisabled: {
    backgroundColor: "#cbd5e0",
  },
  submitCommentButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  commentsList: {
    backgroundColor: "#ffffff",
    margin: 16,
    marginBottom: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  commentsLoading: {
    padding: 40,
    alignItems: "center",
  },
  commentsLoadingText: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 8,
  },
  noCommentsContainer: {
    padding: 40,
    alignItems: "center",
  },
  noCommentsText: {
    fontSize: 16,
    color: "#9ca3af",
    fontWeight: "500",
    marginTop: 12,
  },
  noCommentsSubtext: {
    fontSize: 14,
    color: "#cbd5e0",
    marginTop: 4,
    textAlign: "center",
  },
  commentItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  commentUserInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  commentAvatarText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2d3748",
  },
  commentDate: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  editedLabel: {
    fontStyle: "italic",
    color: "#9ca3af",
  },
  commentMenuButton: {
    padding: 4,
  },
  commentText: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
    marginLeft: 48,
  },
  commentActions: {
    flexDirection: "row",
    marginTop: 8,
    marginLeft: 48,
  },
  commentActionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 16,
  },
  commentActionText: {
    fontSize: 12,
    color: "#3b82f6",
    fontWeight: "500",
    marginLeft: 4,
  },
  editModalContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  editModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  editModalCloseButton: {
    padding: 8,
  },
  editModalCloseText: {
    fontSize: 16,
    color: "#6b7280",
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2d3748",
  },
  editModalSaveButton: {
    padding: 8,
  },
  editModalSaveButtonDisabled: {
    opacity: 0.5,
  },
  editModalSaveText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "600",
  },
  editModalContent: {
    flex: 1,
    padding: 16,
  },
  editCommentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#2d3748",
    textAlignVertical: "top",
  },
  editCharacterCount: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "right",
    marginTop: 8,
  },
}); 