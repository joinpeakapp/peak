import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

/**
 * Service pour la gestion persistante des photos de workouts
 * Évite la perte de photos due aux URIs temporaires
 */
export class PhotoStorageService {
  private static getPhotosDirectory(): string {
    // Utiliser l'API legacy qui est stable
    const baseDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
    return `${baseDir}workout_photos/`;
  }

  /**
   * Initialise le service et crée le dossier de photos
   */
  static async initialize(): Promise<void> {
    try {
      const photosDir = this.getPhotosDirectory();
      const dirInfo = await FileSystem.getInfoAsync(photosDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(photosDir, { intermediates: true });
        }
    } catch (error) {
      console.error('[PhotoStorageService] Error initializing:', error);
    }
  }

  /**
   * Sauvegarde une photo de manière permanente
   * @param tempUri URI temporaire de la photo
   * @param workoutId ID du workout
   * @returns URI permanent de la photo sauvegardée
   */
  static async saveWorkoutPhoto(tempUri: string, workoutId: string): Promise<string> {
    try {
      await this.initialize();
      
      const fileName = `workout_${workoutId}_${Date.now()}.jpg`;
      const permanentUri = `${this.getPhotosDirectory()}${fileName}`;
      
      // Copier la photo temporaire vers l'emplacement permanent
      await FileSystem.copyAsync({
        from: tempUri,
        to: permanentUri
      });
      
      return permanentUri;
    } catch (error) {
      console.error('[PhotoStorageService] Error saving photo:', error);
      // Retourner l'URI temporaire en cas d'erreur
      return tempUri;
    }
  }

  /**
   * Vérifie si une photo existe et est accessible
   * @param photoUri URI de la photo à vérifier
   * @returns true si la photo existe et est accessible
   */
  static async isPhotoAccessible(photoUri: string): Promise<boolean> {
    try {
      if (!photoUri) return false;
      
      // Vérifier si c'est une URI permanente (notre dossier)
      if (photoUri.startsWith(this.getPhotosDirectory())) {
        const fileInfo = await FileSystem.getInfoAsync(photoUri);
        return fileInfo.exists;
      }
      
      // Pour les URIs temporaires, vérifier l'accessibilité
      const fileInfo = await FileSystem.getInfoAsync(photoUri);
      return fileInfo.exists;
    } catch (error) {
      console.warn('[PhotoStorageService] Error checking photo accessibility:', error);
      return false;
    }
  }

  /**
   * Récupère une photo avec fallback si elle n'est plus accessible
   * @param photoUri URI de la photo
   * @param workoutId ID du workout
   * @returns URI accessible de la photo ou placeholder
   */
  static async getAccessiblePhotoUri(photoUri: string, workoutId: string): Promise<string> {
    try {
      // Si pas d'URI ou placeholder, retourner placeholder
      if (!photoUri || photoUri.includes('placeholder')) {
        return 'https://via.placeholder.com/114x192/242526/FFFFFF?text=Workout';
      }
      
      // Vérifier si c'est une URI valide (pas un placeholder déjà)
      if (photoUri.startsWith('https://via.placeholder.com')) {
        return photoUri;
      }
      
      // Pour les URIs locales, essayer de vérifier l'accessibilité de manière simple
      try {
        const isAccessible = await this.isPhotoAccessible(photoUri);
        if (isAccessible) {
          return photoUri;
        } else {
          console.warn(`[PhotoStorageService] Photo not accessible for workout ${workoutId}, using placeholder`);
          return 'https://via.placeholder.com/114x192/242526/FFFFFF?text=Workout';
        }
      } catch (error) {
        // En cas d'erreur de vérification, retourner l'URI originale et laisser le composant gérer
        console.warn(`[PhotoStorageService] Could not verify photo accessibility for ${workoutId}, returning original URI`);
        return photoUri;
      }
      
    } catch (error) {
      console.error('[PhotoStorageService] Error getting accessible photo:', error);
      return 'https://via.placeholder.com/114x192/242526/FFFFFF?text=Workout';
    }
  }

  /**
   * Migre une photo temporaire vers un stockage permanent
   * @param tempUri URI temporaire
   * @param workoutId ID du workout
   * @returns URI permanent ou URI temporaire si migration échoue
   */
  static async migratePhotoToPermanent(tempUri: string, workoutId: string): Promise<string> {
    try {
      // Si c'est déjà une URI permanente, ne rien faire
      if (tempUri.startsWith(this.getPhotosDirectory())) {
        return tempUri;
      }

      // Si c'est un placeholder, ne pas migrer
      if (tempUri.includes('placeholder')) {
        return tempUri;
      }

      // Vérifier si la photo temporaire existe encore
      const isAccessible = await this.isPhotoAccessible(tempUri);
      if (!isAccessible) {
        console.warn(`[PhotoStorageService] Cannot migrate inaccessible photo for workout ${workoutId}`);
        return 'https://via.placeholder.com/114x192/242526/FFFFFF?text=Workout';
      }

      // Migrer vers stockage permanent
      return await this.saveWorkoutPhoto(tempUri, workoutId);
    } catch (error) {
      console.error('[PhotoStorageService] Error migrating photo:', error);
      return tempUri;
    }
  }

  /**
   * Nettoie les photos orphelines (sans workout associé)
   * @param activeWorkoutIds Liste des IDs de workouts actifs
   */
  static async cleanupOrphanedPhotos(activeWorkoutIds: string[]): Promise<void> {
    try {
      await this.initialize();
      
      const photosDir = this.getPhotosDirectory();
      const dirInfo = await FileSystem.getInfoAsync(photosDir);
      if (!dirInfo.exists) return;

      const files = await FileSystem.readDirectoryAsync(photosDir);
      
      for (const file of files) {
        // Extraire l'ID du workout du nom de fichier
        const match = file.match(/workout_([^_]+)_/);
        if (match) {
          const workoutId = match[1];
          
          // Si le workout n'existe plus, supprimer la photo
          if (!activeWorkoutIds.includes(workoutId)) {
            const filePath = `${photosDir}${file}`;
            await FileSystem.deleteAsync(filePath);
            }
        }
      }
    } catch (error) {
      console.error('[PhotoStorageService] Error cleaning up photos:', error);
    }
  }

  /**
   * Obtient les statistiques du stockage des photos
   */
  static async getStorageStats(): Promise<{
    totalPhotos: number;
    totalSize: number;
    directoryPath: string;
  }> {
    try {
      await this.initialize();
      
      const photosDir = this.getPhotosDirectory();
      const dirInfo = await FileSystem.getInfoAsync(photosDir);
      if (!dirInfo.exists) {
        return { totalPhotos: 0, totalSize: 0, directoryPath: photosDir };
      }

      const files = await FileSystem.readDirectoryAsync(photosDir);
      let totalSize = 0;

      for (const file of files) {
        const filePath = `${photosDir}${file}`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        if (fileInfo.exists && fileInfo.size) {
          totalSize += fileInfo.size;
        }
      }

      return {
        totalPhotos: files.length,
        totalSize,
        directoryPath: photosDir
      };
    } catch (error) {
      console.error('[PhotoStorageService] Error getting storage stats:', error);
      return { totalPhotos: 0, totalSize: 0, directoryPath: this.getPhotosDirectory() };
    }
  }
}
