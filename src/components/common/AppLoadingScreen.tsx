import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Image,
} from 'react-native';

interface AppLoadingScreenProps {
  onLoadingComplete?: () => void;
}

export const AppLoadingScreen: React.FC<AppLoadingScreenProps> = ({
  onLoadingComplete,
}) => {
  useEffect(() => {
    // Simuler le temps de chargement minimum
    const timer = setTimeout(() => {
      onLoadingComplete?.();
    }, 2500); // 2.5 secondes minimum

    return () => clearTimeout(timer);
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
