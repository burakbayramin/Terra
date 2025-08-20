# Acil Durum Bildirim Ekranı

## Genel Bakış

Acil Durum Bildirim Ekranı, kullanıcıların "Tehlikedeyim" butonuna tıkladığında açılan özel bir ekrandır. Bu ekran, acil durumlarda kullanıcıların hızlıca yardım alabilmesi için tasarlanmıştır.

## Özellikler

### 1. 112 Ara
- Acil servis ile direkt iletişim kurma
- Telefon uygulamasını açarak 112 numarasını arama
- Kullanıcı onayı ile güvenli arama

### 2. Konumumu Paylaş
- Mevcut konum bilgisini alma ve kaydetme
- Konum izni kontrolü
- Başarılı konum paylaşımı bildirimi

### 3. Tehlikedeyim Bildirimi SMS
- Acil durum kişisine otomatik SMS gönderme
- Kullanıcı bilgileri ve konum bilgisi ile SMS oluşturma
- SMS uygulamasını açarak mesaj gönderme

### 4. Statümü Tehlikede Olarak Güncelle
- Kullanıcının acil durum statüsünü veritabanında güncelleme
- Emergency status tablosuna kayıt ekleme
- Durum güncelleme onayı

## Teknik Detaylar

### Dosya Yapısı
```
app/(protected)/emergency-notification.tsx  # Ana ekran dosyası
emergency_status_table.sql                  # Veritabanı tablosu
```

### Veritabanı Tablosu
`emergency_status` tablosu aşağıdaki alanları içerir:
- `id`: Benzersiz kimlik
- `profile_id`: Kullanıcı profili referansı
- `status`: Durum (in_danger, safe, needs_help, evacuated)
- `location`: Konum bilgisi
- `coordinates`: Koordinat bilgisi
- `created_at`: Oluşturulma tarihi
- `updated_at`: Güncellenme tarihi
- `resolved_at`: Çözülme tarihi
- `notes`: Ek notlar

### Kullanılan Hook'lar
- `useAuth`: Kullanıcı kimlik doğrulama
- `useLocation`: Konum yönetimi
- `supabase`: Veritabanı işlemleri

## Kullanım Senaryoları

### Senaryo 1: Deprem Sırasında
1. Kullanıcı "Tehlikedeyim" butonuna tıklar
2. Acil Durum Bildirim Ekranı açılır
3. Kullanıcı konumunu paylaşır
4. Acil durum kişisine SMS gönderir
5. Durumunu "tehlikede" olarak günceller

### Senaryo 2: Diğer Acil Durumlar
1. Kullanıcı acil durum ekranını açar
2. 112 acil servisi arar
3. Gerekli bilgileri paylaşır
4. Yardım bekler

## Güvenlik Önlemleri

- Konum izni kontrolü
- Kullanıcı onayı ile arama
- Veritabanı güvenliği
- Hata yönetimi

## Gelecek Geliştirmeler

- Acil durum bildirimleri için push notification
- Acil durum kişileri ile gerçek zamanlı iletişim
- Acil durum haritası entegrasyonu
- Otomatik konum takibi
- Acil durum istatistikleri

## Test Senaryoları

1. **Konum İzni Yok**: Kullanıcıya izin verme seçeneği sunulmalı
2. **Acil Durum Kişisi Yok**: Profil ayarlarına yönlendirme yapılmalı
3. **SMS Gönderimi**: SMS uygulaması açılmalı
4. **Durum Güncelleme**: Veritabanına kayıt eklenmeli
5. **Hata Durumları**: Kullanıcıya anlaşılır hata mesajları gösterilmeli

## Notlar

- Bu ekran sadece acil durumlarda kullanılmalıdır
- Kullanıcılar konum izinlerini vermelidir
- Acil durum kişileri profil ayarlarından eklenmelidir
- Tüm işlemler kullanıcı onayı ile yapılmalıdır 