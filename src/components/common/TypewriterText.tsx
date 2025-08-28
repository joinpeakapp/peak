import React, { useState, useEffect } from 'react';
import { Text, TextStyle, Animated } from 'react-native';

interface TypewriterTextProps {
  text: string;
  speed?: number; // Vitesse en ms par caractère
  style?: TextStyle;
  onComplete?: () => void; // Callback quand l'animation est terminée
  startDelay?: number; // Délai avant de commencer l'animation
  smooth?: boolean; // Animation plus fluide style Apple
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  speed = 50,
  style,
  onComplete,
  startDelay = 0,
  smooth = false,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [opacity] = useState(new Animated.Value(smooth ? 0 : 1));

  useEffect(() => {
    // Réinitialiser quand le texte change
    setDisplayedText('');
    setCurrentIndex(0);
    if (smooth) {
      opacity.setValue(0);
    }
  }, [text, smooth, opacity]);

  useEffect(() => {
    if (currentIndex === 0 && smooth) {
      // Fade-in initial pour l'animation smooth
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }

    if (currentIndex < text.length) {
      const actualSpeed = smooth ? Math.max(speed * 0.6, 25) : speed; // Plus rapide et fluide
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, currentIndex === 0 ? startDelay : actualSpeed);

      return () => clearTimeout(timer);
    } else if (currentIndex === text.length && onComplete) {
      // Animation terminée
      setTimeout(onComplete, smooth ? 200 : 0); // Petit délai pour la fluidité
    }
  }, [currentIndex, text, speed, startDelay, onComplete, smooth]);

  const textStyle = smooth 
    ? [style, { opacity }] 
    : style;

  return smooth ? (
    <Animated.Text style={textStyle}>
      {displayedText}
    </Animated.Text>
  ) : (
    <Text style={style}>{displayedText}</Text>
  );
}; 