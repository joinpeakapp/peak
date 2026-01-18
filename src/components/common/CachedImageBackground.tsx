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
  // Vérifier le cache immédiatement pour initialiser correctement l'état
  const initialCacheState = imageCache.get(uri);
  const now = Date.now();
  const isCached = initialCacheState && (now - initialCacheState.timestamp < CACHE_DURATION);
  
  const [isLoading, setIsLoading] = useState(() => {
    // Si l'image est déjà en cache et chargée, ne pas mettre isLoading à true
    if (isCached && initialCacheState.loaded) {
      return false;
    }
    return true;
  });
  
  const [hasError, setHasError] = useState(() => {
    return isCached ? (initialCacheState.error || false) : false;
  });
  
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Plus de prefetch dans useEffect - on laisse le composant Image gérer le chargement
  // Le cache sera mis à jour via onLoad/onError
  useEffect(() => {
    if (!uri) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    // Vérifier le cache au montage et à chaque changement d'URI
    const cached = imageCache.get(uri);
    const currentTime = Date.now();
    
    if (cached && (currentTime - cached.timestamp < CACHE_DURATION)) {
      // Image en cache et valide - mettre à jour l'état immédiatement
      if (mountedRef.current) {
        setIsLoading(!cached.loaded);
        setHasError(cached.error);
      }
    }
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
