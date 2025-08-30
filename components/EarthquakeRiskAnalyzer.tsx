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
  Modal,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Import Turkey cities and districts data
import turkeyData from '@/assets/data/turkey-cities-districts.json';

// Use real data from JSON file
const cities = turkeyData.cities;
const districts = turkeyData.districts;

// Import new fault line utilities
import { findNearestFaultLine, NearestFaultLine, calculateDistance } from '@/utils/faultLineUtils';

// Legacy fault line data (kept for backward compatibility)
const FAULT_LINE_DATA = [
  { 
    faultLine: "Kuzey Anadolu Fay Hattı", 
    count: 287, 
    region: "Marmara-Ege", 
    description: "Türkiye'nin en aktif fay hattı",
    coordinates: { lat: 40.5, lng: 29.5 } // İstanbul area
  },
  { 
    faultLine: "Doğu Anadolu Fay Hattı", 
    count: 189, 
    region: "Doğu Anadolu", 
    description: "Yüksek tektonik aktivite",
    coordinates: { lat: 38.5, lng: 39.5 } // Elazığ area
  },
  { 
    faultLine: "Batı Anadolu Fay Sistemi", 
    count: 134, 
    region: "Ege", 
    description: "Çoklu fay sistemi",
    coordinates: { lat: 38.2, lng: 27.1 } // İzmir area
  },
  { 
    faultLine: "Güney Anadolu Fay Hattı", 
    count: 89, 
    region: "Akdeniz", 
    description: "Orta düzey aktivite",
    coordinates: { lat: 36.5, lng: 32.5 } // Mersin area
  },
  { 
    faultLine: "İç Anadolu Fay Sistemi", 
    count: 67, 
    region: "İç Anadolu", 
    description: "Düşük aktivite",
    coordinates: { lat: 39.9, lng: 32.9 } // Ankara area
  },
  { 
    faultLine: "Güneydoğu Anadolu Fay Hattı", 
    count: 45, 
    region: "Güneydoğu", 
    description: "Minimal aktivite",
    coordinates: { lat: 37.0, lng: 40.0 } // Diyarbakır area
  },
];

// Dummy neighborhoods data (will be replaced with real data later)
const dummyNeighborhoods = {
  1: [ // Kadıköy
    { id: 1, name: 'Fenerbahçe' },
    { id: 2, name: 'Caddebostan' },
    { id: 3, name: 'Göztepe' },
    { id: 4, name: 'Eğitim' },
  ],
  2: [ // Beşiktaş
    { id: 5, name: 'Levent' },
    { id: 6, name: 'Etiler' },
    { id: 7, name: 'Bebek' },
    { id: 8, name: 'Ortaköy' },
  ],
};

