import faultLineData from '@/assets/data/türkiye_fay_sistemleri.json';

export interface FaultLinePoint {
  lat: number;
  lng: number;
}

export interface FaultLineSegment {
  faultSystem: string;
  faultRegion: string;
  coordinates: FaultLinePoint[];
  description?: string;
}

export interface NearestFaultLine {
  faultSystem: string;
  faultRegion: string;
  distance: number;
  nearestPoint: FaultLinePoint;
  description?: string;
}

/**
 * İki nokta arasındaki mesafeyi hesaplar (Haversine formülü)
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Dünya'nın yarıçapı (km)
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Bir noktadan bir çizgi segmentine olan en kısa mesafeyi hesaplar
 */
export function pointToLineDistance(
  point: FaultLinePoint,
  lineStart: FaultLinePoint,
  lineEnd: FaultLinePoint
): number {
  const A = point.lat - lineStart.lat;
  const B = point.lng - lineStart.lng;
  const C = lineEnd.lat - lineStart.lat;
  const D = lineEnd.lng - lineStart.lng;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  
  if (lenSq === 0) {
    return calculateDistance(point.lat, point.lng, lineStart.lat, lineStart.lng);
  }

  let param = dot / lenSq;

  let xx, yy;
  if (param < 0) {
    xx = lineStart.lat;
    yy = lineStart.lng;
  } else if (param > 1) {
    xx = lineEnd.lat;
    yy = lineEnd.lng;
  } else {
    xx = lineStart.lat + param * C;
    yy = lineStart.lng + param * D;
  }

  return calculateDistance(point.lat, point.lng, xx, yy);
}

/**
 * Bir koordinat için en yakın fay hattını bulur
 */
export function findNearestFaultLine(
  targetLat: number,
  targetLng: number
): NearestFaultLine | null {
  const targetPoint: FaultLinePoint = { lat: targetLat, lng: targetLng };
  let nearestFault: NearestFaultLine | null = null;
  let minDistance = Infinity;

  faultLineData.forEach((faultSystem) => {
    const faultSystemName = faultSystem.Fay_Sistemi;
    
    Object.entries(faultSystem.Fay_Bölgesi).forEach(([regionName, regionData]) => {
      const coordinates = regionData.geometry.coordinates;
      
      // Her koordinat çifti için segment hesapla
      for (let i = 0; i < coordinates.length - 1; i++) {
        const startPoint: FaultLinePoint = {
          lng: coordinates[i][0],
          lat: coordinates[i][1]
        };
        const endPoint: FaultLinePoint = {
          lng: coordinates[i + 1][0],
          lat: coordinates[i + 1][1]
        };

        const distance = pointToLineDistance(targetPoint, startPoint, endPoint);
        
        if (distance < minDistance) {
          minDistance = distance;
          
          // En yakın noktayı bul
          const nearestPoint = findNearestPointOnSegment(targetPoint, startPoint, endPoint);
          
          nearestFault = {
            faultSystem: faultSystemName,
            faultRegion: regionName,
            distance: distance,
            nearestPoint: nearestPoint,
            description: getFaultSystemDescription(faultSystemName)
          };
        }
      }
    });
  });

  return nearestFault;
}

/**
 * Bir segment üzerindeki en yakın noktayı bulur
 */
function findNearestPointOnSegment(
  point: FaultLinePoint,
  lineStart: FaultLinePoint,
  lineEnd: FaultLinePoint
): FaultLinePoint {
  const A = point.lat - lineStart.lat;
  const B = point.lng - lineStart.lng;
  const C = lineEnd.lat - lineStart.lat;
  const D = lineEnd.lng - lineStart.lng;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  
  if (lenSq === 0) {
    return lineStart;
  }

  let param = dot / lenSq;

  if (param < 0) {
    return lineStart;
  } else if (param > 1) {
    return lineEnd;
  } else {
    return {
      lat: lineStart.lat + param * C,
      lng: lineStart.lng + param * D
    };
  }
}

/**
 * Fay sistemi için açıklama döndürür
 */
function getFaultSystemDescription(faultSystemName: string): string {
  const descriptions: { [key: string]: string } = {
    "Kuzey Anadolu Fay Hattı": "Türkiye'nin en aktif fay hattı, Marmara'dan Van'a kadar uzanır",
    "Doğu Anadolu Fay Hattı": "Yüksek tektonik aktivite gösteren, doğu-batı yönlü fay sistemi",
    "Batı Anadolu Fay Sistemi": "Çoklu fay sistemi, Ege bölgesinde yoğun aktivite",
    "Güney Anadolu Fay Hattı": "Orta düzey aktivite, Akdeniz kıyılarında etkili",
    "İç Anadolu Fay Sistemi": "Düşük aktivite, merkezi Anadolu'da yer alır",
    "Güneydoğu Anadolu Fay Hattı": "Minimal aktivite, güneydoğu bölgesinde etkili"
  };

  return descriptions[faultSystemName] || "Fay sistemi bilgisi mevcut değil";
}

/**
 * Belirli bir bölgedeki tüm fay hatlarını döndürür
 */
export function getFaultLinesInRegion(
  centerLat: number,
  centerLng: number,
  radiusKm: number = 100
): FaultLineSegment[] {
  const faultLines: FaultLineSegment[] = [];

  faultLineData.forEach((faultSystem) => {
    const faultSystemName = faultSystem.Fay_Sistemi;
    
    Object.entries(faultSystem.Fay_Bölgesi).forEach(([regionName, regionData]) => {
      const coordinates = regionData.geometry.coordinates;
      
      // Bölge içinde fay hattı var mı kontrol et
      let isInRegion = false;
      coordinates.forEach((coord) => {
        const distance = calculateDistance(centerLat, centerLng, coord[1], coord[0]);
        if (distance <= radiusKm) {
          isInRegion = true;
        }
      });

      if (isInRegion) {
        const faultLinePoints: FaultLinePoint[] = coordinates.map(coord => ({
          lng: coord[0],
          lat: coord[1]
        }));

        faultLines.push({
          faultSystem: faultSystemName,
          faultRegion: regionName,
          coordinates: faultLinePoints
        });
      }
    });
  });

  return faultLines;
}

/**
 * Fay hatları için istatistik bilgilerini döndürür
 */
export function getFaultLineStats(): {
  totalSystems: number;
  totalRegions: number;
  totalCoordinates: number;
  systems: Array<{
    name: string;
    regionCount: number;
    coordinateCount: number;
  }>;
} {
  const stats = {
    totalSystems: faultLineData.length,
    totalRegions: 0,
    totalCoordinates: 0,
    systems: [] as Array<{
      name: string;
      regionCount: number;
      coordinateCount: number;
    }>
  };

  faultLineData.forEach((faultSystem) => {
    const regionCount = Object.keys(faultSystem.Fay_Bölgesi).length;
    let coordinateCount = 0;

    Object.values(faultSystem.Fay_Bölgesi).forEach((regionData) => {
      coordinateCount += regionData.geometry.coordinates.length;
    });

    stats.totalRegions += regionCount;
    stats.totalCoordinates += coordinateCount;

    stats.systems.push({
      name: faultSystem.Fay_Sistemi,
      regionCount,
      coordinateCount
    });
  });

  return stats;
}
