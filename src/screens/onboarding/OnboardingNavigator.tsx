import React, { useState } from 'react';
import { Modal } from 'react-native';
import { WelcomeScreen } from './WelcomeScreen';
import { NameScreen } from './NameScreen';
import { FitnessLevelScreen } from './FitnessLevelScreen';
import { GoalScreen } from './GoalScreen';
import UserProfileService, { OnboardingData, UserProfile } from '../../services/userProfileService';

interface OnboardingNavigatorProps {
  visible: boolean;
  onComplete: (profile: UserProfile) => void;
}

type OnboardingStep = 'welcome' | 'name' | 'fitness' | 'goal';

export const OnboardingNavigator: React.FC<OnboardingNavigatorProps> = ({
  visible,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({});
  const [isCompleting, setIsCompleting] = useState(false);

  // Navigation handlers
  const goToNextStep = () => {
    switch (currentStep) {
      case 'welcome':
        setCurrentStep('name');
        break;
      case 'name':
        setCurrentStep('fitness');
        break;
      case 'fitness':
        setCurrentStep('goal');
        break;
      default:
        break;
    }
  };

  const goToPreviousStep = () => {
    switch (currentStep) {
      case 'name':
        setCurrentStep('welcome');
        break;
      case 'fitness':
        setCurrentStep('name');
        break;
      case 'goal':
        setCurrentStep('fitness');
        break;
      default:
        break;
    }
  };

  // Data collection handlers
  const handleNameSubmit = (firstName: string) => {
    setOnboardingData(prev => ({ ...prev, firstName }));
    goToNextStep();
  };

  const handleFitnessLevelSubmit = (fitnessLevel: UserProfile['fitnessLevel']) => {
    setOnboardingData(prev => ({ ...prev, fitnessLevel }));
    goToNextStep();
  };

  const handleGoalSubmit = async (primaryGoal: UserProfile['primaryGoal']) => {
    setIsCompleting(true);
    
    try {
      const updatedData = { ...onboardingData, primaryGoal };
      const profile = await UserProfileService.completeOnboarding(updatedData);
      
      onComplete(profile);
    } catch (error) {
      console.error('❌ Error completing onboarding:', error);
      // En cas d'erreur, on reste sur l'écran actuel
      setIsCompleting(false);
    }
  };

  const renderCurrentScreen = () => {
    if (isCompleting) {
      // On pourrait afficher un loader ici
      return null;
    }

    switch (currentStep) {
      case 'welcome':
        return <WelcomeScreen onContinue={goToNextStep} />;
      
      case 'name':
        return (
          <NameScreen 
            onContinue={handleNameSubmit}
            onBack={goToPreviousStep}
          />
        );
      
      case 'fitness':
        return (
          <FitnessLevelScreen 
            onContinue={handleFitnessLevelSubmit}
            onBack={goToPreviousStep}
          />
        );
      
      case 'goal':
        return (
          <GoalScreen 
            onComplete={handleGoalSubmit}
            onBack={goToPreviousStep}
          />
        );
      
      default:
        return <WelcomeScreen onContinue={goToNextStep} />;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      {renderCurrentScreen()}
    </Modal>
  );
}; 