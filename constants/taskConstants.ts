import { Task } from '../types/types';

export const TASK_DATA: Task[] = [
  {
    id: "1",
    title: "Profil Bilgilerini Tamamla",
    snippet: "Ad, soyad ve iletişim bilgilerini eksiksiz şekilde doldur.",
    description:
      "Daha güvenli ve kişiselleştirilmiş bir deneyim sunabilmemiz için bu bilgiler bize yardımcı olur.",
    icon: "person-circle",
    category: "profile",
    priority: 1,
  },
  {
    id: "2",
    title: "Deprem Risk Eğitimini Tamamla",
    snippet: "Profil sayfandaki eğitim modülünü baştan sona tamamla.",
    description:
      "Deprem öncesi, sırasında ve sonrasında ne yapman gerektiğini öğrenerek kendini ve sevdiklerini koruyabilirsin.",
    icon: "school",
    category: "education",
    priority: 2,
  },
  {
    id: "3",
    title: "Deprem Risk Değerlendirmesini Doldur",
    snippet: "Yaşadığın konum ve evin özelliklerine göre risk analizini yap.",
    description:
      "Böylece sana özel öneriler sunabilir, daha doğru önlemler almanı sağlayabiliriz.",
    icon: "analytics",
    category: "safety",
    priority: 3,
  },
  {
    id: "4",
    title: "Aileni ve Arkadaşlarını Davet Et",
    snippet: "Sevdiklerini uygulamaya davet et ve onları da bilgilendir.",
    description:
      "Afetlere karşı hazırlıklı olmak sadece bireysel değil, toplumsal bir sorumluluk. Hep birlikte daha güçlü oluruz.",
    icon: "people",
    category: "community",
    priority: 4,
  },
  {
    id: "5",
    title: "Uygulamayı Değerlendir",
    snippet:
      "Uygulama hakkında düşüncelerini paylaş: Neler işe yaradı, neleri iyileştirebiliriz?",
    description:
      "Senin geri bildiriminle daha iyi bir deneyim sunabilir, ihtiyaca yönelik geliştirmeler yapabiliriz.",
    icon: "star",
    category: "feedback",
    priority: 5,
  },
];

// Task kategorilerine göre filtreleme için yardımcı fonksiyonlar
export const getTasksByCategory = (category: Task['category']) => {
  return TASK_DATA.filter(task => task.category === category);
};

export const getCompletedTasks = () => {
  return TASK_DATA.filter(task => task.isCompleted);
};

export const getIncompleteTasks = () => {
  return TASK_DATA.filter(task => !task.isCompleted);
};

export const getTasksByPriority = () => {
  return [...TASK_DATA].sort((a, b) => (a.priority || 0) - (b.priority || 0));
};
