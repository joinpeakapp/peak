import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image as ExpoImage } from 'expo-image';

const { width } = Dimensions.get('window');

interface OnboardingStepScreenProps {
  step: number;
  totalSteps: number;
  imageSource: any; // Image source (require() ou URI)
  title: string;
  description: string;
  buttonText: string;
  gradientColors: string[];
  onContinue: () => void;
}

export const OnboardingStepScreen: React.FC<OnboardingStepScreenProps> = ({
  step,
  totalSteps,
  imageSource,
  title,
  description,
  buttonText,
  gradientColors,
  onContinue,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  // Animation pour l'image : slide depuis la droite pour les steps 2 et 3
  const imageSlideX = useRef(new Animated.Value(width)).current;
  const imageScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Réinitialiser toutes les valeurs d'animation
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    
    // Réinitialiser les valeurs d'animation selon le step
    if (step >= 2) {
      imageSlideX.setValue(width); // Commence depuis la droite
    } else {
      imageSlideX.setValue(0); // Pas de slide pour le step 1
    }
    
    if (step === 3) {
      imageScale.setValue(1.5); // Scale x1.5 pour le step 3
    } else {
      imageScale.setValue(1); // Scale normal pour les autres steps
    }

    // Animation d'entrée
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      // Animation de l'image depuis la droite pour les steps 2 et 3
      Animated.timing(imageSlideX, {
        toValue: 0,
        duration: 600,
        delay: step >= 2 ? 200 : 0,
        useNativeDriver: true,
      }),
    ]).start();
  }, [step]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onContinue();
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.background}>
        <LinearGradient
          colors={gradientColors}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </View>

      {/* Logo Peak */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <ExpoImage
          source={require('../../../assets/splash-icon.png')}
          style={styles.logo}
          contentFit="contain"
        />
      </Animated.View>

      {/* Image */}
      <Animated.View
        style={[
          styles.imageContainer,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { translateX: imageSlideX },
              { scale: imageScale },
            ],
          },
        ]}
      >
        <Image source={imageSource} style={styles.image} resizeMode="contain" />
      </Animated.View>

      {/* Stepper */}
      <Animated.View
        style={[
          styles.stepperContainer,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        {Array.from({ length: totalSteps }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.stepperDot,
              index === step - 1 && styles.stepperDotActive,
            ]}
          />
        ))}
      </Animated.View>

      {/* Bottom Section */}
      <Animated.View
        style={[
          styles.bottomSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <Animated.View style={{ width: '100%', transform: [{ scale: buttonScaleAnim }] }}>
          <TouchableOpacity style={styles.button} onPress={handlePress}>
            <Text style={styles.buttonText}>{buttonText}</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0F',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    flex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 64,
    marginBottom: 16,
  },
  logo: {
    width: 48,
    height: 48,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 16,
    height: 350,
    justifyContent: 'center',
  },
  image: {
    width: width * 0.85,
    height: 350,
  },
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  stepperDot: {
    width: 24,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  stepperDotActive: {
    backgroundColor: '#FFFFFF',
  },
  bottomSection: {
    position: 'absolute',
    bottom: 48,
    left: 40,
    right: 40,
    alignItems: 'stretch',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    fontWeight: '400',
    color: '#FFFFFF',
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 48,
    paddingHorizontal: 16,
    opacity: 0.7,
  },
  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: 1000,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Poppins-SemiBold',
  },
});
