import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { store } from './src/store';
import { AppNavigator } from './src/navigation/AppNavigator';
import { loadInitialData } from './src/store/slices/workoutSlice';

export default function App() {
  useEffect(() => {
    // Charger les données initiales au démarrage de l'application
    store.dispatch(loadInitialData());
  }, []);

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </SafeAreaProvider>
    </Provider>
  );
}
