import React from "react";
import { View, Animated, StyleSheet, ViewStyle } from "react-native";

export interface AnimatedProgressBarProps {
  percentage: number; // 0 - 100
  width?: number; // default 30
  height?: number; // default 4
  backgroundColor?: string; // track color
  fillColor?: string; // bar color
  duration?: number; // animation ms (default 800)
  style?: ViewStyle; // extra style for outer container
}

const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
  percentage,
  width = 30,
  height = 4,
  backgroundColor = "rgba(255,255,255,0.2)",
  fillColor = "#fff",
  duration = 800,
  style,
}) => {
  const clamped = Math.min(Math.max(percentage, 0), 100);
  const animatedWidth = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: clamped,
      duration,
      useNativeDriver: false,
    }).start();
  }, [clamped, duration, animatedWidth]);

  return (
    <View
      style={[
        styles.container,
        {
          width,
          height,
          backgroundColor,
          borderRadius: height / 2,
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          height: "100%",
          width: animatedWidth.interpolate({
            inputRange: [0, 100],
            outputRange: ["0%", "100%"],
          }),
          backgroundColor: fillColor,
          borderRadius: height / 2,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
});

export default AnimatedProgressBar;
