import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';

interface AIQuestion {
  id: string;
  question: string;
  priority?: number;
}

interface AIQuestionsComponentProps {
  questions?: AIQuestion[];
  title?: string;
  maxQuestions?: number;
}

const AIQuestionsComponent: React.FC<AIQuestionsComponentProps> = ({ 
  questions = defaultQuestions,
  title = "AI'a Sor",
  maxQuestions = 8
}) => {
  const router = useRouter();

  // Limit questions to maxQuestions and sort by priority if available
  const displayQuestions = questions
    .sort((a, b) => (b.priority || 0) - (a.priority || 0))
    .slice(0, maxQuestions);

  const handleQuestionPress = (question: string) => {
    // AI sayfasına yönlendir ve seçilen soruyu parametre olarak geç
    router.push({
      pathname: '/(protected)/(tabs)/analyzer',
      params: { 
        question: question,
        autoAsk: 'true'
      }
    });
  };

  return (
    <View style={styles.aiQuestionsSection}>
      <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>
        {title}
      </Text>
      <FlashList
        data={displayQuestions}
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
            onPress={() => handleQuestionPress(item.question)}
          >
            <LinearGradient
              colors={[colors.gradientOne, colors.gradientTwo]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.aiQuestionCard}
            >
              <Text style={styles.aiQuestionText}>{item.question}</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

// Varsayılan AI soruları - daha kısa ve öz
const defaultQuestions: AIQuestion[] = [
  { id: "1", question: "Depremde ne yapmalıyım?", priority: 1 },
  { id: "2", question: "En yakın toplanma alanı nerede?", priority: 2 },
  { id: "3", question: "Deprem çantasında neler olmalı?", priority: 3 },
  { id: "4", question: "Deprem anında evdeysem ne yapmalıyım?", priority: 4 },
  { id: "5", question: "Afet sonrası iletişim nasıl sağlanır?", priority: 5 },
  { id: "6", question: "Deprem öncesi ev hazırlığı nasıl yapılır?", priority: 6 },
  { id: "7", question: "Deprem sırasında hangi pozisyonu almalıyım?", priority: 7 },
  { id: "8", question: "Deprem sonrası ilk yardım nasıl yapılır?", priority: 8 },
  { id: "9", question: "Deprem sigortası gerekli mi?", priority: 9 },
  { id: "10", question: "Çocuklara deprem nasıl anlatılır?", priority: 10 },
];

const styles = StyleSheet.create({
  aiQuestionsSection: {
    paddingHorizontal: 10,
    paddingBottom: 2,
    backgroundColor: colors.light.background,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.light.textPrimary,
    marginBottom: 16,
    fontFamily: 'NotoSans-Bold',
  },
  aiQuestionCard: {
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
    position: 'relative',
  },
  aiQuestionText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    fontFamily: "NotoSans-Medium",
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default AIQuestionsComponent;
