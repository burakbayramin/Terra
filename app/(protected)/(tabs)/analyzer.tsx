import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useState, useRef, useEffect } from "react";
import { colors } from "../../../constants/colors";
import { LinearGradient } from "expo-linear-gradient";
import { Divider } from "react-native-paper";
import { GoogleGenerativeAI } from '@google/generative-ai';
import { usePremium } from "@/hooks/usePremium";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import PredefinedQuestionsComponent from "@/components/PredefinedQuestionsComponent";

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
  icon: string;
}

const predefinedQuestions: PredefinedQuestion[] = [
  {
    id: "1",
    question: "Bölgedeki deprem riski nedir?",
    answer:
      "Bulunduğunuz bölge 1. derece deprem kuşağında yer almaktadır. Son 100 yılda 7+ büyüklüğünde 3 deprem kaydedilmiştir. Düzenli olarak deprem çantanızı hazır bulundurmanız ve acil durum planınızı gözden geçirmeniz önerilir.",
    icon: "🌋",
  },
  {
    id: "2",
    question: "En yakın toplanma alanları nerede?",
    answer:
      "Size en yakın toplanma alanları:\n• Merkez Park (500m) - Kapasite: 5000 kişi\n• Spor Kompleksi (800m) - Kapasite: 3000 kişi\n• Okul Bahçesi (1.2km) - Kapasite: 2000 kişi\n\nAcil durumlarda bu alanlara yönelin ve yetkililerin talimatlarını bekleyin.",
    icon: "📍",
  },
  {
    id: "3",
    question: "En yakın hastane nerede?",
    answer:
      "En yakın sağlık kuruluşları:\n• Devlet Hastanesi (2.1km) - 7/24 Acil Servis\n• Özel Tıp Merkezi (1.8km) - 7/24 Acil Servis\n• Sağlık Ocağı (900m) - 08:00-17:00\n\nAcil durumlarda 112'yi arayarak ambulans talep edebilirsiniz.",
    icon: "🏥",
  },
  {
    id: "4",
    question: "En yakın havalimanı nerede?",
    answer:
      "En yakın havalimanları:\n• Şehir Havalimanı (25km) - İç hat ve dış hat seferleri\n• Askeri Hava Üssü (18km) - Acil durumlarda sivil kullanım\n\nAcil tahliye durumlarında havalimanına ulaşım için otobüs seferleri düzenlenir.",
    icon: "✈️",
  },
];

// Google Generative AI instance
const genAI = new GoogleGenerativeAI("AIzaSyA9gguZnXbvAcOmVvDxTm1vNVeIqOYfejA");

