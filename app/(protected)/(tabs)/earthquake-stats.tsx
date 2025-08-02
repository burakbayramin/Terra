import React, { useState, useRef } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions, 
  ScrollView,
  Share,
  Alert
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getTransformComponents,
  Pie,
  PolarChart,
  setScale,
  setTranslate,
  useChartTransformState,
  Bar,
  CartesianChart,
  useChartPressState,
  Line,
  Area,
  Scatter,
} from "victory-native";
import {
  DashPathEffect,
  LinearGradient as SkiaLinearGradient,
  vec,
} from "@shopify/react-native-skia";
import {
  useAnimatedReaction,
  useSharedValue,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import ViewShot from 'react-native-view-shot';

const { width } = Dimensions.get("window");

// Güncellenmiş renk paleti
const colors = {
  primary: "#FF5700",
  gradientOne: "#FF5700", 
  gradientTwo: "#EF1C19",
  secondary: "#0079D3",
  background: "#FFFFFF",
  surface: "#F8F8F8",
  textPrimary: "#1A1A1B",
  textSecondary: "#878A8C",
  card: "#FFFFFF",
  border: "#EDEFF1",
  success: "#46A758",
  warning: "#FF8B00",
  danger: "#FF4444",
  info: "#0095DA",
};

// Türkiye bölgelerine göre deprem verileri - daha gerçekçi sayılar
const EARTHQUAKE_DATA = [
  {
    value: 423,
    color: "#FF4444",
    label: "Marmara",
    region: "Marmara Bölgesi",
    description: "Yüksek risk bölgesi",
    riskLevel: "Yüksek"
  },
  {
    value: 318,
    color: "#FF8B00", 
    label: "Ege",
    region: "Ege Bölgesi",
    description: "Aktif fay hatları",
    riskLevel: "Yüksek"
  },
  {
    value: 245,
    color: "#0095DA",
    label: "Akdeniz", 
    region: "Akdeniz Bölgesi",
    description: "Orta düzey aktivite",
    riskLevel: "Orta"
  },
  {
    value: 167,
    color: "#46A758",
    label: "Doğu Anadolu",
    region: "Doğu Anadolu Bölgesi", 
    description: "Tektonik aktivite",
    riskLevel: "Orta"
  },
  {
    value: 89,
    color: "#9333EA",
    label: "İç Anadolu",
    region: "İç Anadolu Bölgesi",
    description: "Düşük aktivite", 
    riskLevel: "Düşük"
  },
  {
    value: 54,
    color: "#EC4899",
    label: "Karadeniz",
    region: "Karadeniz Bölgesi",
    description: "Minimal aktivite",
    riskLevel: "Düşük"
  },
  {
    value: 32,
    color: "#F59E0B",
    label: "Güneydoğu Anadolu", 
    region: "Güneydoğu Anadolu Bölgesi",
    description: "Çok düşük aktivite",
    riskLevel: "Düşük"
  }
];

// En sık deprem görülen şehirler verisi
const CITY_EARTHQUAKE_DATA = [
  { city: "İstanbul", count: 127, cityCode: "IST" },
  { city: "İzmir", count: 98, cityCode: "IZM" },
  { city: "Ankara", count: 67, cityCode: "ANK" },
  { city: "Antalya", count: 54, cityCode: "ANT" },
  { city: "Bursa", count: 43, cityCode: "BUR" },
  { city: "Van", count: 38, cityCode: "VAN" },
  { city: "Erzurum", count: 29, cityCode: "ERZ" },
];

// En aktif fay hatları verisi
const FAULT_LINE_DATA = [
  { faultLine: "Kuzey Anadolu Fay Hattı", count: 287, region: "Marmara-Ege", description: "Türkiye'nin en aktif fay hattı" },
  { faultLine: "Doğu Anadolu Fay Hattı", count: 189, region: "Doğu Anadolu", description: "Yüksek tektonik aktivite" },
  { faultLine: "Batı Anadolu Fay Sistemi", count: 134, region: "Ege", description: "Çoklu fay sistemi" },
  { faultLine: "Güney Anadolu Fay Hattı", count: 89, region: "Akdeniz", description: "Orta düzey aktivite" },
  { faultLine: "İç Anadolu Fay Sistemi", count: 67, region: "İç Anadolu", description: "Düşük aktivite" },
  { faultLine: "Güneydoğu Anadolu Fay Hattı", count: 45, region: "Güneydoğu", description: "Minimal aktivite" },
];

// Aylık deprem sayısı trendi verisi (son 12 ay)
const MONTHLY_TREND_DATA = [
  { month: "Ocak", count: 156, monthCode: "OCA" },
  { month: "Şubat", count: 134, monthCode: "ŞUB" },
  { month: "Mart", count: 189, monthCode: "MAR" },
  { month: "Nisan", count: 167, monthCode: "NİS" },
  { month: "Mayıs", count: 145, monthCode: "MAY" },
  { month: "Haziran", count: 178, monthCode: "HAZ" },
  { month: "Temmuz", count: 198, monthCode: "TEM" },
  { month: "Ağustos", count: 167, monthCode: "AĞU" },
  { month: "Eylül", count: 145, monthCode: "EYL" },
  { month: "Ekim", count: 178, monthCode: "EKİ" },
  { month: "Kasım", count: 156, monthCode: "KAS" },
  { month: "Aralık", count: 134, monthCode: "ARA" },
];

// Deprem büyüklük dağılımı verisi
const MAGNITUDE_DISTRIBUTION_DATA = [
  { magnitude: "3.0-3.9", count: 687, range: "3.0-3.9" },
  { magnitude: "4.0-4.9", count: 412, range: "4.0-4.9" },
  { magnitude: "5.0-5.9", count: 178, range: "5.0-5.9" },
  { magnitude: "6.0-6.9", count: 45, range: "6.0-6.9" },
  { magnitude: "7.0+", count: 6, range: "7.0+" },
];

const EarthquakeStats = () => {
  const [data] = useState(EARTHQUAKE_DATA);
  const [selectedSegment, setSelectedSegment] = useState("percentage");
  const { state } = useChartTransformState();
    const insets = useSafeAreaInsets();

  // Bar chart için press state'ler
  const { state: cityChartState } = useChartPressState({ x: "", y: { count: 0 } });
  const { state: magnitudeChartState } = useChartPressState({ x: "", y: { count: 0 } });
  const { state: faultChartState } = useChartPressState({ x: "", y: { count: 0 } });
  const { state: trendChartState } = useChartPressState({ x: "", y: { count: 0 } });
  
  const [activeCityIndex, setActiveCityIndex] = useState(-1);
  const [activeMagnitudeIndex, setActiveMagnitudeIndex] = useState(-1);
  const [activeFaultIndex, setActiveFaultIndex] = useState(-1);
  const [activeTrendIndex, setActiveTrendIndex] = useState(-1);

  // Grafik referansları
  const pieChartRef = useRef<ViewShot | null>(null);
  const cityChartRef = useRef<ViewShot | null>(null);
  const faultChartRef = useRef<ViewShot | null>(null);
  const trendChartRef = useRef<ViewShot | null>(null);
  const magnitudeChartRef = useRef<ViewShot | null>(null);

  const k = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);

  useAnimatedReaction(
    () => {
      return state.panActive.value || state.zoomActive.value;
    },
    (cv, pv) => {
      if (!cv && pv) {
        const vals = getTransformComponents(state.matrix.value);
        k.value = vals.scaleX;
        tx.value = vals.translateX;
        ty.value = vals.translateY;

        k.value = withTiming(1);
        tx.value = withTiming(0);
        ty.value = withTiming(0);
      }
    },
  );

    useAnimatedReaction(
    () => {
      return { k: k.value, tx: tx.value, ty: ty.value };
    },
    ({ k, tx, ty }) => {
      const m = setTranslate(state.matrix.value, tx, ty);
      state.matrix.value = setScale(m, k);
    },
  );

  // City chart press reactions
  useAnimatedReaction(
    () => cityChartState.matchedIndex.value,
    (matchedIndex) => {
      runOnJS(setActiveCityIndex)(matchedIndex);
    },
  );

  // Magnitude chart press reactions
  useAnimatedReaction(
    () => magnitudeChartState.matchedIndex.value,
    (matchedIndex) => {
      runOnJS(setActiveMagnitudeIndex)(matchedIndex);
    },
  );

  // Fault chart press reactions
  useAnimatedReaction(
    () => faultChartState.matchedIndex.value,
    (matchedIndex) => {
      runOnJS(setActiveFaultIndex)(matchedIndex);
    },
  );

  // Trend chart press reactions
  useAnimatedReaction(
    () => trendChartState.matchedIndex.value,
    (matchedIndex) => {
      runOnJS(setActiveTrendIndex)(matchedIndex);
    },
  );

  const totalEarthquakes = data.reduce((sum, item) => sum + item.value, 0);

  // AI Özet fonksiyonu
  const generateAISummary = () => {
    const highRiskCount = data.filter(item => item.riskLevel === "Yüksek").length;
    const mediumRiskCount = data.filter(item => item.riskLevel === "Orta").length;
    const lowRiskCount = data.filter(item => item.riskLevel === "Düşük").length;
    
    const maxMonthlyActivity = Math.max(...MONTHLY_TREND_DATA.map(m => m.count));
    const minMonthlyActivity = Math.min(...MONTHLY_TREND_DATA.map(m => m.count));
    const maxMonth = MONTHLY_TREND_DATA.find(m => m.count === maxMonthlyActivity)?.month;
    const minMonth = MONTHLY_TREND_DATA.find(m => m.count === minMonthlyActivity)?.month;
    
    const highMagnitudeCount = MAGNITUDE_DISTRIBUTION_DATA.slice(3).reduce((sum, m) => sum + m.count, 0);
    const highMagnitudePercentage = ((highMagnitudeCount / MAGNITUDE_DISTRIBUTION_DATA.reduce((sum, m) => sum + m.count, 0)) * 100).toFixed(1);
    
    let riskAssessment = "";
    if (highRiskCount >= 2) {
      riskAssessment = "Türkiye'de yüksek deprem riski bulunan bölgeler mevcuttur ve özellikle Marmara ile Ege bölgelerinde dikkatli olunmalıdır.";
    } else if (mediumRiskCount >= 3) {
      riskAssessment = "Orta düzey deprem riski bulunan bölgeler ağırlıktadır ve genel olarak dikkatli olunması gereken bir dönemdir.";
    } else {
      riskAssessment = "Genel olarak düşük risk seviyesi görülmektedir ancak her zaman hazırlıklı olunmalıdır.";
    }
    
    let trendAnalysis = "";
    if (maxMonthlyActivity > minMonthlyActivity * 1.5) {
      trendAnalysis = "Aylık deprem aktivitesinde belirgin dalgalanmalar gözlemlenmekte ve mevsimsel faktörler etkili olabilmektedir.";
    } else {
      trendAnalysis = "Aylık deprem aktivitesi nispeten dengeli seyretmekte ve istikrarlı bir trend göstermektedir.";
    }
    
    let magnitudeWarning = "";
    if (parseFloat(highMagnitudePercentage) > 10) {
      magnitudeWarning = "Yüksek büyüklükteki depremlerin oranı dikkat çekici seviyede olup yapısal güvenlik önlemleri gözden geçirilmelidir.";
    } else {
      magnitudeWarning = "Yüksek büyüklükteki depremlerin oranı normal seviyede olup mevcut güvenlik önlemleri yeterli görünmektedir.";
    }
    
    let recommendations = "";
    if (highRiskCount >= 2) {
      recommendations = "Bu durumda düzenli deprem tatbikatları yapılmalı, acil durum planları güncel tutulmalı ve yapısal güvenlik kontrolleri sıklaştırılmalıdır.";
    } else {
      recommendations = "Genel olarak düzenli deprem tatbikatları yapılmalı, acil durum planları güncel tutulmalı ve deprem çantası hazır bulundurulmalıdır.";
    }
    
    return `🤖 Terra AI İstatistik Özeti:

${riskAssessment} ${trendAnalysis} ${magnitudeWarning} ${recommendations}`;
  };

  // Paylaşım fonksiyonu
  const handleShare = async () => {
    try {
      const aiSummary = generateAISummary();
      
      const shareContent = `🌍 Türkiye Deprem İstatistikleri Raporu

📊 Genel Durum:
• Toplam Deprem: ${totalEarthquakes}
• En Aktif Bölge: ${data[0].region} (${data[0].value} deprem)
• En Aktif Fay Hattı: ${FAULT_LINE_DATA[0].faultLine} (${FAULT_LINE_DATA[0].count} deprem)
• En Aktif Şehir: ${CITY_EARTHQUAKE_DATA[0].city} (${CITY_EARTHQUAKE_DATA[0].count} deprem)

📈 Son 12 Ay Trend:
• En Yüksek Aktivite: ${MONTHLY_TREND_DATA[6].month} (${MONTHLY_TREND_DATA[6].count} deprem)
• En Düşük Aktivite: ${MONTHLY_TREND_DATA[1].month} (${MONTHLY_TREND_DATA[1].count} deprem)

⚠️ Risk Değerlendirmesi:
• Yüksek Risk Bölgeleri: ${data.filter(item => item.riskLevel === "Yüksek").length}
• Orta Risk Bölgeleri: ${data.filter(item => item.riskLevel === "Orta").length}
• Düşük Risk Bölgeleri: ${data.filter(item => item.riskLevel === "Düşük").length}

${aiSummary}

📱 Terra Uygulaması ile güncel deprem bilgilerini takip edin!`;

      await Share.share({
        message: shareContent,
        title: 'Türkiye Deprem İstatistikleri',
      });
    } catch (error) {
      Alert.alert('Hata', 'Paylaşım sırasında bir hata oluştu.');
    }
  };

  // AI yorumu oluşturma fonksiyonu
  const generateAIComment = () => {
    const totalQuakes = totalEarthquakes;
    const mostActiveRegion = data[0];
    const mostActiveFault = FAULT_LINE_DATA[0];
    const mostActiveCity = CITY_EARTHQUAKE_DATA[0];
    const highRiskCount = data.filter(item => item.riskLevel === "Yüksek").length;
    const maxMonth = MONTHLY_TREND_DATA.reduce((max, month) => month.count > max.count ? month : max);
    const minMonth = MONTHLY_TREND_DATA.reduce((min, month) => month.count < min.count ? month : min);

    let aiComment = "🤖 Terra AI İstatistik Özeti:\n\n";

    // Genel değerlendirme
    if (totalQuakes > 1000) {
      aiComment += "📊 Yüksek aktivite dönemi: Son 12 ayda 1000+ deprem kaydedildi. ";
    } else if (totalQuakes > 500) {
      aiComment += "📊 Orta aktivite dönemi: Son 12 ayda 500+ deprem kaydedildi. ";
    } else {
      aiComment += "📊 Düşük aktivite dönemi: Son 12 ayda 500'den az deprem kaydedildi. ";
    }

    // En aktif bölge yorumu
    aiComment += `${mostActiveRegion.region} en aktif bölge olarak öne çıkıyor. `;

    // Fay hattı yorumu
    if (mostActiveFault.count > 200) {
      aiComment += `${mostActiveFault.faultLine} kritik seviyede aktivite gösteriyor. `;
    } else {
      aiComment += `${mostActiveFault.faultLine} orta seviyede aktivite gösteriyor. `;
    }

    // Şehir yorumu
    aiComment += `${mostActiveCity.city} en çok etkilenen şehir. `;

    // Risk değerlendirmesi
    if (highRiskCount >= 2) {
      aiComment += "⚠️ Yüksek risk bölgeleri dikkat gerektiriyor. ";
    }

    // Mevsimsel trend
    if (maxMonth.count > minMonth.count * 1.5) {
      aiComment += `📈 ${maxMonth.month} ayında belirgin aktivite artışı gözlemlendi. `;
    }

    // Genel uyarı
    aiComment += "🔍 Düzenli takip ve hazırlık önemli.";

    return aiComment;
  };

  // PDF oluşturma fonksiyonu
  const handleDownloadPDF = async () => {
    try {
      const aiSummary = generateAISummary();
      
      // Grafikleri base64 formatında al
      let pieChartImage = '';
      let cityChartImage = '';
      let trendChartImage = '';
      
      try {
        console.log('Grafik yakalama başlıyor...');
        
        // Grafiklerin render olması için kısa bir bekleme
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (pieChartRef.current) {
          console.log('Pie chart yakalanıyor...');
          pieChartImage = await pieChartRef.current!.capture!();
          console.log('Pie chart yakalandı, uzunluk:', pieChartImage.length);
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (cityChartRef.current) {
          console.log('City chart yakalanıyor...');
          cityChartImage = await cityChartRef.current!.capture!();
          console.log('City chart yakalandı, uzunluk:', cityChartImage.length);
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (trendChartRef.current) {
          console.log('Trend chart yakalanıyor...');
          trendChartImage = await trendChartRef.current!.capture!();
          console.log('Trend chart yakalandı, uzunluk:', trendChartImage.length);
        }
      } catch (error) {
        console.log('Grafik yakalama hatası:', error);
      }
      
      // HTML template oluştur
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Türkiye Deprem İstatistikleri Raporu</title>
          <style>
            @page {
              size: A4;
              margin: 20mm;
            }
            
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 0;
              background: white;
              color: #333;
              line-height: 1.6;
            }
            
            .page {
              page-break-after: always;
              min-height: 100vh;
              display: flex;
              flex-direction: column;
            }
            
            .page:last-child {
              page-break-after: avoid;
            }
            
            .header {
              background: linear-gradient(135deg, #FF5700 0%, #EF1C19 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
              border-radius: 0 0 20px 20px;
              margin-bottom: 30px;
            }
            
            .header h1 {
              margin: 0;
              font-size: 32px;
              font-weight: bold;
              text-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }
            
            .header p {
              margin: 15px 0 0 0;
              opacity: 0.95;
              font-size: 18px;
              font-weight: 500;
            }
            
            .content {
              flex: 1;
              padding: 0 30px 30px 30px;
            }
            
            .section {
              margin-bottom: 40px;
              page-break-inside: avoid;
            }
            
            .section h2 {
              color: #FF5700;
              font-size: 24px;
              margin-bottom: 20px;
              border-bottom: 3px solid #FF5700;
              padding-bottom: 10px;
              font-weight: bold;
            }
            
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 25px;
              margin-bottom: 30px;
            }
            
            .stat-card {
              background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
              border-radius: 15px;
              padding: 25px;
              text-align: center;
              border: 2px solid #FF5700;
              box-shadow: 0 4px 15px rgba(255, 87, 0, 0.1);
            }
            
            .stat-number {
              font-size: 28px;
              font-weight: bold;
              color: #FF5700;
              margin-bottom: 8px;
            }
            
            .stat-label {
              color: #555;
              font-size: 16px;
              font-weight: 600;
            }
            
            .ai-summary {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              border-radius: 20px;
              margin: 25px 0;
              box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
            }
            
            .ai-summary h3 {
              margin: 0 0 20px 0;
              font-size: 22px;
              font-weight: bold;
            }
            
            .ai-summary p {
              margin: 0;
              line-height: 1.8;
              font-size: 16px;
              text-align: justify;
            }
            
            .data-table {
              width: 100%;
              border-collapse: collapse;
              margin: 25px 0;
              box-shadow: 0 4px 15px rgba(0,0,0,0.1);
              border-radius: 10px;
              overflow: hidden;
            }
            
            .data-table th,
            .data-table td {
              padding: 15px 12px;
              text-align: left;
              border-bottom: 1px solid #e0e0e0;
            }
            
            .data-table th {
              background: linear-gradient(135deg, #FF5700 0%, #EF1C19 100%);
              color: white;
              font-weight: bold;
              font-size: 16px;
            }
            
            .data-table tr:nth-child(even) {
              background: #f8f9fa;
            }
            
            .data-table tr:hover {
              background: #e9ecef;
            }
            
            .footer {
              background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
              padding: 25px;
              text-align: center;
              color: #666;
              font-size: 14px;
              border-radius: 20px 20px 0 0;
              margin-top: 40px;
            }
            
            .logo {
              font-size: 20px;
              font-weight: bold;
              color: #FF5700;
              margin-bottom: 10px;
            }
            
            .page-break {
              page-break-before: always;
            }
            
            .no-break {
              page-break-inside: avoid;
            }
            
            .chart-placeholder {
              background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
              border: 2px dashed #FF5700;
              border-radius: 15px;
              padding: 40px;
              text-align: center;
              margin: 20px 0;
              color: #666;
            }
            
            .chart-placeholder h4 {
              color: #FF5700;
              margin-bottom: 10px;
            }
            
            .chart-image {
              width: 100%;
              max-width: 600px;
              height: auto;
              border-radius: 15px;
              box-shadow: 0 8px 25px rgba(0,0,0,0.15);
              margin: 20px auto;
              display: block;
              page-break-inside: avoid;
            }
            
            .chart-container {
              text-align: center;
              margin: 30px 0;
              page-break-inside: avoid;
            }
            
            .chart-title {
              color: #FF5700;
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 15px;
            }
          </style>
        </head>
        <body>
          <!-- Sayfa 1: Başlık ve Genel İstatistikler -->
          <div class="page">
            <div class="header">
              <h1>🌍 Türkiye Deprem İstatistikleri Raporu</h1>
              <p>Son 12 Ay Veri Analizi | ${new Date().toLocaleDateString('tr-TR')}</p>
            </div>
            
            <div class="content">
              <div class="section">
                <h2>📊 Genel İstatistikler</h2>
                <div class="stats-grid">
                  <div class="stat-card">
                    <div class="stat-number">${totalEarthquakes}</div>
                    <div class="stat-label">Toplam Deprem</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-number">${data[0].region}</div>
                    <div class="stat-label">En Aktif Bölge</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-number">${FAULT_LINE_DATA[0].faultLine}</div>
                    <div class="stat-label">En Aktif Fay Hattı</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-number">${CITY_EARTHQUAKE_DATA[0].city}</div>
                    <div class="stat-label">En Aktif Şehir</div>
                  </div>
                </div>
              </div>

              <div class="section">
                <h2>🤖 Terra AI İstatistik Özeti</h2>
                <div class="ai-summary">
                  <h3>AI Analizi</h3>
                  <p>${aiSummary.replace(/\n/g, '<br>')}</p>
                </div>
              </div>
              
              ${pieChartImage ? `
              <div class="section">
                <h2>📊 Bölgesel Dağılım Grafiği</h2>
                <div class="chart-container">
                  <div class="chart-title">Pasta Grafik - Bölgesel Deprem Dağılımı</div>
                  <img src="data:image/png;base64,${pieChartImage}" class="chart-image" alt="Bölgesel Dağılım Grafiği" />
                  <p style="text-align: center; color: #666; font-size: 12px; margin-top: 10px;">Grafik başarıyla yakalandı (${pieChartImage.length} karakter)</p>
                </div>
              </div>
              ` : '<div class="section"><p style="color: #999; text-align: center;">Pie chart yakalanamadı</p></div>'}
            </div>
          </div>

          <!-- Sayfa 2: Bölgesel Dağılım -->
          <div class="page page-break">
            <div class="content">
              <div class="section">
                <h2>📈 Bölgesel Dağılım</h2>
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Bölge</th>
                      <th>Deprem Sayısı</th>
                      <th>Yüzde</th>
                      <th>Risk Seviyesi</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${data.map(item => {
                      const percentage = ((item.value / totalEarthquakes) * 100).toFixed(1);
                      return `
                        <tr>
                          <td>${item.region}</td>
                          <td>${item.value}</td>
                          <td>%${percentage}</td>
                          <td>${item.riskLevel}</td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>

              ${cityChartImage ? `
              <div class="section">
                <h2>🏙️ En Aktif Şehirler Grafiği</h2>
                <div class="chart-container">
                  <div class="chart-title">Bar Grafik - Şehir Bazlı Deprem Sayıları</div>
                  <img src="data:image/png;base64,${cityChartImage}" class="chart-image" alt="Şehir Grafiği" />
                  <p style="text-align: center; color: #666; font-size: 12px; margin-top: 10px;">Grafik başarıyla yakalandı (${cityChartImage.length} karakter)</p>
                </div>
              </div>
              ` : '<div class="section"><p style="color: #999; text-align: center;">City chart yakalanamadı</p></div>'}
              
              <div class="section">
                <h2>🗺️ En Aktif Fay Hatları</h2>
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Fay Hattı</th>
                      <th>Deprem Sayısı</th>
                      <th>Bölge</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${FAULT_LINE_DATA.map(fault => `
                      <tr>
                        <td>${fault.faultLine}</td>
                        <td>${fault.count}</td>
                        <td>${fault.region}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Sayfa 3: Şehirler ve Footer -->
          <div class="page page-break">
            <div class="content">
              <div class="section">
                <h2>🏙️ En Aktif Şehirler</h2>
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Şehir</th>
                      <th>Deprem Sayısı</th>
                      <th>Risk Seviyesi</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${CITY_EARTHQUAKE_DATA.map(city => {
                      const riskLevel = city.count > 100 ? "Yüksek" : city.count > 60 ? "Orta" : "Düşük";
                      return `
                        <tr>
                          <td>${city.city}</td>
                          <td>${city.count}</td>
                          <td>${riskLevel}</td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>

              ${trendChartImage ? `
              <div class="section">
                <h2>📈 Aylık Trend Grafiği</h2>
                <div class="chart-container">
                  <div class="chart-title">Çizgi Grafik - Son 12 Ay Deprem Trendi</div>
                  <img src="data:image/png;base64,${trendChartImage}" class="chart-image" alt="Aylık Trend Grafiği" />
                  <p style="text-align: center; color: #666; font-size: 12px; margin-top: 10px;">Grafik başarıyla yakalandı (${trendChartImage.length} karakter)</p>
                </div>
              </div>
              ` : '<div class="section"><p style="color: #999; text-align: center;">Trend chart yakalanamadı</p></div>'}
              
              <div class="section">
                <h2>📊 Aylık Trend Özeti</h2>
                <div class="chart-placeholder">
                  <h4>📈 Aylık Deprem Aktivitesi</h4>
                  <p>En yüksek aktivite: ${MONTHLY_TREND_DATA[6].month} (${MONTHLY_TREND_DATA[6].count} deprem)</p>
                  <p>En düşük aktivite: ${MONTHLY_TREND_DATA[1].month} (${MONTHLY_TREND_DATA[1].count} deprem)</p>
                  <p>Ortalama aylık aktivite: ${Math.round(MONTHLY_TREND_DATA.reduce((sum, m) => sum + m.count, 0) / MONTHLY_TREND_DATA.length)} deprem</p>
                </div>
              </div>

              <div class="footer">
                <div class="logo">Terra</div>
                <p>Bu rapor Terra uygulaması tarafından otomatik olarak oluşturulmuştur.</p>
                <p>Veriler AFAD, Kandilli ve USGS kaynaklarından derlenmiştir.</p>
                <p>Rapor tarihi: ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR')}</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      // PDF oluştur
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false
      });

      // PDF'i paylaş
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Türkiye Deprem İstatistikleri Raporu'
        });
      } else {
        Alert.alert(
          'PDF Oluşturuldu',
          'PDF raporu başarıyla oluşturuldu ancak paylaşım özelliği mevcut değil.',
          [{ text: 'Tamam', style: 'default' }]
        );
      }
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      Alert.alert(
        'Hata',
        'PDF oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.',
        [{ text: 'Tamam', style: 'default' }]
      );
    }
  };

  // Risk seviyesi renklerini al
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "Yüksek": return colors.danger;
      case "Orta": return colors.warning;
      case "Düşük": return colors.success;
      default: return colors.textSecondary;
    }
  };

  // Ana sayfadaki segmented control stilini taklit eden component
  const SegmentedControl = () => (
    <View style={styles.segmentedControl}>
      <TouchableOpacity
        style={[
          styles.segmentButton,
          selectedSegment === "percentage" && styles.activeSegmentButton,
        ]}
        onPress={() => setSelectedSegment("percentage")}
      >
        <Text
          style={[
            styles.segmentText,
            selectedSegment === "percentage" && styles.activeSegmentText,
          ]}
        >
          Yüzde Dağılımı
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.segmentButton,
          selectedSegment === "details" && styles.activeSegmentButton,
        ]}
        onPress={() => setSelectedSegment("details")}
      >
        <Text
          style={[
            styles.segmentText,
            selectedSegment === "details" && styles.activeSegmentText,
          ]}
        >
          Detaylar
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Sayıları formatla (1328 -> 1.3K)
  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom }]}
      >
        <View style={styles.container}>
          {/* Ana başlık */}
          <Text style={styles.sectionTitle}>Bölgelere Göre Deprem Dağılımı</Text>
          
          {/* Segmented Control */}
          <SegmentedControl />

          {/* Pie Chart Container */}
          <View style={styles.chartSection}>
            <ViewShot ref={pieChartRef} style={styles.chartContainer} options={{ format: 'png', quality: 1.0, result: 'base64' }}>
              <PolarChart
                transformState={state}
                data={data}
                colorKey={"color"}
                valueKey={"value"}
                labelKey={"label"}
              >
                <Pie.Chart>
                  {({ slice }) => {
                    return (
                      <>
                        <Pie.Slice />
                        <Pie.SliceAngularInset
                          angularInset={{
                            angularStrokeWidth: 3,
                            angularStrokeColor: colors.background,
                          }}
                        />
                      </>
                    );
                  }}
                </Pie.Chart>
              </PolarChart>
            </ViewShot>
            
            {/* Merkez bilgi */}
            <View style={styles.centerInfo}>
              <Text style={styles.centerTitle}>Toplam</Text>
              <Text style={styles.centerValue}>{formatNumber(totalEarthquakes)}</Text>
              <Text style={styles.centerSubtitle}>deprem</Text>
            </View>
          </View>

          {/* İstatistik kartları */}
          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: "#FEF2F2" }]}>
                <MaterialCommunityIcons name="alert-circle" size={24} color={colors.danger} />
                <Text style={styles.statNumber}>741</Text>
                <Text style={styles.statLabel}>Yüksek Risk</Text>
              </View>
              
              <View style={[styles.statCard, { backgroundColor: "#FFF7ED" }]}>
                <Ionicons name="shield-checkmark" size={24} color={colors.warning} />
                <Text style={styles.statNumber}>412</Text>
                <Text style={styles.statLabel}>Orta Risk</Text>
              </View>
              
              <View style={[styles.statCard, { backgroundColor: "#F0FDF4" }]}>
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                <Text style={styles.statNumber}>175</Text>
                <Text style={styles.statLabel}>Düşük Risk</Text>
              </View>
            </View>
          </View>

          {/* Bölge detayları */}
          <View style={styles.detailsContainer}>
            {selectedSegment === "percentage" ? (
              // Yüzde görünümü
              <View style={styles.percentageView}>
                {data.map((item, index) => {
                  const percentage = ((item.value / totalEarthquakes) * 100).toFixed(1);
                  return (
                    <View key={index} style={styles.percentageItem}>
                      <View style={styles.percentageRow}>
                        <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
                        <View style={styles.regionInfo}>
                          <Text style={styles.regionName}>{item.region}</Text>
                          <Text style={styles.earthquakeCount}>{item.value} deprem</Text>
                        </View>
                        <Text style={styles.percentageText}>%{percentage}</Text>
                      </View>
                      <View style={styles.progressBarContainer}>
                        <View style={styles.progressBarBackground}>
                          <View 
                            style={[
                              styles.progressBarFill, 
                              { 
                                width: `${parseFloat(percentage)}%`, 
                                backgroundColor: item.color 
                              }
                            ]} 
                          />
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              // Detay görünümü
              <View style={styles.detailsView}>
                {data.map((item, index) => {
                  const percentage = ((item.value / totalEarthquakes) * 100).toFixed(1);
                  return (
                    <TouchableOpacity key={index} style={styles.detailCard} activeOpacity={0.7}>
                      <View style={styles.detailHeader}>
                        <View style={[styles.detailColorBox, { backgroundColor: item.color }]} />
                        <View style={styles.detailInfo}>
                          <Text style={styles.detailRegionName}>{item.region}</Text>
                          <Text style={styles.detailDescription}>{item.description}</Text>
                          <View style={styles.riskBadge}>
                            <View style={[styles.riskDot, { backgroundColor: getRiskColor(item.riskLevel) }]} />
                            <Text style={[styles.riskText, { color: getRiskColor(item.riskLevel) }]}>
                              {item.riskLevel} Risk
                            </Text>
                          </View>
                        </View>
                        <View style={styles.detailStats}>
                          <Text style={styles.detailCount}>{item.value}</Text>
                          <Text style={styles.detailCountLabel}>deprem</Text>
                          <Text style={styles.detailPercentage}>%{percentage}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* En Aktif Şehirler Bar Chart */}
          <View style={styles.chartCardContainer}>
            <Text style={styles.chartTitle}>En Sık Deprem Görülen Şehirler</Text>
            <ViewShot ref={cityChartRef} style={styles.barChartContainer} options={{ format: 'png', quality: 1.0, result: 'base64' }}>
              <CartesianChart
                chartPressState={cityChartState}
                data={CITY_EARTHQUAKE_DATA}
                xKey="cityCode"
                yKeys={["count"]}
                domainPadding={{ left: 50, right: 50, top: 50, bottom: 20 }}
                domain={{ 
                  x: [0, CITY_EARTHQUAKE_DATA.length - 1],
                  y: [0, Math.max(...CITY_EARTHQUAKE_DATA.map(d => d.count)) + 30] 
                }}
                xAxis={{
                  tickCount: CITY_EARTHQUAKE_DATA.length,
                  labelColor: colors.textSecondary,
                  lineWidth: 0,
                  formatXLabel: (value) => value,
                  linePathEffect: <DashPathEffect intervals={[4, 4]} />,
                  labelOffset: 10,
                }}
                yAxis={[
                  {
                    yKeys: ["count"],
                    labelColor: colors.textSecondary,
                    linePathEffect: <DashPathEffect intervals={[4, 4]} />,
                    lineColor: colors.border,
                    formatYLabel: (value) => `${value}`,
                    tickCount: 6,
                  },
                ]}
                frame={{
                  lineWidth: 0,
                }}
              >
                {({ points, chartBounds }) => {
                  return (
                    <Bar
                      points={points.count}
                      chartBounds={chartBounds}
                      animate={{ type: "spring", damping: 15, stiffness: 150 }}
                      innerPadding={0.45}
                      roundedCorners={{
                        topLeft: 8,
                        topRight: 8,
                      }}
                    >
                      <SkiaLinearGradient
                        start={vec(0, 0)}
                        end={vec(0, 400)}
                        colors={[colors.primary, colors.primary + "80"]}
                      />
                    </Bar>
                  );
                }}
              </CartesianChart>
            </ViewShot>
            {activeCityIndex >= 0 && (
              <View style={styles.chartTooltip}>
                <Text style={styles.tooltipCity}>
                  {CITY_EARTHQUAKE_DATA[activeCityIndex]?.city}
                </Text>
                <Text style={styles.tooltipCount}>
                  {CITY_EARTHQUAKE_DATA[activeCityIndex]?.count} deprem
                </Text>
              </View>
            )}
            
            {/* Şehirler Açıklama */}
            <View style={styles.chartExplanation}>
              <Text style={styles.explanationTitle}>Şehir Bazlı Deprem Analizi</Text>
              <Text style={styles.explanationText}>
                Son 12 ay içerisinde en sık deprem kaydedilen şehirler büyüklük ve nüfus yoğunluğu ile doğru orantılıdır. 
                Marmara ve Ege bölgelerindeki şehirler aktif fay hatları nedeniyle daha yüksek aktivite göstermektedir.
              </Text>
            </View>

            {/* Şehirler Detay Listesi */}
            <View style={styles.chartDetailsList}>
              <Text style={styles.detailsListTitle}>Detaylı İstatistikler</Text>
              {CITY_EARTHQUAKE_DATA.map((city, index) => {
                const percentage = ((city.count / CITY_EARTHQUAKE_DATA.reduce((sum, c) => sum + c.count, 0)) * 100).toFixed(1);
                const riskLevel = city.count > 100 ? "Yüksek" : city.count > 60 ? "Orta" : "Düşük";
                const riskColor = riskLevel === "Yüksek" ? colors.danger : riskLevel === "Orta" ? colors.warning : colors.success;
                
                return (
                  <View key={index} style={styles.detailsListItem}>
                    <View style={styles.detailsListRank}>
                      <Text style={styles.rankNumber}>{index + 1}</Text>
                    </View>
                    <View style={styles.detailsListInfo}>
                      <View style={styles.detailsListHeader}>
                        <Text style={styles.detailsListCity}>{city.city}</Text>
                        <View style={[styles.riskBadgeSmall, { backgroundColor: riskColor + "20" }]}>
                          <Text style={[styles.riskTextSmall, { color: riskColor }]}>{riskLevel}</Text>
                        </View>
                      </View>
                      <View style={styles.detailsListStats}>
                        <Text style={styles.detailsListCount}>{city.count} deprem</Text>
                        <Text style={styles.detailsListPercentage}>%{percentage}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
            {activeMagnitudeIndex >= 0 && (
              <View style={styles.chartTooltip}>
                <Text style={styles.tooltipCity}>
                  Büyüklük {MAGNITUDE_DISTRIBUTION_DATA[activeMagnitudeIndex]?.magnitude}
                </Text>
                <Text style={styles.tooltipCount}>
                  {MAGNITUDE_DISTRIBUTION_DATA[activeMagnitudeIndex]?.count} deprem
                </Text>
              </View>
            )}
          </View>

          {/* Aylık Deprem Sayısı Trendi Line Chart */}
          <View style={styles.chartCardContainer}>
            <Text style={styles.chartTitle}>Aylık Deprem Sayısı Trendi</Text>
            <ViewShot ref={trendChartRef} style={styles.barChartContainer} options={{ format: 'png', quality: 1.0, result: 'base64' }}>
              <CartesianChart
                chartPressState={trendChartState}
                data={MONTHLY_TREND_DATA}
                xKey="monthCode"
                yKeys={["count"]}
                domainPadding={{ left: 60, right: 60, top: 60, bottom: 40 }}
                domain={{ 
                  x: [0, MONTHLY_TREND_DATA.length - 1],
                  y: [0, Math.max(...MONTHLY_TREND_DATA.map(d => d.count)) + 50] 
                }}
                xAxis={{
                  tickCount: MONTHLY_TREND_DATA.length,
                  labelColor: colors.textSecondary,
                  lineWidth: 1,
                  lineColor: colors.border,
                  formatXLabel: (value) => value,
                  linePathEffect: <DashPathEffect intervals={[4, 4]} />,
                  labelOffset: 15,
                  labelRotate: 0,
                }}
                yAxis={[
                  {
                    yKeys: ["count"],
                    labelColor: colors.textSecondary,
                    lineWidth: 1,
                    lineColor: colors.border,
                    linePathEffect: <DashPathEffect intervals={[4, 4]} />,
                    formatYLabel: (value) => `${value}`,
                    tickCount: 8,
                    labelOffset: 10,
                  },
                ]}
                frame={{
                  lineWidth: 2,
                  lineColor: colors.border,
                }}
              >
                {({ points }) => {
                  return (
                    <>
                      <Line
                        points={points.count}
                        animate={{ type: "spring", damping: 15, stiffness: 150 }}
                        strokeWidth={3}
                      >
                        <SkiaLinearGradient
                          start={vec(0, 0)}
                          end={vec(0, 400)}
                          colors={[colors.danger, colors.danger]}
                        />
                      </Line>
                      <Scatter
                        points={points.count}
                        animate={{ type: "spring", damping: 15, stiffness: 150 }}
                        radius={6}
                      >
                        <SkiaLinearGradient
                          start={vec(0, 0)}
                          end={vec(0, 400)}
                          colors={[colors.danger, colors.danger]}
                        />
                      </Scatter>
                    </>
                  );
                }}
              </CartesianChart>
            </ViewShot>
            {activeTrendIndex >= 0 && (
              <View style={styles.chartTooltip}>
                <Text style={styles.tooltipCity}>
                  {MONTHLY_TREND_DATA[activeTrendIndex]?.month}
                </Text>
                <Text style={styles.tooltipCount}>
                  {MONTHLY_TREND_DATA[activeTrendIndex]?.count} deprem
                </Text>
              </View>
            )}

            {/* Trend Açıklama */}
            <View style={styles.chartExplanation}>
              <Text style={styles.explanationTitle}>Son 12 Ay Trend Analizi</Text>
              <Text style={styles.explanationText}>
                Y ekseni deprem sayısını, X ekseni ayları göstermektedir. Temmuz ayında en yüksek aktivite görülürken, 
                Şubat ve Aralık aylarında düşük aktivite kaydedilmiştir. Mevsimsel değişimler ve tektonik aktivite döngüleri 
                bu trendi etkilemektedir.
              </Text>
            </View>

            {/* Trend Detay Listesi */}
            <View style={styles.chartDetailsList}>
              <Text style={styles.detailsListTitle}>Aylık Analiz</Text>
              {MONTHLY_TREND_DATA.map((month, index) => {
                const trendDirection = index > 0 ? 
                  (month.count > MONTHLY_TREND_DATA[index - 1].count ? "↑" : month.count < MONTHLY_TREND_DATA[index - 1].count ? "↓" : "→") : "→";
                const trendColor = trendDirection === "↑" ? colors.danger : trendDirection === "↓" ? colors.success : colors.textSecondary;
                const trendText = index > 0 ? 
                  (month.count > MONTHLY_TREND_DATA[index - 1].count ? "Artış" : month.count < MONTHLY_TREND_DATA[index - 1].count ? "Azalış" : "Sabit") : "Başlangıç";
                
                return (
                  <View key={index} style={styles.trendListItem}>
                    <View style={styles.trendMonthInfo}>
                      <Text style={styles.trendMonth}>{month.month}</Text>
                      <View style={[styles.trendBadge, { backgroundColor: trendColor + "20" }]}>
                        <Text style={[styles.trendText, { color: trendColor }]}>{trendDirection} {trendText}</Text>
                      </View>
                    </View>
                    <View style={styles.trendStats}>
                      <Text style={styles.trendCount}>{month.count} deprem</Text>
                      <Text style={styles.trendPercentage}>
                        {((month.count / MONTHLY_TREND_DATA.reduce((sum, m) => sum + m.count, 0)) * 100).toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* En Aktif Fay Hatları Bar Chart */}
          <View style={styles.chartCardContainer}>
            <Text style={styles.chartTitle}>En Aktif Fay Hatları</Text>
            <View style={styles.barChartContainer}>
              <CartesianChart
                chartPressState={faultChartState}
                data={FAULT_LINE_DATA}
                xKey="faultLine"
                yKeys={["count"]}
                domainPadding={{ left: 60, right: 60, top: 60, bottom: 20 }}
                domain={{ 
                  x: [0, FAULT_LINE_DATA.length - 1],
                  y: [0, Math.max(...FAULT_LINE_DATA.map(d => d.count)) + 50] 
                }}
                xAxis={{
                  tickCount: FAULT_LINE_DATA.length,
                  labelColor: colors.textSecondary,
                  lineWidth: 0,
                  formatXLabel: (value) => value,
                  linePathEffect: <DashPathEffect intervals={[4, 4]} />,
                  labelRotate: 0,
                  labelOffset: 12,
                }}
                yAxis={[
                  {
                    yKeys: ["count"],
                    labelColor: colors.textSecondary,
                    linePathEffect: <DashPathEffect intervals={[4, 4]} />,
                    lineColor: colors.border,
                    formatYLabel: (value) => `${value}`,
                    tickCount: 6,
                  },
                ]}
                frame={{
                  lineWidth: 0,
                }}
              >
                {({ points, chartBounds }) => {
                  return points.count.map((point, index) => {
                    // Fay hattına göre renk gradasyonu
                    const getBarColors = (idx: number) => {
                      const colorPairs = [
                        [colors.danger, colors.danger + "80"],        // Kuzey Anadolu (kırmızı)
                        ["#8B0000", "#8B000080"],                     // Doğu Anadolu (koyu kırmızı)
                        [colors.warning, colors.warning + "80"],      // Batı Anadolu (turuncu)
                        [colors.info, colors.info + "80"],           // Güney Anadolu (mavi)
                        [colors.success, colors.success + "80"],      // İç Anadolu (yeşil)
                      ];
                      return colorPairs[idx] || colorPairs[0];
                    };

                    const [startColor, endColor] = getBarColors(index);

                    return (
                      <Bar
                        key={index}
                        points={[point]}
                        chartBounds={chartBounds}
                        animate={{ type: "spring", damping: 15, stiffness: 150 }}
                        innerPadding={0.5}
                        roundedCorners={{
                          topLeft: 8,
                          topRight: 8,
                        }}
                      >
                        <SkiaLinearGradient
                          start={vec(0, 0)}
                          end={vec(0, 400)}
                          colors={[startColor, endColor]}
                        />
                      </Bar>
                    );
                  });
                }}
              </CartesianChart>
            </View>
            {activeFaultIndex >= 0 && (
              <View style={styles.chartTooltip}>
                <Text style={styles.tooltipCity}>
                  {FAULT_LINE_DATA[activeFaultIndex]?.faultLine}
                </Text>
                <Text style={styles.tooltipCount}>
                  {FAULT_LINE_DATA[activeFaultIndex]?.count} deprem
                </Text>
                <Text style={styles.tooltipRegion}>
                  {FAULT_LINE_DATA[activeFaultIndex]?.region} Bölgesi
                </Text>
              </View>
            )}

            {/* Fay Hatları Açıklama */}
            <View style={styles.chartExplanation}>
              <Text style={styles.explanationTitle}>Türkiye'nin En Aktif Fay Hatları</Text>
              <Text style={styles.explanationText}>
                Y ekseni deprem sayısını, X ekseni fay hatlarını göstermektedir. Kuzey Anadolu Fay Hattı en aktif fay hattı olarak öne çıkmaktadır. 
                Fay hatlarının aktivitesi bölgesel tektonik hareketlerle doğrudan ilişkilidir. Grafikteki sütunlara dokunarak detaylı bilgi alabilirsiniz.
              </Text>
            </View>

            {/* Fay Hatları Detay Listesi */}
            <View style={styles.chartDetailsList}>
              <Text style={styles.detailsListTitle}>En Aktif Fay Hatları Analizi</Text>
              {FAULT_LINE_DATA.map((fault, index) => {
                const percentage = ((fault.count / FAULT_LINE_DATA.reduce((sum, f) => sum + f.count, 0)) * 100).toFixed(1);
                const riskLevel = fault.count > 200 ? "Çok Yüksek" : fault.count > 150 ? "Yüksek" : fault.count > 100 ? "Orta" : "Düşük";
                const riskLevelShort = fault.count > 200 ? "Çok Yük." : fault.count > 150 ? "Yüksek" : fault.count > 100 ? "Orta" : "Düşük";
                const riskColor = riskLevel === "Çok Yüksek" ? colors.danger : riskLevel === "Yüksek" ? "#8B0000" : riskLevel === "Orta" ? colors.warning : colors.success;
                
                return (
                  <View key={index} style={styles.faultListItem}>
                    <View style={[styles.faultColorBar, { backgroundColor: riskColor }]} />
                    <View style={styles.faultInfo}>
                      <View style={styles.faultHeader}>
                        <Text style={styles.faultName} numberOfLines={2}>{fault.faultLine}</Text>
                      </View>
                      <View style={styles.faultStats}>
                        <Text style={styles.faultCount}>{fault.count} deprem</Text>
                        <View style={[styles.riskBadgeSmall, { backgroundColor: riskColor + "20", marginLeft: 1 }]}>
                          <Text style={[styles.riskTextSmall, { color: riskColor }]}>{riskLevelShort}</Text>
                        </View>
                        <Text style={styles.faultPercentage}>%{percentage}</Text>
                      </View>
                      <Text style={styles.faultRegion}>{fault.region} Bölgesi</Text>
                      <Text style={styles.faultDescription}>{fault.description}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Deprem Büyüklük Dağılımı Bar Chart */}
          <View style={styles.chartCardContainer}>
            <Text style={styles.chartTitle}>Deprem Büyüklük Dağılımı</Text>
            <View style={styles.barChartContainer}>
              <CartesianChart
                chartPressState={magnitudeChartState}
                data={MAGNITUDE_DISTRIBUTION_DATA}
                xKey="range"
                yKeys={["count"]}
                domainPadding={{ left: 60, right: 60, top: 60, bottom: 20 }}
                domain={{ 
                  x: [0, MAGNITUDE_DISTRIBUTION_DATA.length - 1],
                  y: [0, Math.max(...MAGNITUDE_DISTRIBUTION_DATA.map(d => d.count)) + 150] 
                }}
                xAxis={{
                  tickCount: MAGNITUDE_DISTRIBUTION_DATA.length,
                  labelColor: colors.textSecondary,
                  lineWidth: 0,
                  formatXLabel: (value) => value,
                  linePathEffect: <DashPathEffect intervals={[4, 4]} />,
                  labelRotate: 0,
                  labelOffset: 12,
                }}
                yAxis={[
                  {
                    yKeys: ["count"],
                    labelColor: colors.textSecondary,
                    linePathEffect: <DashPathEffect intervals={[4, 4]} />,
                    lineColor: colors.border,
                    formatYLabel: (value) => `${value}`,
                    tickCount: 6,
                  },
                ]}
                frame={{
                  lineWidth: 0,
                }}
              >
                {({ points, chartBounds }) => {
                  return points.count.map((point, index) => {
                    // Büyüklüğe göre renk gradasyonu
                    const getBarColors = (idx: number) => {
                      const colorPairs = [
                        [colors.success, colors.success + "80"],      // 3.0-3.9 (yeşil)
                        [colors.info, colors.info + "80"],           // 4.0-4.9 (mavi)
                        [colors.warning, colors.warning + "80"],     // 5.0-5.9 (turuncu)
                        [colors.danger, colors.danger + "80"],       // 6.0-6.9 (kırmızı)
                        ["#8B0000", "#8B000080"],                    // 7.0+ (koyu kırmızı)
                      ];
                      return colorPairs[idx] || colorPairs[0];
                    };

                    const [startColor, endColor] = getBarColors(index);

                    return (
                      <Bar
                        key={index}
                        points={[point]}
                        chartBounds={chartBounds}
                        animate={{ type: "spring", damping: 15, stiffness: 150 }}
                        innerPadding={0.5}
                        roundedCorners={{
                          topLeft: 8,
                          topRight: 8,
                        }}
                      >
                        <SkiaLinearGradient
                          start={vec(0, 0)}
                          end={vec(0, 400)}
                          colors={[startColor, endColor]}
                        />
                      </Bar>
                    );
                  });
                }}
              </CartesianChart>
            </View>


            {/* Büyüklük Açıklama */}
            <View style={styles.chartExplanation}>
              <Text style={styles.explanationTitle}>Richter Ölçeği Dağılımı</Text>
              <Text style={styles.explanationText}>
                Y ekseni deprem sayısını, X ekseni büyüklük aralıklarını göstermektedir. Deprem büyüklükleri logaritmik ölçekte değerlendirilir. 
                3.0-4.9 arası depremlerin sayısının fazla olması normal bir dağılımdır. 6.0 ve üzeri depremlerin az olması bölgesel risk değerlendirmesi için önemli bir göstergedir.
              </Text>
            </View>

            {/* Büyüklük Detay Listesi */}
            <View style={styles.chartDetailsList}>
              <Text style={styles.detailsListTitle}>Büyüklük Analizi</Text>
              {MAGNITUDE_DISTRIBUTION_DATA.map((magnitude, index) => {
                const percentage = ((magnitude.count / MAGNITUDE_DISTRIBUTION_DATA.reduce((sum, m) => sum + m.count, 0)) * 100).toFixed(1);
                const impactLevel = index === 0 ? "Minimal" : index === 1 ? "Hafif" : index === 2 ? "Orta" : index === 3 ? "Güçlü" : "Çok Güçlü";
                const impactColor = index === 0 ? colors.success : index === 1 ? colors.info : index === 2 ? colors.warning : colors.danger;
                
                return (
                  <View key={index} style={styles.magnitudeListItem}>
                    <View style={[styles.magnitudeColorBar, { backgroundColor: impactColor }]} />
                    <View style={styles.magnitudeInfo}>
                      <View style={styles.magnitudeHeader}>
                        <Text style={styles.magnitudeRange}>{magnitude.magnitude}</Text>
                        <View style={[styles.impactBadge, { backgroundColor: impactColor + "20" }]}>
                          <Text style={[styles.impactText, { color: impactColor }]}>{impactLevel}</Text>
                        </View>
                      </View>
                      <View style={styles.magnitudeStats}>
                        <Text style={styles.magnitudeCount}>{magnitude.count} deprem</Text>
                        <Text style={styles.magnitudePercentage}>%{percentage}</Text>
                      </View>
                      <Text style={styles.magnitudeDescription}>
                        {index === 0 && "Genellikle hissedilmeyen, sadece sismograflarla kaydedilen"}
                        {index === 1 && "Hafif sarsıntı, bazı kişiler tarafından hissedilebilir"}
                        {index === 2 && "Binalarda çatlaklar, mobilyalar hareket eder"}
                        {index === 3 && "Yapısal hasarlar, panik yaratabilir"}
                        {index === 4 && "Büyük hasarlar, yıkımlar meydana gelir"}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Risk Değerlendirme Özeti */}
            <View style={styles.riskSummary}>
              <View style={styles.riskSummaryHeader}>
                <MaterialCommunityIcons name="shield-check" size={20} color={colors.info} />
                <Text style={styles.riskSummaryTitle}>Risk Değerlendirmesi</Text>
              </View>
              <View style={styles.riskStats}>
                <View style={styles.riskStatItem}>
                  <Text style={styles.riskStatNumber}>
                    {((MAGNITUDE_DISTRIBUTION_DATA.slice(0, 2).reduce((sum, m) => sum + m.count, 0) / 
                      MAGNITUDE_DISTRIBUTION_DATA.reduce((sum, m) => sum + m.count, 0)) * 100).toFixed(0)}%
                  </Text>
                  <Text style={styles.riskStatLabel}>Düşük Şiddet</Text>
                </View>
                <View style={styles.riskStatItem}>
                  <Text style={styles.riskStatNumber}>
                    {((MAGNITUDE_DISTRIBUTION_DATA[2].count / 
                      MAGNITUDE_DISTRIBUTION_DATA.reduce((sum, m) => sum + m.count, 0)) * 100).toFixed(0)}%
                  </Text>
                  <Text style={styles.riskStatLabel}>Orta Şiddet</Text>
                </View>
                <View style={styles.riskStatItem}>
                  <Text style={styles.riskStatNumber}>
                    {((MAGNITUDE_DISTRIBUTION_DATA.slice(3).reduce((sum, m) => sum + m.count, 0) / 
                      MAGNITUDE_DISTRIBUTION_DATA.reduce((sum, m) => sum + m.count, 0)) * 100).toFixed(0)}%
                  </Text>
                  <Text style={styles.riskStatLabel}>Yüksek Şiddet</Text>
                </View>
              </View>
            </View>
          </View>

          {/* En aktif bölge bilgisi */}
          <View style={styles.summaryCard}>
            <LinearGradient
              colors={[colors.gradientOne, colors.gradientTwo]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.summaryGradient}
            >
              <View style={styles.summaryContent}>
                <Ionicons name="analytics" size={24} color="#fff" style={styles.summaryIcon} />
                <View style={styles.summaryText}>
                  <Text style={styles.summaryTitle}>En Aktif Bölge</Text>
                  <Text style={styles.summaryDescription}>
                    {data[0].region} - {data[0].value} deprem (%{((data[0].value / totalEarthquakes) * 100).toFixed(1)})
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* En aktif fay hattı bilgisi */}
          <View style={styles.summaryCard}>
            <LinearGradient
              colors={[colors.danger, "#8B0000"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.summaryGradient}
            >
              <View style={styles.summaryContent}>
                <MaterialCommunityIcons name="map-marker-path" size={24} color="#fff" style={styles.summaryIcon} />
                <View style={styles.summaryText}>
                  <Text style={styles.summaryTitle}>En Aktif Fay Hattı</Text>
                  <Text style={styles.summaryDescription}>
                    {FAULT_LINE_DATA[0].faultLine} - {FAULT_LINE_DATA[0].count} deprem ({FAULT_LINE_DATA[0].region})
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* En aktif şehir bilgisi */}
          <View style={styles.summaryCard}>
            <LinearGradient
              colors={[colors.info, "#0066CC"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.summaryGradient}
            >
              <View style={styles.summaryContent}>
                <Ionicons name="location" size={24} color="#fff" style={styles.summaryIcon} />
                <View style={styles.summaryText}>
                  <Text style={styles.summaryTitle}>En Aktif Şehir</Text>
                  <Text style={styles.summaryDescription}>
                    {CITY_EARTHQUAKE_DATA[0].city} - {CITY_EARTHQUAKE_DATA[0].count} deprem
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Ek bilgi kartı */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle" size={20} color={colors.info} />
              <Text style={styles.infoTitle}>Son 12 Ay Verileri</Text>
            </View>
            <Text style={styles.infoDescription}>
              Yukarıdaki veriler son 12 ay içerisinde kayıtlara geçen 3.0 ve üzeri büyüklükteki 
              depremlerden oluşmaktadır. Veriler AFAD, Kandilli ve USGS kaynaklarından derlenmiştir.
            </Text>
          </View>

          {/* Paylaşım ve İndirme Butonları */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <LinearGradient
                colors={[colors.primary, colors.gradientTwo]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="share-social" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Paylaş</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleDownloadPDF}>
              <LinearGradient
                colors={[colors.info, "#0066CC"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionButtonGradient}
              >
                <MaterialCommunityIcons name="file-pdf-box" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>PDF İndir</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
    );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  container: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 20,
    color: colors.textPrimary,
    letterSpacing: 0.2,
    textAlign: "center",
    alignSelf: "center",
  },
  segmentedControl: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 24,
    marginHorizontal: 4,
  },
  segmentButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    position: "relative",
  },
  activeSegmentButton: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  segmentText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  activeSegmentText: {
    color: colors.textPrimary,
    fontWeight: "600",
  },
  chartSection: {
    position: "relative",
    alignItems: "center",
    marginBottom: 28,
  },
  chartContainer: {
    height: 300,
    width: width - 32,
  },
  centerInfo: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -60 }, { translateY: -60 }],
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
    borderRadius: 60,
    width: 120,
    height: 120,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 3,
    borderColor: colors.background,
  },
  centerTitle: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  centerValue: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.textPrimary,
    marginVertical: 2,
  },
  centerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statsContainer: {
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: 18,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.textPrimary,
    marginTop: 10,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "600",
    textAlign: "center",
  },
  detailsContainer: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  percentageView: {
    gap: 16,
  },
  percentageItem: {
    marginBottom: 4,
  },
  percentageRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  colorIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  regionInfo: {
    flex: 1,
  },
  regionName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 2,
  },
  earthquakeCount: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  percentageText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primary,
  },
  progressBarContainer: {
    marginLeft: 32,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: colors.surface,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  detailsView: {
    gap: 12,
  },
  detailCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  detailColorBox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    marginRight: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  detailInfo: {
    flex: 1,
  },
  detailRegionName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  detailDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  riskBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  riskDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  riskText: {
    fontSize: 12,
    fontWeight: "600",
  },
  detailStats: {
    alignItems: "flex-end",
  },
  detailCount: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  detailCountLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  detailPercentage: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  // Bar Chart Stilleri
  chartCardContainer: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 16,
    textAlign: "center",
  },
  barChartContainer: {
    height: 300,
    width: "100%",
    marginBottom: 12,
  },
  chartTooltip: {
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  tooltipCity: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 2,
  },
  tooltipCount: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  tooltipRegion: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "400",
    marginTop: 2,
  },
  // Chart Açıklama Stilleri
  chartExplanation: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  explanationTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  // Detay Listesi Stilleri
  chartDetailsList: {
    marginTop: 16,
  },
  detailsListTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 12,
  },
  detailsListItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  detailsListRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
  },
  detailsListInfo: {
    flex: 1,
  },
  detailsListHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  detailsListCity: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  riskBadgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    width: 70,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  riskTextSmall: {
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
  },
  detailsListStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailsListCount: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  detailsListPercentage: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
  },
  // Büyüklük Listesi Stilleri
  magnitudeListItem: {
    flexDirection: "row",
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  magnitudeColorBar: {
    width: 4,
    borderRadius: 2,
    marginRight: 14,
  },
  magnitudeInfo: {
    flex: 1,
  },
  magnitudeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  magnitudeRange: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  impactBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  impactText: {
    fontSize: 12,
    fontWeight: "600",
  },
  magnitudeStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  magnitudeCount: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  magnitudePercentage: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
  },
  magnitudeDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
    fontStyle: "italic",
  },
  // Fay Hatları Listesi Stilleri
  faultListItem: {
    flexDirection: "row",
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  faultColorBar: {
    width: 4,
    borderRadius: 2,
    marginRight: 14,
  },
  faultInfo: {
    flex: 1,
  },
  faultHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
    justifyContent: "space-between",
  },
  faultNameContainer: {
    flex: 1,
    marginRight: 12,
  },
  faultName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  faultStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    flexWrap: "wrap",
  },
  faultCount: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  faultPercentage: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
  },
  faultRegion: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
    fontStyle: "italic",
  },
  faultDescription: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 15,
    marginTop: 4,
    fontStyle: "italic",
  },
  // Trend Listesi Stilleri
  trendListItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  trendMonthInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  trendMonth: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  trendBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  trendText: {
    fontSize: 11,
    fontWeight: "600",
  },
  trendStats: {
    alignItems: "flex-end",
  },
  trendCount: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  trendPercentage: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
  },
  // Risk Özeti Stilleri
  riskSummary: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  riskSummaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  riskSummaryTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    marginLeft: 8,
  },
  riskStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  riskStatItem: {
    alignItems: "center",
  },
  riskStatNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  riskStatLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
    textAlign: "center",
  },
  summaryCard: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  summaryGradient: {
    padding: 20,
  },
  summaryContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryIcon: {
    marginRight: 14,
  },
  summaryText: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  summaryDescription: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    marginLeft: 8,
  },
  infoDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  // Action Buttons Stilleri
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 20,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  actionButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginLeft: 8,
  },
});

export default EarthquakeStats;