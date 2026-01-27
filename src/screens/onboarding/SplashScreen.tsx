import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Easing,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [showWelcome, setShowWelcome] = useState(false);
  const [showTapText, setShowTapText] = useState(false);
  
  const logoFadeAnim = useRef(new Animated.Value(0)).current;
  const welcomeFadeAnim = useRef(new Animated.Value(0)).current;
  const tapTextOpacityAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Étape 1: Logo apparaît en fade in (120x120 au centre)
    Animated.timing(logoFadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start(() => {
      // Étape 2: Logo disparaît en fade out pendant que le texte apparaît
      setTimeout(() => {
        setShowWelcome(true);
        Animated.parallel([
          Animated.timing(logoFadeAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(welcomeFadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Étape 3: "Tap to start" apparaît avec animation smooth
          setTimeout(() => {
            setShowTapText(true);
            Animated.loop(
              Animated.sequence([
                Animated.timing(tapTextOpacityAnim, {
                  toValue: 0.9,
                  duration: 2000,
                  easing: Easing.out(Easing.quad),
                  useNativeDriver: true,
                }),
                Animated.timing(tapTextOpacityAnim, {
                  toValue: 0.3,
                  duration: 2000,
                  easing: Easing.in(Easing.quad),
                  useNativeDriver: true,
                }),
              ])
            ).start();
          }, 500);
        });
      }, 1000);
    });
  }, []);

  const handlePress = () => {
    onComplete();
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      activeOpacity={1}
      onPress={handlePress}
    >
      {/* Logo animé */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoFadeAnim,
          },
        ]}
      >
        <ExpoImage
          source={require('../../../assets/splash-icon.png')}
          style={styles.logo}
          contentFit="contain"
        />
      </Animated.View>

      {/* Texte Welcome */}
      {showWelcome && (
        <Animated.View
          style={[
            styles.welcomeContainer,
            {
              opacity: welcomeFadeAnim,
            },
          ]}
        >
          <Text style={styles.welcomeText}>Welcome to Peak.</Text>
        </Animated.View>
      )}

      {/* Tap to start */}
      {showTapText && (
        <Animated.View
          style={[
            styles.tapContainer,
            {
              opacity: tapTextOpacityAnim,
            },
          ]}
        >
          <Text style={styles.tapText}>Tap to start</Text>
        </Animated.View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0F',
  },
  logoContainer: {
    position: 'absolute',
    top: '50%',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: -60, // Half of logo height (120/2)
  },
  logo: {
    width: 120,
    height: 120,
  },
  welcomeContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    transform: [{ translateY: -12 }], // Centrer verticalement le texte
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
  },
  tapContainer: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  tapText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'Poppins-SemiBold',
  },
});