export default function AnalyzerScreen() {
  const { user } = useAuth();
  const { hasAccessToFeature, isPremium, getCurrentLevel } = usePremium();
  const params = useLocalSearchParams();
  
  // URL parametrelerinden gelen soru ve otomatik sorma bilgisi
  const autoQuestion = params.question as string;
  const shouldAutoAsk = params.autoAsk === 'true';
  
  // Otomatik soru sorma işleminin sadece bir kez çalışması için flag
  const [hasAutoAsked, setHasAutoAsked] = useState(false);
  
  // Günlük soru limiti state'leri
  const [dailyQuestionCount, setDailyQuestionCount] = useState(0);
  const [lastQuestionDate, setLastQuestionDate] = useState<string>('');
  const [isLimitReached, setIsLimitReached] = useState(false);
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "0",
      text: "Merhaba! Ben Terra AI, afet ve acil durumlar konusunda size yardımcı olmak için buradayım. 🤖\n\nAşağıdaki hızlı sorulardan birini seçebilir veya kendi sorunuzu yazabilirsiniz.",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [askedQuestions, setAskedQuestions] = useState<string[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingText, setTypingText] = useState("");
  const [currentTypingMessageId, setCurrentTypingMessageId] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  // Sayfa her açıldığında state'leri sıfırla
  useEffect(() => {
    setHasAutoAsked(false);
    // Günlük soru sayısını da sıfırla
    const today = new Date().toDateString();
    if (lastQuestionDate !== today) {
      setDailyQuestionCount(0);
      setLastQuestionDate(today);
      setIsLimitReached(false);
    }
  }, []);

  // Otomatik soru sorma için useEffect
  useEffect(() => {
    console.log('useEffect çalıştı:', { shouldAutoAsk, autoQuestion, hasAutoAsked });
    
    if (shouldAutoAsk && autoQuestion) {
      console.log('Otomatik soru sorma başlatılıyor:', autoQuestion);
      
      // Seçilen soruyu input alanına doldur
      setInputText(autoQuestion);
      
      // Kısa bir gecikme ile gönder butonuna otomatik tıkla
      const timer = setTimeout(() => {
        console.log('Otomatik gönder başlatılıyor:', autoQuestion);
        // handleAutoQuestion yerine handleSendMessage çağır
        handleSendMessage(autoQuestion);
        setHasAutoAsked(true); // Flag'i true yaparak tekrar çalışmasını engelle
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [shouldAutoAsk, autoQuestion]); // hasAutoAsked dependency'sini kaldırdık

  // Günlük soru sayısını kontrol et
  const checkDailyQuestionLimit = async () => {
    if (!user) return false;
    
    const today = new Date().toDateString();
    
    console.log('checkDailyQuestionLimit çalıştı:', {
      today,
      lastQuestionDate,
      dailyQuestionCount,
      isLimitReached,
      hasAccess: hasAccessToFeature('terra-ai-daily-questions')
    });
    
    // Eğer bugün ilk soru ise, sayacı sıfırla
    if (lastQuestionDate !== today) {
      console.log('Bugün ilk soru, sayaç sıfırlanıyor');
      setDailyQuestionCount(0);
      setLastQuestionDate(today);
      setIsLimitReached(false);
      return true;
    }
    
    // Premium kullanıcılar için limit yok
    if (hasAccessToFeature('terra-ai-daily-questions')) {
      console.log('Premium kullanıcı, limit kontrolü yapılmıyor');
      return true;
    }
    
    // Ücretsiz kullanıcılar için 3 soru limiti
    if (dailyQuestionCount >= 3) {
      console.log('Limit aşıldı, dailyQuestionCount:', dailyQuestionCount);
      setIsLimitReached(true);
      return false;
    }
    
    console.log('Limit kontrolü geçildi, dailyQuestionCount:', dailyQuestionCount);
    return true;
  };

  // Soru sayısını artır
  const incrementQuestionCount = () => {
    const today = new Date().toDateString();
    if (lastQuestionDate !== today) {
      setDailyQuestionCount(1);
      setLastQuestionDate(today);
    } else {
      setDailyQuestionCount(prev => prev + 1);
    }
  };

  // Typing effect fonksiyonu
  const typeText = (text: string, messageId: string, speed: number = 30) => {
    setIsTyping(true);
    setCurrentTypingMessageId(messageId);
    setTypingText("");
    
    let index = 0;
    const timer = setInterval(() => {
      if (index < text.length) {
        setTypingText(text.substring(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
        setIsTyping(false);
        setCurrentTypingMessageId(null);
        setTypingText("");
      }
    }, speed);
  };

  // Otomatik soru sorma fonksiyonu
  const handleAutoQuestion = async (questionText: string) => {
    console.log('handleAutoQuestion başladı:', questionText);
    
    // Premium kullanıcılar için limit kontrolü yok
    if (!hasAccessToFeature('terra-ai-daily-questions')) {
      console.log('Ücretsiz kullanıcı, limit kontrolü yapılıyor');
      // Günlük limit kontrolü sadece ücretsiz kullanıcılar için
      const canAskQuestion = await checkDailyQuestionLimit();
      if (!canAskQuestion) {
        console.log('Limit aşıldı');
        const limitMessage: ChatMessage = {
          id: Date.now().toString(),
          text: "Günlük soru limitinize ulaştınız. Premium üyeliğe geçerek sınırsız soru sorabilirsiniz.",
          isUser: false,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, limitMessage]);
        return;
      }
    } else {
      console.log('Premium kullanıcı, limit kontrolü yapılmıyor');
    }

    // Kullanıcının sorusunu ekle
    console.log('Kullanıcı mesajı ekleniyor:', questionText);
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: questionText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    console.log('AI yanıtı bekleniyor...');

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      
      const prompt = `Sen bir afet ve acil durum uzmanısın. Aşağıdaki soruya Türkçe olarak maksimum 3-4 cümle ile yanıt ver. Yanıtın kısa, net ve faydalı olsun. Soru: ${questionText}`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: text,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      
      // Soru sayısını sadece ücretsiz kullanıcılar için artır
      if (!hasAccessToFeature('terra-ai-daily-questions')) {
        incrementQuestionCount();
      }
      
      // Otomatik gönderim sonrası input'u temizle
      setInputText("");
      
      // Typing effect başlat
      setTimeout(() => {
        typeText(text, aiMessage.id);
      }, 200);
      
    } catch (error) {
      console.error('AI yanıt hatası:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        text: "Üzgünüm, şu anda yanıt veremiyorum. Lütfen daha sonra tekrar deneyin.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePredefinedQuestion = async (question: PredefinedQuestion) => {
    // Premium kullanıcılar için limit kontrolü yok
    if (!hasAccessToFeature('terra-ai-daily-questions')) {
      // Günlük limit kontrolü sadece ücretsiz kullanıcılar için
      const canAskQuestion = await checkDailyQuestionLimit();
      if (!canAskQuestion) {
        const limitMessage: ChatMessage = {
          id: Date.now().toString(),
          text: "Günlük soru limitinize ulaştınız. Premium üyeliğe geçerek sınırsız soru sorabilirsiniz.",
          isUser: false,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, limitMessage]);
        return;
      }
    }

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
    
    // Soru sayısını sadece ücretsiz kullanıcılar için artır
    if (!hasAccessToFeature('terra-ai-daily-questions')) {
      incrementQuestionCount();
    }
    
    // Typing effect başlat
    setTimeout(() => {
      typeText(question.answer, aiMessage.id);
    }, 200);
  };

  const handleSendMessage = async (autoText?: string) => {
    const textToSend = autoText || inputText.trim();
    if (!textToSend || isLoading) return;
    
    console.log('Premium kontrol:', {
      hasAccess: hasAccessToFeature('terra-ai-daily-questions'),
      isPremium: isPremium(),
      currentLevel: getCurrentLevel()
    });

    // Premium kullanıcılar için limit kontrolü yok
    if (!hasAccessToFeature('terra-ai-daily-questions')) {
      console.log('Ücretsiz kullanıcı, limit kontrolü yapılıyor');
      // Günlük limit kontrolü sadece ücretsiz kullanıcılar için
      const canAskQuestion = await checkDailyQuestionLimit();
      if (!canAskQuestion) {
        console.log('Limit aşıldı');
        const limitMessage: ChatMessage = {
          id: Date.now().toString(),
          text: "Günlük soru limitinize ulaştınız. Premium üyeliğe geçerek sınırsız soru sorabilirsiniz.",
          isUser: false,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, limitMessage]);
        setInputText("");
        return;
      }
    } else {
      console.log('Premium kullanıcı, limit kontrolü yapılmıyor');
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: textToSend,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    // Input'u her durumda temizle (otomatik ve manuel gönderim)
    setInputText("");
    setIsLoading(true);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      
      const prompt = `Sen bir afet ve acil durum uzmanısın. Aşağıdaki soruya Türkçe olarak maksimum 2 cümle ile yanıt ver. Yanıtın kısa, net ve faydalı olsun. Soru: ${textToSend}`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: text,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      
      // Soru sayısını sadece ücretsiz kullanıcılar için artır
      if (!hasAccessToFeature('terra-ai-daily-questions')) {
        incrementQuestionCount();
      }
      
      // Typing effect başlat
      setTimeout(() => {
        typeText(text, aiMessage.id);
      }, 200);
    } catch (error) {
      console.error("AI yanıt hatası:", error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "Üzgünüm, şu anda yanıt veremiyorum. Lütfen daha sonra tekrar deneyin.",
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* AI Header */}
        <View style={styles.aiHeader}>
          <View style={styles.aiAvatar}>
            <Text style={styles.aiAvatarText}>🤖</Text>
          </View>
          <View style={styles.aiInfo}>
            <Text style={styles.aiName}>Terra AI</Text>
            <Text style={styles.aiStatus}>Çevrimiçi • Afet Uzmanı</Text>
          </View>
          <View style={styles.aiStatusIndicator}>
            <View style={styles.onlineIndicator} />
          </View>
        </View>

        {/* Günlük Soru Sayısı */}
        {!hasAccessToFeature('terra-ai-daily-questions') && (
          <View style={styles.dailyLimitContainer}>
            <View style={styles.limitInfo}>
              <Ionicons name="time-outline" size={16} color={colors.primary} />
              <Text style={styles.limitText}>
                Günlük Soru: {dailyQuestionCount}/3
              </Text>
            </View>
            {isLimitReached && (
              <TouchableOpacity 
                style={styles.upgradeButton}
                onPress={() => router.push('/(protected)/premium-packages')}
              >
                <LinearGradient
                  colors={[colors.primary, '#8B5CF6']}
                  style={styles.upgradeButtonGradient}
                >
                  <Ionicons name="sparkles" size={16} color="#fff" />
                  <Text style={styles.upgradeButtonText}>Premium'a Geç</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        )}

        <ScrollView
          ref={scrollViewRef}
          style={styles.chatContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom }]}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((message) => (
            <View key={message.id} style={styles.messageWrapper}>
              {message.isUser ? (
                <View style={styles.userMessageContainer}>
                  <View style={styles.userMessageBubble}>
                    <Text style={styles.userMessageText}>{message.text}</Text>
                    <Text style={styles.userTimestamp}>
                      {message.timestamp.toLocaleTimeString("tr-TR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.aiMessageContainer}>
                  <View style={styles.aiAvatarSmall}>
                    <Text style={styles.aiAvatarSmallText}>🤖</Text>
                  </View>
                  <View style={styles.aiMessageBubble}>
                    <Text style={styles.aiMessageText}>
                      {currentTypingMessageId === message.id && isTyping ? typingText : message.text}
                      {currentTypingMessageId === message.id && isTyping && (
                        <Text style={styles.cursor}>|</Text>
                      )}
                    </Text>
                    <Text style={styles.timestamp}>
                      {message.timestamp.toLocaleTimeString("tr-TR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          ))}

          {isLoading && (
            <View style={styles.messageWrapper}>
              <View style={styles.aiMessageContainer}>
                <View style={styles.aiAvatarSmall}>
                  <Text style={styles.aiAvatarSmallText}>🤖</Text>
                </View>
                <View style={styles.aiMessageBubble}>
                                     <View style={styles.loadingContainer}>
                     <ActivityIndicator size="small" color={colors.primary} />
                     <Text style={styles.loadingText}>AI düşünüyor...</Text>
                   </View>
                </View>
              </View>
            </View>
          )}

          {/* Hızlı sorular - Dinamik component ile */}
          {messages.length > 1 && (
            <PredefinedQuestionsComponent
              questions={predefinedQuestions}
              title="💡 Hızlı Sorular"
              maxQuestions={6}
              onQuestionPress={handlePredefinedQuestion}
              askedQuestions={askedQuestions}
            />
          )}
        </ScrollView>

        {/* AI Input alanı */}
        <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 5 }]}>
          <View style={styles.inputWrapper}>
            <View style={styles.inputField}>
                             <TextInput
                 style={styles.textInput}
                 placeholder="Deprem çantasında neler olmalı?"
                 placeholderTextColor={colors.light.textSecondary}
                 value={inputText}
                 onChangeText={setInputText}
                 multiline
                 maxLength={200}
                 editable={!isLoading}
               />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!inputText.trim() || isLoading) && styles.sendButtonDisabled
                ]}
                onPress={() => handleSendMessage()}
                disabled={!inputText.trim() || isLoading}
              >
                               <LinearGradient
                 colors={inputText.trim() && !isLoading ? [colors.gradientOne, colors.gradientTwo] : ['#E0E0E0', '#CCCCCC']}
                 style={styles.sendButtonGradient}
               >
                 <Text style={styles.sendButtonText}>📤</Text>
               </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
                 </View>
       </KeyboardAvoidingView>
     </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.surface,
    backgroundColor: colors.light.background,
  },
  aiAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  aiAvatarText: {
    fontSize: 24,
  },
  aiInfo: {
    flex: 1,
  },
  aiName: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.light.textPrimary,
    marginBottom: 2,
  },
  aiStatus: {
    fontSize: 12,
    color: colors.light.textSecondary,
  },
  aiStatusIndicator: {
    alignItems: "center",
    justifyContent: "center",
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#00C851",
  },
  chatContainer: {
    flex: 1,
    paddingHorizontal: 15,
    backgroundColor: colors.light.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  messageWrapper: {
    marginVertical: 6,
  },
  userMessageContainer: {
    alignItems: "flex-end",
  },
  userMessageBubble: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomRightRadius: 8,
    maxWidth: "80%",
  },
  userMessageText: {
    color: "white",
    fontSize: 16,
    lineHeight: 22,
  },
  userTimestamp: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
    textAlign: "right",
  },
  aiMessageContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  aiAvatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  aiAvatarSmallText: {
    fontSize: 16,
  },
  aiMessageBubble: {
    backgroundColor: colors.light.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 8,
    maxWidth: "75%",
    flex: 1,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  aiMessageText: {
    color: colors.light.textPrimary,
    fontSize: 16,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 11,
    color: colors.light.textSecondary,
    marginTop: 4,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    color: colors.light.textSecondary,
    fontSize: 14,
  },
  cursor: {
    color: colors.primary,
    fontWeight: "bold",
    fontSize: 16,
  },


  inputContainer: {
    paddingHorizontal: 15,
    paddingTop: 5,
    backgroundColor: colors.light.background,
    borderTopWidth: 1,
    borderTopColor: colors.light.surface,
  },
  inputWrapper: {
    width: "100%",
  },
  inputField: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingVertical: 12,
    maxHeight: 100,
    fontSize: 16,
    color: colors.light.textPrimary,
    backgroundColor: colors.light.background,
  },
  sendButton: {
    borderRadius: 25,
    overflow: "hidden",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonText: {
    fontSize: 18,
  },
  // Günlük limit stilleri
  dailyLimitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 92, 246, 0.2)',
  },
  limitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  limitText: {
    fontSize: 14,
    color: colors.light.textPrimary,
    fontWeight: '500',
  },
  upgradeButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  upgradeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});
