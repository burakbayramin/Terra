import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/providers/AuthProvider';

const ONBOARDING_COMPLETED_KEY = 'onboarding_completed';

export const useOnboarding = () => {
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    checkOnboardingStatus();
  }, [user]);

  const checkOnboardingStatus = async () => {
    try {
      if (user) {
        const key = `${ONBOARDING_COMPLETED_KEY}_${user.id}`;
        const completed = await AsyncStorage.getItem(key);
        setIsOnboardingCompleted(completed === 'true');
      } else {
        setIsOnboardingCompleted(false);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setIsOnboardingCompleted(false);
    } finally {
      setIsLoading(false);
    }
  };

  const markOnboardingCompleted = async () => {
    try {
      if (user) {
        const key = `${ONBOARDING_COMPLETED_KEY}_${user.id}`;
        await AsyncStorage.setItem(key, 'true');
        setIsOnboardingCompleted(true);
      }
    } catch (error) {
      console.error('Error marking onboarding as completed:', error);
    }
  };

  const shouldShowOnboarding = () => {
    return user && !isOnboardingCompleted && !isLoading;
  };

  return {
    isOnboardingCompleted,
    isLoading,
    shouldShowOnboarding,
    markOnboardingCompleted,
  };
}; 