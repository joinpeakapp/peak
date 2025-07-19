import { manipulateAsync, SaveFormat, FlipType } from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  shouldCache?: boolean;
  correctOrientation?: boolean;
  flipHorizontal?: boolean; // Pour corriger l'effet miroir
}

interface CachedImage {
  uri: string;
  originalUri: string;
  timestamp: number;
  size: number;
}

const DEFAULT_OPTIONS: Required<ImageOptimizationOptions> = {
  maxWidth: 800,
  maxHeight: 1200,
  quality: 0.8,
  shouldCache: true,
  correctOrientation: true,
  flipHorizontal: false,
};

class ImageOptimizationService {
  private static readonly CACHE_KEY_PREFIX = 'optimized_image_';
  private static readonly CACHE_METADATA_KEY = 'image_cache_metadata';
  private static readonly MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB
  private static readonly MAX_CACHE_AGE = 30 * 24 * 60 * 60 * 1000; // 30 jours

  /**
   * Optimise une image avec compression, redimensionnement et correction d'orientation
   */
  static async optimizeImage(
    imageUri: string, 
    options: ImageOptimizationOptions = {},
    cameraType?: 'front' | 'back'
  ): Promise<string> {
    const finalOptions = { ...DEFAULT_OPTIONS, ...options };
    
    // Pour la caméra frontale, activer automatiquement la correction du miroir
    if (cameraType === 'front') {
      finalOptions.flipHorizontal = true;
    }

    try {
      console.log(`🖼️ [ImageOptimization] Starting optimization for: ${imageUri}`);
      
      // Vérifier le cache d'abord
      if (finalOptions.shouldCache) {
        const cachedUri = await this.getCachedImage(imageUri);
        if (cachedUri) {
          console.log(`🖼️ [ImageOptimization] ✅ Found cached image: ${cachedUri}`);
          return cachedUri;
        }
      }

      // Préparer les actions de manipulation
      const actions = [];

      // 1. Redimensionnement si nécessaire
      if (finalOptions.maxWidth || finalOptions.maxHeight) {
        actions.push({
          resize: {
            width: finalOptions.maxWidth,
            height: finalOptions.maxHeight,
          }
        });
      }

      // 2. Correction de l'orientation (rotation automatique basée sur EXIF)
      if (finalOptions.correctOrientation) {
        // expo-image-manipulator gère automatiquement l'orientation EXIF
        // Pas d'action spécifique nécessaire
      }

      // 3. Correction de l'effet miroir pour caméra frontale
      if (finalOptions.flipHorizontal) {
        actions.push({
          flip: FlipType.Horizontal
        });
      }

      // Appliquer les transformations
      const manipulatedImage = await manipulateAsync(
        imageUri,
        actions,
        {
          compress: finalOptions.quality,
          format: SaveFormat.JPEG,
        }
      );

      console.log(`🖼️ [ImageOptimization] ✅ Image optimized successfully`);
      console.log(`🖼️ [ImageOptimization] Original size: ${await this.getImageSize(imageUri)} bytes`);
      console.log(`🖼️ [ImageOptimization] Optimized size: ${await this.getImageSize(manipulatedImage.uri)} bytes`);

      // Mettre en cache l'image optimisée
      if (finalOptions.shouldCache) {
        await this.cacheImage(imageUri, manipulatedImage.uri);
      }

      return manipulatedImage.uri;
    } catch (error) {
      console.error('🖼️ [ImageOptimization] ❌ Error optimizing image:', error);
      // En cas d'erreur, retourner l'URI original
      return imageUri;
    }
  }

  /**
   * Optimise spécifiquement les photos de workout
   */
  static async optimizeWorkoutPhoto(
    imageUri: string,
    cameraType?: 'front' | 'back'
  ): Promise<string> {
    return this.optimizeImage(imageUri, {
      maxWidth: 800,
      maxHeight: 1200,
      quality: 0.85, // Qualité légèrement supérieure pour les photos importantes
      shouldCache: true,
      correctOrientation: true,
      flipHorizontal: cameraType === 'front', // Correction automatique pour caméra frontale
    }, cameraType);
  }

  /**
   * Optimise les miniatures pour les affichages de liste
   */
  static async optimizeThumbnail(imageUri: string): Promise<string> {
    return this.optimizeImage(imageUri, {
      maxWidth: 300,
      maxHeight: 450,
      quality: 0.7,
      shouldCache: true,
      correctOrientation: true,
    });
  }

  /**
   * Récupère une image du cache
   */
  private static async getCachedImage(originalUri: string): Promise<string | null> {
    try {
      const cacheKey = this.getCacheKey(originalUri);
      const cachedData = await AsyncStorage.getItem(cacheKey);
      
      if (cachedData) {
        const cached: CachedImage = JSON.parse(cachedData);
        
        // Vérifier si le fichier existe toujours
        const fileExists = await FileSystem.getInfoAsync(cached.uri);
        if (fileExists.exists) {
          // Vérifier l'âge du cache
          const now = Date.now();
          if (now - cached.timestamp < this.MAX_CACHE_AGE) {
            return cached.uri;
          }
        }
        
        // Nettoyer le cache expiré ou fichier manquant
        await AsyncStorage.removeItem(cacheKey);
      }
    } catch (error) {
      console.error('🖼️ [ImageOptimization] Error retrieving cached image:', error);
    }
    
    return null;
  }

  /**
   * Met en cache une image optimisée
   */
  private static async cacheImage(originalUri: string, optimizedUri: string): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(originalUri);
      const size = await this.getImageSize(optimizedUri);
      
