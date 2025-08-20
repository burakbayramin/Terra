import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  Platform,
  ActivityIndicator,
  Dimensions,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Ionicons,
  MaterialCommunityIcons,
  Feather,
  AntDesign,
} from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useLocation } from '@/hooks/useLocation';
import Toast from '@/components/Toast';

const { width } = Dimensions.get('window');

export default function EmergencyNotificationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { getAndSaveLocation, hasPermission } = useLocation();
  
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [locationShared, setLocationShared] = useState(false);
  const [statusUpdated, setStatusUpdated] = useState(false);
  
  // Ana tehlikedeyim bildirimi için state'ler
  const [countdownActive, setCountdownActive] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(5);
  const borderBlinkAnim = useRef(new Animated.Value(0)).current;
  // Koordinat gönderme varsayılan ve tek seçim
  const shareCoordinates = true;
  const updateNetworkStatus = true;
  const sendNetworkNotification = true;
  
  // Toast state
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'success' as 'success' | 'error' | 'info'
  });

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  // Countdown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (countdownActive && countdownSeconds > 0) {
      // Countdown timer
      interval = setInterval(() => {
        setCountdownSeconds(prev => {
                      if (prev <= 1) {
              // Countdown bitti, SMS gönder
              showToast('Countdown tamamlandı, SMS gönderiliyor...', 'info');
              handleEmergencySMS();
              setCountdownActive(false);
              setCountdownSeconds(5);
              // Animasyonu durdur ve başlangıç durumuna getir
              Animated.timing(borderBlinkAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: false,
              }).start();
              return 5;
            }
          return prev - 1;
        });
      }, 1000);
      
      // Smooth border blink effect - 1 saniyede iki yönlü
      Animated.loop(
        Animated.sequence([
          Animated.timing(borderBlinkAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(borderBlinkAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: false,
          }),
        ])
      ).start();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [countdownActive, countdownSeconds, borderBlinkAnim]);

  const fetchUserData = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) {
        console.error('Kullanıcı bilgileri alınamadı:', error);
        return;
      }

      setUserData(data);
    } catch (error) {
      console.error('Veri alma hatası:', error);
    }
  };

  // Show toast function
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({
      visible: true,
      message,
      type
    });
  };

  // Hide toast function
  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  // Ana tehlikedeyim bildirimi handler
  const handleMainEmergencyPress = () => {
    if (!countdownActive) {
      // İlk tıklama - countdown başlat
      setCountdownActive(true);
      setCountdownSeconds(5);
      // Smooth border fade in
      Animated.timing(borderBlinkAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
      // Toast mesajı göster
      showToast('Tehlikedeyim Bildirimi Başlatıldı', 'info');
    } else {
      // İkinci tıklama - iptal et
      setCountdownActive(false);
      setCountdownSeconds(5);
      // Smooth border fade out
      Animated.timing(borderBlinkAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
      // Toast mesajı göster
      showToast('Tehlikedeyim bildirimi iptal edildi', 'success');
    }
  };

  // Acil durum SMS gönderme fonksiyonu
  const handleEmergencySMS = async () => {
    try {
      setLoading(true);

      if (!userData?.emergency_phone) {
        showToast('Acil durum kişisi bulunamadı. Lütfen profil ayarlarınızdan ekleyin.', 'error');
        return;
      }

      // SMS mesajını oluştur
      let message = `ACİL DURUM! ${userData.name || 'Bilinmeyen'} ${userData.surname || ''}. Tehlikedeyim!`;
      
      if (shareCoordinates && userData.latitude && userData.longitude) {
        message += ` Son koordinatlarım: ${userData.latitude.toFixed(6)}, ${userData.longitude.toFixed(6)}.`;
      }
      
      message += ` Kayıtlı adresim: ${userData.city || 'Bilinmeyen'} / ${userData.district || 'Bilinmeyen'}.`;

      let phoneNumber = userData.emergency_phone;
      if (!phoneNumber.startsWith('+')) {
        phoneNumber = '+90' + phoneNumber;
      }

      let smsUrl;
      if (Platform.OS === 'ios') {
        smsUrl = `sms:${phoneNumber}&body=${encodeURIComponent(message)}`;
      } else {
        smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
      }

      const canOpen = await Linking.canOpenURL(smsUrl);
      if (canOpen) {
        await Linking.openURL(smsUrl);
        showToast('Tehlikedeyim bildirimi başarıyla gönderildi!', 'success');
      } else {
        showToast('SMS uygulaması açılamadı', 'error');
      }

    } catch (error) {
      console.error('SMS gönderme hatası:', error);
      showToast('SMS gönderilirken bir hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 112 Ara
  const callEmergency = () => {
    Alert.alert(
      '112 Acil Servis',
      '112 acil servisi aranacak. Devam etmek istiyor musunuz?',
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Ara',
          onPress: () => {
            const phoneNumber = '112';
            const url = Platform.OS === 'ios' ? `tel:${phoneNumber}` : `tel:${phoneNumber}`;
            Linking.openURL(url);
          },
        },
      ]
    );
  };

  // Konumumu Paylaş
  const shareLocation = async () => {
    try {
      setLoading(true);
      
      if (!hasPermission) {
        Alert.alert(
          'Konum İzni Gerekli',
          'Konumunuzu paylaşabilmek için konum izni gereklidir.',
          [
            { text: 'İptal', style: 'cancel' },
            { text: 'İzin Ver', onPress: () => router.push('/(protected)/profile/profile-settings') }
          ]
        );
        return;
      }

      const success = await getAndSaveLocation();
      if (success) {
        setLocationShared(true);
        Alert.alert(
          'Başarılı',
          'Konumunuz başarıyla paylaşıldı ve kaydedildi.',
          [{ text: 'Tamam' }]
        );
      } else {
        Alert.alert('Hata', 'Konum paylaşılamadı. Lütfen tekrar deneyin.');
      }
    } catch (error) {
      console.error('Konum paylaşma hatası:', error);
      Alert.alert('Hata', 'Konum paylaşılırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Tehlikedeyim Bildirimi SMS (Eski fonksiyon - artık kullanılmıyor)
  const sendEmergencySMS = async () => {
    // Bu fonksiyon artık kullanılmıyor, yeni handleEmergencySMS fonksiyonu kullanılıyor
    Alert.alert('Bilgi', 'Lütfen ana "Tehlikedeyim Bildirimi Yap" butonunu kullanın.');
  };

  // Statümü Tehlikede Olarak Güncelle
  const updateStatus = async () => {
    try {
      setLoading(true);
      
      // Burada kullanıcının durumunu "tehlikede" olarak güncelleyebilirsiniz
      // Örneğin, bir emergency_status tablosuna kayıt ekleyebilir veya
      // profiles tablosundaki bir alanı güncelleyebilirsiniz
      
      // Örnek: Emergency status kaydı ekleme
      const { error } = await supabase
        .from('emergency_status')
        .insert({
          profile_id: user?.id,
          status: 'in_danger',
          created_at: new Date().toISOString(),
          location: userData?.city + ', ' + userData?.district,
        });

      if (error) {
        console.error('Durum güncelleme hatası:', error);
        Alert.alert('Hata', 'Durum güncellenirken bir hata oluştu.');
        return;
      }

      setStatusUpdated(true);
      Alert.alert(
        'Başarılı',
        'Durumunuz "Tehlikede" olarak güncellendi.',
        [{ text: 'Tamam' }]
      );
    } catch (error) {
      console.error('Durum güncelleme hatası:', error);
      Alert.alert('Hata', 'Durum güncellenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ACİL DURUM BİLDİRİMİ</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Tehlike İkonu */}
        <View style={styles.dangerIconContainer}>
          <MaterialCommunityIcons 
            name="alert-octagon" 
            size={100} 
            color="#fff" 
          />
        </View>

        {/* Tehlikedeyim Bildirimi Ana Butonu */}
        <View style={styles.mainEmergencyContainer}>
                                <TouchableOpacity
            style={[
              styles.mainEmergencyButton,
              countdownActive && styles.mainEmergencyButtonCountdown,
            ]}
            onPress={handleMainEmergencyPress}
            activeOpacity={0.8}
          >
            <Animated.View
              style={[
                styles.mainEmergencyButtonBorder,
                {
                  borderColor: borderBlinkAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 1)'],
                  }),
                  borderWidth: borderBlinkAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 3],
                  }),
                },
              ]}
            >
              <LinearGradient
                colors={countdownActive ? ['#660000', '#4a0000'] : ['#8b0000', '#660000']}
                style={[
                  styles.mainEmergencyGradient,
                  countdownActive && styles.mainEmergencyGradientCountdown
                ]}
              >
                <View style={styles.mainEmergencyContent}>
                  <Text style={styles.mainEmergencyTitle}>
                    TEHLİKEDEYİM!
                  </Text>
                  {countdownActive && (
                    <View style={styles.countdownContainer}>
                      <View style={styles.countdownCircle}>
                        <Text style={styles.countdownText}>{countdownSeconds}</Text>
                      </View>
                      <Text style={styles.countdownLabel}>saniye</Text>
                      <Text style={styles.countdownInfoText}>
                        İptal etmek için tekrar tıklayın
                      </Text>
                    </View>
                  )}
                </View>
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>




        </View>

        {/* 112 Ara - Sadece Ana Buton */}
        <View style={styles.quickEmergencyContainer}>
          <TouchableOpacity
            style={styles.quickEmergencyButton}
            onPress={callEmergency}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#c0392b', '#a93226']}
              style={styles.quickEmergencyGradient}
            >
              <View style={styles.quickEmergencyContent}>
                <Ionicons name="call" size={32} color="#fff" />
                <Text style={styles.quickEmergencyText}>112 ARA</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Emergency Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.sectionTitle}>ACİL DURUM TALİMATLARI</Text>
          
          <View style={styles.instructionCard}>
            <View style={styles.instructionHeader}>
              <Ionicons name="information-circle" size={24} color="#e74c3c" />
              <Text style={styles.instructionTitle}>Deprem Sırasında</Text>
            </View>
            <Text style={styles.instructionText}>
              • Çök, Kapan, Tutun pozisyonunu alın{'\n'}
              • Pencere ve camlardan uzak durun{'\n'}
              • Asansör kullanmayın{'\n'}
              • Elektrik ve gaz vanalarını kapatın
            </Text>
          </View>

          <View style={styles.instructionCard}>
            <View style={styles.instructionHeader}>
              <Ionicons name="shield-checkmark" size={24} color="#e74c3c" />
              <Text style={styles.instructionTitle}>Güvenlik Önlemleri</Text>
            </View>
            <Text style={styles.instructionText}>
              • Güvenli alanlara çekilin{'\n'}
              • Acil durum çantanızı yanınıza alın{'\n'}
              • Radyo veya TV'den bilgi alın{'\n'}
              • Acil durum numaralarını arayın
            </Text>
          </View>
        </View>

        {/* Emergency Contacts */}
        <View style={styles.contactsContainer}>
          <Text style={styles.sectionTitle}>ACİL DURUM NUMARALARI</Text>
          
          <View style={styles.contactGrid}>
            <TouchableOpacity
              style={styles.contactCard}
              onPress={() => Linking.openURL('tel:112')}
              activeOpacity={0.8}
            >
              <View style={styles.contactIconContainer}>
                <Ionicons name="medical" size={24} color="#e74c3c" />
              </View>
              <Text style={styles.contactTitle}>112</Text>
              <Text style={styles.contactSubtitle}>Acil Servis</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactCard}
              onPress={() => Linking.openURL('tel:110')}
              activeOpacity={0.8}
            >
              <View style={styles.contactIconContainer}>
                <Ionicons name="shield" size={24} color="#3498db" />
              </View>
              <Text style={styles.contactTitle}>110</Text>
              <Text style={styles.contactSubtitle}>İtfaiye</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactCard}
              onPress={() => Linking.openURL('tel:155')}
              activeOpacity={0.8}
            >
              <View style={styles.contactIconContainer}>
                <Ionicons name="car" size={24} color="#f39c12" />
              </View>
              <Text style={styles.contactTitle}>155</Text>
              <Text style={styles.contactSubtitle}>Polis</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactCard}
              onPress={() => Linking.openURL('tel:156')}
              activeOpacity={0.8}
            >
              <View style={styles.contactIconContainer}>
                <Ionicons name="call" size={24} color="#9b59b6" />
              </View>
              <Text style={styles.contactTitle}>156</Text>
              <Text style={styles.contactSubtitle}>Jandarma</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Additional Help */}
        <View style={styles.helpContainer}>
          <Text style={styles.sectionTitle}>EK YARDIM</Text>
          
          <TouchableOpacity
            style={styles.helpButton}
            onPress={() => router.push('/(protected)/first-aid')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#27ae60', '#2ecc71']}
              style={styles.helpButtonGradient}
            >
              <View style={styles.helpButtonContent}>
                <Ionicons name="medkit" size={24} color="#fff" />
                <Text style={styles.helpButtonText}>İlk Yardım Rehberi</Text>
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.helpButton}
            onPress={() => router.push('/(protected)/whistle')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#e67e22', '#d35400']}
              style={styles.helpButtonGradient}
            >
              <View style={styles.helpButtonContent}>
                <MaterialCommunityIcons name="whistle" size={24} color="#fff" />
                <Text style={styles.helpButtonText}>Deprem Düdüğü</Text>
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Safety Reminder */}
        <View style={styles.safetyReminder}>
          <LinearGradient
            colors={['#e74c3c', '#c0392b', '#a93226']}
            style={styles.safetyGradient}
          >
            <View style={styles.safetyContent}>
                          <Ionicons name="heart" size={32} color="#fff" />
              <Text style={styles.safetyTitle}>GÜVENDE KALIN</Text>
              <Text style={styles.safetyText}>
                Acil durumlarda sakin olun ve güvenlik önlemlerini takip edin. 
                Yardım yolda, umutla bekleyin.
              </Text>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>
      
      {/* Toast Component */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e74c3c',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#e74c3c',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'NotoSans-Bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  headerRight: {
    width: 40,
  },

  emergencyBanner: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emergencyGradient: {
    padding: 20,
  },
  emergencyContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  emergencyTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  mainEmergencyContainer: {
    marginHorizontal: 16,
    marginBottom: 2,
  },
  mainEmergencyButton: {
    shadowColor: '#8b0000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    marginBottom: 8,
  },
  mainEmergencyButtonCountdown: {
    shadowColor: '#4a0000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
    transform: [{ scale: 1.02 }],
  },
  mainEmergencyButtonActive: {
    shadowColor: '#4a0000',
    shadowOpacity: 0.7,
    shadowRadius: 18,
  },
  mainEmergencyButtonBorder: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  mainEmergencyGradient: {
    padding: 32,
    opacity: 0.85,
    borderRadius: 20,
  },
  mainEmergencyGradientCountdown: {
    padding: 36,
    borderRadius: 24,
  },
  mainEmergencyContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainEmergencyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'NotoSans-Bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },

  countdownContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  countdownCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 3,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  countdownText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'NotoSans-Bold',
  },
  countdownLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'NotoSans-Regular',
    fontWeight: '500',
  },
  countdownInfoText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'NotoSans-Regular',
    fontWeight: '400',
    marginTop: 8,
    textAlign: 'center',
  },


  quickEmergencyContainer: {
    marginHorizontal: 16,
    marginBottom: 32,
    marginTop: 2,
  },
  quickEmergencyButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#e74c3c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  quickEmergencyGradient: {
    padding: 20,
  },
  quickEmergencyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickEmergencyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'NotoSans-Bold',
    marginLeft: 12,
  },
  dangerIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },

  emergencyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'NotoSans-Bold',
    marginBottom: 4,
  },
  emergencySubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'NotoSans-Regular',
    lineHeight: 20,
    marginBottom: 8,
  },

  actionsContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    fontFamily: 'NotoSans-Bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  emergencyActionButton: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  actionButtonGradient: {
    padding: 20,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'NotoSans-Bold',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'NotoSans-Regular',
    marginBottom: 4,
  },

  instructionsContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  instructionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.2)',
  },
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.light.textPrimary,
    marginLeft: 12,
    fontFamily: 'NotoSans-Bold',
  },
  instructionText: {
    fontSize: 14,
    color: colors.light.textSecondary,
    lineHeight: 20,
    fontFamily: 'NotoSans-Regular',
  },
  contactsContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  contactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  contactCard: {
    width: (width - 48) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.2)',
  },
  contactIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.3)',
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.light.textPrimary,
    fontFamily: 'NotoSans-Bold',
    marginBottom: 4,
  },
  contactSubtitle: {
    fontSize: 12,
    color: colors.light.textSecondary,
    fontFamily: 'NotoSans-Regular',
    textAlign: 'center',
  },
  helpContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  helpButton: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  helpButtonGradient: {
    padding: 16,
  },
  helpButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  helpButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 16,
    fontFamily: 'NotoSans-Bold',
  },
  safetyReminder: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  safetyGradient: {
    padding: 20,
  },
  safetyContent: {
    alignItems: 'center',
  },


  safetyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
    marginBottom: 8,
    fontFamily: 'NotoSans-Bold',
  },
  safetyText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'NotoSans-Regular',
    marginBottom: 12,
  },

}); 