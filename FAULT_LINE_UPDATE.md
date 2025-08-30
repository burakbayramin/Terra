# Fay Hatları Sistemi Güncellemesi

## 🎯 **Amaç**

Mevcut sistemde fay hatları tek nokta koordinatına bağlı çalışıyordu. Ancak gerçekte fay sistemleri lineer yapıda birden fazla koordinat noktasından oluşuyor. Bu güncelleme ile:

- **Lineer fay hatları** destekleniyor
- **Gerçek koordinat verileri** kullanılıyor
- **En yakın nokta hesaplaması** yapılıyor
- **Daha doğru fay bilgileri** gösteriliyor

## 📁 **Yeni Dosyalar**

### `utils/faultLineUtils.ts`
- Fay hatları için utility fonksiyonları
- Lineer mesafe hesaplama algoritmaları
- En yakın fay hattı bulma sistemi
- Bölgesel fay hattı filtreleme

## 🔧 **Güncellenen Bileşenler**

### 1. **EarthquakeRiskAnalyzer.tsx**
- Yeni fay sistemi entegrasyonu
- Lineer fay hattı hesaplama
- Geriye uyumluluk korundu

### 2. **EarthquakeRiskAnalyzer copy.tsx**
- Aynı güncellemeler uygulandı
- Copy dosyası da güncel tutuldu

### 3. **Deprem Detay Sayfası** (`[id].tsx`)
- AI yorum oluştururken fay bilgileri güncelleniyor
- Eksik fay bilgileri koordinatlara göre tamamlanıyor

### 4. **Deprem Listesi** (`index.tsx`)
- Her deprem için fay bilgileri gösteriliyor
- Eksik bilgiler otomatik olarak tamamlanıyor

## 🗺️ **Fay Hatları Veri Yapısı**

### JSON Dosyası: `assets/data/türkiye_fay_sistemleri.json`

```json
[
  {
    "Fay_Sistemi": "Kuzey Anadolu Fay Hattı",
    "Fay_Bölgesi": {
      "Kuzey Marmara": {
        "geometry": {
          "type": "LineString",
          "coordinates": [
            [28.208666153123055, 40.9152124471308],
            [28.21423602545932, 40.91618717478965],
            // ... daha fazla koordinat
          ]
        }
      }
    }
  }
]
```

## 🧮 **Algoritma Detayları**

### 1. **Nokta-Çizgi Mesafe Hesaplama**
```typescript
export function pointToLineDistance(
  point: FaultLinePoint,
  lineStart: FaultLinePoint,
  lineEnd: FaultLinePoint
): number
```

### 2. **En Yakın Fay Hattı Bulma**
```typescript
export function findNearestFaultLine(
  targetLat: number,
  targetLng: number
): NearestFaultLine | null
```

### 3. **Bölgesel Fay Hatları**
```typescript
export function getFaultLinesInRegion(
  centerLat: number,
  centerLng: number,
  radiusKm: number = 100
): FaultLineSegment[]
```

## 📊 **Fay Sistemi İstatistikleri**

Sistem şu anda şu fay sistemlerini destekliyor:

- **Kuzey Anadolu Fay Hattı** - En aktif
- **Doğu Anadolu Fay Hattı** - Yüksek aktivite
- **Batı Anadolu Fay Sistemi** - Çoklu fay sistemi
- **Güney Anadolu Fay Hattı** - Orta aktivite
- **İç Anadolu Fay Sistemi** - Düşük aktivite
- **Güneydoğu Anadolu Fay Hattı** - Minimal aktivite

## 🚀 **Kullanım Örnekleri**

### 1. **En Yakın Fay Hattı Bulma**
```typescript
import { findNearestFaultLine } from '@/utils/faultLineUtils';

const nearestFault = findNearestFaultLine(40.5, 29.5);
if (nearestFault) {
  console.log(`En yakın fay: ${nearestFault.faultSystem}`);
  console.log(`Mesafe: ${nearestFault.distance.toFixed(1)} km`);
}
```

### 2. **Bölgesel Fay Hatları**
```typescript
import { getFaultLinesInRegion } from '@/utils/faultLineUtils';

const regionalFaults = getFaultLinesInRegion(40.5, 29.5, 50);
console.log(`${regionalFaults.length} fay hattı bulundu`);
```

## 🔄 **Geriye Uyumluluk**

- Eski sistem korundu (`FAULT_LINE_DATA`)
- Yeni sistem opsiyonel olarak kullanılıyor
- Mevcut kodlar çalışmaya devam ediyor
- Kademeli geçiş mümkün

## 📈 **Performans İyileştirmeleri**

- **Haversine formülü** ile doğru mesafe hesaplama
- **Segment bazlı hesaplama** ile daha doğru sonuçlar
- **Önbellekleme** ile tekrarlanan hesaplamalar önleniyor
- **Optimize edilmiş algoritma** ile hızlı çalışma

## 🧪 **Test Senaryoları**

### 1. **Koordinat Testleri**
- İstanbul koordinatları (40.5, 29.5)
- Ankara koordinatları (39.9, 32.9)
- İzmir koordinatları (38.2, 27.1)

### 2. **Fay Hattı Doğrulama**
- En yakın fay hattı doğru bulunuyor mu?
- Mesafe hesaplamaları doğru mu?
- Bölge bilgileri doğru mu?

### 3. **Edge Cases**
- Koordinat sınırları
- Eksik veri durumları
- Hatalı koordinat formatları

## 🔮 **Gelecek Geliştirmeler**

1. **3D Fay Hattı Desteği** - Derinlik bilgisi ekleme
2. **Fay Aktivite Seviyeleri** - Gerçek zamanlı veri entegrasyonu
3. **Fay Hattı Görselleştirme** - Harita üzerinde çizim
4. **Fay Hattı Tahminleri** - Makine öğrenmesi ile risk analizi
5. **Çoklu Dil Desteği** - Uluslararası kullanım

## 📝 **Notlar**

- Sistem şu anda sadece Türkiye fay hatlarını destekliyor
- Koordinat sistemi WGS84 (EPSG:4326) kullanıyor
- Mesafe hesaplamaları kilometre cinsinden
- Tüm hesaplamalar gerçek dünya koordinatlarına göre

## 🤝 **Katkıda Bulunma**

Bu sistemi geliştirmek için:

1. Yeni fay hatları ekleyin
2. Algoritma iyileştirmeleri yapın
3. Test senaryoları ekleyin
4. Dokümantasyonu güncelleyin

## 📞 **Destek**

Herhangi bir sorun veya öneri için:
- Issue açın
- Pull request gönderin
- Dokümantasyonu güncelleyin
