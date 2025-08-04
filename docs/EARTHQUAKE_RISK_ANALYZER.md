# Deprem Risk Analizi Modülü

Bu modül, kullanıcıların konumlarına göre deprem risk değerlendirmesi yapmalarını sağlar.

## Özellikler

### 1. Konum Seçimi
- **İl Seçimi**: Türkiye'nin 81 ilinden birini seçin
- **İlçe Seçimi**: Seçilen ile ait ilçeleri görüntüleyin
- **Mahalle Seçimi**: Seçilen ilçeye ait mahalleleri görüntüleyin (şu an dummy data)
- **Detaylı Adres**: Google Maps API ile entegre adres arama

### 2. Google Maps Entegrasyonu
- Kullanıcının girdiği adresi koordinatlara çevirir
- Türkiye sınırları içindeki adresler için optimize edilmiştir
- Koordinatlar arka planda kullanılır, kullanıcıya gösterilmez
- Gerçek API key ile çalışır (şu an mock data kullanılıyor)

### 3. Risk Analizi
Aşağıdaki parametreler hesaplanır:
- **PGA (Peak Ground Acceleration)**: Yer ivmesi değerleri
- **SS (Spectral Acceleration)**: Spektral ivme değerleri  
- **S2 (Spectral Acceleration 2)**: 2 saniye periyot spektral ivme
- **PGV (Peak Ground Velocity)**: Yer hızı değerleri

### 4. Risk Değerlendirmesi
Her analiz sonucunda 4 kategoride değerlendirme yapılır:
- **En Yakın Fay Hattı**: Mesafe, bölge ve açıklama bilgileri
- **Altyapı Riski**: Su, elektrik, iletişim sistemleri
- **Bina Riski**: Düşük ve yüksek katlı binalar
- **Zemin Riski**: Zemin yapısı ve sıvılaşma riski

### 5. Terra AI Analizi
- Gemini AI kullanarak otomatik risk değerlendirmesi
- PGA, SS, S2 ve PGV değerlerine göre analiz
- En yakın fay hattı bilgisi AI analizine dahil edilir
- Maksimum 5 cümlelik typing efekt ile AI yanıtı
- Dinamik yükseklik ile metin uzadıkça alan genişler
- Gerçek zamanlı AI analizi

## Kullanım

### Ana Sayfada
1. "Konumuna Göre Deprem Riskini Öğren" modülüne tıklayın
2. "Risk Analizi Yap" butonuna basın

### Risk Analizi Sayfasında
1. **İl Seçin**: Dropdown menüden il seçin
2. **İlçe Seçin**: Seçilen ile ait ilçeleri görüntüleyin
3. **Mahalle Seçin**: Seçilen ilçeye ait mahalleleri görüntüleyin
4. **Adres Girin**: Detaylı adres bilgisi girin
5. **Risk Analizi Yap**: Adres arama ve risk analizi otomatik olarak başlar
6. **Terra AI Analizi**: AI tarafından otomatik olarak oluşturulan değerlendirme

## Teknik Detaylar

### Veri Kaynakları
- **Şehir ve İlçe Verileri**: `assets/data/turkey-cities-districts.json`
- **Mahalle Verileri**: Şu an dummy data (gelecekte gerçek veri eklenecek)
- **Risk Hesaplamaları**: Mock API (gelecekte gerçek servis entegrasyonu)

### API Entegrasyonları
- **Google Maps Geocoding API**: Adres → Koordinat dönüşümü
- **Risk Analizi API**: Koordinat → Risk değerleri hesaplama
- **Fay Hattı Hesaplama**: Haversine formülü ile en yakın fay hattı tespiti
- **Gemini AI API**: Risk değerleri + Fay hattı bilgisi → AI analizi ve öneriler

### Risk Hesaplama Algoritması
Risk değerleri konuma göre çarpan faktörü ile hesaplanır:
- **İstanbul Bölgesi**: 1.5x (Yüksek Risk)
- **İzmir Bölgesi**: 1.3x (Orta-Yüksek Risk)  
- **Ankara Bölgesi**: 1.2x (Orta Risk)
- **Diğer Bölgeler**: 1.0x (Normal Risk)

## Gelecek Geliştirmeler

1. **Gerçek Mahalle Verileri**: Türkiye'nin tüm mahalle verilerinin eklenmesi
2. **Gerçek Risk API**: AFAD veya benzeri kurumlarla entegrasyon
3. **Harita Görünümü**: Risk analizi sonuçlarının harita üzerinde gösterimi
4. **Geçmiş Analizler**: Kullanıcının önceki analizlerini kaydetme
5. **Bildirimler**: Risk değişikliklerinde kullanıcıyı bilgilendirme
6. **Gelişmiş AI Analizi**: Daha detaylı ve kişiselleştirilmiş AI önerileri
7. **Çoklu Dil Desteği**: AI analizinin farklı dillerde sunulması
8. **Fay Hattı Haritası**: En yakın fay hattının harita üzerinde gösterimi
9. **Fay Hattı Geçmişi**: Fay hattının geçmiş aktivite verileri

## Kurulum

### Google Maps API Key
1. Google Cloud Console'da proje oluşturun
2. Geocoding API'yi etkinleştirin
3. API key oluşturun
4. `components/EarthquakeRiskAnalyzer.tsx` dosyasında `YOUR_GOOGLE_MAPS_API_KEY` yerine gerçek key'i yazın

### Risk Analizi API
1. Risk hesaplama servisi ile anlaşma yapın
2. API endpoint'lerini belirleyin
3. Mock API çağrılarını gerçek API çağrıları ile değiştirin

### Gemini AI API
1. Google Cloud Console'da Gemini API'yi etkinleştirin
2. API key oluşturun
3. `components/EarthquakeRiskAnalyzer.tsx` dosyasında API key'i güncelleyin

## Dosya Yapısı

```
components/
├── EarthquakeRiskAnalyzer.tsx          # Ana bileşen
app/(protected)/
├── earthquake-risk-analyzer.tsx        # Sayfa wrapper
assets/data/
├── turkey-cities-districts.json        # Şehir/İlçe verileri
docs/
├── EARTHQUAKE_RISK_ANALYZER.md         # Bu dokümantasyon
```

## Test

Modülü test etmek için:
1. Uygulamayı başlatın
2. Ana sayfada "Risk Analizi Yap" butonuna tıklayın
3. İl, ilçe, mahalle seçin
4. Adres girin ve "Risk Analizi Yap" butonuna basın
5. Risk analizi sonuçlarını kontrol edin:
   - En yakın fay hattı bilgisi ve mesafesi
   - Risk değerlendirmesi (Altyapı, Bina, Zemin)
   - Terra AI analizi (dinamik yükseklik ile)
6. Typing efekt ile AI yanıtının oluşturulduğunu gözlemleyin
7. Farklı konumlar için farklı fay hatları tespit edildiğini kontrol edin

## Sorun Giderme

### Adres Bulunamıyor
- Adresin Türkiye sınırları içinde olduğundan emin olun
- Daha detaylı adres bilgisi girin
- Google Maps API key'inin doğru olduğunu kontrol edin

### Risk Analizi Başarısız
- Koordinatların doğru alındığından emin olun
- İnternet bağlantınızı kontrol edin
- Risk API servisinin çalıştığından emin olun 