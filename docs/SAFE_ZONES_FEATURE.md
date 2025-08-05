# Güvenli Alanlar Özelliği

## Genel Bakış

Güvenli Alanlar özelliği, ağ üyelerinin acil durumlar için güvenli olduğunu düşündükleri alanları konum bilgisiyle birlikte ekleyebilmelerini sağlar. Bu özellik, deprem gibi acil durumlarda ağ üyelerinin güvenli alanlara ulaşabilmesi için kritik öneme sahiptir.

## Özellikler

### 1. Güvenli Alan Ekleme
- Kullanıcılar mevcut konumlarını alarak güvenli alan ekleyebilir
- Her güvenli alan için isim verilir
- Konum bilgisi (latitude/longitude) otomatik olarak kaydedilir

### 2. Güvenli Alan Yönetimi
- **Görüntüleme**: Tüm güvenli alanlar liste halinde gösterilir
- **Düzenleme**: Kullanıcılar kendi ekledikleri alanları düzenleyebilir
- **Silme**: Kullanıcılar kendi ekledikleri alanları silebilir

### 3. Güvenli Alan Bilgileri
Her güvenli alan kartında şu bilgiler gösterilir:
- Alan adı
- Ekleyen kişinin adı
- Ekleme tarihi ve saati
- Koordinat bilgileri

## Teknik Detaylar

### Veritabanı Yapısı

```sql
CREATE TABLE safe_zones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    network_id UUID NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Güvenlik (Row Level Security)

- Kullanıcılar sadece üye oldukları ağlardaki güvenli alanları görebilir
- Kullanıcılar sadece kendi ekledikleri alanları düzenleyebilir/silebilir
- Kullanıcılar sadece üye oldukları ağlara güvenli alan ekleyebilir

### API Endpoints

Güvenli alanlar için React Query hook'ları kullanılmaktadır:

- `useSafeZones(networkId)` - Ağdaki güvenli alanları getirir
- `useCreateSafeZone()` - Yeni güvenli alan oluşturur
- `useUpdateSafeZone()` - Mevcut güvenli alanı günceller
- `useDeleteSafeZone()` - Güvenli alanı siler

## Kullanım Senaryoları

### 1. Acil Durum Planlaması
- Ağ üyeleri ev, iş yeri veya okul çevresindeki güvenli alanları ekler
- Deprem sırasında en yakın güvenli alana yönlendirme yapılabilir

### 2. Aile Koordinasyonu
- Aile üyeleri ortak güvenli alanları belirler
- Acil durumda buluşma noktaları önceden planlanır

### 3. Topluluk Güvenliği
- Mahalle veya iş arkadaşları ağında güvenli alanlar paylaşılır
- Topluluk genelinde güvenlik bilinci artırılır

## Ekran Akışı

1. **Ağ Detay Sayfası** → "Özellikler" sekmesi
2. **"Güvenli Alanları Ekle"** butonuna tıklama
3. **Güvenli Alanlar Listesi** görüntüleme
4. **"Ekle"** butonu ile yeni alan ekleme
5. **Konum alma** ve **isim verme**
6. **Düzenleme/Silme** işlemleri

## Gelecek Geliştirmeler

### 1. Harita Entegrasyonu
- Güvenli alanları harita üzerinde gösterme
- En yakın güvenli alana rota çizme

### 2. Kategoriler
- Güvenli alan türleri (park, okul, hastane, vb.)
- Filtreleme ve arama özellikleri

### 3. Doğrulama Sistemi
- Güvenli alanların gerçekten güvenli olup olmadığını doğrulama
- Topluluk oylaması sistemi

### 4. Bildirimler
- Yeni güvenli alan eklendiğinde ağ üyelerine bildirim
- Acil durumda en yakın güvenli alan önerisi

## Kurulum

1. Veritabanı tablosunu oluşturun:
```bash
# safe_zones_table.sql dosyasını çalıştırın
```

2. Uygulamayı başlatın:
```bash
npm start
```

3. Ağ detay sayfasından "Güvenli Alanları Ekle" özelliğine erişin

## Test Senaryoları

### Temel Testler
- [ ] Güvenli alan ekleme
- [ ] Güvenli alan düzenleme
- [ ] Güvenli alan silme
- [ ] Konum alma
- [ ] Ağ üyeleri arasında paylaşım

### Güvenlik Testleri
- [ ] Başka ağın güvenli alanlarını görme (engellenmeli)
- [ ] Başkasının güvenli alanını düzenleme (engellenmeli)
- [ ] Başkasının güvenli alanını silme (engellenmeli)

### Hata Senaryoları
- [ ] İnternet bağlantısı olmadan işlem yapma
- [ ] Konum izni vermeden alan ekleme
- [ ] Boş isimle alan ekleme 