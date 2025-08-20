import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';

const { width, height } = Dimensions.get('window');

const onboardingData = [
  { id: 1, image: require('@/assets/images/Onboarding1.png') },
  { id: 2, image: require('@/assets/images/Onboarding2.png') },
  { id: 3, image: require('@/assets/images/Onboarding3.png') },
  { id: 4, image: require('@/assets/images/Onboarding4.png') },
  { id: 5, image: require('@/assets/images/Onboarding5.png') },
  { id: 6, image: require('@/assets/images/Onboarding6.png') },
];

interface OnboardingCarouselProps {
  onComplete: () => void;
}

export default function OnboardingCarousel({ onComplete }: OnboardingCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * width,
        animated: true,
      });
    }
  };

  const handleComplete = () => {
    onComplete();
    router.push('/(protected)/(tabs)');
  };

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / width);
    setCurrentIndex(index);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {onboardingData.map((item, index) => (
          <View key={item.id} style={[
            styles.slide,
            {
              paddingLeft: insets.left,
              paddingRight: insets.right,
            }
          ]}>
            <ImageBackground
              source={item.image}
              style={styles.backgroundImage}
              resizeMode="cover"
            >
              {/* Bottom content */}
              <View style={[
                styles.bottomContent,
                {
                  paddingBottom: 50 + insets.bottom,
                  paddingLeft: 24 + insets.left,
                  paddingRight: 24 + insets.right,
                }
              ]}>
                {/* Page indicators */}
                <View style={styles.indicators}>
                  {onboardingData.map((_, indicatorIndex) => (
                    <View
                      key={indicatorIndex}
                      style={[
                        styles.indicator,
                        indicatorIndex === currentIndex && styles.activeIndicator,
                      ]}
                    />
                  ))}
                </View>

                {/* Action buttons */}
                <View style={styles.buttonContainer}>
                  {currentIndex < onboardingData.length - 1 ? (
                    <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                      <Text style={styles.nextButtonText}>Devam Et</Text>
                      <Ionicons name="arrow-forward" size={20} color="#fff" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
                      <Text style={styles.completeButtonText}>Hadi Başlayalım</Text>
                      <Ionicons name="rocket" size={20} color="#fff" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </ImageBackground>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width,
    height,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  bottomContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 50,
    paddingTop: 20,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    height: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.6)',
  },
  activeIndicator: {
    backgroundColor: '#000',
    width: 24,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#000',
  },
  buttonContainer: {
    alignItems: 'center',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: colors.primaryDark,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
    fontFamily: 'NotoSans-Medium',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D43F30',
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 8,
    fontFamily: 'NotoSans-Bold',
  },
}); 