# Premium Özellikler Dokümantasyonu

Bu dokümantasyon, Terra uygulamasındaki premium özelliklerin nasıl kullanılacağını açıklar.

## Paket Seviyeleri

### 1. Free Package (Ücretsiz)
- **Fiyat:** ₺0/ay
- **Özellikler:**
  - Temel deprem bildirimleri
  - Sınırlı harita görüntüleme
  - Reklamlar
  - Temel istatistikler
  - Sınırlı haber erişimi

### 2. Supporter Package
- **Fiyat:** ₺29.99/ay veya ₺299.90/yıl (%17 indirim)
- **Özellikler:**
  - Reklamsız deneyim
  - Gelişmiş deprem bildirimleri
  - Tam harita erişimi
  - Detaylı istatistikler
  - Öncelikli haber erişimi
  - Özel bildirim sesleri

### 3. Protector Package
- **Fiyat:** ₺49.99/ay veya ₺499.90/yıl (%17 indirim)
- **Özellikler:**
  - Supporter özellikleri
  - Gelişmiş güvenlik özellikleri
  - Acil durum planları
  - Kişiselleştirilmiş risk analizi
  - 7/24 destek
  - Aile üyeleri için ek hesaplar

### 4. Sponsor Package
- **Fiyat:** ₺99.99/ay veya ₺999.90/yıl (%17 indirim)
- **Özellikler:**
  - Protector özellikleri
  - Özel araştırma raporları
  - Öncelikli müşteri desteği
  - Beta özelliklerine erken erişim
  - Özel etkinliklere davet
  - Uygulama geliştirme sürecinde söz hakkı

## Kullanım

### 1. Premium Hook Kullanımı

```typescript
import { usePremium } from '@/hooks/usePremium';

function MyComponent() {
  const { 
    currentPackage, 
    hasFeature, 
    subscribeToPackage, 
    isLoading 
  } = usePremium();

  // Özellik kontrolü
  if (hasFeature('Reklamsız deneyim')) {
    // Premium özellik kodu
  }

  return (
    // Component içeriği
  );
}
```

### 2. Premium Feature Gate Bileşeni

```typescript
import PremiumFeatureGate from '@/components/PremiumFeatureGate';

function MyComponent() {
  return (
    <PremiumFeatureGate featureName="Reklamsız deneyim">
      {/* Premium özellik içeriği */}
      <AdFreeContent />
    </PremiumFeatureGate>
  );
}
```

### 3. Özel Fallback ile Kullanım

```typescript
<PremiumFeatureGate 
  featureName="Gelişmiş güvenlik özellikleri"
  fallback={<BasicSecurityFeatures />}
  showUpgradeButton={false}
>
  <AdvancedSecurityFeatures />
</PremiumFeatureGate>
```

## Özellik İsimleri

Aşağıdaki özellik isimleri `hasFeature` fonksiyonu ile kontrol edilebilir:

### Free Package Özellikleri
- `Temel deprem bildirimleri`
- `Sınırlı harita görüntüleme`
- `Temel istatistikler`
- `Sınırlı haber erişimi`

### Supporter Package Özellikleri
- `Reklamsız deneyim`
- `Gelişmiş deprem bildirimleri`
- `Tam harita erişimi`
- `Detaylı istatistikler`
- `Öncelikli haber erişimi`
- `Özel bildirim sesleri`

### Protector Package Özellikleri
- `Gelişmiş güvenlik özellikleri`
- `Acil durum planları`
- `Kişiselleştirilmiş risk analizi`
- `7/24 destek`
- `Aile üyeleri için ek hesaplar`

### Sponsor Package Özellikleri
- `Özel araştırma raporları`
- `Öncelikli müşteri desteği`
- `Beta özelliklerine erken erişim`
- `Özel etkinliklere davet`
- `Uygulama geliştirme sürecinde söz hakkı`

## Abonelik Yönetimi

### Abonelik Oluşturma
```typescript
const result = await subscribeToPackage('supporter');
if (result.success) {
  // Başarılı abonelik
} else {
  // Hata durumu
  console.error(result.error);
}
```

### Abonelik İptal
```typescript
const result = await cancelSubscription();
if (result.success) {
  // Başarılı iptal
} else {
  // Hata durumu
  console.error(result.error);
}
```

## Ödeme Entegrasyonu

Şu anda mock veriler kullanılmaktadır. Gerçek ödeme entegrasyonu için:

1. **Stripe** veya **PayPal** gibi bir ödeme sağlayıcısı entegre edin
2. `usePremium` hook'undaki `subscribeToPackage` fonksiyonunu güncelleyin
3. Veritabanı tablolarını oluşturun (`user_subscriptions` tablosu)
4. Webhook'ları yapılandırın

## Veritabanı Şeması

```sql
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id VARCHAR(50) NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_active ON user_subscriptions(is_active);
```

## Güvenlik

- Kullanıcı kimlik doğrulaması her premium işlem öncesi kontrol edilir
- Abonelik durumu sunucu tarafında doğrulanır
- Ödeme bilgileri güvenli şekilde saklanır
- Abonelik iptal işlemleri loglanır

## Test

Premium özellikleri test etmek için:

1. Farklı paketlerle kullanıcı hesapları oluşturun
2. `hasFeature` fonksiyonunu test edin
3. Abonelik işlemlerini test edin
4. Premium Feature Gate bileşenini test edin

## Gelecek Özellikler

- Aile paketleri
- Kurumsal abonelikler
- Özel özellik istekleri
- API erişimi
- Webhook entegrasyonları 