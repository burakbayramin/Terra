export const getMagnitudeColor = (magnitude: number) => {
  if (magnitude >= 5.0) return "#FF4444";
  if (magnitude >= 4.0) return "#FF8800";
  if (magnitude >= 3.0) return "#FFB800";
  return "#4CAF50";
};

export const getMagnitudeLabel = (magnitude: number) => {
  if (magnitude >= 5.0) return "Güçlü";
  if (magnitude >= 4.0) return "Orta";
  if (magnitude >= 3.0) return "Hafif";
  return "Zayıf";
};

export const formatSourceName = (source: string) => {
  switch (source.toLowerCase()) {
    case 'kandilli':
      return 'KANDILLI';
    case 'afad':
      return 'AFAD';
    case 'usgs':
      return 'USGS';
    case 'iris':
      return 'IRIS';
    case 'emsc':
      return 'EMSC';
    default:
      return source.toUpperCase();
  }
};

export const calculateFeltRadius = (magnitude: number, depth: number): number => {
  const baseRadius = Math.pow(10, 0.5 * magnitude - 1.8);
  const depthFactor = 1 + (depth / 100);
  const feltRadius = baseRadius * depthFactor;  
  return Math.min(Math.max(feltRadius, 5), 500); // Between 5-500 km
};

export const calculateMercalliIntensity = (magnitude: number, depth: number): number => {
  
  let baseIntensity = 0;
  
  if (magnitude >= 8.0) baseIntensity = 10;
  else if (magnitude >= 7.0) baseIntensity = 9;
  else if (magnitude >= 6.0) baseIntensity = 8;
  else if (magnitude >= 5.0) baseIntensity = 7;
  else if (magnitude >= 4.0) baseIntensity = 6;
  else if (magnitude >= 3.0) baseIntensity = 3; // Çok daha düşük
  else if (magnitude >= 2.0) baseIntensity = 2; // Çok daha düşük
  else baseIntensity = 1; // Çok daha düşük
  
  let depthAdjustment = 0;
  if (depth < 30) depthAdjustment = 1; 
  else if (depth > 100) depthAdjustment = -1; 
  
  const intensity = baseIntensity + depthAdjustment;
  
  return Math.min(Math.max(intensity, 1), 12);
};

export const getMercalliDescription = (intensity: number): string => {
  switch (intensity) {
    case 1: return "Hissedilmez";
    case 2: return "Çok Hafif";
    case 3: return "Hafif";
    case 4: return "Orta";
    case 5: return "Güçlü";
    case 6: return "Çok Güçlü";
    case 7: return "Şiddetli";
    case 8: return "Çok Şiddetli";
    case 9: return "Yıkıcı";
    case 10: return "Çok Yıkıcı";
    case 11: return "Felaket";
    case 12: return "Büyük Felaket";
    default: return "Bilinmiyor";
  }
};

export function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  if (diffHours < 1) return "Az önce";
  if (diffHours < 24) return `${diffHours} saat önce`;
  if (diffDays < 7) return `${diffDays} gün önce`;
  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
} 