import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { NotificationSetting, NotificationSource } from '@/types/types';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import { FlatList } from 'react-native';

// Türkiye şehirleri
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

const steps = [
  { id: 1, title: 'Bildirimini İsimlendir', subtitle: 'Örnek: Aile Konumum' },
  { id: 2, title: 'Bildirim Kaynağını Seçin', subtitle: 'Hangi kaynaklardan bildirim almak istiyorsunuz?' },
  { id: 3, title: 'Büyüklük Aralığını Seçin', subtitle: 'Hangi büyüklükteki depremler için bildirim almak istiyorsunuz?' },
  { id: 4, title: 'Konum Belirleyin', subtitle: 'Hangi konumlardaki depremler için bildirim almak istiyorsunuz?' },
  { id: 5, title: 'Özet ve Oluştur', subtitle: 'Bildirim ayarlarınızı kontrol edin' }
];

export default function CreateNotificationWizard() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { addNotification, isAdding } = useNotificationSettings();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [showCitySelector, setShowCitySelector] = useState(false);
  
  // Form state'leri
  const [notificationName, setNotificationName] = useState('');
  const [selectedSources, setSelectedSources] = useState<string[]>(['all']);
  const [magnitudeRange, setMagnitudeRange] = useState({ min: 3.0, max: 10.0 });
  const [locationType, setLocationType] = useState<'all' | 'cities'>('all');
  const [selectedCities, setSelectedCities] = useState<string[]>([]);

  const goToNextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleSource = (sourceCode: string) => {
    if (sourceCode === 'all') {
      setSelectedSources(['all']);
    } else {
      setSelectedSources(prev => {
        const newSources = prev.filter(s => s !== 'all');
        if (newSources.includes(sourceCode)) {
          return newSources.filter(s => s !== sourceCode);
        } else {
          return [...newSources, sourceCode];
        }
      });
    }
  };

  const toggleCity = (cityName: string) => {
    setSelectedCities(prev => {
      if (prev.includes(cityName)) {
        return prev.filter(city => city !== cityName);
      } else {
        return [...prev, cityName];
      }
    });
  };

  const getSelectedCitiesText = () => {
    if (selectedCities.length === 0) return 'Şehir seçin';
    if (selectedCities.length === 1) return selectedCities[0];
    return `${selectedCities.length} şehir seçildi`;
  };

  const getSourceName = (sourceCode: string) => {
    const source = notificationSources.find(s => s.code === sourceCode);
    return source?.name || sourceCode;
  };

  const createNotification = async () => {
    if (!notificationName.trim()) {
      Alert.alert('Hata', 'Bildirim adı boş olamaz.');
      return;
    }

    const notificationData = {
      name: notificationName.trim(),
      isActive: true,
      sources: selectedSources,
      magnitudeRange: magnitudeRange,
      location: {
        type: locationType,
        cities: locationType === 'cities' ? selectedCities : undefined,
      },
    };

    try {
      addNotification(notificationData);
      Alert.alert('Başarılı', 'Bildirim oluşturuldu!');
      router.back();
    } catch (error) {
      console.error('Bildirim oluşturulurken hata:', error);
      Alert.alert('Hata', 'Bildirim oluşturulurken bir hata oluştu.');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepDescription}>
              Bildiriminize anlamlı bir isim verin. Bu isim, bildirimlerinizi yönetirken size yardımcı olacak.
            </Text>
            <TextInput
              style={styles.textInput}
              value={notificationName}
              onChangeText={setNotificationName}
              placeholder="Örnek: Aile Konumum, İş Yerim, Evim"
              placeholderTextColor={colors.gray}
              maxLength={50}
            />
            <Text style={styles.inputHint}>
              {notificationName.length}/50 karakter
            </Text>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepDescription}>
              Hangi kaynaklardan deprem bildirimleri almak istiyorsunuz? Birden fazla kaynak seçebilirsiniz.
            </Text>
            {notificationSources.map((source) => (
              <TouchableOpacity
                key={source.id}
                style={[
                  styles.sourceOption,
                  selectedSources.includes(source.code) && styles.sourceOptionSelected
                ]}
                onPress={() => toggleSource(source.code)}
              >
                <View style={styles.sourceOptionContent}>
                  <Text style={[
                    styles.sourceOptionText,
                    selectedSources.includes(source.code) && styles.sourceOptionTextSelected
                  ]}>
                    {source.name}
                  </Text>
                  <Text style={styles.sourceOptionDescription}>
                    {source.description}
                  </Text>
                </View>
                {selectedSources.includes(source.code) && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepDescription}>
              Hangi büyüklükteki depremler için bildirim almak istiyorsunuz? Slider'ları kullanarak aralık belirleyin.
            </Text>
            <View style={styles.magnitudeContainer}>
              <Text style={styles.magnitudeLabel}>
                Büyüklük Aralığı: {magnitudeRange.min.toFixed(1)} - {magnitudeRange.max.toFixed(1)}
              </Text>
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>Minimum Büyüklük</Text>
                                 <Slider
                   style={styles.slider}
                   minimumValue={0}
                   maximumValue={10}
                   value={magnitudeRange.min}
                   onValueChange={(value) => setMagnitudeRange(prev => ({ ...prev, min: value }))}
                   minimumTrackTintColor={colors.primary}
                   maximumTrackTintColor={colors.gray}
                 />
                <Text style={styles.sliderValue}>{magnitudeRange.min.toFixed(1)}</Text>
              </View>
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>Maksimum Büyüklük</Text>
                                 <Slider
                   style={styles.slider}
                   minimumValue={0}
                   maximumValue={10}
                   value={magnitudeRange.max}
                   onValueChange={(value) => setMagnitudeRange(prev => ({ ...prev, max: value }))}
                   minimumTrackTintColor={colors.primary}
                   maximumTrackTintColor={colors.gray}
                 />
                <Text style={styles.sliderValue}>{magnitudeRange.max.toFixed(1)}</Text>
              </View>
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepDescription}>
              Bildiriminizin hangi konumlara ait uyarılarda aktif olması gerektiğini belirleyin.
            </Text>
            
            <TouchableOpacity
              style={[
                styles.locationOption,
                locationType === 'all' && styles.locationOptionSelected
              ]}
              onPress={() => setLocationType('all')}
            >
              <Ionicons 
                name="globe-outline" 
                size={20} 
                color={locationType === 'all' ? colors.primary : colors.gray} 
              />
              <Text style={[
                styles.locationOptionText,
                locationType === 'all' && styles.locationOptionTextSelected
              ]}>
                Tüm Konumlar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.locationOption,
                locationType === 'cities' && styles.locationOptionSelected
              ]}
              onPress={() => setLocationType('cities')}
            >
                             <Ionicons 
                 name="location" 
                 size={20} 
                 color={locationType === 'cities' ? colors.primary : colors.gray} 
               />
              <Text style={[
                styles.locationOptionText,
                locationType === 'cities' && styles.locationOptionTextSelected
              ]}>
                Şehir Seçimi
              </Text>
            </TouchableOpacity>

            {locationType === 'cities' && (
              <TouchableOpacity
                style={styles.citySelectorButton}
                onPress={() => setShowCitySelector(true)}
              >
                <Text style={styles.citySelectorButtonText}>
                  {getSelectedCitiesText()}
                </Text>
                <Ionicons name="chevron-down" size={16} color={colors.gray} />
              </TouchableOpacity>
            )}
          </View>
        );

      case 5:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepDescription}>
              Bildirim ayarlarınızı kontrol edin. Her şey doğruysa "Oluştur" butonuna tıklayın.
            </Text>
            
            <View style={styles.summaryContainer}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Bildirim Adı:</Text>
                <Text style={styles.summaryValue}>{notificationName}</Text>
              </View>
              
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Kaynaklar:</Text>
                <Text style={styles.summaryValue}>
                  {selectedSources.map(getSourceName).join(', ')}
                </Text>
              </View>
              
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Büyüklük Aralığı:</Text>
                <Text style={styles.summaryValue}>
                  {magnitudeRange.min.toFixed(1)} - {magnitudeRange.max.toFixed(1)}
                </Text>
              </View>
              
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Konum:</Text>
                <Text style={styles.summaryValue}>
                  {locationType === 'all' ? 'Tüm Konumlar' : `${selectedCities.length} şehir seçildi`}
                </Text>
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return notificationName.trim().length > 0;
      case 2:
        return selectedSources.length > 0;
      case 3:
        return magnitudeRange.min <= magnitudeRange.max;
      case 4:
        return locationType === 'all' || (locationType === 'cities' && selectedCities.length > 0);
      case 5:
        return true;
      default:
        return false;
    }
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
        <Text style={styles.headerTitle}>Yeni Bildirim</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(currentStep / 5) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          Adım {currentStep} / 5
        </Text>
      </View>

      {/* Step Title */}
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>{steps[currentStep - 1].title}</Text>
        <Text style={styles.stepSubtitle}>{steps[currentStep - 1].subtitle}</Text>
      </View>

      {/* Step Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStepContent()}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={[styles.navigationContainer, { paddingBottom: insets.bottom }]}>
        {currentStep > 1 && (
          <TouchableOpacity
            style={styles.navButton}
            onPress={goToPreviousStep}
          >
            <Ionicons name="arrow-back" size={20} color={colors.primary} />
            <Text style={styles.navButtonText}>Geri</Text>
          </TouchableOpacity>
        )}
        
        {currentStep < 5 ? (
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.nextButton,
              !canProceed() && styles.disabledButton,
              { marginLeft: 'auto' }
            ]}
            onPress={goToNextStep}
            disabled={!canProceed()}
          >
            <Text style={[
              styles.navButtonText,
              styles.nextButtonText,
              !canProceed() && styles.disabledButtonText
            ]}>
              İleri
            </Text>
            <Ionicons 
              name="arrow-forward" 
              size={20} 
              color={canProceed() ? '#fff' : colors.gray} 
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.createButton,
              !canProceed() && styles.disabledButton,
              { marginLeft: 'auto' }
            ]}
            onPress={createNotification}
            disabled={!canProceed() || isAdding}
          >
            {isAdding ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={[
                  styles.navButtonText,
                  styles.createButtonText,
                  !canProceed() && styles.disabledButtonText
                ]}>
                  Oluştur
                </Text>
                <Ionicons 
                  name="checkmark" 
                  size={20} 
                  color={canProceed() ? '#fff' : colors.gray} 
                />
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Şehir Seçici Modal */}
      <Modal
        visible={showCitySelector}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCitySelector(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Şehir Seçimi</Text>
            <TouchableOpacity
              style={styles.modalSaveButton}
              onPress={() => setShowCitySelector(false)}
            >
              <Text style={styles.modalSaveButtonText}>Tamam</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.citySelectorContent}>
            <Text style={styles.citySelectorInfo}>
              {selectedCities.length} şehir seçildi
            </Text>
            
            <FlatList
              data={turkeyCities}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.cityItem,
                    selectedCities.includes(item.name) && styles.cityItemSelected
                  ]}
                  onPress={() => toggleCity(item.name)}
                >
                  <View style={styles.cityItemContent}>
                    <Text style={[
                      styles.cityItemText,
                      selectedCities.includes(item.name) && styles.cityItemTextSelected
                    ]}>
                      {item.name}
                    </Text>
                    {selectedCities.includes(item.name) && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                    )}
                  </View>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
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
  headerSpacer: {
    width: 34,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: colors.gray,
    textAlign: 'center',
  },
  stepHeader: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: colors.gray,
    lineHeight: 22,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContent: {
    paddingBottom: 20,
  },
  stepDescription: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 20,
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  inputHint: {
    fontSize: 12,
    color: colors.gray,
    textAlign: 'right',
  },
  sourceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    marginTop: 4,
  },
  magnitudeContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  magnitudeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  sliderContainer: {
    marginBottom: 20,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderThumb: {
    backgroundColor: colors.primary,
  },
  sliderValue: {
    fontSize: 14,
    color: colors.gray,
    textAlign: 'center',
    marginTop: 4,
  },
  locationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 8,
  },
  citySelectorButtonText: {
    fontSize: 16,
    color: colors.text,
  },
  summaryContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  summaryValue: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
  },
  nextButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  createButton: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  disabledButton: {
    backgroundColor: colors.border,
    borderColor: colors.border,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginHorizontal: 8,
  },
  nextButtonText: {
    color: '#fff',
  },
  createButtonText: {
    color: '#fff',
  },
  disabledButtonText: {
    color: colors.gray,
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
    paddingTop: 20,
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
}); 