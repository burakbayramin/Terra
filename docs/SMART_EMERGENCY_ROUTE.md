# Akıllı Acil Durum Rotası Özelliği

## 📋 Genel Bakış

Akıllı Acil Durum Rotası özelliği, ağ gruplarının acil durumlarda güvenli kaçış planları oluşturmasını ve üyelerin bu rotaları takip etmesini sağlar. Bu özellik, kriz anında koordinasyonu artırır ve güvenli alanlara ulaşımı kolaylaştırır.

## 🎯 Temel Özellikler

### Yönetici Özellikleri
- **Özellik Aktivasyonu**: Akıllı rota özelliğini ağ grubu için aktif/pasif yapma
- **Rota Oluşturma**: Farklı türlerde acil durum rotaları oluşturma
- **Nokta Yönetimi**: Toplanma noktaları, güvenli alanlar ve kontrol noktaları ekleme
- **İstatistik Takibi**: Üyelerin rota seçimlerini ve kullanımını izleme

### Kullanıcı Özellikleri
- **Rota Seçimi**: Mevcut rotalardan birini seçme
- **Navigasyon**: Seçilen rotayı takip etme
- **İlerleme Takibi**: Rota üzerindeki durumu görüntüleme
- **Dinamik Güncelleme**: Konum bazlı rota güncellemeleri

## 🗄️ Veritabanı Yapısı

### Ana Tablolar

#### `smart_route_settings`
Ağ grubunun akıllı rota özelliği ayarları
```sql
- id: UUID (Primary Key)
- network_id: UUID (Foreign Key)
- is_enabled: BOOLEAN
- created_by: UUID (Foreign Key)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### `smart_routes`
Oluşturulan rotalar
```sql
- id: UUID (Primary Key)
- network_id: UUID (Foreign Key)
- name: VARCHAR(100)
- description: TEXT
- route_type: VARCHAR(50) ('default', 'family', 'disabled_friendly', 'elderly_friendly', 'custom')
- is_default: BOOLEAN
- created_by: UUID (Foreign Key)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### `route_waypoints`
Rota noktaları
```sql
- id: UUID (Primary Key)
- route_id: UUID (Foreign Key)
- waypoint_type: VARCHAR(50) ('gathering_point', 'safe_zone', 'checkpoint')
- name: VARCHAR(100)
- description: TEXT
- latitude: DECIMAL(10, 8)
- longitude: DECIMAL(11, 8)
- order_index: INTEGER
- estimated_time_minutes: INTEGER
- distance_meters: INTEGER
- created_at: TIMESTAMP
```

#### `user_route_selections`
Kullanıcıların rota seçimleri
```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key)
- network_id: UUID (Foreign Key)
- route_id: UUID (Foreign Key)
- selected_at: TIMESTAMP
- is_active: BOOLEAN
```

#### `user_route_progress`
Kullanıcıların rota ilerleme durumu
```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key)
- network_id: UUID (Foreign Key)
- route_id: UUID (Foreign Key)
- current_waypoint_id: UUID (Foreign Key)
- status: VARCHAR(50) ('not_started', 'in_progress', 'at_gathering_point', 'at_safe_zone', 'completed')
- started_at: TIMESTAMP
- completed_at: TIMESTAMP
- current_latitude: DECIMAL(10, 8)
- current_longitude: DECIMAL(11, 8)
- last_updated: TIMESTAMP
```

#### `route_statistics`
Rota kullanım istatistikleri
```sql
- id: UUID (Primary Key)
- route_id: UUID (Foreign Key)
- network_id: UUID (Foreign Key)
- total_users_selected: INTEGER
- total_completions: INTEGER
- average_completion_time_minutes: INTEGER
- last_used: TIMESTAMP
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

## 🔧 Teknik Uygulama

### Hook'lar

#### `useSmartRouteSettings(networkId)`
Ağ grubunun akıllı rota ayarlarını getirir.

#### `useUpdateSmartRouteSettings()`
Akıllı rota özelliğini aktif/pasif yapar.

#### `useSmartRoutes(networkId)`
Ağ grubundaki tüm rotaları getirir.

#### `useSmartRoute(routeId)`
Belirli bir rotanın detaylarını getirir.

#### `useCreateSmartRoute()`
Yeni rota oluşturur.

#### `useUpdateSmartRoute()`
Mevcut rotayı günceller.

#### `useDeleteSmartRoute()`
Rotayı siler.

#### `useRouteWaypoints(routeId)`
Rotanın noktalarını getirir.

#### `useCreateRouteWaypoint()`
Rotaya yeni nokta ekler.

#### `useUpdateRouteWaypoint()`
Nokta bilgilerini günceller.

#### `useDeleteRouteWaypoint()`
Noktayı siler.

#### `useUserRouteSelection(networkId)`
Kullanıcının seçtiği rotayı getirir.

#### `useSelectRoute()`
Kullanıcının rota seçimini kaydeder.

#### `useUserRouteProgress(networkId)`
Kullanıcının rota ilerleme durumunu getirir.

#### `useUpdateRouteProgress()`
Rota ilerleme durumunu günceller.

#### `useRouteStatistics(routeId)`
Rota istatistiklerini getirir.

#### `useNetworkRouteOverview(networkId)`
Ağ grubunun rota genel görünümünü getirir.

### Ekranlar

#### 1. SmartRouteScreen (`/network/smart-route`)
Ana akıllı rota yönetim ekranı
- Özellik aktivasyonu (yönetici)
- Rota listesi
- Rota oluşturma
- Kullanıcı rota seçimi
- İstatistikler (yönetici)

#### 2. RouteDetailScreen (`/network/route/[id]`)
Rota detay ekranı
- Rota bilgileri
- Nokta listesi
- Nokta ekleme/düzenleme (yönetici)
- Navigasyon başlatma
- İlerleme durumu

### Rota Türleri

1. **Varsayılan Rota** (`default`)
   - Genel kullanım için standart rota
   - İkon: `map`
   - Renk: `#667EEA`

