import React, { useState } from 'react';
import { Modal, Animated, View, StyleSheet } from 'react-native';
import { SplashScreen } from './SplashScreen';
import { OnboardingCarouselScreen } from './OnboardingCarouselScreen';
import { ProfileSetupScreen } from './ProfileSetupScreen';
import { ProfileSuccessScreen } from './ProfileSuccessScreen';
import UserProfileService, { UserProfile } from '../../services/userProfileService';
import logger from '../../utils/logger';

interface NewOnboardingNavigatorProps {
  visible: boolean;
  onComplete: (profile: UserProfile) => void;
}

type OnboardingStep =
  | 'splash'
  | 'carousel'
  | 'profile'
  | 'profileSuccess';

export const NewOnboardingNavigator: React.FC<NewOnboardingNavigatorProps> = ({
  visible,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('splash');
  const [profileData, setProfileData] = useState<{
    firstName?: string;
    profilePhotoUri?: string;
  }>({});
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const overlayAnim = React.useRef(new Animated.Value(0)).current;

  // Réinitialiser l'état quand le modal devient visible
  React.useEffect(() => {
    if (visible) {
      setCurrentStep('splash');
      setProfileData({});
      overlayAnim.setValue(0);
      // Fade in au début
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const handleSplashComplete = () => {
    setCurrentStep('carousel');
  };

  const handleCarouselComplete = () => {
    setCurrentStep('profile');
  };

  const handleProfileComplete = async (firstName: string, profilePhotoUri?: string) => {
    setProfileData({ firstName, profilePhotoUri });
    setCurrentStep('profileSuccess');
  };

  const handleProfileSuccessComplete = async () => {
    // Fade out avec overlay noir
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false, // backgroundColor ne peut pas utiliser useNativeDriver
      }),
    ]).start(async () => {
      try {
        // Créer le profil utilisateur avec les données collectées
        const profile: UserProfile = {
          firstName: profileData.firstName || 'User',
          fitnessLevel: 'beginner',
          primaryGoal: 'progress',
          onboardingCompleted: true,
          createdAt: new Date().toISOString(),
          personalRecords: {},
          profilePhotoUri: profileData.profilePhotoUri,
        };

        await UserProfileService.saveUserProfile(profile);
        onComplete(profile);
      } catch (error) {
        logger.error('❌ Error completing onboarding:', error);
        // En cas d'erreur, on crée quand même un profil minimal
        const fallbackProfile: UserProfile = {
          firstName: profileData.firstName || 'User',
          fitnessLevel: 'beginner',
          primaryGoal: 'progress',
          onboardingCompleted: true,
          createdAt: new Date().toISOString(),
          personalRecords: {},
          profilePhotoUri: profileData.profilePhotoUri,
        };
        await UserProfileService.saveUserProfile(fallbackProfile);
        onComplete(fallbackProfile);
      }
    });
  };

  const renderCurrentScreen = () => {
    switch (currentStep) {
      case 'splash':
        return <SplashScreen onComplete={handleSplashComplete} />;

      case 'carousel':
        return <OnboardingCarouselScreen onComplete={handleCarouselComplete} />;

      case 'profile':
        return (
          <ProfileSetupScreen
            onContinue={handleProfileComplete}
          />
        );

      case 'profileSuccess':
        return (
          <ProfileSuccessScreen onContinue={handleProfileSuccessComplete} />
        );

      default:
        return <SplashScreen onComplete={handleSplashComplete} />;
    }
  };

  const overlayOpacity = overlayAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      transparent={false}
    >
      <View style={{ flex: 1, backgroundColor: '#0D0D0F' }}>
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          {renderCurrentScreen()}
        </Animated.View>
        {/* Overlay noir pour le fade out */}
        <Animated.View
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: '#0D0D0F',
            opacity: overlayOpacity,
            zIndex: 1000,
          }}
          pointerEvents="none"
        />
      </View>
    </Modal>
  );
};
