import { Stack, router } from "expo-router";
import React, { useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  SafeAreaView,
  Pressable,
  Image,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  GestureDetector,
  Gesture,
  Directions,
} from "react-native-gesture-handler";

import Animated, {
  FadeIn,
  FadeOut,
  SlideOutLeft,
  SlideInRight,
} from "react-native-reanimated";
import { colors } from "@/constants/colors";

const onboardingSteps = [
  {
    image: require("@/assets/images/onboarding/1.png"),
    title: "Anlık Deprem Bildirimleri",
    description: "Sarsıntıları anında öğren, hazırlıksız yakalanma.",
  },
  {
    image: require("@/assets/images/onboarding/2.png"),
    title: "Terra AI Deprem Yorumu",
    description: "Her sarsıntıya yapay zeka yorumu; en doğru bilgi anında",
  },
  {
    image: require("@/assets/images/onboarding/3.png"),
    title: "Deprem İstatistikleri",
    description:
      "Bölgenizdeki deprem hareketliliğini günlük ve aylık raporla takip edin",
  },
  {
    image: require("@/assets/images/onboarding/4.png"),
    title: "Kullanıcı Ağları",
    description:
      "Ağındaki herkesin güven durumunu ve yakın depremleri anında öğren.",
  },
  {
    image: require("@/assets/images/onboarding/5.png"),
    title: "Zemin Risk Analiz Modülü",
    description: "Bulunduğun konumun zemin riskini öğren, güvenliğini planla.",
  },
  {
    image: require("@/assets/images/onboarding/6.png"),
    title: "Özelleştirilebilir Bildirimler",
    description: "İstediğin bölge, şiddet ve zaman aralığına göre bildirim al.",
  },
];

type OnboardingProps = {
  onComplete?: () => void;
};

export default function OnboardingScreen({ onComplete }: OnboardingProps) {
  const [screenIndex, setScreenIndex] = useState(0);

  const data = onboardingSteps[screenIndex];

  const onContinue = () => {
    const isLastScreen = screenIndex === onboardingSteps.length - 1;
    if (isLastScreen) {
      endOnboarding();
    } else {
      setScreenIndex(screenIndex + 1);
    }
  };

  const onBack = () => {
    const isFirstScreen = screenIndex === 0;
    if (isFirstScreen) {
      endOnboarding();
    } else {
      setScreenIndex(screenIndex - 1);
    }
  };

  const endOnboarding = () => {
    setScreenIndex(0);
    if (onComplete) {
      onComplete();
    } else {
      router.back();
    }
  };

  const swipes = Gesture.Simultaneous(
    Gesture.Fling().direction(Directions.LEFT).onEnd(onContinue),
    Gesture.Fling().direction(Directions.RIGHT).onEnd(onBack)
  );

  return (
    <SafeAreaView style={styles.page}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      <View style={styles.stepIndicatorContainer}>
        {onboardingSteps.map((step, index) => (
          <View
            key={index}
            style={[
              styles.stepIndicator,
              {
                backgroundColor:
                  index === screenIndex ? colors.primary : "grey",
              },
            ]}
          />
        ))}
      </View>

      <GestureDetector gesture={swipes}>
        <View style={styles.pageContent} key={screenIndex}>
          <Animated.Image
            entering={FadeIn}
            exiting={FadeOut}
            source={data.image}
            style={styles.image}
          />

          <View style={styles.footer}>
            <Animated.Text
              entering={SlideInRight}
              exiting={SlideOutLeft}
              style={styles.title}
            >
              {data.title}
            </Animated.Text>
            <Animated.Text
              entering={SlideInRight.delay(50)}
              exiting={SlideOutLeft}
              style={styles.description}
            >
              {data.description}
            </Animated.Text>

            <View style={styles.buttonsRow}>
              <Pressable onPress={endOnboarding} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Atla</Text>
              </Pressable>

              <Pressable
                onPress={onContinue}
                style={styles.button}
                android_ripple={{
                  color: "rgba(255,255,255,0.15)",
                  borderless: false,
                }}
              >
                <Text style={styles.buttonText}>Devam Et</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </GestureDetector>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    // alignItems: 'center',
    justifyContent: "center",
    flex: 1,
    backgroundColor: colors.background,
  },
  pageContent: {
    padding: 20,
    paddingTop: 32,
    flex: 1,
  },
  image: {
    alignSelf: "center",
    margin: 12,
    marginTop: 36,
    width: 250,
    height: 250,
    resizeMode: "contain",
  },
  title: {
    color: colors.text,
    fontSize: 50,
    fontFamily: "NotoSans-Bold",
    letterSpacing: 1.3,
    marginVertical: 6,
    textAlign: "center",
  },
  description: {
    color: colors.gray,
    fontSize: 20,
    fontFamily: "NotoSans-Regular",
    lineHeight: 28,
    marginTop: 4,
    textAlign: "center",
  },
  footer: {
    flex: 1,
  },

  buttonsRow: {
    marginTop: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  button: {
    backgroundColor: "#302E38",
    borderRadius: 999,
    overflow: "hidden",
    alignItems: "center",
    flex: 1,
  },
  secondaryButton: {
    borderColor: colors.gray,
    borderWidth: 1,
    borderRadius: 50,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  buttonText: {
    color: "#FDFDFD",
    fontFamily: "NotoSans-Medium",
    fontSize: 16,

    padding: 15,
    paddingHorizontal: 25,
  },
  secondaryButtonText: {
    color: colors.text,
    fontFamily: "NotoSans-Medium",
    fontSize: 16,
  },

  // steps
  stepIndicatorContainer: {
    flexDirection: "row",
    gap: 8,
    marginHorizontal: 15,
  },
  stepIndicator: {
    flex: 1,
    height: 3,
    backgroundColor: "gray",
    borderRadius: 10,
  },
});
