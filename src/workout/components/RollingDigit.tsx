import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

interface RollingDigitProps {
  digit: string; // Single digit as string (0-9)
  height?: number; // Height of each digit (for spacing)
}

/**
 * RollingDigit - Animates a single digit with vertical rolling effect
 * 
 * When the digit changes, it slides down (current goes out, new comes in from above)
 * Handles wrap-around cases (9→0, 0→9) smoothly
 */
export const RollingDigit: React.FC<RollingDigitProps> = ({ 
  digit, 
  height = 80 
}) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const previousDigit = useRef(digit);
  const isAnimating = useRef(false);

  useEffect(() => {
    // Only animate if digit actually changed and not already animating
    if (digit !== previousDigit.current && !isAnimating.current) {
      isAnimating.current = true;
      
      const currentNum = parseInt(previousDigit.current);
      const newNum = parseInt(digit);
      
      // Determine direction and handle wrap-around
      let startValue = 0;
      
      if (newNum > currentNum) {
        // Incrementing: start from above (negative)
        startValue = -height;
      } else if (newNum < currentNum) {
        // Decrementing: start from below (positive)
        startValue = height;
      } else {
        // Same digit (shouldn't happen, but handle it)
        isAnimating.current = false;
        return;
      }
      
      // Handle wrap-around cases
      if (currentNum === 9 && newNum === 0) {
        // 9 → 0: going forward, start from above
        startValue = -height;
      } else if (currentNum === 0 && newNum === 9) {
        // 0 → 9: going backward, start from below
        startValue = height;
      }

      // Set initial position
      translateY.setValue(startValue);

      // Animate to center position
      Animated.timing(translateY, {
        toValue: 0,
        duration: 150,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        isAnimating.current = false;
      });

      previousDigit.current = digit;
    }
  }, [digit, height, translateY]);

  // Generate array of digits to display (previous, current, next for smooth scrolling)
  const getDigitArray = () => {
    const current = parseInt(digit);
    const prev = current === 0 ? 9 : current - 1;
    const next = current === 9 ? 0 : current + 1;
    return [prev, current, next];
  };

  const digits = getDigitArray();

  return (
    <View style={[styles.container, { height }]}>
      <Animated.View
        style={[
          styles.digitContainer,
          {
            transform: [{ translateY }],
          },
        ]}
      >
        {digits.map((d, index) => (
          <View
            key={`${d}-${index}-${digit}`}
            style={[styles.digitWrapper, { height }]}
          >
            <Text style={styles.digitText}>{d}</Text>
          </View>
        ))}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    width: 50, // Réduit pour rapprocher les chiffres
  },
  digitContainer: {
    alignItems: 'center',
  },
  digitWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  digitText: {
    fontSize: 80,
    fontWeight: '700', // Bold
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
});

