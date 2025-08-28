import React, { useState, useEffect } from 'react';
import { Text, TextStyle, Animated } from 'react-native';

interface FadeInTextProps {
  text: string;
  style?: TextStyle;
  onComplete?: () => void;
  startDelay?: number;
  duration?: number; // Durée de l'animation fade-in
  slideDistance?: number; // Distance du slide (subtil)
}

export const FadeInText: React.FC<FadeInTextProps> = ({
  text,
  style,
  onComplete,
  startDelay = 0,
  duration = 800,
  slideDistance = 10,
}) => {
  const [opacity] = useState(new Animated.Value(0));
  const [translateY] = useState(new Animated.Value(slideDistance));

  useEffect(() => {
    const timer = setTimeout(() => {
      // Animation parallèle : fade-in + slide subtil
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
      ]).start(({ finished }) => {
        if (finished && onComplete) {
          onComplete();
        }
      });
    }, startDelay);

    return () => clearTimeout(timer);
  }, [opacity, translateY, startDelay, duration, onComplete]);

  return (
    <Animated.Text
      style={[
        style,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      {text}
    </Animated.Text>
  );
}; 