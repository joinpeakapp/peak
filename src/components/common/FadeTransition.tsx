import React, { useEffect, useRef } from 'react';
import { Animated, View, ViewStyle } from 'react-native';

interface FadeTransitionProps {
  visible: boolean;
  duration?: number;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const FadeTransition: React.FC<FadeTransitionProps> = ({
  visible,
  duration = 300,
  children,
  style,
}) => {
  const fadeAnim = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration,
      useNativeDriver: true,
    }).start();
  }, [visible, duration, fadeAnim]);

  // Ne pas supprimer le composant du DOM pour éviter l'écran noir
  // Utiliser seulement l'opacité et pointerEvents

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: fadeAnim,
        },
      ]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      {children}
    </Animated.View>
  );
};
