import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { NotificationSetting, NotificationSource } from '@/types/types';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { usePremium } from '@/hooks/usePremium';
import { LinearGradient } from 'expo-linear-gradient';
import PremiumFeatureGate from '@/components/PremiumFeatureGate';
// import turkeyCitiesData from '../../assets/data/turkey-cities-districts.json';

// Türkiye şehirleri - doğrudan tanımlama
const turkeyCities = [
  { id: 1, name: "Adana" },
  { id: 2, name: "Adıyaman" },
  { id: 3, name: "Afyonkarahisar" },
  { id: 4, name: "Ağrı" },
  { id: 5, name: "Amasya" },
  { id: 6, name: "Ankara" },
  { id: 7, name: "Antalya" },
  { id: 8, name: "Artvin" },
  { id: 9, name: "Aydın" },
  { id: 10, name: "Balıkesir" },
  { id: 11, name: "Bilecik" },
  { id: 12, name: "Bingöl" },
  { id: 13, name: "Bitlis" },
  { id: 14, name: "Bolu" },
  { id: 15, name: "Burdur" },
  { id: 16, name: "Bursa" },
  { id: 17, name: "Çanakkale" },
  { id: 18, name: "Çankırı" },
  { id: 19, name: "Çorum" },
  { id: 20, name: "Denizli" },
  { id: 21, name: "Diyarbakır" },
  { id: 22, name: "Edirne" },
  { id: 23, name: "Elazığ" },
  { id: 24, name: "Erzincan" },
  { id: 25, name: "Erzurum" },
  { id: 26, name: "Eskişehir" },
  { id: 27, name: "Gaziantep" },
  { id: 28, name: "Giresun" },
  { id: 29, name: "Gümüşhane" },
  { id: 30, name: "Hakkari" },
  { id: 31, name: "Hatay" },
  { id: 32, name: "Isparta" },
  { id: 33, name: "Mersin" },
  { id: 34, name: "İstanbul" },
  { id: 35, name: "İzmir" },
  { id: 36, name: "Kars" },
  { id: 37, name: "Kastamonu" },
  { id: 38, name: "Kayseri" },
  { id: 39, name: "Kırklareli" },
  { id: 40, name: "Kırşehir" },
  { id: 41, name: "Kocaeli" },
  { id: 42, name: "Konya" },
  { id: 43, name: "Kütahya" },
  { id: 44, name: "Malatya" },
  { id: 45, name: "Manisa" },
  { id: 46, name: "Kahramanmaraş" },
  { id: 47, name: "Mardin" },
  { id: 48, name: "Muğla" },
  { id: 49, name: "Muş" },
  { id: 50, name: "Nevşehir" },
  { id: 51, name: "Niğde" },
  { id: 52, name: "Ordu" },
  { id: 53, name: "Rize" },
  { id: 54, name: "Sakarya" },
  { id: 55, name: "Samsun" },
  { id: 56, name: "Siirt" },
  { id: 57, name: "Sinop" },
  { id: 58, name: "Sivas" },
  { id: 59, name: "Tekirdağ" },
  { id: 60, name: "Tokat" },
  { id: 61, name: "Trabzon" },
  { id: 62, name: "Tunceli" },
  { id: 63, name: "Şanlıurfa" },
  { id: 64, name: "Uşak" },
  { id: 65, name: "Van" },
  { id: 66, name: "Yozgat" },
  { id: 67, name: "Zonguldak" },
  { id: 68, name: "Aksaray" },
  { id: 69, name: "Bayburt" },
  { id: 70, name: "Karaman" },
  { id: 71, name: "Kırıkkale" },
  { id: 72, name: "Batman" },
  { id: 73, name: "Şırnak" },
  { id: 74, name: "Bartın" },
  { id: 75, name: "Ardahan" },
  { id: 76, name: "Iğdır" },
  { id: 77, name: "Yalova" },
  { id: 78, name: "Karabük" },
  { id: 79, name: "Kilis" },
  { id: 80, name: "Osmaniye" },
  { id: 81, name: "Düzce" }
];