2. **Aile Rotası** (`family`)
   - Aile üyeleri için özelleştirilmiş
   - İkon: `account-group`
   - Renk: `#4ECDC4`

3. **Engelli Dostu** (`disabled_friendly`)
   - Engelli bireyler için uygun
   - İkon: `wheelchair-accessibility`
   - Renk: `#FF6B6B`

4. **Yaşlı Dostu** (`elderly_friendly`)
   - Yaşlı bireyler için uygun
   - İkon: `account-heart`
   - Renk: `#45B7D1`

5. **Özel Rota** (`custom`)
   - Özel ihtiyaçlar için
   - İkon: `map-marker-path`
   - Renk: `#96CEB4`

### Nokta Türleri

1. **Toplanma Noktası** (`gathering_point`)
   - Acil durumda toplanma yeri
   - İkon: `account-group`
   - Renk: `#4ECDC4`

2. **Güvenli Alan** (`safe_zone`)
   - Nihai güvenli hedef
   - İkon: `shield-check`
   - Renk: `#45B7D1`

3. **Kontrol Noktası** (`checkpoint`)
   - Ara kontrol noktası
   - İkon: `map-marker-check`
   - Renk: `#FF6B6B`

## 🎨 UI/UX Özellikleri

### Tasarım Prensipleri
- **Görsel Hiyerarşi**: Rota türlerine göre renk kodlaması
- **Sezgisel Navigasyon**: Kolay rota seçimi ve yönetimi
- **Responsive Tasarım**: Farklı ekran boyutlarına uyum
- **Erişilebilirlik**: Engelli kullanıcılar için uygun tasarım

### Bileşenler
- **Rota Kartları**: Her rota için görsel kart
- **Nokta Listesi**: Sıralı nokta gösterimi
- **İlerleme Göstergesi**: Kullanıcının mevcut durumu
- **İstatistik Panelleri**: Yönetici için analitik görünüm

## 🔒 Güvenlik

### Row Level Security (RLS)
- Kullanıcılar sadece kendi ağ gruplarındaki rotaları görebilir
- Yöneticiler sadece kendi oluşturdukları rotaları düzenleyebilir
- Kullanıcılar sadece kendi rota seçimlerini yönetebilir

### Veri Doğrulama
- Koordinat değerlerinin geçerliliği kontrol edilir
- Rota adı ve açıklama uzunluk sınırları
- Nokta sıralamasının mantıklı olması

## 📊 İstatistikler ve Analitik

### Toplanan Veriler
- Rota seçim sayıları
- Tamamlanan rota sayısı
- Ortalama tamamlanma süresi
- En popüler rota türleri
- Kullanıcı ilerleme durumları

### Raporlama
- Yöneticiler için detaylı raporlar
- Kullanım trendleri
- Performans metrikleri

## 🚀 Gelecek Geliştirmeler

### Planlanan Özellikler
1. **Gerçek Zamanlı Harita Entegrasyonu**
   - Canlı rota takibi
   - Trafik durumu entegrasyonu
   - Alternatif rota önerileri

2. **AI Destekli Optimizasyon**
   - Otomatik rota önerileri
   - Trafik analizi
   - Risk değerlendirmesi

3. **Gelişmiş Bildirimler**
   - Push notification entegrasyonu
   - Acil durum uyarıları
   - Rota güncellemeleri

4. **Sosyal Özellikler**
   - Rota paylaşımı
   - Kullanıcı yorumları
   - Topluluk önerileri

### Teknik İyileştirmeler
- Offline mod desteği
- Performans optimizasyonu
- Çoklu dil desteği
- Gelişmiş arama ve filtreleme

## 🧪 Test Stratejisi

### Birim Testleri
- Hook fonksiyonları
- Veri doğrulama
- Hata yönetimi

### Entegrasyon Testleri
- API endpoint'leri
- Veritabanı işlemleri
- UI bileşenleri

### Kullanıcı Testleri
- Kullanılabilirlik testleri
- Performans testleri
- Güvenlik testleri

## 📝 Kullanım Kılavuzu

### Yönetici Kullanımı
1. Ağ grubu detay sayfasından "Akıllı Acil Durum Rotası" özelliğini aktif edin
2. "Yeni Rota Oluştur" butonuna tıklayın
3. Rota adı, açıklama ve türünü belirleyin
4. Rotaya noktalar ekleyin (toplanma noktası, güvenli alan, kontrol noktası)
5. Rotayı kaydedin ve üyelerin kullanımına açın

### Kullanıcı Kullanımı
1. Ağ grubunuzda aktif rotaları görüntüleyin
2. Size uygun rotayı seçin
3. Acil durumda "Rotayı Başlat" butonuna tıklayın
4. Navigasyon talimatlarını takip edin
5. İlerleme durumunuzu kontrol edin

## 🔧 Sorun Giderme

### Yaygın Sorunlar
1. **Rota görünmüyor**: Özelliğin aktif olduğundan emin olun
2. **Nokta eklenemiyor**: Koordinatların doğru formatta olduğunu kontrol edin
3. **Navigasyon başlamıyor**: Konum izinlerini kontrol edin
4. **İstatistikler güncellenmiyor**: Sayfayı yenileyin

### Destek
Teknik sorunlar için geliştirici ekibiyle iletişime geçin. 