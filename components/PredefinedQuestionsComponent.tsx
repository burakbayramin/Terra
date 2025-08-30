import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';

interface PredefinedQuestion {
  id: string;
  question: string;
  answer: string;
  icon: string;
}

interface PredefinedQuestionsComponentProps {
  questions?: PredefinedQuestion[];
  title?: string;
  maxQuestions?: number;
  onQuestionPress: (question: PredefinedQuestion) => void;
  askedQuestions?: string[];
}

const PredefinedQuestionsComponent: React.FC<PredefinedQuestionsComponentProps> = ({ 
  questions = defaultQuestions,
  title = "💡 Hızlı Sorular",
  maxQuestions = 8,
  onQuestionPress,
  askedQuestions = []
}) => {
  // Filter out already asked questions and limit to maxQuestions
  const availableQuestions = questions
    .filter(question => !askedQuestions.includes(question.id))
    .slice(0, maxQuestions);

  // Don't render if no questions available
  if (availableQuestions.length === 0) {
    return null;
  }

  return (
    <View style={styles.predefinedQuestionsSection}>
      <Text style={styles.sectionTitle}>
        {title}
      </Text>
      <FlashList
        data={availableQuestions}
        horizontal
        estimatedItemSize={220}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 8,
          paddingVertical: 2,
        }}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onQuestionPress(item)}
          >
            <LinearGradient
              colors={[colors.gradientOne, colors.gradientTwo]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.predefinedQuestionCard}
            >
              <Text style={styles.questionIcon}>{item.icon}</Text>
              <Text style={styles.questionText}>{item.question}</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

// Varsayılan önceden tanımlanmış sorular
const defaultQuestions: PredefinedQuestion[] = [
  {
    id: "1",
    question: "Bölgedeki deprem riski nedir?",
    answer: "Bulunduğunuz bölge 1. derece deprem kuşağında yer almaktadır. Son 100 yılda 7+ büyüklüğünde 3 deprem kaydedilmiştir. Düzenli olarak deprem çantanızı hazır bulundurmanız ve acil durum planınızı gözden geçirmeniz önerilir.",
    icon: "🌋",
  },
  {
    id: "2",
    question: "En yakın toplanma alanları nerede?",
    answer: "Size en yakın toplanma alanları:\n• Merkez Park (500m) - Kapasite: 5000 kişi\n• Spor Kompleksi (800m) - Kapasite: 3000 kişi\n• Okul Bahçesi (1.2km) - Kapasite: 2000 kişi\n\nAcil durumlarda bu alanlara yönelin ve yetkililerin talimatlarını bekleyin.",
    icon: "📍",
  },
  {
    id: "3",
    question: "En yakın hastane nerede?",
    answer: "En yakın sağlık kuruluşları:\n• Devlet Hastanesi (2.1km) - 7/24 Acil Servis\n• Özel Tıp Merkezi (1.8km) - 7/24 Acil Servis\n• Sağlık Ocağı (900m) - 08:00-17:00\n\nAcil durumlarda 112'yi arayarak ambulans talep edebilirsiniz.",
    icon: "🏥",
  },
  {
    id: "4",
    question: "En yakın havalimanı nerede?",
    answer: "En yakın havalimanları:\n• Şehir Havalimanı (25km) - İç hat ve dış hat seferleri\n• Askeri Hava Üssü (18km) - Acil durumlarda sivil kullanım\n\nAcil tahliye durumlarında havalimanına ulaşım için otobüs seferleri düzenlenir.",
    icon: "✈️",
  },
  {
    id: "5",
    question: "Deprem çantasında neler olmalı?",
    answer: "Deprem çantasında bulunması gereken temel malzemeler:\n• Su (kişi başı 4 litre)\n• Konserve yiyecekler\n• İlk yardım malzemeleri\n• El feneri ve yedek pil\n• Radyo\n• Önemli belgeler\n• Para\n• Telefon şarj cihazı",
    icon: "🎒",
  },
  {
    id: "6",
    question: "Deprem anında ne yapmalıyım?",
    answer: "Deprem anında yapmanız gerekenler:\n• Çök-Kapan-Tutun pozisyonunu alın\n• Pencere ve camlardan uzak durun\n• Asansör kullanmayın\n• Merdivenlerden inerken dikkatli olun\n• Elektrik ve gaz vanalarını kapatın\n• Sakin olun ve panik yapmayın",
    icon: "🆘",
  },
];

const styles = StyleSheet.create({
  predefinedQuestionsSection: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    backgroundColor: colors.light.background,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.light.textPrimary,
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: 'NotoSans-Bold',
  },
  predefinedQuestionCard: {
    minWidth: 220,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  questionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  questionText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    fontFamily: "NotoSans-Medium",
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default PredefinedQuestionsComponent;
