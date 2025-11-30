import React, { useState, useEffect, useRef } from 'react';
import { Image, ImageProps, ActivityIndicator, View, StyleSheet } from 'react-native';

interface CachedImageProps extends Omit<ImageProps, 'source'> {
  uri: string;
  placeholder?: React.ReactNode;
  fallbackUri?: string;
  showLoader?: boolean;
  horizontalFlip?: boolean; // Appliquer une symétrie horizontale à l'image
  workout?: { isFrontCamera?: boolean }; // Objet workout pour déterminer le flip automatiquement
}

// Cache global partagé pour les images (utilisé par CachedImage et CachedImageBackground)
export const imageCache = new Map<string, { 
  loaded: boolean; 
  error: boolean; 
  timestamp: number;
}>();

// Durée de vie du cache (30 minutes)
export const CACHE_DURATION = 30 * 60 * 1000;

// Nettoyer le cache périodiquement
const cleanupCache = () => {
  const now = Date.now();
  for (const [key, value] of imageCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      imageCache.delete(key);
    }
  }
};

// Nettoyer le cache toutes les 10 minutes
setInterval(cleanupCache, 10 * 60 * 1000);

export const CachedImage: React.FC<CachedImageProps> = ({
  uri,
  placeholder,
  fallbackUri,
  showLoader = true,
  horizontalFlip = false, // Par défaut pas de flip
  workout,
  style,
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

    // Précharger l'image pour vérifier qu'elle existe
    const imageToPreload = Image.resolveAssetSource({ uri });
    if (imageToPreload) {
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

  // En cas d'erreur et fallback disponible
  if (hasError && fallbackUri) {
    return (
      <CachedImage
        {...imageProps}
        uri={fallbackUri}
        style={style}
        showLoader={showLoader}
        horizontalFlip={horizontalFlip}
        workout={workout}
      />
    );
  }

  // En cas d'erreur sans fallback
  if (hasError) {
    return (
      <View style={[style, styles.errorContainer]}>
        {placeholder}
      </View>
    );
  }

  // Déterminer si le flip doit être appliqué
  const shouldFlip = horizontalFlip || (workout?.isFrontCamera === true);

  // Créer le style avec flip horizontal si nécessaire
  const imageStyle = [
    style,
    shouldFlip && { transform: [{ scaleX: -1 }] }
  ];

  return (
    <View style={style}>
      <Image
        {...imageProps}
        source={{ uri }}
        style={imageStyle}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});

// Export des utilitaires de cache
export const ImageCacheUtils = {
  preloadImages: async (uris: string[]): Promise<void> => {
    const promises = uris.map(uri => {
      const cached = imageCache.get(uri);
      const now = Date.now();
      
      // Skip si déjà en cache et valide
      if (cached && (now - cached.timestamp < CACHE_DURATION)) {
        return Promise.resolve();
      }
      
      return Image.prefetch(uri)
        .then(() => {
          imageCache.set(uri, { loaded: true, error: false, timestamp: now });
        })
        .catch(() => {
          imageCache.set(uri, { loaded: false, error: true, timestamp: now });
        });
    });
    
    await Promise.all(promises);
  },
  
  clearCache: (): void => {
    imageCache.clear();
  },
  
  getCacheSize: (): number => {
    return imageCache.size;
  }
};
