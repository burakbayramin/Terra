import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";
import React, { useState } from "react";
import { colors } from "../../../constants/colors";
import { LinearGradient } from "expo-linear-gradient";
import { Divider } from "react-native-paper";

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface PredefinedQuestion {
  id: string;
  question: string;
  answer: string;
}

const predefinedQuestions: PredefinedQuestion[] = [
  {
    id: "1",
    question: "Bölgedeki deprem riski nedir?",
    answer:
      "Bulunduğunuz bölge 1. derece deprem kuşağında yer almaktadır. Son 100 yılda 7+ büyüklüğünde 3 deprem kaydedilmiştir. Düzenli olarak deprem çantanızı hazır bulundurmanız ve acil durum planınızı gözden geçirmeniz önerilir.",
  },
  {
    id: "2",
    question: "En yakın toplanma alanları nerede?",
    answer:
      "Size en yakın toplanma alanları:\n• Merkez Park (500m) - Kapasite: 5000 kişi\n• Spor Kompleksi (800m) - Kapasite: 3000 kişi\n• Okul Bahçesi (1.2km) - Kapasite: 2000 kişi\n\nAcil durumlarda bu alanlara yönelin ve yetkililerin talimatlarını bekleyin.",
  },
  {
    id: "3",
    question: "En yakın hastane nerede?",
    answer:
      "En yakın sağlık kuruluşları:\n• Devlet Hastanesi (2.1km) - 7/24 Acil Servis\n• Özel Tıp Merkezi (1.8km) - 7/24 Acil Servis\n• Sağlık Ocağı (900m) - 08:00-17:00\n\nAcil durumlarda 112'yi arayarak ambulans talep edebilirsiniz.",
  },
  {
    id: "4",
    question: "En yakın havalimanı nerede?",
    answer:
      "En yakın havalimanları:\n• Şehir Havalimanı (25km) - İç hat ve dış hat seferleri\n• Askeri Hava Üssü (18km) - Acil durumlarda sivil kullanım\n\nAcil tahliye durumlarında havalimanına ulaşım için otobüs seferleri düzenlenir.",
  },
];

// 1. "Binam hangi büyüklükteki depreme kadar dayanıklı?"

// Yapım yılı, kat sayısı, yapı sistemi, zemin türü analizi
// Betonarme/çelik/yığma karşılaştırmalı dayanıklılık
// "6.4'e kadar güvenli, 7.0'da %60 hasar olasılığı" gibi spesifik tahminler

// 2. "Konumuma göre en güvenli kaçış rotası ve toplanma alanları"

// Anlık konum + bina yoğunluğu + sokak genişliği analizi
// 3 alternatif güvenli rota ve süreler
// En yakın hastane, AFAD koordinasyon merkezi lokasyonları

// 3. "Risk seviyeme göre deprem öncesi hazırlık planım"

// Bölgesel risk + bina durumu + aile yapısı kombine analizi
// Kişiselleştirilmiş acil durum çantası içeriği
// Su depolama, gıda stoklama, alternatif enerji önerileri

// 4. "Bulunduğum kata ve bina riskine göre deprem esnasında stratejim"

// Kat yüksekliği + bina yaşı + yapı türü risk matrisi
// "5. katta iseniz asansöre değil merdivene yönelin, 15 saniye içinde..."
// Oda içi güvenli nokta haritası ve hareket planı

export default function AnalyzerScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "0",
      text: "Merhaba! Size afet ve acil durumlarla ilgili yardımcı olabilirim. Aşağıdaki sorulardan birini seçerek bilgi alabilirsiniz.",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [askedQuestions, setAskedQuestions] = useState<string[]>([]);

  const handlePredefinedQuestion = (question: PredefinedQuestion) => {
    // Kullanıcının sorusunu ekle
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: question.question,
      isUser: true,
      timestamp: new Date(),
    };

    // AI'ın cevabını ekle
    const aiMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      text: question.answer,
      isUser: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage, aiMessage]);
    // Sorulan soruyu listeye ekle
    setAskedQuestions((prev) => [...prev, question.id]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainHeader}>
        <Text style={styles.inboxText}>Terra AI</Text>
      </View>
      <Divider style={styles.divider} />

      <ScrollView
        style={styles.chatContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {messages.map((message) => (
          <View key={message.id}>
            {message.isUser ? (
              <LinearGradient
                colors={[colors.gradientOne, colors.gradientTwo]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.messageContainer, styles.userMessage]}
              >
                <Text style={styles.userMessageText}>{message.text}</Text>
                <Text style={styles.userTimestamp}>
                  {message.timestamp.toLocaleTimeString("tr-TR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </LinearGradient>
            ) : (
              <View style={[styles.messageContainer, styles.aiMessage]}>
                <Text style={styles.aiMessageText}>{message.text}</Text>
                <Text style={styles.timestamp}>
                  {message.timestamp.toLocaleTimeString("tr-TR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
            )}
          </View>
        ))}

        {/* Hızlı sorular - henüz sorulmamış olanlar */}
        <View style={styles.inlineButtonsContainer}>
          {predefinedQuestions
            .filter((question) => !askedQuestions.includes(question.id))
            .map((question) => (
              <TouchableOpacity
                key={question.id}
                onPress={() => handlePredefinedQuestion(question)}
              >
                <LinearGradient
                  colors={[colors.gradientOne, colors.gradientTwo]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.inlineQuestionButton}
                >
                  <Text style={styles.inlineQuestionButtonText}>
                    {question.question}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  // header: {
  //   backgroundColor: colors.primary,
  //   paddingTop: 50,
  //   paddingBottom: 20,
  //   paddingHorizontal: 20,
  //   alignItems: "center",
  // },
  mainHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    marginBottom: 15,
    marginTop: 15,
  },
  inboxText: {
    fontSize: 25,
    fontFamily: "NotoSans-Bold",
    flex: 1,
    textAlign: "center",
  },
  divider: {
    height: 3,
    backgroundColor: colors.light.surface,
    // marginHorizontal: 12,
    // marginVertical: 20,
    borderRadius: 10,
  },
  // headerTitle: {
  //   fontSize: 24,
  //   fontWeight: "bold",
  //   color: "white",
  //   marginBottom: 5,
  // },
  // headerSubtitle: {
  //   fontSize: 14,
  //   color: "rgba(255,255,255,0.9)",
  // },
  chatContainer: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  messageContainer: {
    marginVertical: 5,
    maxWidth: "85%",
    padding: 12,
    borderRadius: 15,
  },
  userMessage: {
    alignSelf: "flex-end",
    borderWidth: 0,
  },
  aiMessage: {
    alignSelf: "flex-start",
    backgroundColor: colors.light.background,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userMessageText: {
    color: "white",
  },
  aiMessageText: {
    color: colors.light.textPrimary,
  },
  timestamp: {
    fontSize: 11,
    color: colors.light.textSecondary,
    marginTop: 5,
    textAlign: "right",
  },
  userTimestamp: {
    fontSize: 11,
    color: "white", // White color for user message timestamps
    marginTop: 5,
    textAlign: "right",
  },
  inlineButtonsContainer: {
    marginTop: 3,
    marginHorizontal: 3,
    alignItems: "flex-end", // Align items to the right side
  },
  inlineQuestionButton: {
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginVertical: 4,
    alignSelf: "flex-end", // Changed from flex-start to flex-end to align to the right
    maxWidth: "90%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 3,
  },
  inlineQuestionButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "right", // Changed from left to right
  },
});
