import { CompletedWorkout } from '../types/workout';
import { Sticker, StickerType } from '../types/stickers';
import { StreakService } from './streakService';
import { RobustStorageService } from './storage';
import logger from '../utils/logger';

/**
 * Service centralisé pour la génération et la gestion des nouveaux stickers de workout.
 * Fournit une logique unifiée pour tous les écrans de l'application.
 */
export class StickerService {
  
  /**
   * Cache des stickers pour éviter les recalculs
   */
  private static stickerCache = new Map<string, { stickers: Sticker[], timestamp: number }>();
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  
  /**
   * Couleurs standardisées pour chaque type de nouveau sticker
   */
  private static readonly STICKER_COLORS = {
    'completion': '#E43C3C',        // Rouge - 100% séries complétées
    'personal-record': '#9B93E4',   // Violet - Nouveau PR
    'plus-one': '#3BDF32',          // Vert - Au moins un +1 obtenu
    'streak': '#FF8A24',            // Orange - Série consécutive
    'volume': '#FFE44D'             // Jaune - Volume supérieur
  } as const;

  /**
   * Noms d'affichage pour chaque type de sticker
   */
  private static readonly STICKER_NAMES = {
    'completion': '100%',
    'personal-record': 'PR',
    'plus-one': '+1',
    'streak': 'Streak',
    'volume': 'Volume'
  } as const;

  /**
   * Génère les stickers pour un workout complété selon les nouvelles règles
   * Utilise un cache pour éviter les recalculs fréquents
   */
  static async generateWorkoutStickers(workout: CompletedWorkout, includeStreak: boolean = false): Promise<Sticker[]> {
    // Créer une clé de cache unique
    const cacheKey = `${workout.id}_${includeStreak}`;
    
    // Vérifier le cache
    const cached = this.stickerCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached.stickers;
    }
    const stickers: Sticker[] = [];
    
    logger.log('[StickerService] Generating stickers for workout:', workout.name, workout.id);
    
    // 🏆 Personal Record - Si au moins un exercice a un PR de poids
    const hasPersonalRecord = this.checkPersonalRecordAchievement(workout);
    if (hasPersonalRecord) {
      logger.log('[StickerService] ✅ PR sticker added');
      stickers.push(this.createSticker('personal-record'));
    }

    // 💯 Completion - Si toutes les séries sont complétées (100%)
    const isFullyCompleted = this.checkFullCompletion(workout);
    if (isFullyCompleted) {
      logger.log('[StickerService] ✅ 100% sticker added');
      stickers.push(this.createSticker('completion'));
    }

    // ➕ Plus One - Si au moins un +1 (ou plus) de répétitions obtenu
    const plusOneValue = this.checkPlusOneAchievement(workout);
    if (plusOneValue > 0) {
      logger.log('[StickerService] ✅ +1 sticker added with value:', plusOneValue);
      stickers.push(this.createSticker('plus-one', plusOneValue));
    } else {
      logger.log('[StickerService] ❌ No +1 achievement found');
    }

    // 🔥 Streak - Si demandé explicitement (pour WorkoutSummary et écrans suivants)
    if (includeStreak) {
      const streakCount = await this.getCurrentStreak(workout);
      stickers.push(this.createSticker('streak', streakCount));
    }

    // ⚡ Volume - Si volume 10%+ supérieur à la même séance précédente
    const volumeIncrease = this.calculateVolumeIncrease(workout);
    if (volumeIncrease >= 10) {
      stickers.push(this.createSticker('volume', volumeIncrease));
    }

    // Mettre en cache les résultats
    this.stickerCache.set(cacheKey, {
      stickers,
      timestamp: Date.now()
    });

