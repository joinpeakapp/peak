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

// Durée de vie du cache (1 heure pour éviter les rechargements fréquents)
export const CACHE_DURATION = 60 * 60 * 1000;

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
    const now = Date.now();
    
    // Filtrer les URIs valides et non déjà en cache
    const urisToLoad = uris.filter(uri => {
      if (!uri || uri.includes('placeholder')) return false;
      
      const cached = imageCache.get(uri);
      // Skip si déjà en cache, chargé et valide
      if (cached && cached.loaded && (now - cached.timestamp < CACHE_DURATION)) {
        return false;
      }
      return true;
    });
    
    if (urisToLoad.length === 0) {
      console.log('[ImageCacheUtils] All images already cached');
      return;
    }
    
    console.log(`[ImageCacheUtils] Preloading ${urisToLoad.length} images...`);
    
    // Précharger en parallèle avec un batch pour éviter de surcharger le système
    const BATCH_SIZE = 10;
    const batches: string[][] = [];
    
    for (let i = 0; i < urisToLoad.length; i += BATCH_SIZE) {
      batches.push(urisToLoad.slice(i, i + BATCH_SIZE));
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const batch of batches) {
      const promises = batch.map(uri => 
        Image.prefetch(uri)
          .then(() => {
            imageCache.set(uri, { loaded: true, error: false, timestamp: now });
            successCount++;
          })
          .catch((error) => {
            console.warn(`[ImageCacheUtils] Failed to preload image: ${uri}`, error);
            imageCache.set(uri, { loaded: false, error: true, timestamp: now });
            errorCount++;
          })
      );
      
      await Promise.allSettled(promises);
    }
    
    console.log(`[ImageCacheUtils] Preload complete: ${successCount} success, ${errorCount} errors`);
  },
  
  clearCache: (): void => {
    imageCache.clear();
    console.log('[ImageCacheUtils] Cache cleared');
  },
  
  getCacheSize: (): number => {
    return imageCache.size;
  },
  
  getCacheStats: (): { total: number; loaded: number; errors: number } => {
    let loaded = 0;
    let errors = 0;
    
    for (const [, value] of imageCache.entries()) {
      if (value.loaded) loaded++;
      if (value.error) errors++;
    }
    
    return {
      total: imageCache.size,
      loaded,
      errors,
    };
  },
};