const notificationSources: NotificationSource[] = [
  {
    id: '1',
    name: 'Kandilli Rasathanesi',
    code: 'kandilli',
    description: 'Boğaziçi Üniversitesi Kandilli Rasathanesi ve Deprem Araştırma Enstitüsü'
  },
  {
    id: '2',
    name: 'AFAD',
    code: 'afad',
    description: 'Afet ve Acil Durum Yönetimi Başkanlığı'
  },
  {
    id: '3',
    name: 'USGS',
    code: 'usgs',
    description: 'United States Geological Survey - Global Deprem Verileri'
  },
  {
    id: '4',
    name: 'EMSC',
    code: 'emsc',
    description: 'European-Mediterranean Seismological Centre'
  },
  {
    id: '5',
    name: 'IRIS',
    code: 'iris',
    description: 'Incorporated Research Institutions for Seismology'
  },
  {
    id: '6',
    name: 'Tümü',
    code: 'all',
    description: 'Tüm kaynaklardan gelen bildirimler'
  }
];

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [dummyToggleValue, setDummyToggleValue] = useState(true);
  const { hasAccessToFeature } = usePremium();
  
  const {
    notifications,
    isLoading,
    updateNotification,
    deleteNotification,
    toggleNotification,
    isUpdating,
    isDeleting,
    isToggling,
  } = useNotificationSettings();


  
  // Success mesajları için useEffect
  useEffect(() => {
    if (!isUpdating) {
      // Mutation tamamlandığında success mesajı göster
      if (editingNotification) {
        Alert.alert('Başarılı', 'Bildirim güncellendi.');
      }
    }
  }, [isUpdating]);
  
  const [editingNotification, setEditingNotification] = useState<NotificationSetting | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  
  // Düzenleme formu state'leri
  const [editNotificationName, setEditNotificationName] = useState('');
  const [editSelectedSources, setEditSelectedSources] = useState<string[]>(['all']);
  const [editMagnitudeRange, setEditMagnitudeRange] = useState({ min: 3.0, max: 10.0 });
  const [editLocationType, setEditLocationType] = useState<'all' | 'cities'>('all');
  const [editSelectedCities, setEditSelectedCities] = useState<string[]>([]);
  const [showEditCitySelector, setShowEditCitySelector] = useState(false);

  const saveEditNotification = async () => {
    if (!editNotificationName.trim()) {
      Alert.alert('Hata', 'Bildirim adı boş olamaz.');
      return;
    }

    const notificationData = {
      name: editNotificationName.trim(),
      isActive: true,
      sources: editSelectedSources,
      magnitudeRange: editMagnitudeRange,
      location: {
        type: editLocationType,
        cities: editLocationType === 'cities' ? editSelectedCities : undefined,
      },
    };

    try {
      if (editingNotification) {
        updateNotification({ id: editingNotification.id, ...notificationData });
      }
      setIsEditModalVisible(false);
      setEditingNotification(null);
      resetEditForm();
    } catch (error) {
      console.error('Bildirim kaydedilirken hata:', error);
      Alert.alert('Hata', 'Bildirim kaydedilirken bir hata oluştu.');
    }
  };

  const handleToggleNotification = (notification: NotificationSetting) => {
    toggleNotification({ id: notification.id, isActive: !notification.isActive });
  };

  const handleDeleteNotification = (notification: NotificationSetting) => {
    Alert.alert(
      'Bildirimi Sil',
      'Bu bildirimi silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => {
            deleteNotification(notification.id);
          },
        },
      ]
    );
  };

  const editNotification = (notification: NotificationSetting) => {
    setEditingNotification(notification);
    setEditNotificationName(notification.name);
    setEditSelectedSources(notification.sources);
    setEditMagnitudeRange(notification.magnitudeRange);
    setEditLocationType(notification.location.type);
    setEditSelectedCities(notification.location.cities || []);
    setIsEditModalVisible(true);
  };

  const resetEditForm = () => {
    setEditNotificationName('');
    setEditSelectedSources(['all']);
    setEditMagnitudeRange({ min: 3.0, max: 10.0 });
    setEditLocationType('all');
    setEditSelectedCities([]);
  };



  const toggleEditSource = (sourceCode: string) => {
    if (sourceCode === 'all') {
      setEditSelectedSources(['all']);
    } else {
      setEditSelectedSources(prev => {
        const newSources = prev.filter(s => s !== 'all');
        if (newSources.includes(sourceCode)) {
          return newSources.filter(s => s !== sourceCode);
        } else {
          return [...newSources, sourceCode];
        }
      });
    }
  };

  const getSourceName = (sourceCode: string) => {
    const source = notificationSources.find(s => s.code === sourceCode);
    return source?.name || sourceCode;
  };

  const getLocationText = (notification: NotificationSetting) => {
    if (notification.location.type === 'all') return 'Tüm Konumlar';
    if (notification.location.type === 'cities') {
      const cityCount = notification.location.cities?.length || 0;
      return `${cityCount} şehir seçildi`;
    }
    return 'Tüm Konumlar';
  };





  const getEditSelectedCitiesText = () => {
    if (editSelectedCities.length === 0) return 'Şehir seçin';
    if (editSelectedCities.length === 1) return editSelectedCities[0];
    return `${editSelectedCities.length} şehir seçildi`;
  };




  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bildirim Ayarları</Text>
        <TouchableOpacity
          style={[
            styles.addButton,
            !hasAccessToFeature('smart-notification-engine') && styles.lockedButton
          ]}
          onPress={() => {
            if (hasAccessToFeature('smart-notification-engine')) {
              router.push("/(protected)/create-notification-wizard");
            } else {
              router.push('/(protected)/premium-packages');
            }
          }}
        >
          {hasAccessToFeature('smart-notification-engine') ? (
            <Ionicons name="add" size={24} color={colors.primary} />
          ) : (
            <Ionicons name="lock-closed" size={20} color={colors.premium.primary} />
          )}
        </TouchableOpacity>
      </View>



      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Bilgilendirme Kartı */}
        <View style={styles.infoCard}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.infoGradient}
          >
            <Ionicons name="notifications" size={24} color="#fff" />
            <Text style={styles.infoTitle}>Özelleştirilebilir Bildirimler</Text>
            <Text style={styles.infoDescription}>
              Deprem bildirimlerinizi kişiselleştirin. Kaynak, büyüklük ve konum filtrelerini ayarlayarak size özel bildirimler oluşturun.
            </Text>
          </LinearGradient>
        </View>

        {/* Bildirimler Listesi */}
        <View style={styles.notificationsSection}>
          <Text style={styles.sectionTitle}>Bildirimleriniz</Text>
          
          {/* Dummy Bildirim - Test İçin */}
          <View style={styles.notificationCard}>
            <View style={styles.notificationHeader}>
              <View style={styles.notificationInfo}>
                <Text style={styles.notificationName}>Örnek Bildirim</Text>
                <Text style={styles.notificationDetails}>
                  AFAD, Kandilli • 3.0-8.0 büyüklük • İstanbul, Ankara, İzmir
                </Text>
              </View>
              <Switch
                value={dummyToggleValue}
                onValueChange={setDummyToggleValue}
                trackColor={{ false: colors.gray, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
            
            <View style={styles.notificationActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {}}
              >
                <Ionicons name="create-outline" size={16} color={colors.primary} />
                <Text style={styles.actionButtonText}>Düzenle</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => {}}
              >
                <Ionicons name="trash-outline" size={16} color={colors.error} />
                <Text style={[styles.actionButtonText, { color: colors.error }]}>Sil</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {isLoading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Bildirimler yükleniyor...</Text>
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off" size={48} color={colors.gray} />
              <Text style={styles.emptyStateTitle}>Henüz bildirim oluşturmadınız</Text>
              <Text style={styles.emptyStateDescription}>
                İlk bildiriminizi oluşturmak için yukarıdaki + butonuna tıklayın.
              </Text>
            </View>
          ) : (
            notifications.map((notification) => (
              <View key={notification.id} style={styles.notificationCard}>
                <View style={styles.notificationHeader}>
                  <View style={styles.notificationInfo}>
                    <Text style={styles.notificationName}>{notification.name}</Text>
                    <Text style={styles.notificationDetails}>
                      {notification.sources.map(getSourceName).join(', ')} • {notification.magnitudeRange.min}-{notification.magnitudeRange.max} büyüklük • {getLocationText(notification)}
                    </Text>
                  </View>
                                     <Switch
                     value={notification.isActive}
                     onValueChange={() => handleToggleNotification(notification)}
                     trackColor={{ false: colors.gray, true: colors.primary }}
                     thumbColor="#fff"
                   />
                </View>
                
                <View style={styles.notificationActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => editNotification(notification)}
                  >
                    <Ionicons name="create-outline" size={16} color={colors.primary} />
                    <Text style={styles.actionButtonText}>Düzenle</Text>
                  </TouchableOpacity>
                  
                                     <TouchableOpacity
                     style={[styles.actionButton, styles.deleteButton]}
                     onPress={() => handleDeleteNotification(notification)}
                   >
                    <Ionicons name="trash-outline" size={16} color={colors.error} />
                    <Text style={[styles.actionButtonText, { color: colors.error }]}>Sil</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>




    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  addButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  infoCard: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  infoGradient: {
    padding: 20,
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 10,
    textAlign: 'center',
  },
  infoDescription: {
    fontSize: 14,
    color: '#fff',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  notificationsSection: {
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 15,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginTop: 15,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: colors.gray,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: colors.gray,
    marginTop: 15,
  },
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notificationInfo: {
    flex: 1,
    marginRight: 15,
  },
  notificationName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  notificationDetails: {
    fontSize: 12,
    color: colors.gray,
    marginTop: 4,
  },
  notificationActions: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  deleteButton: {
    marginLeft: 'auto',
  },
  actionButtonText: {
    fontSize: 14,
    color: colors.primary,
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalCloseButton: {
    padding: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  modalSaveButton: {
    padding: 5,
  },
  modalSaveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  formSection: {
    marginTop: 25,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sourceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sourceOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  sourceOptionContent: {
    flex: 1,
  },
  sourceOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  sourceOptionTextSelected: {
    color: colors.primary,
  },
  sourceOptionDescription: {
    fontSize: 12,
    color: colors.gray,
    marginTop: 2,
  },
  sliderContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderThumb: {
    backgroundColor: colors.primary,
  },
  locationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  locationOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginLeft: 12,
  },
  locationOptionTextSelected: {
    color: colors.primary,
  },
  citySelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 8,
  },
  citySelectorButtonText: {
    fontSize: 16,
    color: colors.text,
  },
  citySelectorContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  citySelectorInfo: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 15,
    textAlign: 'center',
  },
  cityItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cityItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  cityItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cityItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  cityItemTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  lockedButton: {
    backgroundColor: colors.premium.light,
    borderWidth: 1,
    borderColor: colors.premium.primary,
  },

}); 