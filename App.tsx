import React, { useEffect } from 'react';
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

// Composant interne pour gérer la validation des streaks après le chargement des données
const AppContent: React.FC = () => {
  return (
    <StreakProvider>
      <WorkoutHistoryProvider>
        <ActiveWorkoutProvider>
          <RestTimerProvider>
            <SafeAreaProvider>
              <StreakValidator />
              <StatusBar style="light" />
              <AppNavigator />
            </SafeAreaProvider>
          </RestTimerProvider>
        </ActiveWorkoutProvider>
      </WorkoutHistoryProvider>
    </StreakProvider>
  );
};

export default function App() {
  useEffect(() => {
    // Charger les données initiales au démarrage de l'application
    store.dispatch(loadInitialData());
  }, []);

  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}
