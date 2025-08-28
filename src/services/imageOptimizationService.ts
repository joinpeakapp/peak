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
  private static readonly PERMANENT_IMAGES_DIR = `${FileSystem.documentDirectory}optimized_images/`;
  private static readonly FAILED_IMAGES_KEY = 'failed_image_optimizations';
  private static failedImages = new Set<string>();

  /**
   * Initialise le service et charge la liste des images échouées
   */
  static async initialize(): Promise<void> {
    try {
      // Créer le dossier d'images permanentes s'il n'existe pas
      const dirInfo = await FileSystem.getInfoAsync(this.PERMANENT_IMAGES_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.PERMANENT_IMAGES_DIR, { intermediates: true });
        console.log('🖼️ [ImageOptimization] Created permanent images directory');
      }

      // Charger la liste des images échouées
      const failedImagesData = await AsyncStorage.getItem(this.FAILED_IMAGES_KEY);
      if (failedImagesData) {
        const failedArray = JSON.parse(failedImagesData);
        this.failedImages = new Set(failedArray);
        console.log(`🖼️ [ImageOptimization] Loaded ${this.failedImages.size} failed images from storage`);
      }
    } catch (error) {
      console.error('🖼️ [ImageOptimization] Error during initialization:', error);
    }
  }

  /**
   * Vérifie si une image a déjà échoué récemment
   */
  private static hasRecentlyFailed(imageUri: string): boolean {
    return this.failedImages.has(imageUri);
  }

  /**
   * Marque une image comme ayant échoué
   */
  private static async markAsFailed(imageUri: string): Promise<void> {
    this.failedImages.add(imageUri);
    try {
      await AsyncStorage.setItem(this.FAILED_IMAGES_KEY, JSON.stringify([...this.failedImages]));
    } catch (error) {
      console.error('🖼️ [ImageOptimization] Error saving failed images:', error);
    }
  }

  /**
   * Valide si l'URI d'image est correct
   */
  private static isValidImageUri(uri: string): boolean {
    if (!uri || typeof uri !== 'string') {
      return false;
    }
    
    // Vérifier si c'est un URI de fichier valide
    if (uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('ph://')) {
      return true;
    }
    
    // Vérifier si c'est une URL HTTP/HTTPS
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      return true;
    }
    
    // Vérifier si c'est un chemin local
    if (uri.startsWith('/')) {
      return true;
    }
    
    return false;
  }

  /**
   * Génère un nom de fichier pour le stockage permanent
   */
  private static generatePermanentFileName(originalUri: string, options: any): string {
    const hash = originalUri.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const optionsHash = JSON.stringify(options).split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return `${Math.abs(hash)}_${Math.abs(optionsHash)}.jpg`;
  }

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
      // Valider l'URI d'entrée
      if (!this.isValidImageUri(imageUri)) {
        console.log(`🖼️ [ImageOptimization] ⚠️ Invalid image URI: ${imageUri}`);
        await this.markAsFailed(imageUri);
        return imageUri;
      }

      // Vérifier si cette image a déjà échoué récemment
      if (this.hasRecentlyFailed(imageUri)) {
        console.log(`🖼️ [ImageOptimization] ⏭️ Skipping recently failed image: ${imageUri}`);
        return imageUri; // Retourner l'URI original sans tenter d'optimiser
      }

      console.log(`🖼️ [ImageOptimization] Starting optimization for: ${imageUri}`);
      
      // Vérifier que le fichier source existe
      const sourceFileInfo = await FileSystem.getInfoAsync(imageUri);
      if (!sourceFileInfo.exists) {
        console.log(`🖼️ [ImageOptimization] ⚠️ Source file does not exist, marking as failed: ${imageUri}`);
        await this.markAsFailed(imageUri);
        throw new Error(`Source file not found: ${imageUri}`);
      }
      
      // Vérifier le stockage permanent d'abord
      const permanentFileName = this.generatePermanentFileName(imageUri, finalOptions);
      const permanentPath = `${this.PERMANENT_IMAGES_DIR}${permanentFileName}`;
      
      const permanentFileInfo = await FileSystem.getInfoAsync(permanentPath);
      if (permanentFileInfo.exists) {
        console.log(`🖼️ [ImageOptimization] ✅ Found permanent image: ${permanentPath}`);
        return permanentPath;
      }
      
      // Vérifier le cache temporaire en second lieu
      if (finalOptions.shouldCache) {
        const cachedUri = await this.getCachedImage(imageUri);
        if (cachedUri) {
          console.log(`🖼️ [ImageOptimization] ✅ Found cached image: ${cachedUri}`);
          // Copier vers le stockage permanent pour la prochaine fois
          try {
            await FileSystem.copyAsync({
              from: cachedUri,
              to: permanentPath
            });
            console.log(`🖼️ [ImageOptimization] 📁 Moved to permanent storage: ${permanentPath}`);
            return permanentPath;
          } catch (copyError) {
            console.warn(`🖼️ [ImageOptimization] Could not copy to permanent storage, using cache: ${copyError}`);
            return cachedUri;
          }
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

      // Sauvegarder dans le stockage permanent
      try {
        await FileSystem.copyAsync({
          from: manipulatedImage.uri,
          to: permanentPath
        });
        console.log(`🖼️ [ImageOptimization] 📁 Saved to permanent storage: ${permanentPath}`);
        
        // Mettre en cache également pour compatibilité
        if (finalOptions.shouldCache) {
          await this.cacheImage(imageUri, permanentPath);
        }
        
        return permanentPath;
      } catch (saveError) {
        console.warn(`🖼️ [ImageOptimization] Could not save to permanent storage: ${saveError}`);
        
        // Fallback vers le cache temporaire
        if (finalOptions.shouldCache) {
          await this.cacheImage(imageUri, manipulatedImage.uri);
        }
        
        return manipulatedImage.uri;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`🖼️ [ImageOptimization] ⚠️ Failed to optimize image: ${errorMessage}`);
      
      // Marquer comme échoué pour éviter les tentatives répétées
      await this.markAsFailed(imageUri);
      
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
   * Remet à zéro la liste des images échouées
   */
  static async clearFailedImages(): Promise<void> {
    try {
      this.failedImages.clear();
      await AsyncStorage.removeItem(this.FAILED_IMAGES_KEY);
      console.log('🖼️ [ImageOptimization] ✅ Cleared failed images list');
    } catch (error) {
      console.error('🖼️ [ImageOptimization] Error clearing failed images:', error);
    }
  }

  /**
   * Nettoie le stockage permanent des images obsolètes
   */
  static async cleanupPermanentStorage(): Promise<void> {
    try {
      console.log('🖼️ [ImageOptimization] 🧹 Cleaning up permanent storage...');
      
      const dirInfo = await FileSystem.getInfoAsync(this.PERMANENT_IMAGES_DIR);
      if (!dirInfo.exists) {
        return;
      }

      const files = await FileSystem.readDirectoryAsync(this.PERMANENT_IMAGES_DIR);
      let removedCount = 0;
      
      for (const file of files) {
        const filePath = `${this.PERMANENT_IMAGES_DIR}${file}`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        
        // Supprimer les fichiers de plus de 30 jours
        if (fileInfo.exists && fileInfo.modificationTime) {
          const fileAge = Date.now() - fileInfo.modificationTime * 1000;
          if (fileAge > this.MAX_CACHE_AGE) {
            await FileSystem.deleteAsync(filePath);
            removedCount++;
          }
        }
      }
      
      console.log(`🖼️ [ImageOptimization] ✅ Cleaned up ${removedCount} old files from permanent storage`);
    } catch (error) {
      console.error('🖼️ [ImageOptimization] Error during permanent storage cleanup:', error);
    }
  }

  /**
   * Nettoie le cache en supprimant les références aux fichiers qui n'existent plus
   */
  static async cleanupMissingFiles(): Promise<void> {
    try {
      console.log('🖼️ [ImageOptimization] 🧹 Cleaning up missing files from cache...');
      
      const metadataString = await AsyncStorage.getItem(this.CACHE_METADATA_KEY);
      const metadata = metadataString ? JSON.parse(metadataString) : {};
      
      const newMetadata: Record<string, any> = {};
      let removedCount = 0;
      
      // Vérifier chaque fichier du cache
      for (const [cacheKey, data] of Object.entries(metadata)) {
        const cachedData = await AsyncStorage.getItem(cacheKey);
        if (cachedData) {
          const cached: CachedImage = JSON.parse(cachedData);
          
          // Vérifier si le fichier optimisé existe toujours
          const fileExists = await FileSystem.getInfoAsync(cached.uri);
          if (fileExists.exists) {
            newMetadata[cacheKey] = data;
          } else {
            // Supprimer la référence du cache
            await AsyncStorage.removeItem(cacheKey);
            removedCount++;
            console.log(`🖼️ [ImageOptimization] 🗑️ Removed missing file from cache: ${cached.uri}`);
          }
        }
      }
      
      // Mettre à jour les métadonnées
      await AsyncStorage.setItem(this.CACHE_METADATA_KEY, JSON.stringify(newMetadata));
      
      console.log(`🖼️ [ImageOptimization] ✅ Cache cleanup completed. Removed ${removedCount} missing files.`);
    } catch (error) {
      console.error('🖼️ [ImageOptimization] Error during missing files cleanup:', error);
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

  /**
   * Vide complètement tous les caches et données d'images (reset complet)
   */
  static async resetAllImageData(): Promise<void> {
    try {
      console.log('🖼️ [ImageOptimization] 🧹 Performing complete reset of all image data...');
      
      // Vider la liste des images échouées
      await this.clearFailedImages();
      
      // Vider le cache AsyncStorage
      await this.clearCache();
      
      // Supprimer tout le dossier permanent et le recréer
      const dirInfo = await FileSystem.getInfoAsync(this.PERMANENT_IMAGES_DIR);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(this.PERMANENT_IMAGES_DIR);
      }
      await FileSystem.makeDirectoryAsync(this.PERMANENT_IMAGES_DIR, { intermediates: true });
      
      console.log('🖼️ [ImageOptimization] ✅ Complete reset completed successfully');
    } catch (error) {
      console.error('🖼️ [ImageOptimization] Error during complete reset:', error);
    }
  }

  /**
   * Fonction de diagnostic pour déboguer les problèmes de cache
   */
  static async diagnoseCache(): Promise<{
    stats: any;
    missingFiles: string[];
    totalItems: number;
  }> {
    try {
      const stats = await this.getCacheStats();
      const metadataString = await AsyncStorage.getItem(this.CACHE_METADATA_KEY);
      const metadata = metadataString ? JSON.parse(metadataString) : {};
      
      const missingFiles: string[] = [];
      
      // Vérifier chaque fichier du cache
      for (const [cacheKey] of Object.entries(metadata)) {
        const cachedData = await AsyncStorage.getItem(cacheKey);
        if (cachedData) {
          const cached: CachedImage = JSON.parse(cachedData);
          const fileExists = await FileSystem.getInfoAsync(cached.uri);
          if (!fileExists.exists) {
            missingFiles.push(cached.uri);
          }
        }
      }
      
      console.log(`🖼️ [ImageOptimization] 📊 Cache diagnosis:`, {
        stats,
        missingFilesCount: missingFiles.length,
        totalItems: Object.keys(metadata).length
      });
      
      return {
        stats,
        missingFiles,
        totalItems: Object.keys(metadata).length
      };
    } catch (error) {
      console.error('🖼️ [ImageOptimization] Error during cache diagnosis:', error);
      return { stats: null, missingFiles: [], totalItems: 0 };
    }
  }
}

export default ImageOptimizationService; 