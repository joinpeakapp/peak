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
import { WorkoutCreationProvider } from './src/contexts/WorkoutCreationContext';
import { useSelector } from 'react-redux';
import { RootState } from './src/store';
import { ErrorBoundary } from './src/components/common/ErrorBoundary';
import { RobustStorageService } from './src/services/storage';
import { NewOnboardingNavigator } from './src/screens/onboarding/NewOnboardingNavigator';
import UserProfileService, { UserProfile } from './src/services/userProfileService';
import NotificationService from './src/services/notificationService';
import { AppLoadingScreen } from './src/components/common/AppLoadingScreen';
import { AppPreloadService } from './src/services/appPreloadService';
import { FadeTransition } from './src/components/common/FadeTransition';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import logger from './src/utils/logger';
import { NotificationPermissionBottomSheet } from './src/components/common/NotificationPermissionBottomSheet';
import { useFirstWorkoutTracker } from './src/hooks/useFirstWorkoutTracker';
import { AppResetProvider, useAppReset } from './src/contexts/AppResetContext';
import * as SplashScreen from 'expo-splash-screen';

// Empêcher le splash screen natif de se cacher automatiquement
SplashScreen.preventAutoHideAsync().catch(() => {
  // Le catch silencieux est intentionnel - sur certaines configs le splash peut déjà être caché
});

// Composant pour valider les streaks au démarrage
const StreakValidator: React.FC = () => {
  const { validateAllStreaks } = useStreak();
  const workouts = useSelector((state: RootState) => state.workout.workouts);
  const loading = useSelector((state: RootState) => state.workout.loading);

  useEffect(() => {
    // Ne valider les streaks qu'une fois les workouts chargés (loading = false)
    if (!loading && workouts.length > 0) {
      logger.log('[App] Starting streak validation on app startup...');
      validateAllStreaks(workouts);
    }
  }, [loading, workouts, validateAllStreaks]);

  return null; // Ce composant ne rend rien visuellement
};

// Composant interne pour gérer l'onboarding et l'app principale
const AppContent: React.FC = () => {
  const { resetKey } = useAppReset();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [appInitialized, setAppInitialized] = useState(false);

  // Hook pour tracker le premier workout et afficher le bottom sheet notifications
  const { showNotificationModal, closeNotificationModal } = useFirstWorkoutTracker();

  // Charger les fonts Poppins
  const [fontsLoaded] = useFonts({
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
  });

  // Initialiser l'app avec préchargement des données
  useEffect(() => {
    const initializeApp = async () => {
      try {
        logger.log('[App] Starting app initialization...');
        
        // 1. Vérifier le statut d'onboarding
        const isCompleted = await UserProfileService.isOnboardingCompleted();
        const profile = await UserProfileService.getUserProfile();
        
        logger.log('[App] Onboarding status:', { isCompleted, profile });
        
        setUserProfile(profile);
        setShowOnboarding(!isCompleted);
        setOnboardingChecked(true);
        
        // 2. Précharger les données de l'app si l'onboarding est complété
        if (isCompleted && profile) {
          logger.log('[App] Starting data preload...');
          // Précharger en parallèle avec l'initialisation
          AppPreloadService.preloadAppData().catch(logger.warn);
        }
        
        setAppInitialized(true);
        logger.log('[App] ✅ App initialization completed');
      } catch (error) {
        logger.error('[App] Error during app initialization:', error);
        // En cas d'erreur, on considère que l'onboarding n'est pas fait
        setShowOnboarding(true);
        setOnboardingChecked(true);
        setAppInitialized(true);
      }
    };

    initializeApp();
  }, [resetKey]); // Re-initialiser quand resetKey change

  // Handler pour terminer l'onboarding
  const handleOnboardingComplete = async (profile: UserProfile) => {
    logger.log('[App] Onboarding completed:', profile);
    setUserProfile(profile);
    // Le fade out est géré dans NewOnboardingNavigator
    setShowOnboarding(false);
    
    // Précharger les données après l'onboarding
    logger.log('[App] Starting data preload after onboarding...');
    AppPreloadService.preloadAppData().catch(logger.warn);
  };

  // Handler pour terminer le loading screen
  const handleLoadingComplete = () => {
    setIsAppLoading(false);
  };

  const showLoadingScreen = !appInitialized || !fontsLoaded || (isAppLoading && onboardingChecked && !showOnboarding);
  const showMainApp = appInitialized && fontsLoaded && !isAppLoading && onboardingChecked;

  return (
    <ErrorBoundary>
      {/* App principale toujours présente */}
      <WorkoutCreationProvider>
        <StreakProvider>
          <WorkoutHistoryProvider>
            <ActiveWorkoutProvider>
              <RestTimerProvider>
                <SafeAreaProvider>
                  <StreakValidator />
                  <StatusBar style="light" />
                  <AppNavigator />
                  
                  {/* Onboarding Modal */}
                  <NewOnboardingNavigator
                    visible={showOnboarding}
                    onComplete={handleOnboardingComplete}
                  />
                </SafeAreaProvider>
              </RestTimerProvider>
            </ActiveWorkoutProvider>
          </WorkoutHistoryProvider>
        </StreakProvider>
      </WorkoutCreationProvider>

      {/* Loading Screen en overlay avec transition */}
      <FadeTransition 
        visible={showLoadingScreen}
        duration={500}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}
      >
        <AppLoadingScreen onLoadingComplete={handleLoadingComplete} />
      </FadeTransition>

      {/* Notification Permission Bottom Sheet - apparaît après création du premier workout */}
      {/* S'assurer qu'il s'affiche au-dessus du loading screen */}
      <NotificationPermissionBottomSheet
        visible={showNotificationModal && !showLoadingScreen}
        onClose={closeNotificationModal}
      />
    </ErrorBoundary>
  );
};

export default function App() {
  useEffect(() => {
    // Initialiser le service de stockage robuste avec migration des données
    const initializeApp = async () => {
      logger.log('[App] Initializing storage service...');
      await RobustStorageService.initialize();
      
      // Initialiser le service de notifications
      logger.log('[App] Initializing notification service...');
      await NotificationService.initialize();
      
      // Charger les données initiales après l'initialisation du stockage
      logger.log('[App] Loading initial data...');
      store.dispatch(loadInitialData());
    };

    initializeApp();
  }, []);

  return (
    <ErrorBoundary>
      <Provider store={store}>
        <AppResetProvider>
          <AppContent />
        </AppResetProvider>
      </Provider>
    </ErrorBoundary>
  );
}
