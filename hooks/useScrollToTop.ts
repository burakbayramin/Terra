import { useRef, useCallback } from 'react';
import { ScrollView } from 'react-native';

export const useScrollToTop = () => {
  const scrollViewRef = useRef<ScrollView>(null);

  const scrollToTop = useCallback(() => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  return {
    scrollViewRef,
    scrollToTop,
  };
}; 