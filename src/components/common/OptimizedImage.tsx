import React, { useState, useEffect } from 'react';
import { Image, ImageProps, ActivityIndicator, View, StyleSheet } from 'react-native';
import ImageOptimizationService from '../../services/imageOptimizationService';

interface OptimizedImageProps extends Omit<ImageProps, 'source'> {
  uri: string;
  thumbnail?: boolean; // Si true, utilise l'optimisation miniature
  placeholder?: React.ReactNode; // Placeholder pendant le chargement
  fallbackUri?: string; // Image de fallback en cas d'erreur
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  uri,
  thumbnail = false,
  placeholder,
  fallbackUri,
  style,
  ...imageProps
}) => {
  const [optimizedUri, setOptimizedUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!uri) {
      setIsLoading(false);
      setHasError(true);
      return;
    }

    const loadOptimizedImage = async () => {
      setIsLoading(true);
      setHasError(false);

      try {
        // Utiliser le service d'optimisation approprié
        const processedUri = thumbnail 
          ? await ImageOptimizationService.optimizeThumbnail(uri)
          : await ImageOptimizationService.optimizeImage(uri, {
              maxWidth: 800,
              maxHeight: 1200,
              quality: 0.8,
              shouldCache: true,
            });
        
        setOptimizedUri(processedUri);
      } catch (error) {
        console.error('🖼️ [OptimizedImage] Error loading optimized image:', error);
        setHasError(true);
        // En cas d'erreur, utiliser l'URI original
        setOptimizedUri(uri);
      } finally {
        setIsLoading(false);
      }
    };

    loadOptimizedImage();
  }, [uri, thumbnail]);

  // Pendant le chargement
  if (isLoading) {
    return (
      <View style={[style, styles.loadingContainer]}>
        {placeholder || (
          <ActivityIndicator 
            size="small" 
            color="rgba(255, 255, 255, 0.5)" 
          />
        )}
      </View>
    );
  }

  // En cas d'erreur et fallback disponible
  if (hasError && fallbackUri) {
    return (
      <Image
        {...imageProps}
        source={{ uri: fallbackUri }}
        style={style}
        onError={() => console.error('🖼️ [OptimizedImage] Fallback image also failed to load')}
      />
    );
  }

  // Image optimisée ou originale
  if (optimizedUri) {
    return (
      <Image
        {...imageProps}
        source={{ uri: optimizedUri }}
        style={style}
        onError={() => {
          console.error('🖼️ [OptimizedImage] Optimized image failed to load');
          setHasError(true);
        }}
      />
    );
  }

  // Fallback final : placeholder ou rien
  return (
    <View style={[style, styles.errorContainer]}>
      {placeholder}
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
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