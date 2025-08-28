import React, { useState, useEffect, ReactNode } from 'react';
import { Animated, ViewStyle } from 'react-native';

interface FadeInViewProps {
  children: ReactNode;
  style?: ViewStyle;
  startDelay?: number;
  duration?: number;
  slideDistance?: number;
  onComplete?: () => void;
}

export const FadeInView: React.FC<FadeInViewProps> = ({
  children,
  style,
  startDelay = 0,
  duration = 800,
  slideDistance = 10,
  onComplete,
}) => {
  const [opacity] = useState(new Animated.Value(0));
  const [translateY] = useState(new Animated.Value(slideDistance));

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),
      ]).start(onComplete);
    }, startDelay);

    return () => clearTimeout(timer);
  }, [opacity, translateY, startDelay, duration, onComplete]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