    return stickers;
  }

  /**
   * Récupère les stickers depuis le cache de manière synchrone
   * Retourne null si les stickers ne sont pas dans le cache ou si le cache est expiré
   */
  static getCachedStickers(workout: CompletedWorkout, includeStreak: boolean = false): Sticker[] | null {
    const cacheKey = `${workout.id}_${includeStreak}`;
    const cached = this.stickerCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached.stickers;
    }
    
    return null;
  }

  /**
   * Vide le cache des stickers (utile lors de changements de données)
   */
  static clearCache(): void {
    this.stickerCache.clear();
  }

  /**
   * Crée un objet sticker standardisé
   */
  private static createSticker(type: StickerType, dynamicValue?: number): Sticker {
    return {
      name: this.STICKER_NAMES[type],
      type,
      color: this.STICKER_COLORS[type],
      dynamicValue
    };
  }

  /**
   * Vérifie si l'utilisateur a obtenu au moins un PR de poids
   */
  private static checkPersonalRecordAchievement(workout: CompletedWorkout): boolean {
    // Vérifier d'abord avec personalRecord (format historique)
    for (const exercise of workout.exercises) {
      if (exercise.personalRecord) {
        return true;
      }
      
      // Vérifier dans enhancedPersonalRecord (nouveau format)
      if (exercise.enhancedPersonalRecord?.weightPR?.isNew) {
        return true;
      }
      
      // Vérifier dans les sets individuels (format actuel)
      if (exercise.sets && exercise.sets.length > 0) {
        for (const set of exercise.sets) {
          if (set.prData?.weightPR?.isNew) {
            return true;
          }
        }
      }
    }
    
    return false;
  }

  /**
   * Vérifie si toutes les séries sont complétées (100%)
   * Vérifie qu'aucune série n'est vide ou non validée
   */
  private static checkFullCompletion(workout: CompletedWorkout): boolean {
    // Parcourir tous les exercices du workout
    for (const exercise of workout.exercises) {
      // Pour les exercices trackés par répétitions/poids
      if (exercise.sets && exercise.sets.length > 0) {
        for (const set of exercise.sets) {
          // Si la série n'est pas complétée, retourner false
          if (!set.completed) {
            return false;
          }
          // Si la série est complétée mais vide (pas de reps ou pas de poids pour exercices avec poids)
          if (set.completed) {
            const hasReps = set.reps && set.reps > 0;
            const hasWeight = exercise.tracking === 'trackedOnTime' || (set.weight && set.weight > 0);
            
            // Si pas de reps ou pas de poids (quand nécessaire), ce n'est pas 100%
            if (!hasReps || !hasWeight) {
              return false;
            }
          }
        }
      }
      
      // Pour les exercices trackés par temps
      if (exercise.times && exercise.times.length > 0) {
        for (const time of exercise.times) {
          // Si le temps n'est pas complété ou est zéro, retourner false
          if (!time.completed || !time.duration || time.duration === 0) {
            return false;
          }
        }
      }
    }
    
    // Si tous les exercices et toutes les séries sont validées et remplies
    return true;
  }

  /**
   * Vérifie si l'utilisateur a obtenu au moins un +1 (ou plus) de répétitions
   * Retourne le plus grand incrément de répétitions trouvé
   */
  private static checkPlusOneAchievement(workout: CompletedWorkout): number {
    let maxIncrement = 0;
    
    logger.log('[StickerService] === Checking +1 achievement ===');
    logger.log('[StickerService] Workout:', workout.name, 'with', workout.exercises.length, 'exercises');
    
    // Parcourir tous les exercices
    for (const exercise of workout.exercises) {
      logger.log(`[StickerService] Checking exercise: ${exercise.name}`);
      logger.log(`[StickerService]   - Has enhancedPersonalRecord:`, !!exercise.enhancedPersonalRecord);
      logger.log(`[StickerService]   - Number of sets:`, exercise.sets?.length || 0);
      
      // Vérifier d'abord dans enhancedPersonalRecord (nouveau format)
      if (exercise.enhancedPersonalRecord?.repsPR?.isNew) {
        const repsPR = exercise.enhancedPersonalRecord.repsPR;
        const increment = repsPR.reps - repsPR.previousReps;
        
        logger.log(`[StickerService] ✅ Found +${increment} in enhancedPersonalRecord for ${exercise.name}`);
        
        if (increment > maxIncrement) {
          maxIncrement = increment;
        }
      }
      
      // Vérifier aussi dans les sets individuels (format actuel)
      if (exercise.sets && exercise.sets.length > 0) {
        exercise.sets.forEach((set, setIndex) => {
          logger.log(`[StickerService]   Set ${setIndex}: completed=${set.completed}, hasPRData=${!!set.prData}`);
          
          if (set.prData) {
            logger.log(`[StickerService]     - weightPR:`, set.prData.weightPR);
            logger.log(`[StickerService]     - repsPR:`, set.prData.repsPR);
          }
          
          if (set.prData?.repsPR?.isNew) {
            const repsPR = set.prData.repsPR;
            const increment = repsPR.reps - repsPR.previousReps;
            
            logger.log(`[StickerService] ✅ Found +${increment} in set ${setIndex} prData for ${exercise.name} (${repsPR.reps} reps vs ${repsPR.previousReps} previous)`);
            
            if (increment > maxIncrement) {
              maxIncrement = increment;
            }
          }
        });
      }
    }
    
    logger.log(`[StickerService] === Final result: Max +1 increment = ${maxIncrement} ===`);
    return maxIncrement;
  }


  /**
   * Récupère la streak actuelle de l'utilisateur
   */
  private static async getCurrentStreak(workout: CompletedWorkout): Promise<number> {
    try {
      // Utiliser les données historiques stockées si disponibles (valeurs figées)
      if (workout.stickerData?.streakCount) {
        return workout.stickerData.streakCount;
      }

      // Fallback : calculer dynamiquement (pour les anciens workouts)
      const workoutId = workout.workoutId || workout.name;
      const streakData = await StreakService.getWorkoutStreak(workoutId);
      
      const streakCount = streakData.current || 0;
      return streakCount;
    } catch (error) {
      console.error('[StickerService] Error getting current streak:', error);
      return 1;
    }
  }

  /**
   * Calcule l'augmentation de volume par rapport à la même séance précédente
   */
  private static calculateVolumeIncrease(workout: CompletedWorkout): number {
    // TODO: Implémenter la logique de calcul de volume
    // Volume = Poids × Reps × Séries pour tous les exercices
    // Comparer avec la même séance précédente
    // Pour l'instant, on retourne 0 (pas d'augmentation)
    return 0;
  }

  /**
   * Calcule le volume total d'un workout
   */
  private static calculateWorkoutVolume(workout: CompletedWorkout): number {
    let totalVolume = 0;
    
    for (const exercise of workout.exercises) {
      for (const set of exercise.sets) {
        if (set.weight && set.reps) {
          totalVolume += set.weight * set.reps;
        }
      }
    }
    
    return totalVolume;
  }

  /**
   * Trouve la séance précédente du même type pour comparaison
   */
  private static findPreviousWorkoutOfSameType(workout: CompletedWorkout): CompletedWorkout | null {
    // TODO: Implémenter la recherche dans l'historique des workouts
    // Chercher le dernier workout avec le même nom/ID
    return null;
  }
}