interface LocationData {
  city: { id: number; name: string } | null;
  district: { id: number; name: string } | null;
  neighborhood: { id: number; name: string } | null;
  address: string;
  coordinates: { lat: number; lng: number } | null;
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
    city: null,
    district: null,
    neighborhood: null,
    address: '',
    coordinates: null,
  });

  const [showCityModal, setShowCityModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [showNeighborhoodModal, setShowNeighborhoodModal] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<RiskAnalysisResult | null>(null);
  const [aiAnalysisText, setAiAnalysisText] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [nearestFaultLine, setNearestFaultLine] = useState<NearestFaultLine | null>(null);

  const availableDistricts = locationData.city 
    ? (districts as any)[locationData.city.id.toString()] || []
    : [];

  const availableNeighborhoods = locationData.district 
    ? dummyNeighborhoods[locationData.district.id as keyof typeof dummyNeighborhoods] || []
    : [];



  // Find nearest fault line
    const findNearestFaultLineLegacy = (coordinates: { lat: number; lng: number }) => {
    let nearest = FAULT_LINE_DATA[0];
    let minDistance = calculateDistance(
      coordinates.lat,
      coordinates.lng,
      FAULT_LINE_DATA[0].coordinates.lat,
      FAULT_LINE_DATA[0].coordinates.lng
    );

    FAULT_LINE_DATA.forEach(fault => {
      const distance = calculateDistance(
        coordinates.lat,
        coordinates.lng,
        fault.coordinates.lat,
        fault.coordinates.lng
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearest = fault;
      }
    });

    return {
      faultLine: nearest.faultLine,
      distance: minDistance,
      region: nearest.region,
      description: nearest.description
    };
  };

  // New function using advanced fault line detection
  const findNearestFaultLineAdvanced = (coordinates: { lat: number; lng: number }) => {
    return findNearestFaultLine(coordinates.lat, coordinates.lng);
  };

  const handleCitySelect = (city: { id: number; name: string }) => {
    setLocationData(prev => ({
      ...prev,
      city,
      district: null,
      neighborhood: null,
    }));
    setShowCityModal(false);
  };

  const handleDistrictSelect = (district: { id: number; name: string }) => {
    setLocationData(prev => ({
      ...prev,
      district,
      neighborhood: null,
    }));
    setShowDistrictModal(false);
  };

  const handleNeighborhoodSelect = (neighborhood: { id: number; name: string }) => {
    setLocationData(prev => ({
      ...prev,
      neighborhood,
    }));
    setShowNeighborhoodModal(false);
  };

  const searchGoogleAddress = async () => {
    if (!locationData.address.trim()) {
      Alert.alert('Hata', 'Lütfen bir adres girin');
      return;
    }

    try {
      // Google Maps Geocoding API call
      const address = encodeURIComponent(locationData.address);
      const apiKey = 'YOUR_GOOGLE_MAPS_API_KEY'; // Replace with actual API key
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${apiKey}`;
      
      // For now, simulate the API call with mock data
      // In production, you would make a real HTTP request here
      console.log('Searching for address:', locationData.address);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock coordinates based on selected city
      let mockCoordinates;
      if (locationData.city?.name === 'İstanbul') {
        mockCoordinates = {
          lat: 41.0082 + (Math.random() - 0.5) * 0.1,
          lng: 28.9784 + (Math.random() - 0.5) * 0.1,
        };
      } else if (locationData.city?.name === 'Ankara') {
        mockCoordinates = {
          lat: 39.9334 + (Math.random() - 0.5) * 0.1,
          lng: 32.8597 + (Math.random() - 0.5) * 0.1,
        };
      } else if (locationData.city?.name === 'İzmir') {
        mockCoordinates = {
          lat: 38.4192 + (Math.random() - 0.5) * 0.1,
          lng: 27.1287 + (Math.random() - 0.5) * 0.1,
        };
      } else {
        // Default to Turkey center
        mockCoordinates = {
          lat: 39.9334 + (Math.random() - 0.5) * 0.5,
          lng: 32.8597 + (Math.random() - 0.5) * 0.5,
        };
      }

      setLocationData(prev => ({
        ...prev,
        coordinates: mockCoordinates,
      }));

      // Find nearest fault line
          const nearestFault = findNearestFaultLineAdvanced(mockCoordinates);
    setNearestFaultLine(nearestFault);

      // Automatically start risk analysis after getting coordinates
      await analyzeRisk();
    } catch (error) {
      Alert.alert('Hata', 'Adres bulunamadı. Lütfen tekrar deneyin.');
    }
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
      city: null,
      district: null,
      neighborhood: null,
      address: '',
      coordinates: null,
    });
    setAnalysisResult(null);
    setAiAnalysisText('');
    setNearestFaultLine(null);
  };

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
        {/* Location Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Konum Seçimi</Text>
          
          {/* City Selection */}
          <TouchableOpacity
            style={styles.selectionButton}
            onPress={() => setShowCityModal(true)}
          >
            <View style={styles.selectionContent}>
              <Ionicons name="location" size={20} color={colors.primary} />
              <Text style={styles.selectionText}>
                {locationData.city ? locationData.city.name : 'İl Seçin'}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>

          {/* District Selection */}
          {locationData.city && (
            <TouchableOpacity
              style={styles.selectionButton}
              onPress={() => setShowDistrictModal(true)}
            >
              <View style={styles.selectionContent}>
                <Ionicons name="business" size={20} color={colors.primary} />
                <Text style={styles.selectionText}>
                  {locationData.district ? locationData.district.name : 'İlçe Seçin'}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          )}

          {/* Neighborhood Selection */}
          {locationData.district && (
            <TouchableOpacity
              style={styles.selectionButton}
              onPress={() => setShowNeighborhoodModal(true)}
            >
              <View style={styles.selectionContent}>
                <Ionicons name="home" size={20} color={colors.primary} />
                <Text style={styles.selectionText}>
                  {locationData.neighborhood ? locationData.neighborhood.name : 'Mahalle Seçin'}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          )}

          {/* Address Input */}
          <View style={styles.addressContainer}>
            <Text style={styles.addressLabel}>Detaylı Adres</Text>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <TextInput
                style={styles.addressInput}
                placeholder="Sokak, cadde, bina numarası..."
                value={locationData.address}
                onChangeText={(text) => setLocationData(prev => ({ ...prev, address: text }))}
                multiline
              />
            </TouchableWithoutFeedback>
            <TouchableOpacity
              style={styles.searchButton}
              onPress={searchGoogleAddress}
            >
              <Ionicons name="analytics" size={20} color="#fff" />
              <Text style={styles.searchButtonText}>Risk Analizi Yap</Text>
            </TouchableOpacity>
          </View>

          {/* Coordinates are hidden from UI but used for analysis */}
        </View>

        {/* Analysis is now triggered automatically after address search */}

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

      {/* City Selection Modal */}
      <Modal
        visible={showCityModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>İl Seçin</Text>
              <TouchableOpacity onPress={() => setShowCityModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
                         <ScrollView style={styles.modalList}>
               {cities.map((city) => (
                <TouchableOpacity
                  key={city.id}
                  style={styles.modalItem}
                  onPress={() => handleCitySelect(city)}
                >
                  <Text style={styles.modalItemText}>{city.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* District Selection Modal */}
      <Modal
        visible={showDistrictModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDistrictModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>İlçe Seçin</Text>
              <TouchableOpacity onPress={() => setShowDistrictModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
                             {availableDistricts.map((district: any) => (
                <TouchableOpacity
                  key={district.id}
                  style={styles.modalItem}
                  onPress={() => handleDistrictSelect(district)}
                >
                  <Text style={styles.modalItemText}>{district.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Neighborhood Selection Modal */}
      <Modal
        visible={showNeighborhoodModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNeighborhoodModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Mahalle Seçin</Text>
              <TouchableOpacity onPress={() => setShowNeighborhoodModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {availableNeighborhoods.map((neighborhood) => (
                <TouchableOpacity
                  key={neighborhood.id}
                  style={styles.modalItem}
                  onPress={() => handleNeighborhoodSelect(neighborhood)}
                >
                  <Text style={styles.modalItemText}>{neighborhood.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    marginTop: 20, // Başlık ile konum seçimi arasındaki mesafeyi artır
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.light.textPrimary,
    marginBottom: 15,
  },
  selectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectionText: {
    fontSize: 16,
    color: colors.light.textPrimary,
    marginLeft: 10,
  },
  addressContainer: {
    marginTop: 15,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.light.textPrimary,
    marginBottom: 8,
  },
  addressInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 10,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  coordinatesContainer: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
  },
  coordinatesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.light.textPrimary,
    marginBottom: 5,
  },
  coordinatesText: {
    fontSize: 14,
    color: colors.light.textSecondary,
    fontFamily: 'monospace',
  },
  analysisSection: {
    marginBottom: 30,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  analyzeButtonDisabled: {
    backgroundColor: '#ccc',
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.light.textPrimary,
  },
  modalList: {
    padding: 20,
  },
  modalItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalItemText: {
    fontSize: 16,
    color: colors.light.textPrimary,
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