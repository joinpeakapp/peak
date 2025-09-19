import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { store } from './src/store';
import { AppNavigator } from './src/navigation/AppNavigator';
import { loadInitialData } from './src/store/slices/workoutSlice';
import { ActiveWorkoutProvider } from './src/workout/contexts/ActiveWorkoutContext';
import { RestTimerProvider } from './src/workout/contexts/RestTimerContext';
import { StreakProvider, useStreak } from './src/workout/contexts/StreakContext';
import { WorkoutHistoryProvider } from './src/workout/contexts/WorkoutHistoryContext';
import { useSelector } from 'react-redux';
import { RootState } from './src/store';
import { ErrorBoundary } from './src/components/common/ErrorBoundary';
import { RobustStorageService } from './src/services/storage';
import { OnboardingNavigator } from './src/screens/onboarding/OnboardingNavigator';
import UserProfileService, { UserProfile } from './src/services/userProfileService';

// Composant pour valider les streaks au démarrage
const StreakValidator: React.FC = () => {
  const { validateAllStreaks } = useStreak();
  const workouts = useSelector((state: RootState) => state.workout.workouts);
  const loading = useSelector((state: RootState) => state.workout.loading);

  useEffect(() => {
    // Ne valider les streaks qu'une fois les workouts chargés (loading = false)
    if (!loading && workouts.length > 0) {
      console.log('[App] Starting streak validation on app startup...');
      validateAllStreaks(workouts);
    }
  }, [loading, workouts, validateAllStreaks]);

  return null; // Ce composant ne rend rien visuellement
};

// Composant interne pour gérer l'onboarding et l'app principale
const AppContent: React.FC = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Vérifier si l'onboarding a été complété
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const isCompleted = await UserProfileService.isOnboardingCompleted();
        const profile = await UserProfileService.getUserProfile();
        
        console.log('[App] Onboarding status:', { isCompleted, profile });
        
        setUserProfile(profile);
        setShowOnboarding(!isCompleted);
        setOnboardingChecked(true);
      } catch (error) {
        console.error('[App] Error checking onboarding status:', error);
        // En cas d'erreur, on considère que l'onboarding n'est pas fait
        setShowOnboarding(true);
        setOnboardingChecked(true);
      }
    };

    checkOnboardingStatus();
  }, []);

  // Handler pour terminer l'onboarding
  const handleOnboardingComplete = (profile: UserProfile) => {
    console.log('[App] Onboarding completed:', profile);
    setUserProfile(profile);
    setShowOnboarding(false);
  };

  // Ne rien afficher tant qu'on n'a pas vérifié le statut d'onboarding
  if (!onboardingChecked) {
    return null; // On pourrait afficher un splash screen ici
  }

  return (
    <ErrorBoundary>
      <StreakProvider>
        <WorkoutHistoryProvider>
          <ActiveWorkoutProvider>
            <RestTimerProvider>
              <SafeAreaProvider>
                <StreakValidator />
                <StatusBar style="light" />
                <AppNavigator />
                
                {/* Onboarding Modal */}
                <OnboardingNavigator
                  visible={showOnboarding}
                  onComplete={handleOnboardingComplete}
                />
              </SafeAreaProvider>
            </RestTimerProvider>
          </ActiveWorkoutProvider>
        </WorkoutHistoryProvider>
      </StreakProvider>
    </ErrorBoundary>
  );
};

export default function App() {
  useEffect(() => {
    // Initialiser le service de stockage robuste avec migration des données
    const initializeApp = async () => {
      console.log('[App] Initializing storage service...');
      await RobustStorageService.initialize();
      
      // Service d'optimisation d'images supprimé - utilisation d'images natives
      
      // Charger les données initiales après l'initialisation du stockage
      console.log('[App] Loading initial data...');
      store.dispatch(loadInitialData());
    };

    initializeApp();
  }, []);

  return (
    <ErrorBoundary>
      <Provider store={store}>
        <AppContent />
      </Provider>
    </ErrorBoundary>
  );
}
