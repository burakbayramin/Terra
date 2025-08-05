# Acil Durum Eylem Planı Özelliği

## Genel Bakış

Acil Durum Eylem Planı özelliği, ağ yöneticilerinin deprem gibi acil durumlar için detaylı eylem planları oluşturmasını sağlar. Bu planlar, kriz anlarında kullanıcılara adım adım rehberlik edecek şekilde tasarlanmıştır.

## Özellikler

### 1. Varsayılan Plan
- Sistem tarafından otomatik olarak oluşturulan temel plan
- Kullanıcılar sadece "Aktif Et" diyerek kullanabilir
- Düzenlenemez veya silinemez

### 2. Özel Plan Oluşturma
- Kullanıcılar kendi ihtiyaçlarına göre plan oluşturabilir
- Adım adım wizard ile kolay plan oluşturma
- İki kategori: Acil Durum Anı ve Acil Durum Sonrası

### 3. Plan Yönetimi
- **Görüntüleme**: Tüm planlar detaylı olarak görüntülenebilir
- **Aktifleştirme**: Sadece bir plan aynı anda aktif olabilir
- **Pasifleştirme**: Aktif planlar pasif hale getirilebilir

## Teknik Detaylar

### Veritabanı Yapısı

#### Emergency Plans Table
```sql
CREATE TABLE emergency_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    network_id UUID NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT false,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Emergency Plan Steps Table
```sql
CREATE TABLE emergency_plan_steps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    plan_id UUID NOT NULL REFERENCES emergency_plans(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(20) NOT NULL CHECK (category IN ('emergency', 'post_emergency')),
    order_index INTEGER NOT NULL,
    safe_zone_id UUID REFERENCES safe_zones(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Güvenlik (Row Level Security)

- Kullanıcılar sadece üye oldukları ağlardaki planları görebilir
- Kullanıcılar sadece kendi oluşturdukları planları düzenleyebilir/silebilir
- Kullanıcılar sadece üye oldukları ağlara plan ekleyebilir
- Aynı anda sadece bir plan aktif olabilir (trigger ile kontrol)

### API Endpoints

Acil durum planları için React Query hook'ları kullanılmaktadır:

- `useEmergencyPlans(networkId)` - Ağdaki acil durum planlarını getirir
- `useCreateEmergencyPlan()` - Yeni acil durum planı oluşturur
- `useUpdateEmergencyPlan()` - Acil durum planını günceller (aktif/pasif)
- `useDeleteEmergencyPlan()` - Acil durum planını siler

## Kullanım Senaryoları

### 1. Aile Koordinasyonu
- Aile üyeleri ortak acil durum planı oluşturur
- Deprem sırasında ve sonrasında yapılacaklar belirlenir
- Güvenli alanlar plana dahil edilir

### 2. İş Yeri Güvenliği
- Şirket yöneticileri çalışanlar için plan oluşturur
- Ofis içi güvenlik prosedürleri belirlenir
- Tahliye planları hazırlanır

### 3. Topluluk Hazırlığı
- Mahalle sakinleri ortak plan oluşturur
- Topluluk genelinde koordinasyon sağlanır
- Acil durum kaynakları paylaşılır

## Ekran Akışı

1. **Ağ Detay Sayfası** → "Özellikler" sekmesi
2. **"Acil Durum Eylem Planı Oluştur"** butonuna tıklama
3. **Acil Durum Planları Listesi** görüntüleme
4. **"Yeni Plan"** butonu ile plan oluşturma
5. **4 Adımlı Wizard**:
   - Adım 1: Plan adını belirleme
   - Adım 2: Acil durum anı aksiyonları
   - Adım 3: Acil durum sonrası aksiyonları
   - Adım 4: Gözden geçirme ve kaydetme

## UI Bileşenleri

### Plan Kartları
- Plan adı ve oluşturan kişi
- Oluşturulma tarihi
- Aktiflik durumu (Aktif/Pasif)
- Adım sayısı
- Görüntüleme ve aktifleştirme butonları

### Plan Oluşturma Wizard'ı
- Adım göstergesi (1/4, 2/4, vb.)
- Her adımda açıklayıcı metinler
- Dinamik adım ekleme/çıkarma
- Form validasyonu

### Plan Detay Görünümü
- Plan bilgileri
- Kategorilere ayrılmış adımlar
- Güvenli alan referansları
- Adım açıklamaları

## UX Notları

### Kullanıcı Deneyimi
- Stresli anlar için tasarlandığından akıcı ve yönlendirici deneyim
- Her adımda açıklayıcı alt metinler ve örnekler
- Progress bar ile tamamlanma yüzdesi
- Adım önceliği yüksek eylemler için uyarıcı renkler

### Erişilebilirlik
- Büyük dokunma alanları
- Yüksek kontrast renkler
- Açık ve net yazı tipleri
- Sesli geri bildirim desteği

## Gelecek Geliştirmeler

### 1. Plan Şablonları
- Önceden hazırlanmış plan şablonları
- Farklı senaryolar için özel şablonlar
- Topluluk tarafından paylaşılan şablonlar

### 2. Gelişmiş Entegrasyon
- Güvenli alanlarla otomatik entegrasyon
- Harita üzerinde plan görselleştirme
- Rota planlama entegrasyonu

### 3. Bildirim Sistemi
- Plan aktivasyonu bildirimleri
- Adım hatırlatıcıları
- Acil durum uyarıları

### 4. Analitik ve Raporlama
- Plan kullanım istatistikleri
- Etkinlik analizi
- İyileştirme önerileri

## Kurulum

1. Veritabanı tablolarını oluşturun:
```bash
# emergency_plans_table.sql dosyasını çalıştırın
```

2. Uygulamayı başlatın:
```bash
npm start
```

3. Ağ detay sayfasından "Acil Durum Eylem Planı Oluştur" özelliğine erişin

## Test Senaryoları

### Temel Testler
- [ ] Varsayılan plan görüntüleme
- [ ] Yeni plan oluşturma
- [ ] Plan aktifleştirme/pasifleştirme
- [ ] Plan detaylarını görüntüleme
- [ ] Adım ekleme/çıkarma

### Güvenlik Testleri
- [ ] Başka ağın planlarını görme (engellenmeli)
- [ ] Başkasının planını düzenleme (engellenmeli)
- [ ] Başkasının planını silme (engellenmeli)
- [ ] Birden fazla aktif plan (engellenmeli)

### Hata Senaryoları
- [ ] Boş plan adı ile oluşturma
- [ ] Adım olmadan plan oluşturma
- [ ] İnternet bağlantısı olmadan işlem yapma
- [ ] Geçersiz veri ile plan oluşturma

## Örnek Plan İçerikleri

### Varsayılan Plan
**Acil Durum Anı:**
1. Pencereden uzaklaş
2. Güvenli pozisyonda kal

**Acil Durum Sonrası:**
1. Aile bireylerini kontrol et
2. Güvenli alana git

### Aile Planı
**Acil Durum Anı:**
1. Çocukları koru
2. Elektrik ve gazı kapat

**Acil Durum Sonrası:**
1. Merkez Park'a git (Güvenli Alan)
2. Acil durum çantasını al
3. Aile üyelerini aramaya çalış 