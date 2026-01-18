import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Animated,
} from 'react-native';
import { usePreload } from '../../contexts/PreloadContext';

interface AppLoadingScreenProps {
  onLoadingComplete?: () => void;
}

export const AppLoadingScreen: React.FC<AppLoadingScreenProps> = ({
  onLoadingComplete,
}) => {
  const { state } = usePreload();
  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  // Gérer la complétion du chargement
  useEffect(() => {
    if (!state.isPreloading && state.progress === 100) {
      // Fade out rapide avant de fermer
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        onLoadingComplete?.();
      });
    }
  }, [state.isPreloading, state.progress, fadeAnim, onLoadingComplete]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.logoContainer}>
        <Image
          source={require('../../../assets/splash-icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    </Animated.View>
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
