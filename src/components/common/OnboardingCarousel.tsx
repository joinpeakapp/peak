import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Animated,
  Dimensions,
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingCarouselProps {
  visible: boolean;
  onComplete?: () => void;
  onClose?: () => void;
}

interface OnboardingSlide {
  id: number;
  title: string;
  description: string;
  buttonText: string;
  gradient: string[];
  illustration: React.ReactNode;
}

export const OnboardingCarousel: React.FC<OnboardingCarouselProps> = ({
  visible,
  onComplete,
  onClose
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const slides: OnboardingSlide[] = [
    {
      id: 0,
      title: "Track your workouts like never before",
      description: "Peak tracks your progress in real time - get instant feedback when you lift more.",
      buttonText: "Continue",
      gradient: ['#0D0D0F', '#2D1B69'],
      illustration: (
        <View style={styles.illustrationContainer}>
          {/* Mockup de l'interface de tracking */}
          <View style={styles.mockupContainer}>
            <View style={styles.mockupHeader}>
              <Text style={styles.mockupTitle}>Bench Press</Text>
              <Text style={styles.mockupSubtitle}>3 sets</Text>
            </View>
            
            {/* Sets avec PR badge */}
            <View style={styles.mockupSets}>
              <View style={styles.mockupSet}>
                <View style={styles.mockupSetContent}>
                  <Text style={styles.mockupSetText}>80 kg</Text>
                  <Text style={styles.mockupSetText}>9 reps</Text>
                </View>
                <View style={styles.mockupCheckmark}>
                  <Ionicons name="checkmark" size={16} color="#4CAF50" />
                </View>
              </View>
              
              <View style={styles.mockupSet}>
                <View style={styles.mockupSetContent}>
                  <Text style={styles.mockupSetText}>112.5 kg</Text>
                  <Text style={styles.mockupSetText}>1 reps</Text>
                </View>
                <View style={styles.mockupCheckmark}>
                  <Ionicons name="checkmark" size={16} color="#4CAF50" />
                </View>
                {/* PR Badge */}
                <View style={styles.mockupPRBadge}>
                  <Text style={styles.mockupPRText}>NEW PR</Text>
                </View>
              </View>
              
              <View style={styles.mockupSet}>
                <View style={styles.mockupSetContent}>
                  <Text style={styles.mockupSetText}>100 kg</Text>
                  <Text style={styles.mockupSetText}>5 reps</Text>
                </View>
                <View style={styles.mockupCheckmark}>
                  <Ionicons name="checkmark" size={16} color="#4CAF50" />
                </View>
              </View>
            </View>
            
            {/* Rest Timer */}
            <View style={styles.mockupRestTimer}>
              <Text style={styles.mockupRestText}>Rest for 2:59</Text>
              <TouchableOpacity style={styles.mockupPauseButton}>
                <Ionicons name="pause" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )
    },
    {
      id: 1,
      title: "Progress that feels rewarding",
      description: "Earn stickers when you hit milestones - new records, streaks, consistency",
      buttonText: "Continue",
      gradient: ['#2D1B69', '#8B4513'],
      illustration: (
        <View style={styles.illustrationContainer}>
          {/* Stickers flottants */}
          <View style={styles.stickersContainer}>
            <View style={[styles.sticker, styles.stickerPR]}>
              <Ionicons name="trophy" size={24} color="#000000" />
              <Text style={styles.stickerText}>PR</Text>
            </View>
            
            <View style={[styles.sticker, styles.stickerLightning]}>
              <Ionicons name="flash" size={24} color="#000000" />
            </View>
            
            <View style={[styles.sticker, styles.stickerFire]}>
              <Ionicons name="flame" size={24} color="#000000" />
            </View>
            
            <View style={[styles.sticker, styles.stickerBubble]}>
              <Text style={styles.stickerBubbleText}>100</Text>
            </View>
            
            <View style={[styles.sticker, styles.stickerStar]}>
              <Ionicons name="star" size={24} color="#000000" />
            </View>
          </View>
        </View>
      )
    },
    {
      id: 2,
      title: "Turn your workouts into memories",
      description: "Each session becomes a card: your photo, your stats, your achievements, all in one place.",
      buttonText: "Start now",
      gradient: ['#8B4513', '#2D5016'],
      illustration: (
        <View style={styles.illustrationContainer}>
          {/* Cartes de workout */}
          <View style={styles.cardsContainer}>
            <View style={[styles.workoutCard, styles.cardLeft]}>
              <View style={styles.cardImage}>
                <Ionicons name="people" size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.cardTitle}>workout</Text>
              <View style={styles.cardBadges}>
                <View style={[styles.cardBadge, styles.badgePR]}>
                  <Text style={styles.cardBadgeText}>PR</Text>
                </View>
                <View style={[styles.cardBadge, styles.badgePercent]}>
                  <Text style={styles.cardBadgeText}>10%</Text>
                </View>
              </View>
            </View>
            
            <View style={[styles.workoutCard, styles.cardCenter]}>
              <View style={styles.cardImage}>
                <Ionicons name="person" size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.cardTitle}>Legs & cardio</Text>
              <View style={styles.cardBadges}>
                <View style={[styles.cardBadge, styles.badgeRed]}>
                  <Text style={styles.cardBadgeText}>100</Text>
                </View>
                <View style={[styles.cardBadge, styles.badgeGreen]}>
                  <Text style={styles.cardBadgeText}>25</Text>
                </View>
              </View>
            </View>
            
            <View style={[styles.workoutCard, styles.cardRight]}>
              <View style={styles.cardImage}>
                <Ionicons name="person" size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.cardTitle}>Pull wo</Text>
              <View style={styles.cardBadges}>
                <View style={[styles.cardBadge, styles.badgeRed]}>
                  <Text style={styles.cardBadgeText}>100</Text>
                </View>
                <View style={[styles.cardBadge, styles.badgePR]}>
                  <Text style={styles.cardBadgeText}>PR</Text>
                </View>
                <View style={[styles.cardBadge, styles.badgePercent]}>
                  <Text style={styles.cardBadgeText}>10%</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      )
    }
  ];

  const goToNextSlide = () => {
    if (currentSlide < slides.length - 1) {
      // Animation de sortie
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -SCREEN_WIDTH,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        })
      ]).start(() => {
        setCurrentSlide(currentSlide + 1);
        slideAnim.setValue(SCREEN_WIDTH);
        fadeAnim.setValue(0);
        
        // Animation d'entrée
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          })
        ]).start();
      });
    } else {
      onComplete?.();
    }
  };

  const goToPreviousSlide = () => {
    if (currentSlide > 0) {
      // Animation de sortie
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_WIDTH,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        })
      ]).start(() => {
        setCurrentSlide(currentSlide - 1);
        slideAnim.setValue(-SCREEN_WIDTH);
        fadeAnim.setValue(0);
        
        // Animation d'entrée
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          })
        ]).start();
      });
    }
  };

  const currentSlideData = slides[currentSlide];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0D0D0F" />
        
        <LinearGradient
          colors={currentSlideData.gradient}
          style={styles.gradient}
        >
        {/* Logo fixe en haut */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="star" size={20} color="#FFFFFF" />
            <Text style={styles.logoText}>peak</Text>
          </View>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Contenu animé */}
        <View style={styles.contentContainer}>
          <Animated.View
            style={[
              styles.slideContainer,
              {
                transform: [{ translateX: slideAnim }],
                opacity: fadeAnim,
              }
            ]}
          >
            {/* Illustration */}
            {currentSlideData.illustration}

            {/* Titre */}
            <Text style={styles.title}>{currentSlideData.title}</Text>
            
            {/* Description */}
            <Text style={styles.description}>{currentSlideData.description}</Text>
          </Animated.View>
        </View>

        {/* Indicateurs de progression */}
        <View style={styles.progressContainer}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressBar,
                index === currentSlide && styles.progressBarActive
              ]}
            />
          ))}
        </View>

        {/* Bouton fixe en bas */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={goToNextSlide}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>{currentSlideData.buttonText}</Text>
            <Ionicons 
              name={currentSlide === slides.length - 1 ? "checkmark" : "arrow-forward"} 
              size={20} 
              color="#000000" 
            />
          </TouchableOpacity>
        </View>
        </LinearGradient>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0F',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 8,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  slideContainer: {
    alignItems: 'center',
    width: SCREEN_WIDTH - 64,
  },
  illustrationContainer: {
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 34,
  },
  description: {
    fontSize: 16,
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.9,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  progressBar: {
    width: 24,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  progressBarActive: {
    backgroundColor: '#FFFFFF',
  },
  buttonContainer: {
    paddingHorizontal: 32,
    paddingBottom: 48,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#FFFFFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Styles pour les illustrations
  mockupContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    width: 280,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  mockupHeader: {
    marginBottom: 16,
  },
  mockupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  mockupSubtitle: {
    fontSize: 14,
    color: '#AAAAAA',
  },
  mockupSets: {
    gap: 12,
    marginBottom: 16,
  },
  mockupSet: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    position: 'relative',
  },
  mockupSetContent: {
    flexDirection: 'row',
    gap: 16,
  },
  mockupSetText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  mockupCheckmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockupPRBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#9B93E4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  mockupPRText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000000',
  },
  mockupRestTimer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
  },
  mockupRestText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  mockupPauseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Styles pour les stickers
  stickersContainer: {
    width: 300,
    height: 200,
    position: 'relative',
  },
  sticker: {
    position: 'absolute',
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  stickerPR: {
    backgroundColor: '#9B93E4',
    top: 20,
    left: 50,
    width: 60,
    height: 60,
  },
  stickerLightning: {
    backgroundColor: '#FFD54D',
    top: 40,
    right: 60,
    width: 50,
    height: 50,
  },
  stickerFire: {
    backgroundColor: '#FF6B35',
    bottom: 60,
    left: 30,
    width: 55,
    height: 55,
  },
  stickerBubble: {
    backgroundColor: '#FF3B30',
    top: 80,
    right: 20,
    width: 50,
    height: 50,
  },
  stickerStar: {
    backgroundColor: '#4CAF50',
    bottom: 20,
    right: 40,
    width: 45,
    height: 45,
  },
  stickerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
    marginTop: 4,
  },
  stickerBubbleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  
  // Styles pour les cartes
  cardsContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-end',
  },
  workoutCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardLeft: {
    width: 80,
    height: 100,
  },
  cardCenter: {
    width: 90,
    height: 120,
  },
  cardRight: {
    width: 80,
    height: 100,
  },
  cardImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 10,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  cardBadges: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  cardBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgePR: {
    backgroundColor: '#9B93E4',
  },
  badgePercent: {
    backgroundColor: '#FFD54D',
  },
  badgeRed: {
    backgroundColor: '#FF3B30',
  },
  badgeGreen: {
    backgroundColor: '#4CAF50',
  },
  cardBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#000000',
  },
});
