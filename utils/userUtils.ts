export const getRiskLevel = (score: number): string => {
  if (score >= 80) return "Düşük Risk";
  if (score >= 60) return "Orta Risk";
  if (score >= 40) return "Yüksek Risk";
  return "Çok Yüksek Risk";
};

export const getRiskMessage = (score: number): string => {
  if (score >= 80)
    return "Tebrikler! Deprem riskine karşı iyi hazırlıklısınız.";
  if (score >= 60)
    return "Deprem hazırlığınız orta seviyede. Bazı konularda iyileştirme yapabilirsiniz.";
  if (score >= 40)
    return "Deprem riskine karşı hazırlığınızı artırmanız önerilir.";
  return "Acil olarak deprem hazırlığı konusunda önlemler almanız gerekiyor.";
};

export const getScoreColor = (score: number): string => {
  if (score >= 85) return "#27ae60"; // Koyu Yeşil
  if (score >= 70) return "#2ecc71"; // Açık Yeşil
  if (score >= 55) return "#f1c40f"; // Sarı
  if (score >= 40) return "#f39c12"; // Koyu Sarı/Altın
  if (score >= 25) return "#e67e22"; // Turuncu
  if (score >= 10) return "#e74c3c"; // Kırmızı
  return "#c0392b"; // Koyu Kırmızı
};
