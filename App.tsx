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
import NotificationService from './src/services/notificationService';
import { AppLoadingScreen } from './src/components/common/AppLoadingScreen';
import { AppPreloadService } from './src/services/appPreloadService';
import { FadeTransition } from './src/components/common/FadeTransition';

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
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [appInitialized, setAppInitialized] = useState(false);

  // Initialiser l'app avec préchargement des données
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('[App] Starting app initialization...');
        
        // 1. Vérifier le statut d'onboarding
        const isCompleted = await UserProfileService.isOnboardingCompleted();
        const profile = await UserProfileService.getUserProfile();
        
        console.log('[App] Onboarding status:', { isCompleted, profile });
        
        setUserProfile(profile);
        setShowOnboarding(!isCompleted);
        setOnboardingChecked(true);
        
        // 2. Précharger les données de l'app si l'onboarding est complété
        if (isCompleted && profile) {
          console.log('[App] Starting data preload...');
          // Précharger en parallèle avec l'initialisation
          AppPreloadService.preloadAppData().catch(console.warn);
        }
        
        setAppInitialized(true);
        console.log('[App] ✅ App initialization completed');
      } catch (error) {
        console.error('[App] Error during app initialization:', error);
        // En cas d'erreur, on considère que l'onboarding n'est pas fait
        setShowOnboarding(true);
        setOnboardingChecked(true);
        setAppInitialized(true);
      }
    };

    initializeApp();
  }, []);

  // Handler pour terminer l'onboarding
  const handleOnboardingComplete = async (profile: UserProfile) => {
    console.log('[App] Onboarding completed:', profile);
    setUserProfile(profile);
    setShowOnboarding(false);
    
    // Précharger les données après l'onboarding
    console.log('[App] Starting data preload after onboarding...');
    AppPreloadService.preloadAppData().catch(console.warn);
  };

  // Handler pour terminer le loading screen
  const handleLoadingComplete = () => {
    setIsAppLoading(false);
  };

  const showLoadingScreen = !appInitialized || (isAppLoading && onboardingChecked && !showOnboarding);
  const showMainApp = appInitialized && !isAppLoading && onboardingChecked;

  return (
    <ErrorBoundary>
      {/* App principale toujours présente */}
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

      {/* Loading Screen en overlay avec transition */}
      <FadeTransition 
        visible={showLoadingScreen}
        duration={500}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}
      >
        <AppLoadingScreen onLoadingComplete={handleLoadingComplete} />
      </FadeTransition>
    </ErrorBoundary>
  );
};

export default function App() {
  useEffect(() => {
    // Initialiser le service de stockage robuste avec migration des données
    const initializeApp = async () => {
      console.log('[App] Initializing storage service...');
      await RobustStorageService.initialize();
      
      // Initialiser le service de notifications
      console.log('[App] Initializing notification service...');
      await NotificationService.initialize();
      
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
