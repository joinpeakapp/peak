import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  ScrollView,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image as ExpoImage } from 'expo-image';

const { width } = Dimensions.get('window');

interface SlideData {
  imageSource: any;
  title: string;
  description: string;
  buttonText: string;
  gradientColors: string[];
}

interface OnboardingCarouselScreenProps {
  onComplete: () => void;
}

const slides: SlideData[] = [
  {
    imageSource: require('../../../assets/Onboarding/Onboarding 1.png'),
    title: "Track your workouts like never before",
    description: "Peak tracks your progress in real time - get instant feedback when you lift more.",
    buttonText: "Continue",
    gradientColors: ['#9B93E440', 'rgba(10, 10, 12, 0.25)'],
  },
  {
    imageSource: require('../../../assets/Onboarding/Onboarding 2.png'),
    title: "Progress that feels rewarding",
    description: "Earn stickers when you hit milestones - new records, streaks, consistency",
    buttonText: "Continue",
    gradientColors: ['#FF8A2440', 'rgba(10, 10, 12, 0.25)'],
  },
  {
    imageSource: require('../../../assets/Onboarding/Onboarding 3.png'),
    title: "Turn your workouts into memories",
    description: "Each session becomes a card: your photo, your stats, your achievements, all in one place.",
    buttonText: "Start now",
    gradientColors: ['#3BDF3240', 'rgba(10, 10, 12, 0.25)'],
  },
];

export const OnboardingCarouselScreen: React.FC<OnboardingCarouselScreenProps> = ({
  onComplete,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Animations pour le contenu (texte)
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  
  // Animations pour les images - seulement le scale pour le slide 3
  const imageScale = useRef(new Animated.Value(1)).current;
  
  // Animation pour le gradient - transition directe entre gradients
  const previousGradientOpacity = useRef(new Animated.Value(1)).current;
  const currentGradientOpacity = useRef(new Animated.Value(1)).current;

  const currentSlide = slides[currentIndex];

  useEffect(() => {
    // Animation pour les slides suivants (pas le premier)
    if (currentIndex > 0) {
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
      
      // Transition du gradient : fade out précédent, fade in actuel
      previousGradientOpacity.setValue(1);
      currentGradientOpacity.setValue(0);
      
      // Scale pour le slide 3
      if (currentIndex === 2) {
        imageScale.setValue(1.5);
      } else {
        imageScale.setValue(1);
      }
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(previousGradientOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        }),
        Animated.timing(currentGradientOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      // Premier slide - animation d'entrée initiale
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
      previousGradientOpacity.setValue(0);
      currentGradientOpacity.setValue(0);
      imageScale.setValue(1);
      
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
        Animated.timing(currentGradientOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [currentIndex]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    if (index !== currentIndex && index >= 0 && index < slides.length) {
      setPreviousIndex(currentIndex);
      setCurrentIndex(index);
    }
  };

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    if (index !== currentIndex && index >= 0 && index < slides.length) {
      setPreviousIndex(currentIndex);
      setCurrentIndex(index);
    }
  };

  const handleButtonPress = () => {
    if (currentIndex < slides.length - 1) {
      // Animation du bouton
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
      ]).start();

      // Simuler un swipe vers la droite en faisant défiler le ScrollView
      // Le ScrollView gérera naturellement la transition grâce à pagingEnabled
      const nextIndex = currentIndex + 1;
      scrollViewRef.current?.scrollTo({
        x: nextIndex * width,
        animated: true,
      });
      
      // Ne pas changer l'index immédiatement - laisser handleScroll/handleMomentumScrollEnd
      // le gérer naturellement comme lors d'un swipe
    } else {
      // Dernier slide, terminer l'onboarding
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
        onComplete();
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Gradient précédent (pour transition fluide) */}
      {previousIndex !== currentIndex && previousIndex >= 0 && (
        <Animated.View
          style={[
            styles.background,
            {
              opacity: previousGradientOpacity,
            },
          ]}
        >
          <LinearGradient
            colors={slides[previousIndex].gradientColors}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
        </Animated.View>
      )}
      
      {/* Gradient actuel */}
      <Animated.View style={[styles.background, { opacity: currentGradientOpacity }]}>
        <LinearGradient
          colors={currentSlide.gradientColors}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </Animated.View>

      {/* Logo Peak - fixe, pas d'animation */}
      <View style={styles.logoContainer}>
        <ExpoImage
          source={require('../../../assets/splash-icon.png')}
          style={styles.logo}
          contentFit="contain"
        />
      </View>

      {/* ScrollView horizontal pour les images */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        decelerationRate="fast"
        style={styles.imageScrollView}
        contentContainerStyle={styles.imageScrollContent}
      >
        {slides.map((slide, index) => {
          const isActive = index === currentIndex;
          return (
            <View key={index} style={styles.imageSlideContainer}>
              <Animated.View
                style={[
                  styles.imageContainer,
                  {
                    opacity: isActive ? 1 : 0,
                    transform: [
                      { scale: isActive ? imageScale : index === 2 ? 1.5 : 1 },
                    ],
                  },
                ]}
              >
                <Image source={slide.imageSource} style={styles.image} resizeMode="contain" />
              </Animated.View>
            </View>
          );
        })}
      </ScrollView>

      {/* Stepper */}
      <Animated.View
        style={[
          styles.stepperContainer,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.stepperDot,
              index === currentIndex && styles.stepperDotActive,
            ]}
          />
        ))}
      </Animated.View>

      {/* Bottom Section avec texte animé */}
      <Animated.View
        style={[
          styles.bottomSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={styles.title}>{currentSlide.title}</Text>
        <Text style={styles.description}>{currentSlide.description}</Text>
        <Animated.View style={{ width: '100%', transform: [{ scale: buttonScaleAnim }] }}>
          <TouchableOpacity style={styles.button} onPress={handleButtonPress}>
            <Text style={styles.buttonText}>{currentSlide.buttonText}</Text>
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
  imageScrollView: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    height: 350,
  },
  imageScrollContent: {
    alignItems: 'center',
  },
  imageSlideContainer: {
    width: width,
    alignItems: 'center',
    justifyContent: 'center',
    height: 350,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 350,
  },
  image: {
    width: width * 0.85,
    height: 350,
  },
  stepperContainer: {
    position: 'absolute',
    top: 120 + 350 + 16, // 120px (top) + 350px (image height) + 16px (gap)
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
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
