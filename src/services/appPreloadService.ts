import UserProfileService from './userProfileService';
import { PersonalRecordService } from './personalRecordService';
import { StreakService } from './streakService';
import { StickerService } from './stickerService';
import { PhotoStorageService } from './photoStorageService';
import { Image } from 'react-native';

export class AppPreloadService {
  private static isPreloaded = false;

  /**
   * Précharge toutes les données critiques de l'application
   */
  static async preloadAppData(): Promise<void> {
    if (this.isPreloaded) {
      // Data already preloaded
      return;
    }

    const startTime = Date.now();

    try {
      // Précharger en parallèle pour optimiser les performances
      await Promise.allSettled([
        this.preloadUserProfile(),
        this.preloadPersonalRecords(),
        this.preloadStreakData(),
        this.preloadWorkoutHistory(),
        this.preloadStickers(), // Préchargement des stickers
        this.preloadPhotos(), // Préchargement et migration des photos
        this.migrateStickerHistoricalData(), // Migration des données historiques des stickers
        this.preloadImages(),
      ]);

      this.isPreloaded = true;
      const loadTime = Date.now() - startTime;
      // Preload completed
    } catch (error) {
      console.error('[AppPreloadService] ❌ Preload failed:', error);
      // Ne pas bloquer l'app si le préchargement échoue
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
   * Précharge l'historique des workouts
   */
  private static async preloadWorkoutHistory(): Promise<void> {
    try {
      // Forcer le chargement de l'historique via le service de stockage
      const { RobustStorageService } = require('./storage');
      const result = await RobustStorageService.loadWorkoutHistory();
      
      if (!result.success) {
        console.warn('[AppPreloadService] Failed to preload workout history:', result.error?.userMessage);
      }
      // Workout history preloaded
    } catch (error) {
      console.warn('[AppPreloadService] Failed to preload workout history:', error);
    }
  }

  /**
   * Précharge tous les stickers des workouts
   */
  private static async preloadStickers(): Promise<void> {
    try {
      // Charger l'historique des workouts pour pré-calculer les stickers
      const { RobustStorageService } = require('./storage');
      const result = await RobustStorageService.loadWorkoutHistory();
      
      if (result.success && result.data.length > 0) {
        let preloadedCount = 0;
        
        // Pré-calculer les stickers pour chaque workout
        for (const workout of result.data) {
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
   */
  private static async preloadPhotos(): Promise<void> {
    try {
      // Initialiser le service de photos
      await PhotoStorageService.initialize();
      
      // Charger l'historique des workouts pour migrer les photos
      const { RobustStorageService } = require('./storage');
      const result = await RobustStorageService.loadWorkoutHistory();
      
      if (result.success && result.data.length > 0) {
        let migratedCount = 0;
        const updatedWorkouts = [];
        
        for (const workout of result.data) {
          if (workout.photo && !workout.photo.includes('placeholder')) {
            // Migrer la photo vers un stockage permanent
            const permanentUri = await PhotoStorageService.migratePhotoToPermanent(workout.photo, workout.id);
            
            if (permanentUri !== workout.photo) {
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
        }
        
        // Nettoyer les photos orphelines
        const activeWorkoutIds = result.data.map(w => w.id);
        await PhotoStorageService.cleanupOrphanedPhotos(activeWorkoutIds);
        
        const stats = await PhotoStorageService.getStorageStats();
        // Photos migration completed
      }
      // Photo preloading completed
    } catch (error) {
      console.warn('[AppPreloadService] Failed to preload photos:', error);
    }
  }

  /**
   * Précharge les images importantes
   */
  private static async preloadImages(): Promise<void> {
    try {
      // Note: UserProfileService n'a pas de getCompletedWorkouts()
      // En réalité, on préchargerait les images depuis le Redux store
      // Ici on simule le préchargement
      // Images preloaded
    } catch (error) {
      console.warn('[AppPreloadService] Failed to preload images:', error);
    }
  }

  /**
   * Migre les données historiques des stickers pour les workouts existants
   */
  private static async migrateStickerHistoricalData(): Promise<void> {
    try {
      const { RobustStorageService } = await import('./storage');
      const { StreakService } = await import('./streakService');
      
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
