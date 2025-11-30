import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

/**
 * Service pour la gestion persistante des photos de workouts et de profil
 * Évite la perte de photos due aux URIs temporaires
 */
export class PhotoStorageService {
  private static getPhotosDirectory(): string {
    // Utiliser documentDirectory pour garantir la persistance entre les builds
    // documentDirectory persiste même après les mises à jour de l'app
    // Contrairement à cacheDirectory qui peut être nettoyé par le système entre les builds
    const baseDir = FileSystem.documentDirectory;
    if (!baseDir) {
      // Fallback vers cacheDirectory uniquement si documentDirectory n'est pas disponible (très rare)
      const fallbackDir = FileSystem.cacheDirectory;
      if (!fallbackDir) {
        throw new Error('Neither documentDirectory nor cacheDirectory is available');
      }
      console.warn('[PhotoStorageService] documentDirectory not available, using cacheDirectory as fallback');
      return `${fallbackDir}workout_photos/`;
    }
    return `${baseDir}workout_photos/`;
  }

  private static getProfilePhotosDirectory(): string {
    const baseDir = FileSystem.documentDirectory;
    if (!baseDir) {
      const fallbackDir = FileSystem.cacheDirectory;
      if (!fallbackDir) {
        throw new Error('Neither documentDirectory nor cacheDirectory is available');
      }
      console.warn('[PhotoStorageService] documentDirectory not available, using cacheDirectory as fallback');
      return `${fallbackDir}profile_photos/`;
    }
    return `${baseDir}profile_photos/`;
  }

