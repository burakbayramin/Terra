import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Platform,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Modal,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { Earthquake } from "@/types/types";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/colors";
import { useEarthquakeById } from "@/hooks/useEarthquakes";
import { useEarthquakeFeltReports } from "@/hooks/useEarthquakeFeltReports";
import { useEarthquakeComments } from "@/hooks/useEarthquakeComments";
import { GoogleGenerativeAI } from '@google/generative-ai';

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

// Harici harita uygulamasını açma fonksiyonu
const openInExternalMap = async (
  latitude: number,
  longitude: number,
  title: string
) => {
  // URL'leri öncelik sırasına göre tanımla
  const urls = [
    // Google Maps uygulaması (en yaygın)
    `comgooglemaps://?q=${latitude},${longitude}&center=${latitude},${longitude}&zoom=14`,
    // iOS Apple Maps
    `http://maps.apple.com/?q=${latitude},${longitude}&ll=${latitude},${longitude}`,
    // Android geo intent
    `geo:${latitude},${longitude}?q=${latitude},${longitude}`,
    // Google Maps web (son çare)
    `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
  ];

  // Her URL'yi sırayla dene
  for (const url of urls) {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return; // Başarılı olursa çık
      }
    } catch (error) {
      console.log(`URL açılamadı: ${url}`, error);
      continue; // Bir sonraki URL'yi dene
    }
  }

  // Hiçbir URL çalışmazsa kullanıcıyı bilgilendir
  Alert.alert(
    "Harita Uygulaması",
    "Harita uygulaması açılamadı. Koordinatları manuel olarak kopyalayabilirsiniz:\n\n" +
      `${latitude}, ${longitude}`,
    [
      {
        text: "Koordinatları Kopyala",
        onPress: () => {
          // Expo'da Clipboard varsa kullan, yoksa sadece konsola yazdır
          console.log(`Koordinatlar: ${latitude}, ${longitude}`);
        },
      },
      { text: "Tamam", style: "cancel" },
    ]
  );
};

// Yorum bileşeni
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

export default function EarthquakeDetailScreen() {
  const { id } = useLocalSearchParams();
  const [newComment, setNewComment] = useState("");
  const [editingComment, setEditingComment] = useState<any>(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  
  // AI Comment states
  const [showAIComment, setShowAIComment] = useState(false);
  const [aiCommentText, setAiCommentText] = useState('');
  const [displayedAIComment, setDisplayedAIComment] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isTypingAI, setIsTypingAI] = useState(false);

  const {
    data: earthquake,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useEarthquakeById(id as string);

  // Felt reports hook'unu kullan
  const {
    stats,
    isLoading: isLoadingFeltReports,
    toggleFeltReport,
    isUpdating,
    error: feltReportsError,
  } = useEarthquakeFeltReports(id as string);

  // Comments hook'unu kullan - sadece 3 yorum göster
  const {
    comments,
    isLoading: isLoadingComments,
    addComment,
    updateComment,
    deleteComment,
    isAddingComment,
    isUpdatingComment,
    error: commentsError,
  } = useEarthquakeComments(id as string, 3);

  // Tüm yorumları al (limit olmadan) - sadece sayı için
  const {
    comments: allComments,
  } = useEarthquakeComments(id as string);

  // Loading durumu
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Deprem verisi yükleniyor...</Text>
      </View>
    );
  }

  // Error durumu
  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={[styles.loadingText, { color: "red", marginBottom: 20 }]}>
          {error instanceof Error ? error.message : "Bir hata oluştu"}
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 8,
          }}
          onPress={() => refetch()}
        >
          <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "600" }}>
            Tekrar Dene
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Deprem bulunamadı durumu
  if (!earthquake) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Deprem verisi bulunamadı.</Text>
      </View>
    );
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      Alert.alert("Uyarı", "Lütfen bir yorum yazın.");
      return;
    }

    try {
      console.log('Starting to add comment...');
      await addComment(newComment.trim());
      setNewComment("");
      Alert.alert("Başarılı", "Yorumunuz eklendi.");
    } catch (error) {
      console.error('handleAddComment error:', error);
      
      // Detaylı hata mesajı
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



  // Typing effect fonksiyonu
  const typeText = (text: string, speed: number = 50) => {
    setIsTypingAI(true);
    setDisplayedAIComment('');
    let index = 0;
    
    const typeInterval = setInterval(() => {
      if (index < text.length) {
        setDisplayedAIComment(text.substring(0, index + 1));
        index++;
      } else {
        clearInterval(typeInterval);
        setIsTypingAI(false);
      }
    }, speed);
  };

  // Gemini AI ile deprem yorumu oluşturma fonksiyonu
  const generateAIComment = async () => {
    if (!earthquake) return;
    
    try {
      setIsGeneratingAI(true);
      
      const genAI = new GoogleGenerativeAI("AIzaSyA9gguZnXbvAcOmVvDxTm1vNVeIqOYfejA");
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      
      // Deprem verilerini hazırla
      const earthquakeData = {
        title: earthquake.title,
        magnitude: earthquake.mag,
        depth: earthquake.depth,
        date: earthquake.date,
        region: earthquake.region,
        faultline: earthquake.faultline,
        latitude: earthquake.latitude,
        longitude: earthquake.longitude,
        provider: earthquake.provider
      };
      
      const prompt = `
        Aşağıdaki deprem verilerini analiz ederek, tam olarak 4-5 cümlelik kısa bir yorum oluştur:
        
        Deprem Bilgileri:
        - Başlık: ${earthquakeData.title}
        - Büyüklük: ${earthquakeData.magnitude}
        - Derinlik: ${earthquakeData.depth} km
        - Tarih: ${earthquakeData.date}
        - Bölge: ${earthquakeData.region}
        - Fay Hattı: ${earthquakeData.faultline || 'Belirtilmemiş'}
        - Koordinatlar: ${earthquakeData.latitude}, ${earthquakeData.longitude}
        - Kaynak: ${earthquakeData.provider}
        
        ÖNEMLİ: Yanıtını tam olarak 4-5 cümle ile sınırla. Daha uzun yanıt verme.
        
        Bu deprem verilerini analiz ederek kısa bir yorum yap:
        1. Depremin genel karakteristiği
        2. Büyüklük ve derinlik değerlendirmesi
        3. Bölgesel etki potansiyeli
        4. Kısa bir güvenlik önerisi
        
        Yanıtı Türkçe olarak, tam olarak 4-5 cümlelik bir paragraf halinde ver. Daha uzun yanıt verme.
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      
      // Metni temizle ve formatla
      text = text.trim()
        .replace(/\s+/g, ' ') // Birden fazla boşluğu tek boşluğa çevir
        .replace(/\n+/g, ' ') // Satır sonlarını boşluğa çevir
        .replace(/\s+([.!?])(?!\d)/g, '$1') // Noktalama işaretlerinden önceki boşlukları kaldır (sayı değilse)
        .replace(/([.!?])(?!\d)\s*/g, '$1 ') // Noktalama işaretlerinden sonra tek boşluk bırak (sayı değilse)
        .trim();
      
      // Cümle sayısını kontrol et ve sınırla
      const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
      if (sentences.length > 5) {
        text = sentences.slice(0, 5).join('. ') + '.';
      }
      
      setAiCommentText(text);
      setShowAIComment(true);
      
      // Typing effect başlat
      setTimeout(() => {
        typeText(text, 40);
      }, 200);
      
    } catch (error) {
      console.error('AI yorum oluşturma hatası:', error);
      setAiCommentText('AI yorumu oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
      setShowAIComment(true);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#1a365d" />

      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          bounces={false}
          // YENİ: Pull to refresh
          // refreshControl={
          //   <RefreshControl
          //     refreshing={isFetching}
          //     onRefresh={() => refetch()}
          //     colors={[colors.primary]}
          //     tintColor={colors.primary}
          //   />
          // }
        >
          {/* Hero Header */}
          <View
            style={[
              styles.heroHeader,
              { backgroundColor: getMagnitudeColor(earthquake.mag) },
            ]}
          >
            <View style={styles.heroContent}>
              <View style={styles.magnitudeDisplay}>
                <Text style={styles.magnitudeNumber}>
                  {earthquake.mag.toFixed(1)}
                </Text>
                <View style={styles.magnitudeBadge}>
                  <Text style={styles.magnitudeBadgeText}>
                    {getMagnitudeLabel(earthquake.mag)}
                  </Text>
                </View>
              </View>
              <View style={styles.heroInfo}>
                <Text style={styles.heroTitle}>{earthquake.title}</Text>
                <View style={styles.timeAgo}>
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color="rgba(255,255,255,0.8)"
                  />
                  <Text style={styles.timeAgoText}>
                    {formatDate(earthquake.date)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.content}>
            {/* Quick Stats */}
            <View style={styles.quickStats}>
              <View style={styles.statItem}>
                <Ionicons
                  name="layers-outline"
                  size={20}
                  color={getMagnitudeColor(earthquake.mag)}
                />
                <Text style={styles.statValue}>{earthquake.depth} km</Text>
                <Text style={styles.statLabel}>Derinlik</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons
                  name="people-outline"
                  size={20}
                  color={getMagnitudeColor(earthquake.mag)}
                />
                <Text style={styles.statValue}>
                  {isLoadingFeltReports ? "..." : stats?.total_reports || 0}
                </Text>
                <Text style={styles.statLabel}>Hisseden</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color={getMagnitudeColor(earthquake.mag)}
                />
                <Text style={styles.statValue}>{earthquake.provider}</Text>
                <Text style={styles.statLabel}>Kaynak</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.feelButton,
                stats?.user_has_reported && styles.feelButtonPressed,
                isUpdating && styles.feelButtonDisabled,
              ]}
              onPress={async () => {
                try {
                  await toggleFeltReport();
                } catch (error) {
                  Alert.alert(
                    "Hata",
                    error instanceof Error ? error.message : "Bir hata oluştu",
                    [{ text: "Tamam" }]
                  );
                }
              }}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text
                  style={[
                    styles.feelButtonText,
                    stats?.user_has_reported && styles.feelButtonTextPressed,
                  ]}
                >
                  {stats?.user_has_reported
                    ? "Depremi Hissettim ✓"
                    : "Depremi Hissetin Mi?"}
                </Text>
              )}
            </TouchableOpacity>

            {/* Map Section */}
            <View style={styles.mapSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="location-outline" size={22} color="#2d3748" />
                <Text style={styles.sectionTitle}>Deprem Konumu</Text>
              </View>

              {earthquake.longitude !== 0 && earthquake.latitude !== 0 ? (
                <View style={styles.mapContainer}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() =>
                      openInExternalMap(
                        earthquake.latitude,
                        earthquake.longitude,
                        earthquake.title
                      )
                    }
                  >
                    <MapView
                      style={styles.map}
                      initialRegion={{
                        latitude: earthquake.latitude,
                        longitude: earthquake.longitude,
                        latitudeDelta: 0.5,
                        longitudeDelta: 0.5,
                      }}
                      scrollEnabled={false}
                      zoomEnabled={false}
                      pitchEnabled={false}
                      rotateEnabled={false}
                      onPress={() =>
                        openInExternalMap(
                          earthquake.latitude,
                          earthquake.longitude,
                          earthquake.title
                        )
                      }
                    >
                      <Marker
                        coordinate={{
                          latitude: earthquake.latitude,
                          longitude: earthquake.longitude,
                        }}
                        pinColor={getMagnitudeColor(earthquake.mag)}
                        onPress={() =>
                          openInExternalMap(
                            earthquake.latitude,
                            earthquake.longitude,
                            earthquake.title
                          )
                        }
                      />
                    </MapView>
                  </TouchableOpacity>

                  {/* Harita tıklama ipucu */}
                  <TouchableOpacity
                    style={styles.mapOverlay}
                    onPress={() =>
                      openInExternalMap(
                        earthquake.latitude,
                        earthquake.longitude,
                        earthquake.title
                      )
                    }
                    activeOpacity={0.7}
                  >
                    <View style={styles.mapOverlayContent}>
                      <Ionicons name="open-outline" size={16} color="#6b7280" />
                      <Text style={styles.mapOverlayText}>
                        Harita uygulamasında aç
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.coordinatesContainer}>
                    <Ionicons name="navigate-outline" size={16} color="#6b7280" />
                    <Text style={styles.coordinates}>
                      {earthquake.latitude.toFixed(4)},{" "}
                      {earthquake.longitude.toFixed(4)}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.noLocationContainer}>
                  <Ionicons name="location-outline" size={48} color="#cbd5e0" />
                  <Text style={styles.noLocationText}>
                    Konum bilgisi bulunamadı
                  </Text>
                </View>
              )}
            </View>

            {/* Detailed Information */}
            <View style={styles.detailsSection}>
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="information-circle-outline"
                  size={22}
                  color="#2d3748"
                />
                <Text style={styles.sectionTitle}>Detaylı Bilgiler</Text>
              </View>

              <View style={styles.detailGrid}>
                <View style={styles.detailItem}>
                  <View style={styles.detailIcon}>
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color={getMagnitudeColor(earthquake.mag)}
                    />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Tarih</Text>
                    <Text style={styles.detailValue}>
                      {new Date(earthquake.date).toLocaleDateString("tr-TR", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailItem}>
                  <View style={styles.detailIcon}>
                    <Ionicons
                      name="time-outline"
                      size={20}
                      color={getMagnitudeColor(earthquake.mag)}
                    />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Saat</Text>
                    <Text style={styles.detailValue}>
                      {new Date(earthquake.date).toLocaleTimeString("tr-TR", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </Text>
                  </View>
                </View>

                {earthquake.faultline && (
                  <View style={styles.detailItem}>
                    <View style={styles.detailIcon}>
                      <Ionicons
                        name="git-branch-outline"
                        size={20}
                        color={getMagnitudeColor(earthquake.mag)}
                      />
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Fay Hattı</Text>
                      <Text style={styles.detailValue}>
                        {earthquake.faultline}
                      </Text>
                    </View>
                  </View>
                )}
                {earthquake.region && (
                  <View style={styles.detailItem}>
                    <View style={styles.detailIcon}>
                      <Ionicons
                        name="location-outline"
                        size={20}
                        color={getMagnitudeColor(earthquake.mag)}
                      />
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Bölge</Text>
                      <Text style={styles.detailValue}>{earthquake.region}</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Impact Assessment */}
            <View style={styles.impactSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="analytics-outline" size={22} color="#2d3748" />
                <Text style={styles.sectionTitle}>Etki Değerlendirmesi</Text>
              </View>

              <View style={styles.impactCard}>
                <View
                  style={[
                    styles.impactHeader,
                    { backgroundColor: `${getMagnitudeColor(earthquake.mag)}15` },
                  ]}
                >
                  <Text
                    style={[
                      styles.impactTitle,
                      { color: getMagnitudeColor(earthquake.mag) },
                    ]}
                  >
                    {getMagnitudeLabel(earthquake.mag)} Şiddette Deprem
                  </Text>
                </View>

                <View style={styles.impactContent}>
                  <Text style={styles.impactDescription}>
                    Bu deprem {earthquake.mag.toFixed(1)} büyüklüğünde kaydedilmiş
                    olup, {earthquake.depth} km derinliğinde gerçekleşmiştir.
                    {earthquake.mag >= 4.0
                      ? " Bu şiddetteki depremler genellikle geniş bir alanda hissedilir ve hafif hasarlara neden olabilir."
                      : earthquake.mag >= 3.0
                      ? " Bu şiddetteki depremler genellikle sadece yakın çevrede hissedilir."
                      : " Bu şiddetteki depremler genellikle sadece hassas cihazlarla tespit edilir."}
                  </Text>

                  <View style={styles.impactMetrics}>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricValue}>
                        {Math.floor(Math.random() * 50) + 10} km
                      </Text>
                      <Text style={styles.metricLabel}>Hissedilme Yarıçapı</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricValue}>
                        {Math.floor(Math.random() * 10) + 1}
                      </Text>
                      <Text style={styles.metricLabel}>Mercalli Şiddeti</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* AI Comment Section */}
            <View style={styles.aiCommentSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="sparkles-outline" size={22} color="#2d3748" />
                <Text style={styles.sectionTitle}>Terra AI Deprem Yorumu</Text>
              </View>

              {!showAIComment ? (
                <TouchableOpacity
                  style={styles.aiCommentButton}
                  onPress={generateAIComment}
                  disabled={isGeneratingAI}
                >
                  {isGeneratingAI ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Ionicons name="sparkles" size={20} color="#ffffff" />
                      <Text style={styles.aiCommentButtonText}>
                        Yorumu Gör
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <View style={styles.aiCommentContent}>
                  <View style={styles.aiCommentHeader}>
                    <Ionicons name="sparkles" size={20} color={colors.primary} />
                    <Text style={styles.aiCommentTitle}>Terra AI Analizi</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setShowAIComment(false);
                        setDisplayedAIComment('');
                        setAiCommentText('');
                        setIsTypingAI(false);
                      }}
                      style={styles.closeAICommentButton}
                    >
                      <Ionicons name="close" size={18} color="#6b7280" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.aiCommentTextContainer}>
                    <Text style={styles.aiCommentText}>
                      {displayedAIComment}
                      {isTypingAI && <Text style={styles.typingCursor}>|</Text>}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Comments Section */}
            <View style={styles.commentsSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="chatbubbles-outline" size={22} color="#2d3748" />
                <Text style={styles.sectionTitle}>
                  Yorumlar ({comments?.length || 0})
                </Text>
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
                {isLoadingComments ? (
                  <View style={styles.commentsLoading}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.commentsLoadingText}>Yorumlar yükleniyor...</Text>
                  </View>
                ) : comments && comments.length > 0 ? (
                  <>
                    {comments.map((comment: any) => (
                      <CommentItem
                        key={comment.id}
                        comment={comment}
                        onEdit={handleEditComment}
                        onDelete={handleDeleteComment}
                        isOwnComment={comment.is_own_comment}
                      />
                    ))}
                    
                    {/* View All Comments Button - sadece 3'ten fazla yorum varsa göster */}
                    {allComments && allComments.length > 3 && (
                      <TouchableOpacity
                        style={styles.viewAllCommentsButton}
                        onPress={() => {
                          console.log('Navigating to all-comments with params:', {
                            earthquakeId: id,
                            earthquakeTitle: earthquake.title,
                          });
                          try {
                            router.push({
                              pathname: "/(protected)/(tabs)/earthquakes/all-comments",
                              params: {
                                earthquakeId: id as string,
                                earthquakeTitle: earthquake.title,
                              },
                            });
                          } catch (error) {
                            console.error('Navigation error:', error);
                            Alert.alert('Hata', 'Sayfa açılırken bir hata oluştu.');
                          }
                        }}
                      >
                        <Text style={styles.viewAllCommentsText}>
                          Tüm Yorumları Gör ({allComments.length} yorum)
                        </Text>
                        <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                      </TouchableOpacity>
                    )}

                  </>
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
            </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "500",
    marginTop: 10,
  },
  heroHeader: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  heroContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  magnitudeDisplay: {
    alignItems: "center",
    marginRight: 20,
  },
  magnitudeNumber: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#ffffff",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  magnitudeBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  magnitudeBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  heroInfo: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
    lineHeight: 26,
  },
  heroDate: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 8,
  },
  timeAgo: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeAgoText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginLeft: 6,
  },
  content: {
    padding: 16,
  },
  quickStats: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginTop: -20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#e2e8f0",
    marginHorizontal: 16,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2d3748",
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  mapSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2d3748",
    marginLeft: 8,
  },
  mapContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    position: "relative",
  },
  map: {
    width: "100%",
    height: 220,
  },
  mapOverlay: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  mapOverlayContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  mapOverlayText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
    marginLeft: 4,
  },
  coordinatesContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "#f8fafc",
  },
  coordinates: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
    marginLeft: 6,
  },
  noLocationContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  noLocationText: {
    fontSize: 16,
    color: "#9ca3af",
    fontWeight: "500",
    marginTop: 12,
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailGrid: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 15,
    color: "#2d3748",
    fontWeight: "600",
  },
  impactSection: {
    marginBottom: 24,
  },
  impactCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  impactHeader: {
    padding: 16,
  },
  impactTitle: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  impactContent: {
    padding: 20,
  },
  impactDescription: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 22,
    marginBottom: 20,
    textAlign: "justify",
  },
  impactMetrics: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  metricItem: {
    alignItems: "center",
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2d3748",
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  feelButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    minHeight: 60,
  },
  feelButtonPressed: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  feelButtonDisabled: {
    opacity: 0.6,
  },
  feelButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "NotoSans-Bold",
  },
  feelButtonTextPressed: {
    color: "#ffffff",
  },
  // Comments Section Styles
  commentsSection: {
    marginBottom: 24,
  },
  addCommentContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
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
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 200, // Minimum yükseklik ekle
    marginBottom: 20, // Alt boşluk ekle
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
  viewAllCommentsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    backgroundColor: "#f8fafc",
    marginTop: 8,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  viewAllCommentsText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "600",
    marginRight: 8,
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
  // Edit Modal Styles
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
  // AI Comment Section Styles
  aiCommentSection: {
    marginBottom: 24,
  },
  aiCommentButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    minHeight: 60,
  },
  aiCommentButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "NotoSans-Bold",
    marginLeft: 8,
  },
  aiCommentContent: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  aiCommentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  aiCommentTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2d3748",
    flex: 1,
    marginLeft: 8,
  },
  closeAICommentButton: {
    padding: 4,
  },
  aiCommentTextContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  aiCommentText: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
    textAlign: "left",
    fontFamily: "NotoSans-Regular",
  },
  typingCursor: {
    color: colors.primary,
    fontWeight: 'bold',
  },
});