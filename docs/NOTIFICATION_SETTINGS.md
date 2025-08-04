# Detaylı Bildirim Ayarları

Bu özellik, kullanıcıların deprem bildirimlerini özelleştirmelerine olanak tanır. Kullanıcılar birden fazla bildirim tanımlayabilir ve her birini farklı kriterlere göre ayarlayabilir.

## Özellikler

### 1. Özelleştirilebilir Bildirimler
- Kullanıcılar birden fazla bildirim tanımlayabilir
- Her bildirim benzersiz bir isimle adlandırılabilir
- Bildirimler aktif/pasif duruma getirilebilir

### 2. Bildirim Kaynağı Filtresi
- **Kandilli Rasathanesi**: Boğaziçi Üniversitesi Kandilli Rasathanesi ve Deprem Araştırma Enstitüsü
- **AFAD**: Afet ve Acil Durum Yönetimi Başkanlığı
- **USGS**: United States Geological Survey - Global Deprem Verileri
- **EMSC**: European-Mediterranean Seismological Centre
- **IRIS**: Incorporated Research Institutions for Seismology
- **Tümü**: Tüm kaynaklardan gelen bildirimler

### 3. Büyüklük Aralığı Filtresi
- Minimum ve maksimum büyüklük değerleri ayarlanabilir
- 0.0 - 10.0 arası değer seçilebilir
- Çift slider ile kolay ayarlama

### 4. Konum Filtresi
- **Tüm Konumlar**: Tüm Türkiye'deki depremler
- **Şehir Seçimi**: Birden fazla şehir seçerek sadece bu şehirlerdeki depremler için bildirim alın

## Kullanım

### Bildirim Oluşturma
1. Ana sayfada "Detaylı Bildirim Ayarları" butonuna tıklayın
2. Sağ üst köşedeki "+" butonuna tıklayın
3. Bildirim adını girin
4. Bildirim kaynağını seçin
5. Büyüklük aralığını ayarlayın
6. Konum filtresini seçin
7. "Kaydet" butonuna tıklayın

### Bildirim Düzenleme
1. Mevcut bildirimin yanındaki "Düzenle" butonuna tıklayın
2. İstediğiniz değişiklikleri yapın
3. "Kaydet" butonuna tıklayın

### Bildirim Silme
1. Mevcut bildirimin yanındaki "Sil" butonuna tıklayın
2. Onay dialogunda "Sil" seçeneğini seçin

### Bildirim Aktif/Pasif Yapma
- Bildirimin yanındaki toggle switch'i kullanarak aktif/pasif duruma getirin

## Teknik Detaylar

### Veritabanı Yapısı
```sql
CREATE TABLE notification_settings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sources TEXT[] NOT NULL,
  magnitude_range JSONB NOT NULL,
  location JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### API Endpoints
- `GET /notification_settings` - Kullanıcının bildirimlerini getir
- `POST /notification_settings` - Yeni bildirim oluştur
- `PUT /notification_settings/:id` - Bildirim güncelle
- `DELETE /notification_settings/:id` - Bildirim sil

### Güvenlik
- Row Level Security (RLS) etkin
- Kullanıcılar sadece kendi bildirimlerini görebilir/düzenleyebilir
- Tüm işlemler kullanıcı kimlik doğrulaması gerektirir

## Gelecek Özellikler

- Bildirim geçmişi
- Bildirim istatistikleri
- Gelişmiş konum filtreleri (harita üzerinden seçim)
- Bildirim şablonları
- Toplu bildirim yönetimi
- Bildirim öncelik seviyeleri 