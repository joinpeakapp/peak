import React, { useState, useEffect, useRef } from 'react';
import { ImageBackground, ImageBackgroundProps, ActivityIndicator, View, StyleSheet } from 'react-native';

interface CachedImageBackgroundProps extends Omit<ImageBackgroundProps, 'source'> {
  uri: string;
  placeholder?: React.ReactNode;
  fallbackUri?: string;
  showLoader?: boolean;
}

// Utiliser le même cache que CachedImage
const imageCache = new Map<string, { 
  loaded: boolean; 
  error: boolean; 
  timestamp: number;
}>();

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export const CachedImageBackground: React.FC<CachedImageBackgroundProps> = ({
  uri,
  placeholder,
  fallbackUri,
  showLoader = false, // Par défaut false pour les backgrounds
  style,
  children,
  ...imageProps
}) => {
  const [isLoading, setIsLoading] = useState(() => {
    const cached = imageCache.get(uri);
    return !cached?.loaded;
  });
  const [hasError, setHasError] = useState(() => {
    const cached = imageCache.get(uri);
    return cached?.error || false;
  });
  
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!uri) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    // Vérifier le cache
    const cached = imageCache.get(uri);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp < CACHE_DURATION)) {
      // Image en cache et valide
      if (mountedRef.current) {
        setIsLoading(false);
        setHasError(cached.error);
      }
      return;
    }

    // Précharger l'image avec Image.prefetch directement
    const { Image } = require('react-native');
    Image.prefetch(uri)
      .then(() => {
        if (mountedRef.current) {
          imageCache.set(uri, { loaded: true, error: false, timestamp: now });
          setIsLoading(false);
          setHasError(false);
        }
      })
      .catch(() => {
        if (mountedRef.current) {
          imageCache.set(uri, { loaded: false, error: true, timestamp: now });
          setIsLoading(false);
          setHasError(true);
        }
      });
  }, [uri]);

  const handleImageLoad = () => {
    if (mountedRef.current) {
      const now = Date.now();
      imageCache.set(uri, { loaded: true, error: false, timestamp: now });
      setIsLoading(false);
      setHasError(false);
    }
  };

  const handleImageError = () => {
    if (mountedRef.current) {
      const now = Date.now();
      imageCache.set(uri, { loaded: false, error: true, timestamp: now });
      setIsLoading(false);
      setHasError(true);
    }
  };

  // En cas d'erreur et fallback disponible
  if (hasError && fallbackUri) {
    return (
      <CachedImageBackground
        {...imageProps}
        uri={fallbackUri}
        style={style}
        showLoader={showLoader}
      >
        {children}
      </CachedImageBackground>
    );
  }

  // En cas d'erreur sans fallback, afficher un background par défaut
  if (hasError) {
    return (
      <View style={[style, styles.errorContainer]}>
        {children}
      </View>
    );
  }

  return (
    <View style={style}>
      <ImageBackground
        {...imageProps}
        source={{ uri }}
        style={style}
        onLoad={handleImageLoad}
        onError={handleImageError}
      >
        {children}
      </ImageBackground>
      {isLoading && showLoader && (
        <View style={styles.loadingOverlay}>
          {placeholder || (
            <ActivityIndicator 
              size="small" 
              color="rgba(255, 255, 255, 0.5)" 
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1,
  },
  errorContainer: {
    backgroundColor: '#242526', // Couleur de fallback
  },
});
