import UserProfileService from './userProfileService';
import { PersonalRecordService } from './personalRecordService';
import { StreakService } from './streakService';
import { StickerService } from './stickerService';
import { PhotoStorageService } from './photoStorageService';
import { RobustStorageService } from './storage';
import { CompletedWorkout } from '../types/workout';
import { Image } from 'react-native';

// Type pour les callbacks de progrès
export interface PreloadProgressCallback {
  onProgress?: (progress: number) => void;
  onStepChange?: (step: string, message: string) => void;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export class AppPreloadService {
  private static isPreloaded = false;
  // Cache mémoire pour les données préchargées (disponible immédiatement)
  private static preloadedWorkoutHistory: CompletedWorkout[] | null = null;
  // Callbacks pour reporter le progrès
  private static progressCallbacks: PreloadProgressCallback | null = null;

  /**
   * Configure les callbacks pour le reporting de progrès
   */
  static setProgressCallbacks(callbacks: PreloadProgressCallback): void {
    this.progressCallbacks = callbacks;
  }

  /**
   * Reporte le progrès du préchargement
   */
  private static reportProgress(progress: number): void {
    this.progressCallbacks?.onProgress?.(progress);
  }

  /**
   * Reporte le changement d'étape
   */
  private static reportStep(step: string, message: string): void {
    this.progressCallbacks?.onStepChange?.(step, message);
  }

  /**
   * Reporte une erreur
   */
  private static reportError(error: string): void {
    this.progressCallbacks?.onError?.(error);
  }

  /**
   * Reporte la complétion
   */
  private static reportComplete(): void {
    this.progressCallbacks?.onComplete?.();
  }

  /**
   * Précharge toutes les données critiques de l'application
   */
  static async preloadAppData(): Promise<void> {
    if (this.isPreloaded) {
      console.log('[AppPreloadService] Data already preloaded, skipping...');
      this.reportProgress(100);
      this.reportComplete();
      return;
    }

    const startTime = Date.now();

    try {
      // Étape 1: Précharger en parallèle les données qui ne dépendent pas des photos
      this.reportStep('user-profile', 'Loading your profile...');
      this.reportProgress(10);
      
      await Promise.allSettled([
        this.preloadUserProfile(),
        this.preloadPersonalRecords(),
        this.preloadStreakData(),
      ]);

      this.reportStep('workout-history', 'Loading workout history...');
      this.reportProgress(25);
      
      await this.preloadWorkoutHistory();

      this.reportStep('stickers', 'Preparing achievements...');
      this.reportProgress(40);
      
      await Promise.allSettled([
        this.preloadStickers(),
        this.migrateStickerHistoricalData(),
      ]);

      // Étape 2: Migrer les photos AVANT de précharger les images
      this.reportStep('photos', 'Organizing workout photos...');
      this.reportProgress(60);
      
      await Promise.allSettled([
        this.preloadPhotos(),
        this.migrateProfilePhoto(),
      ]);

      // Étape 3: Précharger les images avec les URIs migrées et vérifiées
      this.reportStep('images', 'Loading images...');
      this.reportProgress(80);
      
      // Précharger les images de manière non bloquante
      // Si ça prend trop de temps, on continue quand même
      try {
        await Promise.race([
          this.preloadImages(),
          new Promise(resolve => setTimeout(resolve, 5000)) // Timeout 5s
        ]);
      } catch (error) {
        console.warn('[AppPreloadService] Image preload took too long or failed, continuing...');
      }

      this.reportProgress(100);
      this.isPreloaded = true;
      
      const loadTime = Date.now() - startTime;
      console.log(`[AppPreloadService] ✅ Preload completed in ${loadTime}ms`);
      
      this.reportStep('complete', 'Ready to go!');
      this.reportComplete();
    } catch (error) {
      console.error('[AppPreloadService] ❌ Preload failed:', error);
      this.reportError('Failed to load some data. The app may not work properly.');
      // Ne pas bloquer l'app si le préchargement échoue
      this.reportComplete(); // Continuer malgré l'erreur
    }
  }

  /**
   * Précharge le profil utilisateur et ses statistiques
   */
  private static async preloadUserProfile(): Promise<void> {
    try {
      const profile = await UserProfileService.getUserProfile();
      // User profile preloaded
    } catch (error) {
      console.warn('[AppPreloadService] Failed to preload user profile:', error);
    }
  }

  /**
   * Précharge tous les records personnels
   */
  private static async preloadPersonalRecords(): Promise<void> {
    try {
      // Charger tous les records personnels via le service de stockage
      const { RobustStorageService } = require('./storage');
      const recordsResult = await RobustStorageService.loadPersonalRecords();
      
      if (!recordsResult.success) {
        console.warn('[AppPreloadService] Failed to preload personal records:', recordsResult.error?.userMessage);
      }
      // Personal records preloaded
    } catch (error) {
      console.warn('[AppPreloadService] Failed to preload personal records:', error);
    }
  }

  /**
   * Précharge les données de streak
   */
  private static async preloadStreakData(): Promise<void> {
    try {
      // Note: StreakService n'a pas ces méthodes statiques, on simule le préchargement
      // En réalité, les streaks sont calculées à la volée depuis les workouts
      // Streak data preloaded
    } catch (error) {
      console.warn('[AppPreloadService] Failed to preload streak data:', error);
    }
  }

  /**
   * Précharge l'historique des workouts et le met en cache mémoire
   */
  private static async preloadWorkoutHistory(): Promise<void> {
    try {
      // Forcer le chargement de l'historique via le service de stockage
      const { RobustStorageService } = require('./storage');
      const result = await RobustStorageService.loadWorkoutHistory();
      
      if (result.success) {
        // Mettre en cache mémoire pour accès immédiat dans le contexte
        this.preloadedWorkoutHistory = result.data;
      } else {
        console.warn('[AppPreloadService] Failed to preload workout history:', result.error?.userMessage);
        this.preloadedWorkoutHistory = [];
      }
      // Workout history preloaded
    } catch (error) {
      console.warn('[AppPreloadService] Failed to preload workout history:', error);
      this.preloadedWorkoutHistory = [];
    }
  }

  /**
   * Récupère l'historique préchargé depuis le cache mémoire (synchrone)
   * Retourne null si les données ne sont pas encore préchargées
   */
  static getPreloadedWorkoutHistory(): CompletedWorkout[] | null {
    return this.preloadedWorkoutHistory;
  }

  /**
   * Met à jour le cache mémoire avec de nouveaux workouts
   * Utile pour synchroniser le cache après l'ajout/modification d'un workout
   */
  static updatePreloadedWorkoutHistory(workouts: CompletedWorkout[]): void {
    this.preloadedWorkoutHistory = workouts;
  }

  /**
   * Précharge tous les stickers des workouts
   * Utilise le cache mémoire si disponible, sinon charge depuis le stockage
   */
  private static async preloadStickers(): Promise<void> {
    try {
      // Utiliser le cache mémoire si disponible, sinon charger depuis le stockage
      let workouts: CompletedWorkout[] = [];
      
      if (this.preloadedWorkoutHistory) {
        workouts = this.preloadedWorkoutHistory;
      } else {
        const { RobustStorageService } = require('./storage');
        const result = await RobustStorageService.loadWorkoutHistory();
        if (result.success) {
          workouts = result.data;
        }
      }
      
      if (workouts.length > 0) {
        let preloadedCount = 0;
        
        // Pré-calculer les stickers pour chaque workout
        for (const workout of workouts) {
          try {
            await StickerService.generateWorkoutStickers(workout, true);
            preloadedCount++;
          } catch (error) {
            console.warn(`[AppPreloadService] Failed to preload stickers for workout ${workout.name}:`, error);
          }
        }
        // Stickers preloaded
      }
      // Stickers preloading completed
    } catch (error) {
      console.warn('[AppPreloadService] Failed to preload stickers:', error);
    }
  }

  /**
   * Précharge et migre les photos des workouts vers un stockage permanent
   * Améliore la récupération des photos même si le chemin a changé entre les builds
   */
  private static async preloadPhotos(): Promise<void> {
    try {
      // Initialiser le service de photos
      await PhotoStorageService.initialize();
      
      // Utiliser le cache mémoire si disponible, sinon charger depuis le stockage
      let workouts: CompletedWorkout[] = [];
      
      if (this.preloadedWorkoutHistory) {
        workouts = this.preloadedWorkoutHistory;
      } else {
        const { RobustStorageService } = require('./storage');
        const result = await RobustStorageService.loadWorkoutHistory();
        if (result.success) {
          workouts = result.data;
        }
      }
      
      if (workouts.length > 0) {
        let migratedCount = 0;
        const updatedWorkouts = [];
        
        for (const workout of workouts) {
          if (workout.photo && !workout.photo.includes('placeholder')) {
            // Vérifier d'abord si la photo est accessible avec le chemin actuel
            const isAccessible = await PhotoStorageService.isPhotoAccessible(workout.photo);
            
            if (!isAccessible) {
              // Si la photo n'est plus accessible, essayer de la retrouver par workoutId
              // Cela permet de récupérer les photos même si le chemin documentDirectory a changé
              const foundUri = await PhotoStorageService.getAccessiblePhotoUri(workout.photo, workout.id);
              
              if (foundUri && !foundUri.includes('placeholder') && foundUri !== workout.photo) {
                // Photo trouvée avec un nouveau chemin, mettre à jour
                updatedWorkouts.push({ ...workout, photo: foundUri });
                migratedCount++;
                continue;
              }
            }
            
            // Migrer la photo vers un stockage permanent (si ce n'est pas déjà fait)
            const permanentUri = await PhotoStorageService.migratePhotoToPermanent(workout.photo, workout.id);
            
            if (permanentUri !== workout.photo && !permanentUri.includes('placeholder')) {
              // Mettre à jour l'URI dans le workout
              updatedWorkouts.push({ ...workout, photo: permanentUri });
              migratedCount++;
            } else {
              updatedWorkouts.push(workout);
            }
          } else {
            updatedWorkouts.push(workout);
          }
        }
        
        // Sauvegarder les workouts mis à jour si des photos ont été migrées
        if (migratedCount > 0) {
          await RobustStorageService.saveWorkoutHistory(updatedWorkouts);
          // Mettre à jour le cache mémoire avec les workouts mis à jour (URIs migrées)
          this.preloadedWorkoutHistory = updatedWorkouts;
          console.log(`[AppPreloadService] Migrated ${migratedCount} workout photos`);
        }
        
        // Nettoyer les photos orphelines - DÉSACTIVÉ pour éviter les suppressions accidentelles
        // const activeWorkoutIds = result.data.map(w => w.id);
        // await PhotoStorageService.cleanupOrphanedPhotos(activeWorkoutIds);
        
        const stats = await PhotoStorageService.getStorageStats();
        // Photos migration completed
      }
      // Photo preloading completed
    } catch (error) {
      console.warn('[AppPreloadService] Failed to preload photos:', error);
    }
  }

  /**
   * Migre la photo de profil vers un stockage permanent
   */
  private static async migrateProfilePhoto(): Promise<void> {
    try {
      // Initialiser le service de photos
      await PhotoStorageService.initialize();
      
      // Charger le profil utilisateur
      const profile = await UserProfileService.getUserProfile();
      
      if (profile && profile.profilePhotoUri && !profile.profilePhotoUri.includes('placeholder')) {
        // Vérifier si la photo est accessible
        const isAccessible = await PhotoStorageService.isProfilePhotoAccessible(profile.profilePhotoUri);
        
        if (!isAccessible) {
          // Si la photo n'est plus accessible, essayer de récupérer la photo sauvegardée
          const savedUri = await PhotoStorageService.getProfilePhotoUri();
          if (savedUri) {
            // Mettre à jour le profil avec la photo récupérée
            await UserProfileService.updateUserProfile({ profilePhotoUri: savedUri });
            console.log('[AppPreloadService] Recovered profile photo from storage');
            return;
          }
        }
        
        // Migrer la photo vers un stockage permanent
        const permanentUri = await PhotoStorageService.migrateProfilePhotoToPermanent(profile.profilePhotoUri);
        
        if (permanentUri !== profile.profilePhotoUri && !permanentUri.includes('placeholder')) {
          // Mettre à jour le profil avec l'URI permanente
          await UserProfileService.updateUserProfile({ profilePhotoUri: permanentUri });
          console.log('[AppPreloadService] Migrated profile photo to permanent storage');
        }
      } else if (profile && (!profile.profilePhotoUri || profile.profilePhotoUri.includes('placeholder'))) {
        // Si pas de photo de profil dans le profil, essayer de récupérer une photo sauvegardée
        const savedUri = await PhotoStorageService.getProfilePhotoUri();
        if (savedUri) {
          await UserProfileService.updateUserProfile({ profilePhotoUri: savedUri });
          console.log('[AppPreloadService] Restored profile photo from storage');
        }
      }
    } catch (error) {
      console.warn('[AppPreloadService] Failed to migrate profile photo:', error);
    }
  }

  /**
   * Précharge les images importantes avec les URIs vérifiées et migrées
   * IMPORTANT: Cette méthode doit être appelée APRÈS preloadPhotos() pour garantir
   * que les URIs sont migrées vers documentDirectory (persistant entre les builds)
   */
  private static async preloadImages(): Promise<void> {
    try {
      // Utiliser le cache mémoire si disponible (avec URIs migrées), sinon charger depuis le stockage
      // À ce stade, les photos sont déjà migrées dans preloadPhotos()
      let workouts: CompletedWorkout[] = [];
      
      if (this.preloadedWorkoutHistory) {
        workouts = this.preloadedWorkoutHistory;
      } else {
        const { RobustStorageService } = require('./storage');
        const result = await RobustStorageService.loadWorkoutHistory();
        if (result.success) {
          workouts = result.data;
        }
      }
      
      if (workouts.length > 0) {
        const { ImageCacheUtils } = require('../components/common/CachedImage');
        const imageUris: string[] = [];
        
        // Précharger les URIs vérifiées pour chaque workout
        // Les photos sont déjà migrées vers documentDirectory dans preloadPhotos()
        // mais on utilise getAccessiblePhotoUri() pour garantir la compatibilité
        // en cas de changement de chemin entre les builds
        for (const workout of workouts) {
          if (workout.photo && !workout.photo.includes('placeholder')) {
            try {
              // Obtenir l'URI accessible de la photo
              // Cette méthode gère automatiquement la récupération si le chemin a changé
              const accessiblePhotoUri = await PhotoStorageService.getAccessiblePhotoUri(
                workout.photo,
                workout.id
              );
              
              if (accessiblePhotoUri && !accessiblePhotoUri.includes('placeholder')) {
                imageUris.push(accessiblePhotoUri);
              }
            } catch (error) {
              console.warn(`[AppPreloadService] Failed to get accessible URI for workout ${workout.id}:`, error);
            }
          }
        }
        
        // Précharger toutes les images en parallèle avec les URIs permanentes
        if (imageUris.length > 0) {
          await ImageCacheUtils.preloadImages(imageUris);
          console.log(`[AppPreloadService] Preloaded ${imageUris.length} workout images with persistent URIs`);
        }
      }
    } catch (error) {
      console.warn('[AppPreloadService] Failed to preload images:', error);
    }
  }

  /**
   * Migre les données historiques des stickers pour les workouts existants
   */
  private static async migrateStickerHistoricalData(): Promise<void> {
    try {
      
      // Charger l'historique des workouts
      const historyResult = await RobustStorageService.loadWorkoutHistory();
      if (!historyResult.success) {
        console.warn('[AppPreloadService] Failed to load workout history for migration');
        return;
      }

      const workouts = historyResult.data;
      let migratedCount = 0;
      
      // Trier les workouts par date pour calculer les valeurs historiques correctement
      const sortedWorkouts = [...workouts].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Calculer les données historiques pour chaque workout
      for (let i = 0; i < sortedWorkouts.length; i++) {
        const workout = sortedWorkouts[i];
        
        // Skip si déjà migré
        if (workout.stickerData) {
          continue;
        }

        // Calculer les valeurs historiques au moment de cette séance
        const workoutsUpToThisPoint = sortedWorkouts.slice(0, i + 1);
        
        // 1. starCount : nombre de fois que ce workout spécifique a été complété jusqu'à ce point
        const starCount = workoutsUpToThisPoint.filter(w => 
          w.workoutId === workout.workoutId || w.name === workout.name
        ).length;
        
        // 2. completionCount : nombre total de séances complétées jusqu'à ce point
        const completionCount = i + 1;
        
        // 3. streakCount : calculer la streak historique au moment de cette séance
        let streakCount = 1;
        try {
          // Calculer la streak historique en regardant les workouts précédents du même type
          const sameWorkoutType = workout.workoutId || workout.name;
          let consecutiveCount = 1; // Cette séance compte
          
          // Regarder en arrière pour compter les séances consécutives
          for (let j = i - 1; j >= 0; j--) {
            const prevWorkout = sortedWorkouts[j];
            const prevWorkoutType = prevWorkout.workoutId || prevWorkout.name;
            
            if (prevWorkoutType === sameWorkoutType) {
              // Vérifier si c'est consécutif (pas plus de 7 jours d'écart)
              const currentDate = new Date(workout.date);
              const prevDate = new Date(prevWorkout.date);
              const daysDiff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
              
              if (daysDiff <= 7) {
                consecutiveCount++;
              } else {
                break; // Streak cassée
              }
            }
          }
          
          streakCount = consecutiveCount;
        } catch (error) {
          console.warn(`[AppPreloadService] Failed to calculate historical streak for workout ${workout.name}:`, error);
          streakCount = 1;
        }

        // Mettre à jour le workout avec les données historiques
        const updatedWorkout = {
          ...workout,
          stickerData: {
            starCount,
            streakCount,
            completionCount
          }
        };

        // Remplacer le workout dans la liste
        sortedWorkouts[i] = updatedWorkout;
        migratedCount++;
      }

      if (migratedCount > 0) {
        // Sauvegarder l'historique mis à jour
        await RobustStorageService.saveWorkoutHistory(sortedWorkouts);
        console.log(`[AppPreloadService] Migrated sticker historical data for ${migratedCount} workouts`);
      }
    } catch (error) {
      console.error('[AppPreloadService] Failed to migrate sticker historical data:', error);
    }
  }

  /**
   * Réinitialise le statut de préchargement (utile pour les tests)
   */
  static reset(): void {
    this.isPreloaded = false;
  }

  /**
   * Vérifie si les données ont été préchargées
   */
  static get isDataPreloaded(): boolean {
    return this.isPreloaded;
  }
}
