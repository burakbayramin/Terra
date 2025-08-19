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

interface ScenarioData {
  _id: number;
  ilce_adi: string;
  mahalle_adi: string;
  mahalle_koy_uavt: number;
  cok_agir_hasarli_bina_sayisi: number;
  agir_hasarli_bina_sayisi: number;
  orta_hasarli_bina_sayisi: number;
  hafif_hasarli_bina_sayisi: number;
  can_kaybi_sayisi: number;
  agir_yarali_sayisi: number;
  hastanede_tedavi_sayisi: number;
  hafif_yarali_sayisi: number;
  dogalgaz_boru_hasari: string;
  icme_suyu_boru_hasari: number;
  atik_su_boru_hasari: number;
  gecici_barinma: number;
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

export default function EarthquakeScenarioScreen() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState("İstanbul");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>("");
  const [filteredData, setFilteredData] = useState<ScenarioData[]>([]);
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
      const jsonData = require("@/assets/data/olasidepremsenaryosuanaliz.json");
      
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
          mahalle_koy_uavt: record[3],
          cok_agir_hasarli_bina_sayisi: record[4],
          agir_hasarli_bina_sayisi: record[5],
          orta_hasarli_bina_sayisi: record[6],
          hafif_hasarli_bina_sayisi: record[7],
          can_kaybi_sayisi: record[8],
          agir_yarali_sayisi: record[9],
          hastanede_tedavi_sayisi: record[10],
          hafif_yarali_sayisi: record[11],
          dogalgaz_boru_hasari: record[12],
          icme_suyu_boru_hasari: record[13],
          atik_su_boru_hasari: record[14],
          gecici_barinma: record[15],
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

