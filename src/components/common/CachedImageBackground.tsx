import React, { useState, useEffect, useRef } from 'react';
import { ImageBackground, ImageBackgroundProps, ActivityIndicator, View, StyleSheet, Image } from 'react-native';
import { imageCache, CACHE_DURATION } from './CachedImage';

interface CachedImageBackgroundProps extends Omit<ImageBackgroundProps, 'source'> {
  uri: string;
  placeholder?: React.ReactNode;
  fallbackUri?: string;
  showLoader?: boolean;
  horizontalFlip?: boolean; // Appliquer une symétrie horizontale à l'image
  workout?: { isFrontCamera?: boolean }; // Objet workout pour déterminer le flip automatiquement
}

export const CachedImageBackground: React.FC<CachedImageBackgroundProps> = ({
  uri,
  placeholder,
  fallbackUri,
  showLoader = false, // Par défaut false pour les backgrounds
  horizontalFlip = false, // Par défaut pas de flip
  workout,
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

  // Déterminer si le flip doit être appliqué
  const shouldFlip = horizontalFlip || (workout?.isFrontCamera === true);

  // En cas d'erreur et fallback disponible
  if (hasError && fallbackUri) {
    return (
      <CachedImageBackground
        {...imageProps}
        uri={fallbackUri}
        style={style}
        showLoader={showLoader}
        horizontalFlip={horizontalFlip}
        workout={workout}
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
      {/* Image de fond avec flip optionnel */}
      <Image
        {...imageProps}
        source={{ uri }}
        style={[
          StyleSheet.absoluteFillObject,
          shouldFlip && { transform: [{ scaleX: -1 }] }
        ]}
        onLoad={handleImageLoad}
        onError={handleImageError}
        resizeMode={imageProps.resizeMode || 'cover'}
      />
      {/* Contenu par-dessus l'image, sans flip */}
      <View style={StyleSheet.absoluteFillObject}>
        {children}
      </View>
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
