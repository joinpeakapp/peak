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
   * Récupérer les données de streak pour un workout
   */
  getWorkoutStreak: async (workoutId: string): Promise<StreakData> => {
    const streakData = await StorageService.loadWorkoutStreak(workoutId);
    
    if (!streakData) {
      return StreakService.initializeStreak(workoutId);
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
    
    // Calculer la date limite pour maintenir la streak
    let deadlineDate: Date;
    
    if (frequency.type === 'weekly') {
      // Pour les entraînements hebdomadaires, on donne une marge de 2 jours
      deadlineDate = addDays(lastDate, 7 + 2); // jour de la semaine + marge de 2 jours
    } else {
      // Pour les entraînements par intervalle, on donne une marge de 1 jour
      deadlineDate = addDays(lastDate, frequency.value + 1);
    }
    
    // La streak est maintenue si la date actuelle est avant la date limite
    return isBefore(currentDate, deadlineDate);
  },

  /**
   * Mise à jour de la streak après complétion d'un workout
   */
  updateStreakOnCompletion: async (workout: Workout, completionDate: Date = new Date()): Promise<StreakData> => {
    try {
      const workoutId = workout.id;
      // Formater la date au format YYYY-MM-DD
      const formattedDate = format(completionDate, 'yyyy-MM-dd');
      
      // Récupérer les données de streak existantes
      let streakData = await StreakService.getWorkoutStreak(workoutId);
      
      // Si c'est la première fois que ce workout est complété
      if (!streakData.lastCompletedDate) {
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
        } else {
          // Reset de la streak et création d'une nouvelle entrée d'historique
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
      
      // Sauvegarder les données mises à jour
      await StorageService.saveWorkoutStreak(workoutId, streakData);
      
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
    
    // Calculer la date limite pour maintenir la streak
    let deadlineDate: Date;
    
    if (frequency.type === 'weekly') {
      deadlineDate = addDays(lastDate, 7 + 2); // jour de la semaine + marge de 2 jours
    } else {
      deadlineDate = addDays(lastDate, frequency.value + 1);
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