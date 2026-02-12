import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Image,
} from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { AppPreloadService } from '../../services/appPreloadService';

interface AppLoadingScreenProps {
  onLoadingComplete?: () => void;
}

const MAX_LOADING_TIME = 5000; // 5 secondes maximum (fallback sécurité)
const PRELOAD_CHECK_INTERVAL = 100; // Vérifier toutes les 100ms

export const AppLoadingScreen: React.FC<AppLoadingScreenProps> = ({
  onLoadingComplete,
}) => {
  // Cacher le splash screen natif dès que notre écran de chargement custom est monté
  // Les deux ont le même look, donc la transition est invisible
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {
      // Silencieux - le splash peut déjà être caché
    });
  }, []);

  useEffect(() => {
    // Vérifier périodiquement si le préchargement est terminé
    const preloadCheckInterval = setInterval(() => {
      if (AppPreloadService.isDataPreloaded) {
        clearInterval(preloadCheckInterval);
        // Fermer immédiatement quand le préchargement est terminé
        onLoadingComplete?.();
      }
    }, PRELOAD_CHECK_INTERVAL);

    // Fallback : fermer après 5s max même si préchargement pas terminé
    const maxTimeTimer = setTimeout(() => {
      console.warn('[AppLoadingScreen] Max loading time reached, closing splash');
      clearInterval(preloadCheckInterval);
      onLoadingComplete?.();
    }, MAX_LOADING_TIME);

    return () => {
      clearInterval(preloadCheckInterval);
      clearTimeout(maxTimeTimer);
    };
  }, [onLoadingComplete]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require('../../../assets/splash-icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
  },
});
