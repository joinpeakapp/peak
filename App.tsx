import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { store } from './src/store';
import { AppNavigator } from './src/navigation/AppNavigator';
import { loadInitialData } from './src/store/slices/workoutSlice';
import { ActiveWorkoutProvider } from './src/workout/contexts/ActiveWorkoutContext';
import { RestTimerProvider } from './src/workout/contexts/RestTimerContext';
import { StreakProvider } from './src/workout/contexts/StreakContext';
import { WorkoutHistoryProvider } from './src/workout/contexts/WorkoutHistoryContext';

export default function App() {
  useEffect(() => {
    // Charger les données initiales au démarrage de l'application
    store.dispatch(loadInitialData());
  }, []);

  return (
    <Provider store={store}>
      <StreakProvider>
        <WorkoutHistoryProvider>
      <ActiveWorkoutProvider>
        <RestTimerProvider>
          <SafeAreaProvider>
            <StatusBar style="light" />
            <AppNavigator />
          </SafeAreaProvider>
        </RestTimerProvider>
      </ActiveWorkoutProvider>
        </WorkoutHistoryProvider>
      </StreakProvider>
    </Provider>
  );
}
