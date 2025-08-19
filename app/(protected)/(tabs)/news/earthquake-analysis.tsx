import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Dropdown from "@/components/Dropdown";
import PremiumFeatureGate from "@/components/PremiumFeatureGate";

interface BuildingData {
  _id: number;
  ilce_adi: string;
  mahalle_adi: string;
  mahalle_uavt: number;
  "1980_oncesi": number;
  "1980-2000_arasi": number;
  "2000_sonrasi": number;
  "1-4 kat_arasi": number;
  "5-9 kat_arasi": number;
  "9-19 kat_arasi": number;
}

interface AnalysisData {
  fields: Array<{
    id: string;
    type: string;
    info?: {
      notes: string;
      type_override: string;
      label: string;
    };
  }>;
  records: Array<Array<any>>;
}

export default function EarthquakeAnalysisScreen() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState("İstanbul");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>("");
  const [filteredData, setFilteredData] = useState<BuildingData[]>([]);
  const [showAI, setShowAI] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isTypingAI, setIsTypingAI] = useState(false);
  const [displayedAI, setDisplayedAI] = useState("");
  
  // JSON verilerini yükle
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // JSON dosyasını require ile yükle
      const jsonData = require("@/assets/data/mahallebinasayilarıanaliz.json");
      
      // Veri yapısını kontrol et
      if (!jsonData || !jsonData.records || !Array.isArray(jsonData.records)) {
        throw new Error("Geçersiz veri yapısı");
      }
      
      setData(jsonData);
      
      // Sadece ilk ilçeyi seç, mahalle seçme
      if (jsonData.records.length > 0) {
        const districts = [...new Set(jsonData.records.map((record: any[]) => record[1]))];
        if (districts.length > 0) {
          const firstDistrict = districts[0] as string;
          setSelectedDistrict(firstDistrict);
          
          // Mahalle seçimini boş bırak
          setSelectedNeighborhood("");
        }
      }
      
    } catch (error) {
      console.error("Veri yükleme hatası:", error);
      const errorMessage = error instanceof Error ? error.message : "Bilinmeyen hata";
      Alert.alert(
        "Veri Yükleme Hatası", 
        `Veriler yüklenirken bir hata oluştu: ${errorMessage}\n\nLütfen uygulamayı yeniden başlatın.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // İlçe değiştiğinde mahalleleri güncelle - otomatik seçim yapma
  useEffect(() => {
    if (data && selectedDistrict) {
      // Mahalle seçimini sıfırla, otomatik seçme
      setSelectedNeighborhood("");
    }
  }, [selectedDistrict, data]);

  // Mahalle değiştiğinde verileri filtrele
  useEffect(() => {
    if (data && selectedDistrict && selectedNeighborhood) {
      const filtered = data.records
        .filter((record: any[]) => {
          const recordDistrict = fixTurkishCharacters(record[1]);
          const recordNeighborhood = fixTurkishCharacters(record[2]);
          const districtMatch = recordDistrict === selectedDistrict;
          const neighborhoodMatch = recordNeighborhood === selectedNeighborhood;
          
          return districtMatch && neighborhoodMatch;
        })
        .map((record: any[]) => ({
          _id: record[0],
          ilce_adi: record[1],
          mahalle_adi: record[2],
          mahalle_uavt: record[3],
          "1980_oncesi": record[4],
          "1980-2000_arasi": record[5],
          "2000_sonrasi": record[6],
          "1-4 kat_arasi": record[7],
          "5-9 kat_arasi": record[8],
          "9-19 kat_arasi": record[9],
        }));
      
      setFilteredData(filtered);
    } else {
      setFilteredData([]);
    }
  }, [selectedDistrict, selectedNeighborhood, data]);

  // Terra AI Analizi oluştur
  const generateAIAnalysis = async () => {
    if (filteredData.length === 0) return;

    try {
      setIsGeneratingAI(true);
      setShowAI(true);
      setAiAnalysis("");
      setDisplayedAI("");

      const genAI = new GoogleGenerativeAI("AIzaSyA9gguZnXbvAcOmVvDxTm1vNVeIqOYfejA");
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

      const buildingData = filteredData[0];
      const prompt = `
        Aşağıdaki İstanbul mahalle bina analiz verilerini değerlendirerek, tam olarak 4-5 cümlelik bir deprem risk analizi yap:

        Mahalle: ${buildingData.mahalle_adi}
        İlçe: ${buildingData.ilce_adi}
        
        Bina Yaş Dağılımı:
        - 1980 öncesi: ${buildingData["1980_oncesi"]} bina
        - 1980-2000 arası: ${buildingData["1980-2000_arasi"]} bina
        - 2000 sonrası: ${buildingData["2000_sonrasi"]} bina
        
        Bina Kat Dağılımı:
        - 1-4 kat arası: ${buildingData["1-4 kat_arasi"]} bina
        - 5-9 kat arası: ${buildingData["5-9 kat_arasi"]} bina
        - 9-19 kat arası: ${buildingData["9-19 kat_arasi"]} bina
        
        ÖNEMLİ: Yanıtını tam olarak 4-5 cümle ile sınırla. Daha uzun yanıt verme.
        
        Bu verilere göre:
        1. Genel deprem risk seviyesi
        2. Bina yaş yapısının risk faktörü
        3. Kat yüksekliğinin etkisi
        4. Kısa bir güvenlik önerisi
        
        Yanıtı Türkçe olarak, tam olarak 4-5 cümlelik bir paragraf halinde ver. Daha uzun yanıt verme.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      setAiAnalysis(text);
      
      // Typing effect başlat
      setTimeout(() => {
        typeText(text, 40);
      }, 200);

    } catch (error) {
      console.error('AI analiz hatası:', error);
      Alert.alert("Hata", "AI analizi oluşturulurken bir hata oluştu.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Typing effect fonksiyonu
  const typeText = (text: string, speed: number) => {
    setIsTypingAI(true);
    let currentText = '';
    const words = text.split(' ');
    let wordIndex = 0;

    const typeInterval = setInterval(() => {
      if (wordIndex < words.length) {
        currentText += words[wordIndex] + ' ';
        setDisplayedAI(currentText.trim());
        wordIndex++;
      } else {
        clearInterval(typeInterval);
        setIsTypingAI(false);
      }
    }, speed);
  };

  // Türkçe karakter sorunlarını düzelt
  const fixTurkishCharacters = (text: string): string => {
    return text
      .replace(/Ý/g, 'I')
      .replace(/Þ/g, 'Ş')
      .replace(/Ð/g, 'Ğ')
      .replace(/Ç/g, 'Ç')
      .replace(/Ö/g, 'Ö')
      .replace(/Ü/g, 'Ü')
      .replace(/Ý/g, 'I')
      .replace(/Þ/g, 'Ş')
      .replace(/Ð/g, 'Ğ');
  };

  // İlçe listesini al
  const getDistricts = () => {
    if (!data || !data.records) return [];
    const districts = [...new Set(data.records.map((record: any[]) => record[1]))];
    return districts.map(district => fixTurkishCharacters(district));
  };

  // Mahalle listesini al
  const getNeighborhoods = () => {
    if (!data || !data.records || !selectedDistrict) return [];
    
    // İlçe adını Türkçe karakter düzeltmesi ile karşılaştır
    const neighborhoods = data.records
      .filter((record: any[]) => {
        const recordDistrict = fixTurkishCharacters(record[1]);
        return recordDistrict === selectedDistrict;
      })
      .map((record: any[]) => record[2]);
    
    return neighborhoods.map(neighborhood => fixTurkishCharacters(neighborhood));
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Deprem Analizleri</Text>
          <Text style={styles.headerSubtitle}>İstanbul Mahalle Bina ve Yapıları Analizi</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Veriler yükleniyor...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Deprem Analizleri</Text>
        <Text style={styles.headerSubtitle}>Mahalle Bazlı Bina Sayıları Analizi</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Veri Kaynağı Bilgi Alanı */}
        <View style={styles.sourceInfoContainer}>
          <View style={styles.sourceInfoHeader}>
            <Ionicons name="information-circle-outline" size={20} color={colors.light.textSecondary} />
            <Text style={styles.sourceInfoTitle}>Veri Kaynağı</Text>
          </View>
          <Text style={styles.sourceInfoText}>
            Bu veri seti, 2016-2017 yıllarında mevcuttaki MAKS verileri altlık olarak alınarak 20 kattan düşük kat sayısına sahip binaların uydu ve sokak görüntüleri kullanılarak hazırlanmıştır.
          </Text>
          <TouchableOpacity 
            style={styles.sourceLinkButton}
            onPress={() => {
              // İBB Açık Veri Portalı linkini aç
              const url = "https://data.ibb.gov.tr/dataset/mahalle-bazli-bina-analiz-verisi/resource/cef193d5-0bd2-4e8d-8a69-275c50288875";
              Linking.openURL(url).catch(err => {
                console.error("Link açılamadı:", err);
                Alert.alert("Hata", "Link açılamadı. Lütfen tekrar deneyin.");
              });
            }}
          >
            <Ionicons name="open-outline" size={16} color={colors.primary} />
            <Text style={styles.sourceLinkText}>İBB Açık Veri Portalı'nda Görüntüle</Text>
          </TouchableOpacity>
        </View>

        {/* Seçim Alanları */}
        <View style={styles.selectionContainer}>
          <View style={styles.selectionItem}>
            <Text style={styles.selectionLabel}>Şehir</Text>
            <View style={styles.cityDisplayContainer}>
              <Text style={styles.cityDisplayText}>İstanbul</Text>
              <Ionicons name="location" size={20} color={colors.primary} />
            </View>
          </View>

          <View style={styles.selectionItem}>
            <Text style={styles.selectionLabel}>İlçe</Text>
            <Dropdown
              items={getDistricts().map(district => ({ label: district, value: district }))}
              value={selectedDistrict}
              onSelect={(value: string) => {
                setSelectedDistrict(value);
                setSelectedNeighborhood(""); // Mahalle seçimini sıfırla
              }}
              placeholder="İlçe seçiniz..."
            />
          </View>

          <View style={styles.selectionItem}>
            <Text style={styles.selectionLabel}>Mahalle</Text>
            <Dropdown
              items={getNeighborhoods().map(neighborhood => ({ label: neighborhood, value: neighborhood }))}
              value={selectedNeighborhood}
              onSelect={(value: string) => {
                setSelectedNeighborhood(value);
              }}
              placeholder={selectedDistrict ? "Mahalle seçiniz..." : "Önce ilçe seçiniz..."}
              disabled={!selectedDistrict}
            />
          </View>
        </View>

        {/* Veri Gösterimi */}
        {selectedDistrict && selectedNeighborhood ? (
          <View style={styles.dataContainer}>
            {filteredData.length > 0 ? (
              <>
                <View style={styles.dataHeader}>
                  <Ionicons name="analytics-outline" size={24} color={colors.primary} />
                  <Text style={styles.dataTitle}>
                    {fixTurkishCharacters(selectedNeighborhood)} Mahallesi Analiz Verileri
                  </Text>
                </View>

                {/* Bina Yaş Dağılımı */}
                <View style={styles.dataSection}>
                  <Text style={styles.sectionTitle}>Bina Yaş Dağılımı</Text>
                  <View style={styles.metricsGrid}>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricValue}>{filteredData[0]["1980_oncesi"]}</Text>
                      <Text style={styles.metricLabel}>1980 Öncesi</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricValue}>{filteredData[0]["1980-2000_arasi"]}</Text>
                      <Text style={styles.metricLabel}>1980-2000 Arası</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricValue}>{filteredData[0]["2000_sonrasi"]}</Text>
                      <Text style={styles.metricLabel}>2000 Sonrası</Text>
                    </View>
                  </View>
                </View>

                {/* Bina Kat Dağılımı */}
                <View style={styles.dataSection}>
                  <Text style={styles.sectionTitle}>Bina Kat Dağılımı</Text>
                  <View style={styles.metricsGrid}>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricValue}>{filteredData[0]["1-4 kat_arasi"]}</Text>
                      <Text style={styles.metricLabel}>1-4 Kat Arası</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricValue}>{filteredData[0]["5-9 kat_arasi"]}</Text>
                      <Text style={styles.metricLabel}>5-9 Kat Arası</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricValue}>{filteredData[0]["9-19 kat_arasi"]}</Text>
                      <Text style={styles.metricLabel}>9-19 Kat Arası</Text>
                    </View>
                  </View>
                </View>

                {/* Toplam Bina Sayısı */}
                <View style={styles.totalContainer}>
                  <Text style={styles.totalLabel}>Toplam Bina Sayısı</Text>
                  <Text style={styles.totalValue}>
                    {filteredData[0]["1980_oncesi"] + 
                     filteredData[0]["1980-2000_arasi"] + 
                     filteredData[0]["2000_sonrasi"]}
                  </Text>
                </View>

                {/* Terra AI Analizi */}
                <PremiumFeatureGate featureId="terra-ai-comment">
                  <View style={styles.aiSection}>
                    <View style={styles.aiHeader}>
                      <Ionicons name="sparkles-outline" size={22} color="#2d3748" />
                      <Text style={styles.aiTitle}>Terra AI Yorumu</Text>
                    </View>

                    {!showAI ? (
                      <TouchableOpacity
                        style={styles.aiButton}
                        onPress={generateAIAnalysis}
                        disabled={isGeneratingAI}
                      >
                        {isGeneratingAI ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                          <>
                            <Ionicons name="sparkles" size={20} color="#ffffff" />
                            <Text style={styles.aiButtonText}>AI Yorumu Oluştur</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.aiContent}>
                        <View style={styles.aiContentHeader}>
                          <Ionicons name="sparkles" size={20} color={colors.primary} />
                          <Text style={styles.aiContentTitle}>Terra AI Yorumu</Text>
                          <TouchableOpacity
                            onPress={() => {
                              setShowAI(false);
                              setDisplayedAI('');
                              setAiAnalysis('');
                              setIsTypingAI(false);
                            }}
                            style={styles.closeAIButton}
                          >
                            <Ionicons name="close" size={18} color="#6b7280" />
                          </TouchableOpacity>
                        </View>
                        <View style={styles.aiTextContainer}>
                          <Text style={styles.aiText}>
                            {displayedAI}
                            {isTypingAI && <Text style={styles.typingCursor}>|</Text>}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </PremiumFeatureGate>
              </>
            ) : (
              <View style={styles.noDataContainer}>
                <Ionicons name="information-circle-outline" size={48} color={colors.light.textSecondary} />
                <Text style={styles.noDataTitle}>Veri Bulunamadı</Text>
                <Text style={styles.noDataSubtitle}>
                  Seçilen mahalle için analiz verisi bulunamadı.
                </Text>
                <Text style={styles.noDataText}>
                  Lütfen farklı bir mahalle seçin.
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.noDataContainer}>
            <Ionicons name="information-circle-outline" size={48} color={colors.light.textSecondary} />
            <Text style={styles.noDataTitle}>Veri Seçimi Gerekli</Text>
            <Text style={styles.noDataSubtitle}>
              Lütfen önce ilçe ve mahalle seçimi yapın
            </Text>
            <Text style={styles.noDataText}>
              Seçim yaptıktan sonra mahalle analiz verileri ve Terra AI analizi görüntülenecektir.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* İlçe Seçimi Modal */}
      {/* Mahalle Seçimi Modal */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.light.background,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "NotoSans-Bold",
    color: colors.light.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: "NotoSans-Regular",
    color: colors.light.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    color: colors.light.textSecondary,
    fontFamily: "NotoSans-Medium",
    marginTop: 16,
  },
  content: {
    flex: 1,
  },
  selectionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.light.surface,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
  },
  selectionItem: {
    marginBottom: 16,
  },
  selectionLabel: {
    fontSize: 14,
    fontFamily: "NotoSans-Medium",
    color: colors.light.textPrimary,
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.light.background,
  },
  picker: {
    height: 50,
  },
  dataContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  dataHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  dataTitle: {
    fontSize: 20,
    fontFamily: "NotoSans-Bold",
    color: colors.light.textPrimary,
    marginLeft: 8,
  },
  dataSection: {
    backgroundColor: colors.light.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "NotoSans-Bold",
    color: colors.light.textPrimary,
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metricItem: {
    flex: 1,
    alignItems: "center",
  },
  metricValue: {
    fontSize: 24,
    fontFamily: "NotoSans-Bold",
    color: colors.primary,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    fontFamily: "NotoSans-Regular",
    color: colors.light.textSecondary,
    textAlign: "center",
  },
  totalContainer: {
    backgroundColor: colors.primary,
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 14,
    fontFamily: "NotoSans-Medium",
    color: "#ffffff",
    marginBottom: 8,
  },
  totalValue: {
    fontSize: 32,
    fontFamily: "NotoSans-Bold",
    color: "#ffffff",
  },
  aiSection: {
    backgroundColor: colors.light.surface,
    padding: 16,
    borderRadius: 12,
  },
  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  aiTitle: {
    fontSize: 18,
    fontFamily: "NotoSans-Bold",
    color: colors.light.textPrimary,
    marginLeft: 8,
  },
  aiButton: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  aiButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "NotoSans-Medium",
    fontWeight: "600",
  },
  aiContent: {
    backgroundColor: colors.light.background,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  aiContentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  aiContentTitle: {
    fontSize: 16,
    fontFamily: "NotoSans-Bold",
    color: colors.light.textPrimary,
    marginLeft: 8,
    flex: 1,
  },
  closeAIButton: {
    padding: 4,
  },
  aiTextContainer: {
    minHeight: 60,
  },
  aiText: {
    fontSize: 14,
    fontFamily: "NotoSans-Regular",
    color: colors.light.textPrimary,
    lineHeight: 20,
  },
  typingCursor: {
    color: colors.primary,
    fontWeight: "bold",
  },
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: colors.light.surface,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  noDataTitle: {
    fontSize: 20,
    fontFamily: "NotoSans-Bold",
    color: colors.light.textPrimary,
    marginTop: 16,
    textAlign: "center",
  },
  noDataSubtitle: {
    fontSize: 14,
    fontFamily: "NotoSans-Regular",
    color: colors.light.textSecondary,
    marginTop: 8,
    textAlign: "center",
  },
  noDataText: {
    fontSize: 12,
    fontFamily: "NotoSans-Regular",
    color: colors.light.textSecondary,
    marginTop: 12,
    textAlign: "center",
  },
  cityDisplayContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.light.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cityDisplayText: {
    fontSize: 16,
    fontFamily: "NotoSans-Medium",
    color: colors.light.textPrimary,
  },
  selectionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.light.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectionButtonText: {
    fontSize: 16,
    fontFamily: "NotoSans-Medium",
    color: colors.light.textPrimary,
  },
  placeholderText: {
    color: colors.light.textSecondary,
  },
  sourceInfoContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.light.surface,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 20,
    borderRadius: 12,
  },
  sourceInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sourceInfoTitle: {
    fontSize: 14,
    fontFamily: "NotoSans-Medium",
    color: colors.light.textPrimary,
    marginLeft: 8,
  },
  sourceInfoText: {
    fontSize: 12,
    fontFamily: "NotoSans-Regular",
    color: colors.light.textSecondary,
    marginBottom: 12,
  },
  sourceLinkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: colors.light.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sourceLinkText: {
    fontSize: 14,
    fontFamily: "NotoSans-Medium",
    color: colors.primary,
    marginLeft: 8,
  },
}); 