  /**
   * Initialise le service et crée les dossiers de photos
   */
  static async initialize(): Promise<void> {
    try {
      const photosDir = this.getPhotosDirectory();
      const dirInfo = await FileSystem.getInfoAsync(photosDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(photosDir, { intermediates: true });
      }

      const profilePhotosDir = this.getProfilePhotosDirectory();
      const profileDirInfo = await FileSystem.getInfoAsync(profilePhotosDir);
      if (!profileDirInfo.exists) {
        await FileSystem.makeDirectoryAsync(profilePhotosDir, { intermediates: true });
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
   * Sauvegarde une photo de profil de manière permanente
   * @param tempUri URI temporaire de la photo
   * @returns URI permanent de la photo sauvegardée
   */
  static async saveProfilePhoto(tempUri: string): Promise<string> {
    try {
      await this.initialize();
      
      // Utiliser un nom de fichier fixe pour la photo de profil (une seule photo de profil)
      const fileName = 'profile_photo.jpg';
      const permanentUri = `${this.getProfilePhotosDirectory()}${fileName}`;
      
      // Supprimer l'ancienne photo de profil si elle existe
      const fileInfo = await FileSystem.getInfoAsync(permanentUri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(permanentUri);
      }
      
      // Copier la photo temporaire vers l'emplacement permanent
      await FileSystem.copyAsync({
        from: tempUri,
        to: permanentUri
      });
      
      return permanentUri;
    } catch (error) {
      console.error('[PhotoStorageService] Error saving profile photo:', error);
      // Retourner l'URI temporaire en cas d'erreur
      return tempUri;
    }
  }

  /**
   * Récupère l'URI de la photo de profil sauvegardée
   * @returns URI de la photo de profil ou null si elle n'existe pas
   */
  static async getProfilePhotoUri(): Promise<string | null> {
    try {
      await this.initialize();
      
      const fileName = 'profile_photo.jpg';
      const permanentUri = `${this.getProfilePhotosDirectory()}${fileName}`;
      
      const fileInfo = await FileSystem.getInfoAsync(permanentUri);
      if (fileInfo.exists) {
        return permanentUri;
      }
      
      return null;
    } catch (error) {
      console.error('[PhotoStorageService] Error getting profile photo:', error);
      return null;
    }
  }

  /**
   * Vérifie si une photo de profil existe et est accessible
   * @param photoUri URI de la photo à vérifier
   * @returns true si la photo existe et est accessible
   */
  static async isProfilePhotoAccessible(photoUri: string): Promise<boolean> {
    try {
      if (!photoUri) return false;
      
      // Vérifier si c'est une URI permanente (notre dossier)
      if (photoUri.startsWith(this.getProfilePhotosDirectory())) {
        const fileInfo = await FileSystem.getInfoAsync(photoUri);
        return fileInfo.exists;
      }
      
      // Pour les URIs temporaires, vérifier l'accessibilité
      const fileInfo = await FileSystem.getInfoAsync(photoUri);
      return fileInfo.exists;
    } catch (error) {
      console.warn('[PhotoStorageService] Error checking profile photo accessibility:', error);
      return false;
    }
  }

  /**
   * Migre une photo de profil temporaire vers un stockage permanent
   * @param tempUri URI temporaire
   * @returns URI permanent ou URI temporaire si migration échoue
   */
  static async migrateProfilePhotoToPermanent(tempUri: string): Promise<string> {
    try {
      // Si c'est déjà une URI permanente, vérifier qu'elle existe
      if (tempUri.startsWith(this.getProfilePhotosDirectory())) {
        const isAccessible = await this.isProfilePhotoAccessible(tempUri);
        if (isAccessible) {
          return tempUri;
        }
        // Si l'URI permanente n'existe plus, essayer de récupérer la photo sauvegardée
        const savedUri = await this.getProfilePhotoUri();
        if (savedUri) {
          return savedUri;
        }
      }

      // Si c'est un placeholder, ne pas migrer
      if (tempUri.includes('placeholder')) {
        return tempUri;
      }

      // Vérifier si la photo temporaire existe encore
      const isAccessible = await this.isProfilePhotoAccessible(tempUri);
      if (!isAccessible) {
        console.warn('[PhotoStorageService] Cannot migrate inaccessible profile photo');
        // Essayer de récupérer la photo sauvegardée
        const savedUri = await this.getProfilePhotoUri();
        if (savedUri) {
          return savedUri;
        }
        return tempUri;
      }

      // Migrer vers stockage permanent
      return await this.saveProfilePhoto(tempUri);
    } catch (error) {
      console.error('[PhotoStorageService] Error migrating profile photo:', error);
      // En cas d'erreur, essayer de récupérer la photo sauvegardée
      const savedUri = await this.getProfilePhotoUri();
      if (savedUri) {
        return savedUri;
      }
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
   * Utilise un identifiant relatif pour retrouver la photo même si le chemin change
   * @param photoUri URI de la photo (peut être un chemin absolu ou un identifiant relatif)
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
      
      // Si c'est un chemin absolu vers notre dossier, vérifier l'accessibilité
      if (photoUri.startsWith(this.getPhotosDirectory())) {
        const isAccessible = await this.isPhotoAccessible(photoUri);
        if (isAccessible) {
          return photoUri;
        }
        // Si le chemin absolu n'est plus accessible, essayer de retrouver la photo par workoutId
        return await this.findWorkoutPhotoByWorkoutId(workoutId);
      }
      
      // Pour les URIs temporaires ou autres, essayer de vérifier l'accessibilité
      try {
        const isAccessible = await this.isPhotoAccessible(photoUri);
        if (isAccessible) {
          return photoUri;
        } else {
          // Si l'URI n'est plus accessible, essayer de retrouver la photo par workoutId
          const foundUri = await this.findWorkoutPhotoByWorkoutId(workoutId);
          if (foundUri) {
            return foundUri;
          }
          console.warn(`[PhotoStorageService] Photo not accessible for workout ${workoutId}, using placeholder`);
          return 'https://via.placeholder.com/114x192/242526/FFFFFF?text=Workout';
        }
      } catch (error) {
        // En cas d'erreur de vérification, essayer de retrouver la photo par workoutId
        const foundUri = await this.findWorkoutPhotoByWorkoutId(workoutId);
        if (foundUri) {
          return foundUri;
        }
        console.warn(`[PhotoStorageService] Could not verify photo accessibility for ${workoutId}, returning original URI`);
        return photoUri;
      }
      
    } catch (error) {
      console.error('[PhotoStorageService] Error getting accessible photo:', error);
      return 'https://via.placeholder.com/114x192/242526/FFFFFF?text=Workout';
    }
  }

  /**
   * Trouve une photo de workout par son workoutId en scannant le dossier
   * Utile pour récupérer les photos même si le chemin a changé
   * @param workoutId ID du workout
   * @returns URI de la photo trouvée ou placeholder si non trouvée
   */
  private static async findWorkoutPhotoByWorkoutId(workoutId: string): Promise<string> {
    try {
      await this.initialize();
      
      const photosDir = this.getPhotosDirectory();
      const dirInfo = await FileSystem.getInfoAsync(photosDir);
      if (!dirInfo.exists) {
        return 'https://via.placeholder.com/114x192/242526/FFFFFF?text=Workout';
      }

      const files = await FileSystem.readDirectoryAsync(photosDir);
      
      // Chercher toutes les photos associées à ce workout
      // Le format est workout_{workoutId}_{timestamp}.jpg
      const matchingFiles = files.filter(file => {
        const match = file.match(/^workout_([^_]+)_/);
        return match && match[1] === workoutId;
      });

      if (matchingFiles.length > 0) {
        // Prendre la photo la plus récente (dernière dans la liste triée)
        matchingFiles.sort();
        const latestFile = matchingFiles[matchingFiles.length - 1];
        const filePath = `${photosDir}${latestFile}`;
        
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        if (fileInfo.exists) {
          return filePath;
        }
      }

      return 'https://via.placeholder.com/114x192/242526/FFFFFF?text=Workout';
    } catch (error) {
      console.error('[PhotoStorageService] Error finding workout photo by ID:', error);
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
   * Supprime la photo associée à un workout
   * @param workoutId ID du workout
   * @param photoUri URI de la photo à supprimer (optionnel, si non fourni, cherche toutes les photos du workout)
   */
  static async deleteWorkoutPhoto(workoutId: string, photoUri?: string): Promise<void> {
    try {
      await this.initialize();
      
      const photosDir = this.getPhotosDirectory();
      const dirInfo = await FileSystem.getInfoAsync(photosDir);
      if (!dirInfo.exists) return;

      // Si une URI spécifique est fournie, supprimer uniquement celle-ci
      if (photoUri && photoUri.startsWith(photosDir)) {
        const fileInfo = await FileSystem.getInfoAsync(photoUri);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(photoUri);
          console.log(`[PhotoStorageService] Deleted photo: ${photoUri}`);
        }
        return;
      }

      // Sinon, chercher toutes les photos associées à ce workout
      const files = await FileSystem.readDirectoryAsync(photosDir);
      
      for (const file of files) {
        // Extraire l'ID du workout du nom de fichier
        const match = file.match(/workout_([^_]+)_/);
        if (match && match[1] === workoutId) {
          const filePath = `${photosDir}${file}`;
          await FileSystem.deleteAsync(filePath);
          console.log(`[PhotoStorageService] Deleted photo: ${filePath}`);
        }
      }
    } catch (error) {
      console.error('[PhotoStorageService] Error deleting workout photo:', error);
      // Ne pas throw pour éviter de bloquer la suppression du workout
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
