# Konum ve Acil Durum Kontakları Özellikleri

Bu dokümantasyon, Terra uygulamasının profil ekranına eklenen yeni konum ve acil durum kontakları özelliklerini açıklar.

## Özellikler

### 1. GPS Konum Seçimi

#### Amaç
Kullanıcıların mevcut GPS konumlarını alarak otomatik olarak şehir, ilçe ve adres bilgilerini doldurması.

#### Özellikler
- **"Konumumu Seç" butonu**: GPS konumunu alır ve koordinatları backend'e kaydeder
- **Otomatik adres doldurma**: GPS koordinatlarından reverse geocoding ile adres bilgisi alınır
- **Şehir/İlçe otomatik seçimi**: GPS verilerinden şehir ve ilçe bilgileri otomatik olarak seçilir
- **Koordinat saklama**: Latitude ve longitude değerleri backend'de saklanır

#### Teknik Detaylar
- `expo-location` kullanılarak GPS konumu alınır
- `Location.reverseGeocodeAsync()` ile koordinatlardan adres bilgisi çıkarılır
- Koordinatlar `DECIMAL(10,8)` ve `DECIMAL(11,8)` formatında saklanır

### 2. Adres Alanı

#### Amaç
Kullanıcıların detaylı adres bilgilerini girebilmesi.

#### Özellikler
- **Çok satırlı metin alanı**: 3 satır yüksekliğinde adres girişi
- **Otomatik doldurma**: GPS konumu alındığında otomatik olarak doldurulur
- **Manuel düzenleme**: Kullanıcılar adresi manuel olarak düzenleyebilir

### 3. Çoklu Acil Durum Kontakları

#### Amaç
Kullanıcıların birden fazla acil durum telefon numarası ekleyebilmesi.

#### Özellikler
- **Manuel numara ekleme**: Kullanıcılar telefon numarasını manuel olarak girebilir
- **Rehberden seçme**: Cihaz rehberinden kişi seçerek numara ekleyebilir
- **Çoklu numara desteği**: Sınırsız sayıda acil durum numarası eklenebilir
- **Numara silme**: Eklenen numaraları tek tek silebilme
- **Türk telefon numarası formatı**: 5XX XXX XX XX formatında otomatik formatlama
- **Validasyon**: 10 haneli Türk telefon numarası kontrolü

#### Teknik Detaylar
- `expo-contacts` kullanılarak rehber erişimi sağlanır
- Telefon numaraları `TEXT[]` array formatında saklanır
- Türk telefon numarası formatı için özel temizleme fonksiyonu

## Veritabanı Değişiklikleri

### Yeni Alanlar

```sql
ALTER TABLE profiles 
ADD COLUMN address TEXT,
ADD COLUMN latitude DECIMAL(10, 8),
ADD COLUMN longitude DECIMAL(11, 8),
ADD COLUMN emergency_contacts TEXT[];
```

### Alan Açıklamaları

- `address`: Kullanıcının detaylı adres bilgisi
- `latitude`: GPS enlem koordinatı (10 basamak, 8 ondalık)
- `longitude`: GPS boylam koordinatı (11 basamak, 8 ondalık)
- `emergency_contacts`: Acil durum telefon numaraları dizisi

### İndeksler

```sql
CREATE INDEX idx_profiles_location ON profiles(latitude, longitude);
CREATE INDEX idx_profiles_city_district ON profiles(city, district);
```

## Kullanıcı Arayüzü

### Konum Bölümü
1. **İl/İlçe Seçimi**: Dropdown ile manuel seçim
2. **GPS Konum Butonu**: "Konumumu Seç" butonu ile otomatik konum alma
3. **Adres Alanı**: Çok satırlı metin alanı

### Acil Durum Kontakları Bölümü
1. **Numara Ekle Butonu**: Manuel numara ekleme
2. **Rehberden Seç Butonu**: Rehber erişimi
3. **Kontak Listesi**: Eklenen numaraların listesi
4. **Silme Butonu**: Her numara için silme seçeneği

## Güvenlik ve İzinler

### Gerekli İzinler
- **Konum İzni**: GPS konumu almak için
- **Rehber İzni**: Kişi listesine erişmek için

### Veri Güvenliği
- Koordinatlar sadece kullanıcının kendi profilinde saklanır
- RLS (Row Level Security) ile veri erişimi kontrol edilir
- Acil durum numaraları şifrelenmiş olarak saklanır

## Kullanım Senaryoları

### 1. İlk Kez Konum Ekleme
1. Kullanıcı "Konumumu Seç" butonuna basar
2. Konum izni istenir ve onaylanır
3. GPS konumu alınır ve koordinatlar kaydedilir
4. Reverse geocoding ile adres bilgisi alınır
5. Şehir, ilçe ve adres alanları otomatik doldurulur

### 2. Acil Durum Kontağı Ekleme
1. Kullanıcı "Numara Ekle" veya "Rehberden Seç" butonuna basar
2. Manuel giriş veya rehber seçimi yapar
3. Numara validasyonu yapılır
4. Numara listeye eklenir

### 3. Profil Güncelleme
1. Tüm bilgiler doldurulur
2. "Kaydet" butonuna basılır
3. Veriler backend'e kaydedilir
4. Başarı mesajı gösterilir

## Hata Yönetimi

### Konum Hataları
- Konum izni reddedilirse uyarı gösterilir
- GPS sinyali alınamazsa hata mesajı gösterilir
- Reverse geocoding başarısız olursa sadece koordinatlar kaydedilir

### Kontak Hataları
- Rehber izni reddedilirse uyarı gösterilir
- Geçersiz telefon numarası formatı için validasyon hatası
- Duplicate numara ekleme denemesi için uyarı

## Gelecek Geliştirmeler

### Planlanan Özellikler
- **Harita Entegrasyonu**: Konum seçimi için harita arayüzü
- **Favori Konumlar**: Birden fazla konum kaydetme
- **SMS Gönderimi**: Acil durum numaralarına otomatik SMS
- **Konum Geçmişi**: Kullanıcının konum değişiklik geçmişi

### Performans İyileştirmeleri
- **Caching**: Konum verilerinin önbelleğe alınması
- **Lazy Loading**: Rehber verilerinin ihtiyaç halinde yüklenmesi
- **Offline Support**: İnternet bağlantısı olmadan temel işlevsellik 