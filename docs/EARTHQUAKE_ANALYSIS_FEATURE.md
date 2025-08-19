# Deprem Analizleri Özelliği

Bu özellik, İstanbul'daki mahallelerin bina yapıları, yaş grupları ve kat sayılarına göre deprem risk analizi yapmanızı sağlar.

## Özellikler

### 1. Üç Sekmeli Haber Sayfası
- **Güncel**: NewsAPI'den gelen deprem haberleri
- **Uzman Yorumları**: Deprem uzmanlarından güncel yorumlar
- **Deprem Analizleri**: İstanbul mahalle bina analizleri (YENİ!)

### 2. İstanbul Mahalle Bina ve Yapıları Analizi
- **Şehir Seçimi**: İstanbul (sabit)
- **İlçe Seçimi**: İstanbul'daki tüm ilçeler
- **Mahalle Seçimi**: Seçilen ilçeye ait mahalleler

### 3. Veri Analizi
- **Bina Yaş Dağılımı**:
  - 1980 öncesi binalar
  - 1980-2000 arası binalar
  - 2000 sonrası binalar

- **Bina Kat Dağılımı**:
  - 1-4 kat arası binalar
  - 5-9 kat arası binalar
  - 9-19 kat arası binalar

- **Toplam Bina Sayısı**: Otomatik hesaplanan toplam

### 4. Terra AI Analizi
- Gemini AI kullanarak otomatik deprem risk değerlendirmesi
- Bina yaş yapısının risk faktörü analizi
- Kat yüksekliğinin etkisi değerlendirmesi
- Kişiselleştirilmiş güvenlik önerileri
- Typing effect ile dinamik gösterim

## Kullanım

### Haberler Sayfasında
1. "Deprem Analizleri" sekmesine tıklayın
2. "Analizi Görüntüle" butonuna tıklayın

### Deprem Analizi Sayfasında
1. **İlçe Seçin**: Dropdown menüden ilçe seçin
2. **Mahalle Seçin**: Seçilen ilçeye ait mahalle seçin
3. **Verileri İnceleyin**: Bina yaş ve kat dağılımlarını görün
4. **AI Analizi**: "AI Analizi Oluştur" butonuna tıklayın
5. **Sonuçları Görün**: Terra AI'nin deprem risk analizini okuyun

## Teknik Detaylar

### Veri Kaynağı
- **Dosya**: `/assets/data/mahallebinasayilarıanaliz.json`
- **Format**: JSON formatında bina analiz verileri
- **Kapsam**: İstanbul'daki tüm ilçe ve mahalleler

### AI Entegrasyonu
- **Model**: Gemini 2.0 Flash Exp
- **API Key**: Google Generative AI
- **Prompt**: Türkçe, 4-5 cümlelik analiz
- **Özellikler**: Typing effect, dinamik yükseklik

### Performans
- Lazy loading ile JSON veri yükleme
- Filtrelenmiş veri gösterimi
- Responsive tasarım
- Smooth animasyonlar

## Güvenlik ve Gizlilik

- Tüm veriler yerel olarak saklanır
- AI analizi için veri gönderimi yapılmaz
- Kullanıcı verileri toplanmaz
- Offline çalışabilir

## Gelecek Geliştirmeler

- [ ] Diğer şehirler için veri ekleme
- [ ] Görsel grafikler ve chartlar
- [ ] Detaylı risk skorlama
- [ ] Karşılaştırmalı analiz
- [ ] Export ve paylaşım özellikleri
- [ ] Offline veri senkronizasyonu

## Destek

Herhangi bir sorun yaşarsanız:
1. Uygulama loglarını kontrol edin
2. JSON veri dosyasının varlığını doğrulayın
3. İnternet bağlantınızı kontrol edin (AI analizi için)
4. Geliştirici desteği sayfasını kullanın 