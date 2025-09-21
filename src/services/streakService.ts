import { differenceInDays, parse, format, isAfter, isBefore, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { StreakData, StreakHistoryEntry, WorkoutFrequency, Workout } from '../types/workout';
import { StorageService } from './storage';

/**
 * Service pour gérer les streaks des workouts
 */
export const StreakService = {
  /**
   * Initialiser une nouvelle streak pour un workout
   */
  initializeStreak: (workoutId: string): StreakData => {
    const newStreak: StreakData = {
      workoutId,
      current: 0,
      longest: 0,
      lastCompletedDate: undefined,
      streakHistory: [],
    };
    
    // Sauvegarde asynchrone
    StorageService.saveWorkoutStreak(workoutId, newStreak);
    
    return newStreak;
  },

  /**
   * Récupérer les données de streak pour un workout avec validation automatique
   */
  getWorkoutStreak: async (workoutId: string, workout?: Workout): Promise<StreakData> => {
    const streakData = await StorageService.loadWorkoutStreak(workoutId);
    
    if (!streakData) {
      return StreakService.initializeStreak(workoutId);
    }
    
    // Si on a les informations du workout, vérifier la validité de la streak
    if (workout && streakData.lastCompletedDate && streakData.current > 0) {
      const isValid = StreakService.isWorkoutInValidTimeWindow(
        streakData.lastCompletedDate,
        new Date(),
        workout.frequency
      );
      
      // Si la streak n'est plus valide, la réinitialiser
      if (!isValid) {
        console.log(`[StreakService] Streak for workout ${workoutId} is no longer valid, resetting...`);
        const resetStreak: StreakData = {
          ...streakData,
          current: 0
        };
        
        // Sauvegarder la streak réinitialisée
        await StorageService.saveWorkoutStreak(workoutId, resetStreak);
        return resetStreak;
      }
    }
    
    return streakData;
  },

  /**
   * Vérifier si un workout est dans la fenêtre temporelle valide pour maintenir une streak
   * basé sur la fréquence configurée
   */
  isWorkoutInValidTimeWindow: (
    lastCompletionDate: string | undefined, 
    currentDate: Date, 
    frequency: WorkoutFrequency
  ): boolean => {
    if (!lastCompletionDate) return true;
    
    const lastDate = parse(lastCompletionDate, 'yyyy-MM-dd', new Date());
    
    // Calculer la date limite pour maintenir la streak (2x la durée attendue)
    let deadlineDate: Date;
    
    if (frequency.type === 'weekly') {
      // Pour les entraînements hebdomadaires : 2x7 = 14 jours
      deadlineDate = addDays(lastDate, 7 * 2);
    } else {
      // Pour les entraînements par intervalle : 2x la valeur (ex: 3 jours -> 6 jours)
      deadlineDate = addDays(lastDate, frequency.value * 2);
    }
    
    // La streak est maintenue si la date actuelle est avant ou égale à la date limite
    return isBefore(currentDate, deadlineDate) || currentDate.toDateString() === deadlineDate.toDateString();
  },

  /**
   * Valider et nettoyer toutes les streaks obsolètes pour tous les workouts
   */
  validateAndCleanAllStreaks: async (workouts: Workout[]): Promise<void> => {
    try {
      console.log('[StreakService] Starting validation of all streaks...');
      console.log(`[StreakService] Available workouts for validation:`, workouts.map(w => ({ id: w.id, name: w.name, frequency: w.frequency })));
      
      const allStreaks = await StorageService.loadWorkoutStreaks();
      console.log(`[StreakService] Loaded streaks:`, Object.keys(allStreaks).map(id => ({ id, current: allStreaks[id].current, lastDate: allStreaks[id].lastCompletedDate })));
      
      let cleanedCount = 0;
      
      for (const workoutId in allStreaks) {
        const streakData = allStreaks[workoutId];
        const workout = workouts.find(w => w.id === workoutId);
        
        console.log(`[StreakService] Validating streak for workout ${workoutId}:`, { 
          found: !!workout, 
          current: streakData.current, 
          lastDate: streakData.lastCompletedDate,
          frequency: workout?.frequency 
        });
        
        // Si le workout existe et a une streak active
        if (workout && streakData.lastCompletedDate && streakData.current > 0) {
          if (!workout.frequency) {
            console.warn(`[StreakService] Workout ${workoutId} has no frequency defined, skipping validation`);
            continue;
          }
          
          const isValid = StreakService.isWorkoutInValidTimeWindow(
            streakData.lastCompletedDate,
            new Date(),
            workout.frequency
          );
          
          console.log(`[StreakService] Time validation for ${workoutId}:`, {
            lastDate: streakData.lastCompletedDate,
            frequency: workout.frequency,
            isValid,
            currentDate: new Date().toISOString().split('T')[0]
          });

          // Si la streak n'est plus valide, la réinitialiser
          if (!isValid) {
            console.log(`[StreakService] Cleaning expired streak for workout ${workoutId} (was ${streakData.current}, last completed: ${streakData.lastCompletedDate})`);
            const resetStreak: StreakData = {
              ...streakData,
              current: 0
            };
            
            await StorageService.saveWorkoutStreak(workoutId, resetStreak);
            cleanedCount++;
          } else {
            console.log(`[StreakService] ✅ Streak for workout ${workoutId} is still valid (${streakData.current})`);
          }
        } else if (!workout) {
          console.log(`[StreakService] ⚠️ Workout ${workoutId} not found in current workouts, keeping streak as-is`);
        } else if (!streakData.lastCompletedDate || streakData.current === 0) {
          console.log(`[StreakService] ℹ️ Workout ${workoutId} has no active streak, skipping validation`);
        }
      }
      
      console.log(`[StreakService] Validation complete. Cleaned ${cleanedCount} expired streaks.`);
    } catch (error) {
      console.error('[StreakService] Error during streak validation:', error);
    }
  },

  /**
   * Mise à jour de la streak après complétion d'un workout
   */
  updateStreakOnCompletion: async (workout: Workout, completionDate: Date = new Date()): Promise<StreakData> => {
    try {
      const workoutId = workout.id;
      // Formater la date au format YYYY-MM-DD
      const formattedDate = format(completionDate, 'yyyy-MM-dd');
      
      console.log(`[StreakService] Updating streak for workout ${workoutId} (${workout.name}) on ${formattedDate}`);
      
      // Récupérer les données de streak existantes (avec validation automatique)
      let streakData = await StreakService.getWorkoutStreak(workoutId, workout);
      console.log(`[StreakService] Current streak data:`, streakData);
      
      // Si c'est la première fois que ce workout est complété
      if (!streakData.lastCompletedDate) {
        console.log(`[StreakService] First completion for workout ${workoutId}`);
        streakData = {
          workoutId,
          current: 1,
          longest: 1,
          lastCompletedDate: formattedDate,
          streakHistory: [{
            startDate: formattedDate,
            endDate: formattedDate,
            count: 1
          }]
        };
      } else {
        // Vérifier si le workout est dans la fenêtre temporelle valide
        const isValid = StreakService.isWorkoutInValidTimeWindow(
          streakData.lastCompletedDate,
          completionDate,
          workout.frequency
        );

        console.log(`[StreakService] Streak continuation check: ${isValid ? 'valid' : 'expired'} (last: ${streakData.lastCompletedDate}, frequency: ${workout.frequency})`);

        // Si on est dans une fenêtre valide, augmenter la streak
        if (isValid) {
          streakData.current += 1;
          
          // Mettre à jour la streak la plus longue si nécessaire
          if (streakData.current > streakData.longest) {
            streakData.longest = streakData.current;
          }
          
          // Mettre à jour l'historique
          if (streakData.streakHistory.length > 0) {
            const lastHistoryEntry = streakData.streakHistory[streakData.streakHistory.length - 1];
            lastHistoryEntry.endDate = formattedDate;
            lastHistoryEntry.count = streakData.current;
          }
          
          console.log(`[StreakService] Streak continued: ${streakData.current} (best: ${streakData.longest})`);
        } else {
          // Reset de la streak et création d'une nouvelle entrée d'historique
          console.log(`[StreakService] Streak reset: starting new streak`);
          streakData.current = 1;
          streakData.streakHistory.push({
            startDate: formattedDate,
            endDate: formattedDate,
            count: 1
          });
        }
        
        // Mettre à jour la date de dernière complétion
        streakData.lastCompletedDate = formattedDate;
      }
      
      console.log(`[StreakService] Final streak data to save:`, streakData);
      
      // Sauvegarder les données mises à jour
      console.log(`[StreakService] Saving streak data for workout ${workoutId}...`);
      const saveResult = await StorageService.saveWorkoutStreak(workoutId, streakData);
      console.log(`[StreakService] Save result:`, saveResult);
      
      // Vérification immédiate de la sauvegarde
      console.log(`[StreakService] Verifying saved streak data...`);
      const verifiedData = await StorageService.loadWorkoutStreak(workoutId);
      console.log(`[StreakService] Verification result:`, verifiedData);
      
      if (verifiedData && verifiedData.current === streakData.current) {
        console.log(`[StreakService] ✅ Streak successfully saved and verified`);
      } else {
        console.error(`[StreakService] ❌ Streak verification failed: expected ${streakData.current}, got ${verifiedData?.current}`);
      }

      // Planifier un rappel de streak si la streak est active
      if (streakData.current > 0 && workout.frequency) {
        try {
          const NotificationService = (await import('./notificationService')).default;
          await NotificationService.scheduleStreakReminder(
            workout.id,
            workout.name,
            formattedDate,
            workout.frequency.value
          );
          console.log(`[StreakService] 🔔 Scheduled streak reminder for ${workout.name}`);
        } catch (error) {
          console.warn(`[StreakService] Failed to schedule streak reminder:`, error);
        }
      }
      
      return streakData;
    } catch (error) {
      console.error('[StreakService] Error updating streak:', error);
      // En cas d'erreur, retourner une streak par défaut
      return {
        workoutId: workout.id,
        current: 0,
        longest: 0,
        lastCompletedDate: undefined,
        streakHistory: []
      };
    }
  },
  
  /**
   * Calcule le nombre de jours restants avant de perdre une streak
   */
  getDaysUntilStreakLoss: (lastCompletionDate: string | undefined, frequency: WorkoutFrequency): number => {
    if (!lastCompletionDate) return 0;
    
    const lastDate = parse(lastCompletionDate, 'yyyy-MM-dd', new Date());
    const currentDate = new Date();
    
    // Calculer la date limite pour maintenir la streak (2x la durée attendue)
    let deadlineDate: Date;
    
    if (frequency.type === 'weekly') {
      // Pour les entraînements hebdomadaires : 2x7 = 14 jours
      deadlineDate = addDays(lastDate, 7 * 2);
    } else {
      // Pour les entraînements par intervalle : 2x la valeur (ex: 3 jours -> 6 jours)
      deadlineDate = addDays(lastDate, frequency.value * 2);
    }
    
    // Si la date limite est déjà passée, retourner 0
    if (isBefore(deadlineDate, currentDate)) {
      return 0;
    }
    
    // Sinon, calculer le nombre de jours restants
    return differenceInDays(deadlineDate, currentDate);
  },
  
  /**
   * Formater le texte de streak pour l'affichage
   */
  formatStreakText: (streakData: StreakData | null): string => {
    if (!streakData || streakData.current === 0) {
      return "Pas encore de streak";
    }
    
    return `Streak: ${streakData.current} ${streakData.current > 1 ? 'fois' : 'fois'}`;
  },
  
  /**
   * Formater le texte de meilleure streak pour l'affichage
   */
  formatBestStreakText: (streakData: StreakData | null): string => {
    if (!streakData || streakData.longest === 0) {
      return "Pas encore de streak";
    }
    
    return `Meilleure streak: ${streakData.longest} ${streakData.longest > 1 ? 'fois' : 'fois'}`;
  },
}; 