      const cachedImage: CachedImage = {
        uri: optimizedUri,
        originalUri,
        timestamp: Date.now(),
        size,
      };

      await AsyncStorage.setItem(cacheKey, JSON.stringify(cachedImage));
      
      // Mettre à jour les métadonnées du cache
      await this.updateCacheMetadata(cacheKey, size);
      
      console.log(`🖼️ [ImageOptimization] ✅ Image cached: ${cacheKey}`);
    } catch (error) {
      console.error('🖼️ [ImageOptimization] Error caching image:', error);
    }
  }

  /**
   * Met à jour les métadonnées du cache et nettoie si nécessaire
   */
  private static async updateCacheMetadata(cacheKey: string, size: number): Promise<void> {
    try {
      const metadataString = await AsyncStorage.getItem(this.CACHE_METADATA_KEY);
      const metadata = metadataString ? JSON.parse(metadataString) : {};
      
      metadata[cacheKey] = { size, timestamp: Date.now() };
      
      // Calculer la taille totale du cache
      const totalSize = Object.values(metadata).reduce((sum: number, item: any) => sum + item.size, 0);
      
      // Nettoyer le cache si nécessaire
      if (totalSize > this.MAX_CACHE_SIZE) {
        await this.cleanupCache(metadata);
      } else {
        await AsyncStorage.setItem(this.CACHE_METADATA_KEY, JSON.stringify(metadata));
      }
    } catch (error) {
      console.error('🖼️ [ImageOptimization] Error updating cache metadata:', error);
    }
  }

  /**
   * Nettoie le cache en supprimant les images les plus anciennes
   */
  private static async cleanupCache(metadata: Record<string, any>): Promise<void> {
    try {
      console.log('🖼️ [ImageOptimization] 🧹 Starting cache cleanup...');
      
      // Trier par timestamp (plus ancien en premier)
      const sortedEntries = Object.entries(metadata).sort(
        ([, a], [, b]) => a.timestamp - b.timestamp
      );
      
      let currentSize = Object.values(metadata).reduce((sum: number, item: any) => sum + item.size, 0);
      const newMetadata: Record<string, any> = {};
      
      // Garder les images tant que la taille reste raisonnable
      for (const [cacheKey, data] of sortedEntries.reverse()) {
        if (currentSize <= this.MAX_CACHE_SIZE * 0.8) { // Garder 80% de la limite
          newMetadata[cacheKey] = data;
        } else {
          // Supprimer l'image du cache
          await AsyncStorage.removeItem(cacheKey);
          currentSize -= data.size;
          console.log(`🖼️ [ImageOptimization] 🗑️ Removed from cache: ${cacheKey}`);
        }
      }
      
      await AsyncStorage.setItem(this.CACHE_METADATA_KEY, JSON.stringify(newMetadata));
      console.log(`🖼️ [ImageOptimization] ✅ Cache cleanup completed`);
    } catch (error) {
      console.error('🖼️ [ImageOptimization] Error during cache cleanup:', error);
    }
  }

  /**
   * Efface tout le cache d'images
   */
  static async clearCache(): Promise<void> {
    try {
      console.log('🖼️ [ImageOptimization] 🧹 Clearing entire image cache...');
      
      const metadataString = await AsyncStorage.getItem(this.CACHE_METADATA_KEY);
      const metadata = metadataString ? JSON.parse(metadataString) : {};
      
      // Supprimer toutes les images du cache
      const cacheKeys = Object.keys(metadata);
      await Promise.all(cacheKeys.map(key => AsyncStorage.removeItem(key)));
      
      // Supprimer les métadonnées
      await AsyncStorage.removeItem(this.CACHE_METADATA_KEY);
      
      console.log(`🖼️ [ImageOptimization] ✅ Cache cleared (${cacheKeys.length} items removed)`);
    } catch (error) {
      console.error('🖼️ [ImageOptimization] Error clearing cache:', error);
    }
  }

  /**
   * Obtient les statistiques du cache
   */
  static async getCacheStats(): Promise<{
    itemCount: number;
    totalSize: number;
    oldestItem: number;
    newestItem: number;
  }> {
    try {
      const metadataString = await AsyncStorage.getItem(this.CACHE_METADATA_KEY);
      const metadata = metadataString ? JSON.parse(metadataString) : {};
      
      const items = Object.values(metadata);
      const itemCount = items.length;
      const totalSize = items.reduce((sum: number, item: any) => sum + item.size, 0);
      const timestamps = items.map((item: any) => item.timestamp);
      
      return {
        itemCount,
        totalSize,
        oldestItem: timestamps.length > 0 ? Math.min(...timestamps) : 0,
        newestItem: timestamps.length > 0 ? Math.max(...timestamps) : 0,
      };
    } catch (error) {
      console.error('🖼️ [ImageOptimization] Error getting cache stats:', error);
      return { itemCount: 0, totalSize: 0, oldestItem: 0, newestItem: 0 };
    }
  }

  /**
   * Génère une clé de cache basée sur l'URI original
   */
  private static getCacheKey(uri: string): string {
    // Créer un hash simple de l'URI pour la clé de cache
    const hash = uri.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return `${this.CACHE_KEY_PREFIX}${Math.abs(hash)}`;
  }

  /**
   * Obtient la taille d'un fichier image
   */
  private static async getImageSize(uri: string): Promise<number> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      return fileInfo.exists && 'size' in fileInfo ? fileInfo.size || 0 : 0;
    } catch (error) {
      console.error('🖼️ [ImageOptimization] Error getting image size:', error);
      return 0;
    }
  }

  /**
   * Formate la taille en format lisible
   */
  static formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  }
}

export default ImageOptimizationService; 