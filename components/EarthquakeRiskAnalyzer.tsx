import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  FlatList,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { GoogleGenerativeAI } from '@google/generative-ai';
import MapView, { Marker } from 'react-native-maps';

// Import new fault line utilities
import { findNearestFaultLine, NearestFaultLine, calculateDistance } from '@/utils/faultLineUtils';

interface AddressSuggestion {
  id: string;
  description: string;
  coordinates: { lat: number; lng: number };
}

interface LocationData {
  address: string;
  coordinates: { lat: number; lng: number } | null;
  selectedAddress: string;
}

interface RiskAnalysisResult {
  pgaValues: {
    pga2: number;
    pga10: number;
    pga50: number;
    pga68: number;
  };
  ssValues: {
    ss2: number;
    ss10: number;
    ss50: number;
    ss68: number;
  };
  s2Values: {
    s22: number;
    s210: number;
    s250: number;
    s268: number;
  };
  pgvValues: {
    pgv2: number;
    pgv10: number;
    pgv50: number;
    pgv68: number;
  };
  analysis: {
    infrastructureRisk: string;
    buildingRisk: string;
    soilRisk: string;
  };
  aiAnalysis: string;
}

export default function EarthquakeRiskAnalyzer() {
  const [locationData, setLocationData] = useState<LocationData>({
    address: '',
    coordinates: null,
    selectedAddress: '',
  });

  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<RiskAnalysisResult | null>(null);
  const [aiAnalysisText, setAiAnalysisText] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [nearestFaultLine, setNearestFaultLine] = useState<NearestFaultLine | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 39.9334,
    longitude: 32.8597,
    latitudeDelta: 8.0,
    longitudeDelta: 8.0,
  });

  // Debounced address search
  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (locationData.address.length > 3) {
        searchAddresses();
      } else {
        setAddressSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300); // Reduced delay for faster response

    return () => clearTimeout(searchTimeout);
  }, [locationData.address]);

  const searchAddresses = async () => {
    if (locationData.address.length <= 3) return;

    setIsSearching(true);
    try {
      // Google Places API call for address autocomplete
      const apiKey = 'YOUR_GOOGLE_MAPS_API_KEY'; // Replace with your actual API key
      const query = encodeURIComponent(locationData.address);
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${query}&components=country:tr&language=tr&key=${apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.predictions) {
        // Get detailed information for each prediction including coordinates
        const detailedSuggestions = await Promise.all(
          data.predictions.slice(0, 5).map(async (prediction: any) => {
            try {
              // Get place details to retrieve coordinates
              const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&fields=geometry&key=${apiKey}`;
              const detailsResponse = await fetch(detailsUrl);
              const detailsData = await detailsResponse.json();
              
              return {
                id: prediction.place_id,
                description: prediction.description,
                coordinates: {
                  lat: detailsData.result.geometry.location.lat,
                  lng: detailsData.result.geometry.location.lng,
                }
              };
            } catch (error) {
              console.error('Error fetching place details:', error);
              // Fallback to Turkey center coordinates if details fail
              return {
                id: prediction.place_id,
                description: prediction.description,
                coordinates: { lat: 39.9334, lng: 32.8597 }
              };
            }
          })
        );

        setAddressSuggestions(detailedSuggestions);
        setShowSuggestions(true);
      } else {
        // If API fails, show fallback suggestions
        console.log('Google Places API error or no results:', data.status);
        setAddressSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Address search error:', error);
      // Show user-friendly error message
      Alert.alert('Bağlantı Hatası', 'Adres arama sırasında bir hata oluştu. İnternet bağlantınızı kontrol edin.');
      setAddressSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddressSelect = (suggestion: AddressSuggestion) => {
    setLocationData(prev => ({
      ...prev,
      coordinates: suggestion.coordinates,
      selectedAddress: suggestion.description,
    }));
    
    // Update map region to show selected location
    setMapRegion({
      latitude: suggestion.coordinates.lat,
      longitude: suggestion.coordinates.lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });

    setShowSuggestions(false);
    setAddressSuggestions([]);
    
    // Find nearest fault line
    const nearestFault = findNearestFaultLine(suggestion.coordinates.lat, suggestion.coordinates.lng);
    setNearestFaultLine(nearestFault);
  };

  const handleMapPress = (event: any) => {
    const { coordinate } = event.nativeEvent;
    setLocationData(prev => ({
      ...prev,
      coordinates: coordinate,
      selectedAddress: `Lat: ${coordinate.latitude.toFixed(6)}, Lng: ${coordinate.longitude.toFixed(6)}`,
    }));

    // Find nearest fault line for new coordinates
    const nearestFault = findNearestFaultLine(coordinate.latitude, coordinate.longitude);
    setNearestFaultLine(nearestFault);
  };

  const useCurrentLocation = async () => {
    if (!locationData.coordinates) {
      Alert.alert('Hata', 'Önce harita üzerinde bir konum seçin');
      return;
    }

    await analyzeRisk();
  };

  const analyzeRisk = async () => {
    if (!locationData.coordinates) {
      Alert.alert('Hata', 'Önce konum bilgilerini tamamlayın');
      return;
    }

    setIsAnalyzing(true);

    try {
      // Simulate API call to risk analysis service
      console.log('Analyzing risk for coordinates:', locationData.coordinates);
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate realistic risk values based on location
      const { lat, lng } = locationData.coordinates;
      
      // Risk factors based on location (higher risk in certain areas)
      let riskMultiplier = 1.0;
      if (lat > 40.5 && lat < 41.5 && lng > 28.5 && lng < 29.5) {
        // İstanbul area - higher risk
        riskMultiplier = 1.5;
      } else if (lat > 39.5 && lat < 40.5 && lng > 32.5 && lng < 33.5) {
        // Ankara area - medium risk
        riskMultiplier = 1.2;
      } else if (lat > 38.0 && lat < 39.0 && lng > 27.0 && lng < 28.0) {
        // İzmir area - medium-high risk
        riskMultiplier = 1.3;
      }

      const mockResult: RiskAnalysisResult = {
        pgaValues: {
          pga2: Number((0.45 * riskMultiplier).toFixed(3)),
          pga10: Number((0.32 * riskMultiplier).toFixed(3)),
          pga50: Number((0.18 * riskMultiplier).toFixed(3)),
          pga68: Number((0.12 * riskMultiplier).toFixed(3)),
        },
        ssValues: {
          ss2: Number((1.2 * riskMultiplier).toFixed(3)),
          ss10: Number((0.85 * riskMultiplier).toFixed(3)),
          ss50: Number((0.48 * riskMultiplier).toFixed(3)),
          ss68: Number((0.32 * riskMultiplier).toFixed(3)),
        },
        s2Values: {
          s22: Number((0.38 * riskMultiplier).toFixed(3)),
          s210: Number((0.27 * riskMultiplier).toFixed(3)),
          s250: Number((0.15 * riskMultiplier).toFixed(3)),
          s268: Number((0.10 * riskMultiplier).toFixed(3)),
        },
        pgvValues: {
          pgv2: Number((45.2 * riskMultiplier).toFixed(1)),
          pgv10: Number((32.1 * riskMultiplier).toFixed(1)),
          pgv50: Number((18.5 * riskMultiplier).toFixed(1)),
          pgv68: Number((12.3 * riskMultiplier).toFixed(1)),
        },
        analysis: {
          infrastructureRisk: riskMultiplier > 1.3 
            ? 'Bu bölgede altyapı sistemleri yüksek risk altındadır. Su, elektrik ve iletişim hatları deprem sırasında ciddi zarar görebilir.'
            : riskMultiplier > 1.1
            ? 'Bu bölgede altyapı sistemleri orta seviyede risk altındadır. Su ve elektrik hatları deprem sırasında zarar görebilir.'
            : 'Bu bölgede altyapı sistemleri düşük risk altındadır. Genel olarak güvenli durumdadır.',
          buildingRisk: riskMultiplier > 1.3
            ? 'Yüksek katlı binalar ciddi risk altındadır. Acil güçlendirme önlemleri alınmalıdır. Düşük katlı binalar da orta seviyede risk taşımaktadır.'
            : riskMultiplier > 1.1
            ? 'Düşük katlı binalar daha güvenli olmakla birlikte, yüksek katlı binalar için ek güçlendirme önlemleri önerilir.'
            : 'Binalar genel olarak güvenli durumdadır. Rutin kontroller yeterlidir.',
          soilRisk: riskMultiplier > 1.3
            ? 'Zemin yapısı riskli bölgelerde bulunmaktadır. Sıvılaşma ve heyelan riski yüksektir. Detaylı zemin etüdü gereklidir.'
            : riskMultiplier > 1.1
            ? 'Zemin yapısı genel olarak stabil olmakla birlikte, bazı bölgelerde sıvılaşma riski bulunmaktadır.'
            : 'Zemin yapısı stabil ve güvenlidir. Özel önlem gerektirmez.',
        },
        aiAnalysis: '', // Will be filled by AI analysis
      };

      setAnalysisResult(mockResult);
      
      // Generate AI analysis
      await generateAIAnalysis(mockResult);
    } catch (error) {
      Alert.alert('Hata', 'Risk analizi yapılırken bir hata oluştu');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateAIAnalysis = async (result: RiskAnalysisResult) => {
    setIsGeneratingAI(true);
    setAiAnalysisText('');
    
    try {
      // Use Gemini AI for real analysis
      const genAI = new GoogleGenerativeAI("AIzaSyA9gguZnXbvAcOmVvDxTm1vNVeIqOYfejA");
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      
      const aiPrompt = `Aşağıdaki deprem risk analizi verilerine göre maksimum 5 cümlelik bir değerlendirme yap:

PGA Değerleri: %2=${result.pgaValues.pga2}, %10=${result.pgaValues.pga10}, %50=${result.pgaValues.pga50}, %68=${result.pgaValues.pga68}
SS Değerleri: %2=${result.ssValues.ss2}, %10=${result.ssValues.ss10}, %50=${result.ssValues.ss50}, %68=${result.ssValues.ss68}
S2 Değerleri: %2=${result.s2Values.s22}, %10=${result.s2Values.s210}, %50=${result.s2Values.s250}, %68=${result.s2Values.s268}
PGV Değerleri: %2=${result.pgvValues.pgv2}, %10=${result.pgvValues.pgv10}, %50=${result.pgvValues.pgv50}, %68=${result.pgvValues.pgv68}

En Yakın Fay Hattı: ${nearestFaultLine?.faultSystem} (${nearestFaultLine?.distance.toFixed(1)} km uzaklıkta, ${nearestFaultLine?.faultRegion} bölgesi)

Bu verilere göre bölgenin deprem risk seviyesini, en yakın fay hattının etkisini, alınması gereken önlemleri ve güvenlik önerilerini Türkçe olarak değerlendir. Yanıtını tam olarak 5 cümle ile sınırla.`;

      const aiResult = await model.generateContent(aiPrompt);
      const response = await aiResult.response;
      const aiResponse = response.text();
      
      // Simulate typing effect
      const words = aiResponse.split(' ');
      let currentText = '';
      
      for (let i = 0; i < words.length; i++) {
        currentText += words[i] + ' ';
        setAiAnalysisText(currentText.trim());
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay between words
      }

      // Update the result with AI analysis
      setAnalysisResult(prev => prev ? {
        ...prev,
        aiAnalysis: aiResponse
      } : null);

    } catch (error) {
      console.error('AI analysis error:', error);
      setAiAnalysisText('AI analizi sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const resetForm = () => {
    setLocationData({
      address: '',
      coordinates: null,
      selectedAddress: '',
    });
    setAnalysisResult(null);
    setAiAnalysisText('');
    setNearestFaultLine(null);
    setAddressSuggestions([]);
    setShowSuggestions(false);
    setMapRegion({
      latitude: 39.9334,
      longitude: 32.8597,
      latitudeDelta: 8.0,
      longitudeDelta: 8.0,
    });
  };

  const renderAddressSuggestion = ({ item }: { item: AddressSuggestion }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleAddressSelect(item)}
    >
      <Ionicons name="location-outline" size={16} color={colors.primary} />
      <Text style={styles.suggestionText}>{item.description}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.gradientOne, colors.gradientTwo]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <MaterialCommunityIcons name="map-marker-alert" size={32} color="#fff" />
          <Text style={styles.headerTitle}>Deprem Risk Analizi</Text>
          <Text style={styles.headerSubtitle}>Konumuna göre risk değerlendirmesi</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Address Search Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Adres Arama</Text>
          
          <View style={styles.addressSearchContainer}>
            <View style={styles.addressInputContainer}>
              <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.addressInput}
                placeholder="Adres yazın (en az 4 karakter)..."
                value={locationData.address}
                onChangeText={(text) => setLocationData(prev => ({ ...prev, address: text }))}
                onFocus={() => setShowSuggestions(addressSuggestions.length > 0)}
              />
              {isSearching && (
                <ActivityIndicator size="small" color={colors.primary} style={styles.searchLoader} />
              )}
            </View>

            {/* Address Suggestions */}
            {showSuggestions && addressSuggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                <FlatList
                  data={addressSuggestions}
                  renderItem={renderAddressSuggestion}
                  keyExtractor={(item) => item.id}
                  style={styles.suggestionsList}
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled={true}
                  scrollEnabled={true}
                />
              </View>
            )}

            {/* Selected Address Display */}
            {locationData.selectedAddress && (
              <View style={styles.selectedAddressContainer}>
                <Ionicons name="checkmark-circle" size={20} color="#27ae60" />
                <Text style={styles.selectedAddressText}>{locationData.selectedAddress}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Map Section - Always visible after address search */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Konum Haritası</Text>
          <Text style={styles.mapSubtitle}>
            {locationData.coordinates 
              ? 'Konumu düzenlemek için haritayı kaydırın ve istediğiniz yere dokunun'
              : 'Önce yukarıdan bir adres seçin'
            }
          </Text>
          
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              region={mapRegion}
              onRegionChangeComplete={setMapRegion}
              onPress={handleMapPress}
              showsUserLocation={false}
              showsMyLocationButton={false}
            >
              {locationData.coordinates && (
                <Marker
                  coordinate={locationData.coordinates}
                  title="Seçilen Konum"
                  description={locationData.selectedAddress}
                  pinColor={colors.primary}
                />
              )}
            </MapView>
          </View>

          {/* Use Location Button - Only show when coordinates are available */}
          {locationData.coordinates && (
            <TouchableOpacity
              style={styles.useLocationButton}
              onPress={useCurrentLocation}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="analytics" size={20} color="#fff" />
              )}
              <Text style={styles.useLocationButtonText}>
                {isAnalyzing ? 'Analiz Ediliyor...' : 'Bu Konumu Kullan'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Analysis Results */}
        {analysisResult && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsTitle}>Risk Analizi Sonuçları</Text>
            
            {/* PGA Values */}
            <View style={styles.resultCard}>
              <Text style={styles.resultCardTitle}>PGA Değerleri (g)</Text>
              <View style={styles.valuesGrid}>
                <View style={styles.valueItem}>
                  <Text style={styles.valueLabel}>PGA%2</Text>
                  <Text style={styles.valueText}>{analysisResult.pgaValues.pga2}</Text>
                </View>
                <View style={styles.valueItem}>
                  <Text style={styles.valueLabel}>PGA%10</Text>
                  <Text style={styles.valueText}>{analysisResult.pgaValues.pga10}</Text>
                </View>
                <View style={styles.valueItem}>
                  <Text style={styles.valueLabel}>PGA%50</Text>
                  <Text style={styles.valueText}>{analysisResult.pgaValues.pga50}</Text>
                </View>
                <View style={styles.valueItem}>
                  <Text style={styles.valueLabel}>PGA%68</Text>
                  <Text style={styles.valueText}>{analysisResult.pgaValues.pga68}</Text>
                </View>
              </View>
            </View>

            {/* SS Values */}
            <View style={styles.resultCard}>
              <Text style={styles.resultCardTitle}>Ss Değerleri</Text>
              <View style={styles.valuesGrid}>
                <View style={styles.valueItem}>
                  <Text style={styles.valueLabel}>Ss%2</Text>
                  <Text style={styles.valueText}>{analysisResult.ssValues.ss2}</Text>
                </View>
                <View style={styles.valueItem}>
                  <Text style={styles.valueLabel}>Ss%10</Text>
                  <Text style={styles.valueText}>{analysisResult.ssValues.ss10}</Text>
                </View>
                <View style={styles.valueItem}>
                  <Text style={styles.valueLabel}>Ss%50</Text>
                  <Text style={styles.valueText}>{analysisResult.ssValues.ss50}</Text>
                </View>
                <View style={styles.valueItem}>
                  <Text style={styles.valueLabel}>Ss%68</Text>
                  <Text style={styles.valueText}>{analysisResult.ssValues.ss68}</Text>
                </View>
              </View>
            </View>

            {/* S2 Values */}
            <View style={styles.resultCard}>
              <Text style={styles.resultCardTitle}>S2 Değerleri</Text>
              <View style={styles.valuesGrid}>
                <View style={styles.valueItem}>
                  <Text style={styles.valueLabel}>S2%2</Text>
                  <Text style={styles.valueText}>{analysisResult.s2Values.s22}</Text>
                </View>
                <View style={styles.valueItem}>
                  <Text style={styles.valueLabel}>S2%10</Text>
                  <Text style={styles.valueText}>{analysisResult.s2Values.s210}</Text>
                </View>
                <View style={styles.valueItem}>
                  <Text style={styles.valueLabel}>S2%50</Text>
                  <Text style={styles.valueText}>{analysisResult.s2Values.s250}</Text>
                </View>
                <View style={styles.valueItem}>
                  <Text style={styles.valueLabel}>S2%68</Text>
                  <Text style={styles.valueText}>{analysisResult.s2Values.s268}</Text>
                </View>
              </View>
            </View>

            {/* PGV Values */}
            <View style={styles.resultCard}>
              <Text style={styles.resultCardTitle}>PGV Değerleri (cm/s)</Text>
              <View style={styles.valuesGrid}>
                <View style={styles.valueItem}>
                  <Text style={styles.valueLabel}>PGV%2</Text>
                  <Text style={styles.valueText}>{analysisResult.pgvValues.pgv2}</Text>
                </View>
                <View style={styles.valueItem}>
                  <Text style={styles.valueLabel}>PGV%10</Text>
                  <Text style={styles.valueText}>{analysisResult.pgvValues.pgv10}</Text>
                </View>
                <View style={styles.valueItem}>
                  <Text style={styles.valueLabel}>PGV%50</Text>
                  <Text style={styles.valueText}>{analysisResult.pgvValues.pgv50}</Text>
                </View>
                <View style={styles.valueItem}>
                  <Text style={styles.valueLabel}>PGV%68</Text>
                  <Text style={styles.valueText}>{analysisResult.pgvValues.pgv68}</Text>
                </View>
              </View>
            </View>

            {/* Risk Analysis */}
            <View style={styles.riskAnalysisCard}>
              <Text style={styles.riskAnalysisTitle}>Risk Değerlendirmesi</Text>
              
              {/* Nearest Fault Line */}
              {nearestFaultLine && (
                <View style={styles.faultLineItem}>
                  <MaterialCommunityIcons name="map-marker-path" size={20} color="#9b59b6" />
                  <View style={styles.faultLineContent}>
                    <Text style={styles.faultLineLabel}>En Yakın Fay Hattı</Text>
                    <Text style={styles.faultLineName}>{nearestFaultLine.faultSystem}</Text>
                    <Text style={styles.faultLineDetails}>
                      {nearestFaultLine.distance.toFixed(1)} km uzaklıkta • {nearestFaultLine.faultRegion} bölgesi
                    </Text>
                    <Text style={styles.faultLineDescription}>{nearestFaultLine.description}</Text>
                  </View>
                </View>
              )}

              <View style={styles.riskItem}>
                <Ionicons name="warning" size={20} color="#e74c3c" />
                <View style={styles.riskContent}>
                  <Text style={styles.riskLabel}>Altyapı Riski</Text>
                  <Text style={styles.riskText}>{analysisResult.analysis.infrastructureRisk}</Text>
                </View>
              </View>

              <View style={styles.riskItem}>
                <Ionicons name="business" size={20} color="#f39c12" />
                <View style={styles.riskContent}>
                  <Text style={styles.riskLabel}>Bina Riski</Text>
                  <Text style={styles.riskText}>{analysisResult.analysis.buildingRisk}</Text>
                </View>
              </View>

              <View style={styles.riskItem}>
                <Ionicons name="earth" size={20} color="#27ae60" />
                <View style={styles.riskContent}>
                  <Text style={styles.riskLabel}>Zemin Riski</Text>
                  <Text style={styles.riskText}>{analysisResult.analysis.soilRisk}</Text>
                </View>
              </View>
            </View>

            {/* Terra AI Analysis */}
            <View style={styles.aiAnalysisCard}>
              <View style={styles.aiAnalysisHeader}>
                <MaterialCommunityIcons name="robot" size={24} color={colors.primary} />
                <Text style={styles.aiAnalysisTitle}>Terra AI Analizi</Text>
                {isGeneratingAI && (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 10 }} />
                )}
              </View>
              
              {isGeneratingAI ? (
                <View style={[styles.aiAnalysisContent, { minHeight: 80 }]}>
                  <Text style={styles.aiAnalysisText}>
                    {aiAnalysisText}
                    <Text style={styles.aiAnalysisCursor}>|</Text>
                  </Text>
                </View>
              ) : analysisResult?.aiAnalysis ? (
                <View style={[styles.aiAnalysisContent, { minHeight: 80 }]}>
                  <Text style={styles.aiAnalysisText}>{analysisResult.aiAnalysis}</Text>
                </View>
              ) : null}
            </View>

            {/* Reset Button */}
            <TouchableOpacity style={styles.resetButton} onPress={resetForm}>
              <Ionicons name="refresh" size={20} color={colors.primary} />
              <Text style={styles.resetButtonText}>Yeni Analiz</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 30,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.light.textPrimary,
    marginBottom: 15,
  },
  // Address Search Styles
  addressSearchContainer: {
    position: 'relative',
    zIndex: 1,
  },
  addressInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 10,
  },
  addressInput: {
    flex: 1,
    fontSize: 16,
    color: colors.light.textPrimary,
  },
  searchLoader: {
    marginLeft: 10,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
    maxHeight: 200,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: colors.light.textPrimary,
    marginLeft: 10,
    lineHeight: 18,
  },
  selectedAddressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  selectedAddressText: {
    flex: 1,
    fontSize: 14,
    color: '#27ae60',
    marginLeft: 8,
    fontWeight: '600',
  },
  // Map Styles
  mapSubtitle: {
    fontSize: 14,
    color: colors.light.textSecondary,
    marginBottom: 15,
    textAlign: 'center',
  },
  mapContainer: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  useLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 15,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  useLocationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  // Results Styles
  resultsSection: {
    marginBottom: 30,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.light.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.light.textPrimary,
    marginBottom: 15,
  },
  valuesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  valueItem: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  valueLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.light.textSecondary,
    marginBottom: 4,
  },
  valueText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.light.textPrimary,
  },
  riskAnalysisCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  riskAnalysisTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.light.textPrimary,
    marginBottom: 15,
  },
  riskItem: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  riskContent: {
    flex: 1,
    marginLeft: 12,
  },
  riskLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.light.textPrimary,
    marginBottom: 4,
  },
  riskText: {
    fontSize: 14,
    color: colors.light.textSecondary,
    lineHeight: 20,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  resetButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // AI Analysis Styles
  aiAnalysisCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  aiAnalysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  aiAnalysisTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.light.textPrimary,
    marginLeft: 10,
  },
  aiAnalysisContent: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
  },
  aiAnalysisText: {
    fontSize: 14,
    color: colors.light.textSecondary,
    lineHeight: 20,
  },
  aiAnalysisCursor: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  // Fault Line Styles
  faultLineItem: {
    flexDirection: 'row',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  faultLineContent: {
    flex: 1,
    marginLeft: 12,
  },
  faultLineLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.light.textPrimary,
    marginBottom: 4,
  },
  faultLineName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#9b59b6',
    marginBottom: 4,
  },
  faultLineDetails: {
    fontSize: 13,
    color: colors.light.textSecondary,
    marginBottom: 4,
  },
  faultLineDescription: {
    fontSize: 13,
    color: colors.light.textSecondary,
    fontStyle: 'italic',
  },
});