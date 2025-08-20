import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Keyboard,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Toast from '@/components/Toast';

const { width } = Dimensions.get('window');

interface DrinkOption {
  id: string;
  name: string;
  price: number;
  currency: string;
  description: string;
  icon: string;
  gradient: [string, string];
  originalPrice: number;
}

interface SupportOrder {
  drink: DrinkOption;
  message: string;
  totalAmount: number;
  orderDate: Date;
}

export default function DeveloperSupportScreen() {
  const router = useRouter();
  const [selectedDrink, setSelectedDrink] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');
  const [isRegularSupport, setIsRegularSupport] = useState(false);
  const [supportHistory, setSupportHistory] = useState<SupportOrder[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [toastDrinkName, setToastDrinkName] = useState('');
  const [toastDrinkPrice, setToastDrinkPrice] = useState(0);
  const insets = useSafeAreaInsets();

  const drinkOptions: DrinkOption[] = [
    {
      id: 'tea',
      name: 'Çay Ismarla',
      price: 22.5, // Gerçek fiyatın yarısı (45₺/2)
      currency: '₺',
      description: 'Geliştiriciler için sıcak bir çay',
      icon: 'leaf',
      gradient: ['#4CAF50', '#66BB6A'],
      originalPrice: 45,
    },
    {
      id: 'coffee',
      name: 'Kahve Ismarla',
      price: 37.5, // Gerçek fiyatın yarısı (75₺/2)
      currency: '₺',
      description: 'Geliştiriciler için taze kahve',
      icon: 'cafe',
      gradient: ['#795548', '#8D6E63'],
      originalPrice: 75,
    },
    {
      id: 'americano',
      name: 'Americano Ismarla',
      price: 45, // Gerçek fiyatın yarısı (90₺/2)
      currency: '₺',
      description: 'Geliştiriciler için Americano',
      icon: 'cafe',
      gradient: ['#3E2723', '#5D4037'],
      originalPrice: 90,
    },
    {
      id: 'latte',
      name: 'Latte Ismarla',
      price: 52.5, // Gerçek fiyatın yarısı (105₺/2)
      currency: '₺',
      description: 'Geliştiriciler için Latte',
      icon: 'cafe',
      gradient: ['#8D6E63', '#A1887F'],
      originalPrice: 105,
    },
    {
      id: 'cappuccino',
      name: 'Cappuccino Ismarla',
      price: 48, // Gerçek fiyatın yarısı (96₺/2)
      currency: '₺',
      description: 'Geliştiriciler için Cappuccino',
      icon: 'cafe',
      gradient: ['#6D4C41', '#8D6E63'],
      originalPrice: 96,
    },
    {
      id: 'espresso',
      name: 'Espresso Ismarla',
      price: 40.5, // Gerçek fiyatın yarısı (81₺/2)
      currency: '₺',
      description: 'Geliştiriciler için Espresso',
      icon: 'cafe',
      gradient: ['#3E2723', '#4E342E'],
      originalPrice: 81,
    },
  ];

  const handleDrinkSelect = (drinkId: string) => {
    setSelectedDrink(drinkId);
  };

  const handleOpenModal = () => {
    if (!selectedDrink) {
      Alert.alert('Seçim Yapın', 'Lütfen bir içecek seçin');
      return;
    }
    console.log('Modal açılıyor, seçilen içecek:', selectedDrink);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setMessage('');
  };

  const sendEmailToDevelopers = (order: SupportOrder) => {
    const emailTemplate = `
Yeni Geliştirici Desteği!

Kullanıcı: Terra App Kullanıcısı
Tarih: ${order.orderDate.toLocaleDateString('tr-TR')}
Saat: ${order.orderDate.toLocaleTimeString('tr-TR')}

İçecek: ${order.drink.name}
Fiyat: ${order.drink.price}${order.drink.currency} (Orijinal: ${order.drink.originalPrice}${order.drink.currency})
Toplam Destek: ${order.totalAmount}${order.drink.currency}

Kullanıcı Mesajı:
"${order.message}"

---
Bu email Terra App geliştirici destek sistemi tarafından otomatik olarak gönderilmiştir.
dev@terraapp.io
    `;

    // Burada gerçek email gönderme işlemi yapılacak
    console.log('Email gönderiliyor:', emailTemplate);
    
    // Email gönderimi simülasyonu
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 1000);
    });
  };

  const handleSupport = async () => {
    if (!selectedDrink) {
      Alert.alert('Seçim Yapın', 'Lütfen bir içecek seçin');
      return;
    }

    if (!message.trim()) {
      Alert.alert('Mesaj Gerekli', 'Lütfen geliştiricilere bir mesaj yazın');
      return;
    }

    const selectedDrinkData = drinkOptions.find(drink => drink.id === selectedDrink);
    if (!selectedDrinkData) return;

    const order: SupportOrder = {
      drink: selectedDrinkData,
      message: message.trim(),
      totalAmount: selectedDrinkData.price,
      orderDate: new Date(),
    };

    try {
      // Email gönder
      await sendEmailToDevelopers(order);
      
      // Destek geçmişine ekle
      setSupportHistory(prev => [order, ...prev]);
      
      // Toast mesajı için bilgileri sakla
      setToastDrinkName(selectedDrinkData.name);
      setToastDrinkPrice(selectedDrinkData.price);
      
      // Toast göster
      setToastType('success');
      setShowToast(true);
      
      // Modal'ı kapat ve formu temizle
      setSelectedDrink(null);
      setMessage('');
      setShowModal(false);
      setIsRegularSupport(false);
    } catch (error) {
      // Hata toast'ı göster
      setToastType('error');
      setShowToast(true);
    }
  };

  const renderDrinkCard = (drink: DrinkOption) => {
    const isSelected = selectedDrink === drink.id;

    return (
      <TouchableOpacity
        key={drink.id}
        style={[
          styles.drinkCard,
          isSelected && styles.selectedDrinkCard,
        ]}
        onPress={() => handleDrinkSelect(drink.id)}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={drink.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.drinkGradient}
        >
          <View style={styles.drinkContent}>
            <View style={styles.drinkIconContainer}>
              <Ionicons name={drink.icon as any} size={28} color="#fff" />
            </View>
            
            <View style={styles.drinkInfo}>
              <Text style={styles.drinkName}>{drink.name}</Text>
              <Text style={styles.drinkDescription}>{drink.description}</Text>
            </View>

            <View style={styles.priceSection}>
              <Text style={styles.originalPrice}>{drink.originalPrice}₺</Text>
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>%50</Text>
              </View>
              <Text style={styles.priceText}>
                {drink.price}{drink.currency}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderSupportHistory = () => {
    if (supportHistory.length === 0) return null;

    return (
      <View style={styles.historySection}>
        <Text style={styles.historyTitle}>Destek Geçmişiniz</Text>
        <View style={styles.historyList}>
          {supportHistory.map((order, index) => (
            <View key={index} style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <View style={styles.historyIcon}>
                  <Ionicons name="cafe" size={20} color={colors.primary} />
                </View>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyDrinkName}>{order.drink.name}</Text>
                  <Text style={styles.historyDate}>
                    {order.orderDate.toLocaleDateString('tr-TR')} - {order.orderDate.toLocaleTimeString('tr-TR')}
                  </Text>
                </View>
                <Text style={styles.historyAmount}>{order.totalAmount}₺</Text>
              </View>
              <Text style={styles.historyMessage}>"{order.message}"</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderOrderSummaryModal = () => {
    const selectedDrinkData = drinkOptions.find(drink => drink.id === selectedDrink);

    if (!selectedDrinkData) return null;

    return (
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => Keyboard.dismiss()}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Destek Özeti</Text>
              <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.light.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              {/* Seçilen İçecek Özeti */}
              <View style={styles.orderSummary}>
                <View style={styles.summaryHeader}>
                  <Ionicons name="cafe" size={24} color={colors.primary} />
                  <Text style={styles.summaryTitle}>Seçilen İçecek</Text>
                </View>
                
                <View style={styles.summaryCard}>
                  <LinearGradient
                    colors={selectedDrinkData.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.summaryGradient}
                  >
                    <View style={styles.summaryContent}>
                      <View style={styles.summaryIcon}>
                        <Ionicons name={selectedDrinkData.icon as any} size={32} color="#fff" />
                      </View>
                      <View style={styles.summaryInfo}>
                        <Text style={styles.summaryDrinkName}>{selectedDrinkData.name}</Text>
                        <Text style={styles.summaryDescription}>{selectedDrinkData.description}</Text>
                      </View>
                      <View style={styles.summaryPrice}>
                        <Text style={styles.summaryOriginalPrice}>{selectedDrinkData.originalPrice}₺</Text>
                        <View style={styles.summaryDiscountBadge}>
                          <Text style={styles.summaryDiscountText}>%50</Text>
                        </View>
                        <Text style={styles.summaryFinalPrice}>{selectedDrinkData.price}₺</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </View>

                {/* Toplam Tutar */}
                <View style={styles.totalSection}>
                  <Text style={styles.totalLabel}>Toplam Destek Tutarı:</Text>
                  <Text style={styles.totalAmount}>{selectedDrinkData.price}₺</Text>
                </View>
              </View>

              {/* Mesaj Girişi */}
              <View style={styles.messageSection}>
                <View style={styles.messageHeader}>
                  <Ionicons name="chatbubble-ellipses" size={24} color={colors.primary} />
                  <Text style={styles.messageTitle}>Geliştiricilere Mesajınız</Text>
                </View>
                <Text style={styles.messageSubtitle}>
                  Seçtiğiniz içecek ile birlikte geliştiricilere bir mesaj gönderin
                </Text>
                <TextInput
                  style={styles.messageInput}
                  placeholder="Geliştiricilere ne söylemek istiyorsunuz? (Örn: Uygulama çok güzel, teşekkürler!)"
                  placeholderTextColor={colors.light.textSecondary}
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  maxLength={120}
                />
                <Text style={styles.characterCount}>
                  {message.length}/120 karakter
                </Text>

              </View>
            </View>

            {/* Regular Support Checkbox */}
            <View style={styles.regularSupportSection}>
              <View style={styles.checkboxContainer}>
                <TouchableOpacity 
                  style={styles.checkbox} 
                  onPress={() => setIsRegularSupport(!isRegularSupport)}
                >
                  {isRegularSupport && (
                    <Ionicons name="checkmark" size={16} color={colors.primary} />
                  )}
                </TouchableOpacity>
                <Text style={styles.checkboxLabel}>Düzenli olarak ısmarlamak istiyorum</Text>
                <TouchableOpacity 
                  style={styles.infoButton}
                  onPress={() => Alert.alert(
                    'Düzenli Destek',
                    'Her ay otomatik olarak geliştiricilere destek olun! 🌟\n\nBu seçenek ile:\n• Seçtiğiniz içecek her ay ısmarlanır\n• Geliştiriciler sürekli motivasyon bulur\n• Uygulama daha hızlı gelişir\n• Siz de her ay destek olmanın gururunu yaşarsınız\n\nDüzenli destek, Terra\'nın geleceğine yatırımdır! 💪',
                    [{ text: 'Harika!', style: 'default' }]
                  )}
                >
                  <Ionicons name="information-circle" size={20} color={colors.light.textSecondary} />
                </TouchableOpacity>
              </View>
              <Text style={[
                styles.regularSupportInfo,
                { color: isRegularSupport ? colors.light.textSecondary : 'transparent' }
              ]}>
                🌟 Her ay otomatik destek! Geliştiriciler sürekli motivasyon bulacak ve uygulama daha hızlı gelişecek.
              </Text>
            </View>

            {/* Modal Alt Butonları */}
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[
                  styles.modalSupportButton, 
                  !message.trim() && styles.modalSupportButtonDisabled
                ]} 
                onPress={handleSupport}
                disabled={!message.trim()}
              >
                <LinearGradient
                  colors={message.trim() ? [colors.primary, colors.gradientTwo] : [colors.light.textSecondary, colors.light.textSecondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalSupportButtonGradient}
                >
                  <Ionicons name="heart" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.modalSupportButtonText}>Destek Gönder</Text>
                </LinearGradient>
              </TouchableOpacity>
              

            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Modern Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.light.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Geliştiricilere Destek</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        >
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <LinearGradient
              colors={[colors.primary, colors.gradientTwo]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGradient}
            >
              <View style={styles.heroContent}>
                <View style={styles.heroIconContainer}>
                  <Ionicons name="heart" size={56} color="#fff" />
                </View>
                <Text style={styles.heroTitle}>Geliştiricilere İçecek Ismarla</Text>
                <Text style={styles.heroSubtitle}>
                  Terra uygulamasının geliştiricilerine destek olmak için bir içecek ısmarlayabilir ve onlara mesaj gönderebilirsiniz. 
                  Bu destek, uygulamanın daha da geliştirilmesine yardımcı olacak.
                </Text>
                <View style={styles.heroStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>%50</Text>
                    <Text style={styles.statLabel}>İndirim</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>6</Text>
                    <Text style={styles.statLabel}>İçecek</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>24/7</Text>
                    <Text style={styles.statLabel}>Destek</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Drinks Section */}
          <View style={styles.drinksSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>İçecek Seçenekleri</Text>
            </View>
            <View style={styles.drinksGrid}>
              {drinkOptions.map(renderDrinkCard)}
            </View>
          </View>

          {/* Features Section */}
          <View style={styles.featuresSection}>
            <Text style={styles.featuresTitle}>Neden Destek Olmalısınız?</Text>
            <View style={styles.featuresGrid}>
              <View style={styles.featureCard}>
                <View style={styles.featureIcon}>
                  <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
                </View>
                <Text style={styles.featureTitle}>Güvenli Ödeme</Text>
                <Text style={styles.featureDescription}>SSL korumalı güvenli ödeme sistemi</Text>
              </View>
              
              <View style={styles.featureCard}>
                <View style={styles.featureIcon}>
                  <Ionicons name="heart" size={24} color={colors.primary} />
                </View>
                <Text style={styles.featureTitle}>Geliştirici Desteği</Text>
                <Text style={styles.featureDescription}>Uygulamanın gelişimine katkıda bulunun</Text>
              </View>
              
              <View style={styles.featureCard}>
                <View style={styles.featureIcon}>
                  <Ionicons name="chatbubble" size={24} color={colors.primary} />
                </View>
                <Text style={styles.featureTitle}>Mesaj Gönder</Text>
                <Text style={styles.featureDescription}>Geliştiricilerle iletişime geçin</Text>
              </View>
              
              <View style={styles.featureCard}>
                <View style={styles.featureIcon}>
                  <Ionicons name="rocket" size={24} color={colors.primary} />
                </View>
                <Text style={styles.featureTitle}>Hızlı Geliştirme</Text>
                <Text style={styles.featureDescription}>Yeni özellikler daha hızlı gelir</Text>
              </View>
            </View>
          </View>

          {/* Support History */}
          {renderSupportHistory()}
        </ScrollView>

        {/* Bottom Action */}
        {selectedDrink && (
          <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 20 }]}>
            <TouchableOpacity style={styles.supportButton} onPress={handleOpenModal}>
              <LinearGradient
                colors={[colors.primary, colors.gradientTwo]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.supportButtonGradient}
              >
                <Ionicons name="heart" size={24} color="#fff" style={{ marginRight: 12 }} />
                <Text style={styles.supportButtonText}>Destek Gönder</Text>
                <View style={styles.buttonArrow}>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Order Summary Modal */}
        {renderOrderSummaryModal()}

        {/* Toast */}
        <Toast
          visible={showToast}
          message={toastType === 'success' 
            ? 'Desteğiniz için teşekkür ederiz!'
            : 'Hata oluştu. Lütfen tekrar deneyin.'
          }
          type={toastType}
          onHide={() => setShowToast(false)}
          duration={3000}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.surface,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.light.surface,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.light.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  heroSection: {
    margin: 20,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  heroGradient: {
    padding: 32,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroIconContainer: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 34,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  drinksSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.light.textPrimary,
    marginBottom: 8,
  },
  drinksGrid: {
    gap: 16,
  },
  drinkCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  selectedDrinkCard: {
    shadowColor: colors.primary,
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 16,
    transform: [{ scale: 1.02 }],
    borderWidth: 3,
    borderColor: colors.primary,
  },
  drinkGradient: {
    padding: 20,
    position: 'relative',
  },
  drinkContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  drinkIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  drinkInfo: {
    flex: 1,
  },
  drinkName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  drinkDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  priceSection: {
    alignItems: 'flex-end',
  },
  originalPrice: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textDecorationLine: 'line-through',
    marginBottom: 4,
  },
  discountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  discountText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  priceText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  featuresSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.light.textPrimary,
    textAlign: 'center',
    marginBottom: 24,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    width: '100%',
    alignItems: 'flex-start',
  },
  featureCard: {
    width: '48.5%',
    backgroundColor: colors.light.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 140,
    marginBottom: 12,
    flexShrink: 0,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.light.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 13,
    color: colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  historySection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  historyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.light.textPrimary,
    textAlign: 'center',
    marginBottom: 24,
  },
  historyList: {
    gap: 16,
  },
  historyCard: {
    backgroundColor: colors.light.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyDrinkName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.light.textPrimary,
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 14,
    color: colors.light.textSecondary,
  },
  historyAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  historyMessage: {
    fontSize: 16,
    color: colors.light.textSecondary,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: colors.light.background,
    borderTopWidth: 1,
    borderTopColor: colors.light.surface,
  },
  supportButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  supportButtonGradient: {
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  buttonArrow: {
    marginLeft: 12,
    padding: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '95%',
    height: '85%',
    backgroundColor: colors.light.background,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.surface,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.light.textPrimary,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.light.surface,
  },
  modalContent: {
    padding: 16,
    flexGrow: 1,
  },
  orderSummary: {
    marginBottom: 8,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.light.textPrimary,
  },
  summaryCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  summaryGradient: {
    padding: 14,
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryDrinkName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  summaryDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
  },
  summaryPrice: {
    alignItems: 'flex-end',
  },
  summaryOriginalPrice: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textDecorationLine: 'line-through',
    marginBottom: 4,
  },
  summaryDiscountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  summaryDiscountText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  summaryFinalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  totalSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.light.surface,
    padding: 14,
    borderRadius: 12,
    marginTop: 12,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.light.textPrimary,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  messageSection: {
    marginBottom: 0,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.light.textPrimary,
  },
  messageSubtitle: {
    fontSize: 15,
    color: colors.light.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  messageInput: {
    borderWidth: 2,
    borderColor: colors.light.surface,
    borderRadius: 16,
    padding: 14,
    fontSize: 15,
    color: colors.light.textPrimary,
    backgroundColor: colors.light.surface,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  messageHint: {
    fontSize: 13,
    color: colors.light.textSecondary,
    marginTop: 6,
    fontStyle: 'italic',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.light.surface,
  },
  modalSupportButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  modalSupportButtonDisabled: {
    opacity: 0.6,
  },
  modalSupportButtonGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSupportButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },

  // Regular Support Checkbox Styles
  regularSupportSection: {
    paddingHorizontal: 16,
    paddingVertical: 2,
    borderTopWidth: 1,
    borderTopColor: colors.light.surface,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.light.textPrimary,
    marginRight: 4,
  },
  infoButton: {
    padding: 2,
    marginLeft: 2,
  },
  regularSupportInfo: {
    fontSize: 13,
    color: colors.light.textSecondary,
    fontStyle: 'italic',
    lineHeight: 18,
    marginLeft: 32,
  },
  characterCount: {
    fontSize: 12,
    color: colors.light.textSecondary,
    textAlign: 'right',
    marginTop: 6,
    fontStyle: 'italic',
  },

}); 