      const scenarioData = filteredData[0];
      const prompt = `
        Aşağıdaki İstanbul mahalle deprem senaryosu analiz verilerini değerlendirerek, tam olarak 4-5 cümlelik bir deprem risk analizi yap:

        Mahalle: ${scenarioData.mahalle_adi}
        İlçe: ${scenarioData.ilce_adi}
        
        Senaryo: 7.5 Mw büyüklüğünde gece olacak deprem
        
        Bina Hasar Dağılımı:
        - Çok ağır hasarlı: ${scenarioData.cok_agir_hasarli_bina_sayisi} bina
        - Ağır hasarlı: ${scenarioData.agir_hasarli_bina_sayisi} bina
        - Orta hasarlı: ${scenarioData.orta_hasarli_bina_sayisi} bina
        - Hafif hasarlı: ${scenarioData.hafif_hasarli_bina_sayisi} bina
        
        İnsan Kayıpları:
        - Can kaybı: ${scenarioData.can_kaybi_sayisi} kişi
        - Ağır yaralı: ${scenarioData.agir_yarali_sayisi} kişi
        - Hastanede tedavi: ${scenarioData.hastanede_tedavi_sayisi} kişi
        - Hafif yaralı: ${scenarioData.hafif_yarali_sayisi} kişi
        
        Altyapı Hasarı:
        - Doğalgaz boru hasarı: ${scenarioData.dogalgaz_boru_hasari}
        - İçme suyu boru hasarı: ${scenarioData.icme_suyu_boru_hasari}
        - Atık su boru hasarı: ${scenarioData.atik_su_boru_hasari}
        
        Geçici Barınma: ${scenarioData.gecici_barinma} kişi
        
        ÖNEMLİ: Yanıtını tam olarak 4-5 cümle ile sınırla. Daha uzun yanıt verme.
        
        Bu senaryo verilerine göre:
        1. Genel risk seviyesi ve bina hasar potansiyeli
        2. İnsan kayıpları ve yaralanma riski
        3. Altyapı sistemlerinin etkilenme durumu
        4. Acil durum hazırlığı için öneriler
        
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
          <Text style={styles.headerSubtitle}>Olası Deprem Senaryosu Analizi</Text>
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
        <Text style={styles.headerSubtitle}>Olası Deprem Senaryosu Analizi</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Veri Kaynağı Bilgi Alanı */}
        <View style={styles.sourceInfoContainer}>
          <View style={styles.sourceInfoHeader}>
            <Ionicons name="information-circle-outline" size={20} color={colors.light.textSecondary} />
            <Text style={styles.sourceInfoTitle}>Veri Kaynağı</Text>
          </View>
          <Text style={styles.sourceInfoText}>
            Veri seti 7.5 Mw büyüklüğünde gece olacak deprem senaryosuna göre yapılan analizlerin sonuçlarını içerir. Verinin oluşturulma tarihi 19 Mart 2021'dir.
          </Text>
          <TouchableOpacity 
            style={styles.sourceLinkButton}
            onPress={() => {
              // İBB Açık Veri Portalı linkini aç
              const url = "https://data.ibb.gov.tr/dataset/deprem-senaryosu-analiz-sonuclari/resource/9c3ac492-de4b-4245-b418-7ad3df67a193";
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
                  <Ionicons name="trending-up-outline" size={24} color={colors.primary} />
                  <Text style={styles.dataTitle}>
                    {fixTurkishCharacters(selectedNeighborhood)} Mahallesi Senaryo Analizi
                  </Text>
                </View>

                {/* Bina Hasar Dağılımı */}
                <View style={styles.dataSection}>
                  <Text style={styles.sectionTitle}>Bina Hasar Dağılımı</Text>
                  <View style={styles.metricsGrid}>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricValue}>{filteredData[0].cok_agir_hasarli_bina_sayisi}</Text>
                      <Text style={styles.metricLabel}>Çok Ağır Hasar</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricValue}>{filteredData[0].agir_hasarli_bina_sayisi}</Text>
                      <Text style={styles.metricLabel}>Ağır Hasar</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricValue}>{filteredData[0].orta_hasarli_bina_sayisi}</Text>
                      <Text style={styles.metricLabel}>Orta Hasar</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricValue}>{filteredData[0].hafif_hasarli_bina_sayisi}</Text>
                      <Text style={styles.metricLabel}>Hafif Hasar</Text>
                    </View>
                  </View>
                </View>

                {/* İnsan Kayıpları */}
                <View style={styles.dataSection}>
                  <Text style={styles.sectionTitle}>İnsan Kayıpları</Text>
                  <View style={styles.metricsGrid}>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricValue}>{filteredData[0].can_kaybi_sayisi}</Text>
                      <Text style={styles.metricLabel}>Can Kaybı</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricValue}>{filteredData[0].agir_yarali_sayisi}</Text>
                      <Text style={styles.metricLabel}>Ağır Yaralı</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricValue}>{filteredData[0].hastanede_tedavi_sayisi}</Text>
                      <Text style={styles.metricLabel}>Hastanede Tedavi</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricValue}>{filteredData[0].hafif_yarali_sayisi}</Text>
                      <Text style={styles.metricLabel}>Hafif Yaralı</Text>
                    </View>
                  </View>
                </View>

                {/* Altyapı Hasarı */}
                <View style={styles.dataSection}>
                  <Text style={styles.sectionTitle}>Altyapı Hasarı</Text>
                  <View style={styles.metricsGrid}>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricValue}>{filteredData[0].dogalgaz_boru_hasari}</Text>
                      <Text style={styles.metricLabel}>Doğalgaz Boru</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricValue}>{filteredData[0].icme_suyu_boru_hasari}</Text>
                      <Text style={styles.metricLabel}>İçme Suyu Boru</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricValue}>{filteredData[0].atik_su_boru_hasari}</Text>
                      <Text style={styles.metricLabel}>Atık Su Boru</Text>
                    </View>
                  </View>
                </View>

                {/* Geçici Barınma */}
                <View style={styles.totalContainer}>
                  <Text style={styles.totalLabel}>Geçici Barınma İhtiyacı</Text>
                  <Text style={styles.totalValue}>{filteredData[0].gecici_barinma}</Text>
                </View>

                {/* Terra AI Yorumu */}
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
                  Seçilen mahalle için senaryo analiz verisi bulunamadı.
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
              Seçim yaptıktan sonra deprem senaryosu analiz verileri ve Terra AI yorumu görüntülenecektir.
            </Text>
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
  content: {
    flex: 1,
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
    fontSize: 16,
    fontFamily: "NotoSans-Medium",
    color: colors.light.textPrimary,
    marginBottom: 8,
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
    minHeight: 48,
  },
  cityDisplayText: {
    fontSize: 16,
    fontFamily: "NotoSans-Medium",
    color: colors.light.textPrimary,
  },
  dataContainer: {
    paddingHorizontal: 20,
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
    marginLeft: 12,
  },
  dataSection: {
    backgroundColor: colors.light.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "NotoSans-Bold",
    color: colors.light.textPrimary,
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  metricItem: {
    width: "48%",
    alignItems: "center",
    marginBottom: 16,
  },
  metricValue: {
    fontSize: 24,
    fontFamily: "NotoSans-Bold",
    color: colors.primary,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    fontFamily: "NotoSans-Medium",
    color: colors.light.textSecondary,
    textAlign: "center",
  },
  totalContainer: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
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
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
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
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  aiButtonText: {
    fontSize: 16,
    fontFamily: "NotoSans-Medium",
    color: "#ffffff",
    marginLeft: 8,
  },
  aiContent: {
    backgroundColor: colors.light.background,
    borderRadius: 8,
    padding: 16,
  },
  aiContentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  aiContentTitle: {
    fontSize: 16,
    fontFamily: "NotoSans-Bold",
    color: colors.light.textPrimary,
  },
  closeAIButton: {
    padding: 4,
  },
  aiTextContainer: {
    backgroundColor: colors.light.background,
    borderRadius: 8,
    padding: 12,
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: "NotoSans-Medium",
    color: colors.light.textSecondary,
    marginTop: 16,
  },
}); 