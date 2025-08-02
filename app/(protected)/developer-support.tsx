import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface DrinkOption {
  id: string;
  name: string;
  price: number;
  currency: string;
  description: string;
  icon: string;
  gradient: string[];
}

export default function DeveloperSupportScreen() {
  const router = useRouter();
  const [selectedDrink, setSelectedDrink] = useState<string | null>(null);

  const drinkOptions: DrinkOption[] = [
    {
      id: 'tea',
      name: 'Çay Ismarla',
      price: 5,
      currency: '₺',
      description: 'Geliştiriciler için sıcak bir çay',
      icon: 'cafe',
      gradient: ['#8B4513', '#D2691E'],
    },
    {
      id: 'coffee',
      name: 'Kahve Ismarla',
      price: 15,
      currency: '₺',
      description: 'Geliştiriciler için taze kahve',
      icon: 'cafe',
      gradient: ['#654321', '#8B4513'],
    },
    {
      id: 'americano',
      name: 'Americano Ismarla',
      price: 20,
      currency: '₺',
      description: 'Geliştiriciler için Americano',
      icon: 'cafe',
      gradient: ['#3E2723', '#5D4037'],
    },
    {
      id: 'latte',
      name: 'Latte Ismarla',
      price: 25,
      currency: '₺',
      description: 'Geliştiriciler için Latte',
      icon: 'cafe',
      gradient: ['#8D6E63', '#A1887F'],
    },
    {
      id: 'cappuccino',
      name: 'Cappuccino Ismarla',
      price: 22,
      currency: '₺',
      description: 'Geliştiriciler için Cappuccino',
      icon: 'cafe',
      gradient: ['#6D4C41', '#8D6E63'],
    },
    {
      id: 'espresso',
      name: 'Espresso Ismarla',
      price: 18,
      currency: '₺',
      description: 'Geliştiriciler için Espresso',
      icon: 'cafe',
      gradient: ['#3E2723', '#4E342E'],
    },
  ];

  const handleDrinkSelect = (drinkId: string) => {
    setSelectedDrink(drinkId);
  };

  const handleSupport = () => {
    if (!selectedDrink) {
      Alert.alert('Seçim Yapın', 'Lütfen bir içecek seçin');
      return;
    }

    const selectedDrinkData = drinkOptions.find(drink => drink.id === selectedDrink);
    if (!selectedDrinkData) return;

    Alert.alert(
      'Destek Onayı',
      `${selectedDrinkData.name} için ${selectedDrinkData.price}${selectedDrinkData.currency} ödeme yapmak istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Ödeme Yap', 
          onPress: () => {
            // Burada ödeme işlemi yapılacak
            Alert.alert(
              'Teşekkürler!',
              'Geliştiriciler için destek gönderdiniz. İçeceğiniz yakında hazır olacak! ☕',
              [
                {
                  text: 'Tamam',
                  onPress: () => router.back()
                }
              ]
            );
          }
        }
      ]
    );
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
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={drink.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.drinkGradient}
        >
          <View style={styles.drinkHeader}>
            <View style={styles.drinkIconContainer}>
              <Ionicons name={drink.icon as any} size={24} color="#fff" />
            </View>
            <View style={styles.drinkInfo}>
              <Text style={styles.drinkName}>{drink.name}</Text>
              <Text style={styles.drinkDescription}>{drink.description}</Text>
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.priceText}>
                {drink.price}{drink.currency}
              </Text>
            </View>
          </View>
          
          {isSelected && (
            <View style={styles.selectedIndicator}>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.light.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Geliştiricilere Destek Ol</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.introSection}>
          <View style={styles.introIconContainer}>
            <Ionicons name="heart" size={48} color={colors.primary} />
          </View>
          <Text style={styles.introTitle}>Geliştiricilere İçecek Ismarla</Text>
          <Text style={styles.introSubtitle}>
            Terra uygulamasının geliştiricilerine destek olmak için bir içecek ısmarlayabilirsiniz. 
            Bu destek, uygulamanın daha da geliştirilmesine yardımcı olacak.
          </Text>
        </View>

        <View style={styles.drinksSection}>
          <Text style={styles.sectionTitle}>İçecek Seçenekleri</Text>
          <View style={styles.drinksGrid}>
            {drinkOptions.map(renderDrinkCard)}
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
            <Text style={styles.infoText}>Güvenli ödeme</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="heart" size={20} color={colors.primary} />
            <Text style={styles.infoText}>Geliştiricilere destek</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="cafe" size={20} color={colors.primary} />
            <Text style={styles.infoText}>Sıcak içecekler</Text>
          </View>
        </View>
      </ScrollView>

      {selectedDrink && (
        <View style={styles.bottomContainer}>
          <TouchableOpacity style={styles.supportButton} onPress={handleSupport}>
            <LinearGradient
              colors={[colors.primary, colors.gradientTwo]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.supportButtonGradient}
            >
              <Ionicons name="heart" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.supportButtonText}>Destek Gönder</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
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
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.surface,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.light.textPrimary,
  },
  placeholder: {
    width: 34,
  },
  content: {
    flex: 1,
  },
  introSection: {
    padding: 20,
    alignItems: 'center',
  },
  introIconContainer: {
    marginBottom: 16,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.light.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  introSubtitle: {
    fontSize: 16,
    color: colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  drinksSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.light.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  drinksGrid: {
    gap: 12,
  },
  drinkCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  selectedDrinkCard: {
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  drinkGradient: {
    padding: 16,
    position: 'relative',
  },
  drinkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  drinkIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  drinkInfo: {
    flex: 1,
  },
  drinkName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  drinkDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  priceContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 4,
  },
  infoSection: {
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 16,
    color: colors.light.textSecondary,
  },
  bottomContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.light.surface,
  },
  supportButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  supportButtonGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
}); 