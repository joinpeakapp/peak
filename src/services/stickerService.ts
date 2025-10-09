import { CompletedWorkout } from '../types/workout';
import { Sticker, StickerType } from '../types/stickers';
import { StreakService } from './streakService';
import { RobustStorageService } from './storage';

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
    'star': '#3BDF32',              // Vert - Complétion de séance
    'streak': '#FF8A24',            // Orange - Série consécutive
    'volume': '#FFE44D'             // Jaune - Volume supérieur
  } as const;

  /**
   * Noms d'affichage pour chaque type de sticker
   */
  private static readonly STICKER_NAMES = {
    'completion': '100%',
    'personal-record': 'PR',
    'star': 'Star',
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
    // 🏆 Personal Record - Si au moins un exercice a un PR
    const hasPersonalRecord = workout.exercises.some(exercise => exercise.personalRecord);
    if (hasPersonalRecord) {
      stickers.push(this.createSticker('personal-record'));
    }

    // 💯 Completion - Si toutes les séries sont complétées (0 série vide/non validée)
    const isFullyCompleted = this.checkFullCompletion(workout);
    if (isFullyCompleted) {
      stickers.push(this.createSticker('completion'));
    }

    // ⭐ Star - Nombre de fois que cette séance a été complétée
    const completionCount = await this.getWorkoutCompletionCount(workout);
    if (completionCount > 0) {
      stickers.push(this.createSticker('star', completionCount));
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
   * Vérifie si toutes les séries sont complétées (100%)
   * Pour l'instant, on se concentre uniquement sur les séries non validées
   */
  private static checkFullCompletion(workout: CompletedWorkout): boolean {
    // TODO: Implémenter la logique pour vérifier qu'aucune série n'est vide ou non validée
    // Pour l'instant, on retourne false pour éviter d'afficher ce sticker partout
    return false;
  }

  /**
   * Calcule le nombre de fois que cette séance spécifique a été complétée
   */
  private static async getWorkoutCompletionCount(workout: CompletedWorkout): Promise<number> {
    try {
      // Utiliser les données historiques stockées si disponibles (valeurs figées)
      if (workout.stickerData?.starCount) {
        return workout.stickerData.starCount;
      }

      // Fallback : calculer dynamiquement (pour les anciens workouts)
      const historyResult = await RobustStorageService.loadWorkoutHistory();
      if (!historyResult.success) {
        console.warn('[StickerService] Failed to load workout history for completion count');
        return 1;
      }

      // Compter les workouts avec le même workoutId (priorité) ou le même nom (fallback)
      const sameWorkouts = historyResult.data.filter(completedWorkout => {
        // Priorité 1: Comparer par workoutId si disponible des deux côtés
        if (completedWorkout.workoutId && workout.workoutId) {
          return completedWorkout.workoutId === workout.workoutId;
        }
        
        // Priorité 2: Comparer par workoutId du completed vs nom du workout actuel
        if (completedWorkout.workoutId && workout.name) {
          return completedWorkout.workoutId === workout.name;
        }
        
        // Fallback: Comparer par nom si pas d'ID disponible
        return completedWorkout.name === workout.name;
      });

      const count = sameWorkouts.length;
      return count;
    } catch (error) {
      console.error('[StickerService] Error getting workout completion count:', error);
      return 1;
    }
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