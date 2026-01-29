import UserProfileService from './userProfileService';
import { PersonalRecords, PersonalRecord, WeightPR, RepsPR, PRCheckResult, PRUpdateResult } from '../types/workout';
import logger from '../utils/logger';

/**
 * Service unifié de gestion des records personnels.
 * Gère la détection, la vérification et la sauvegarde des PRs dans le profil utilisateur.
 */
export class PersonalRecordService {
  
  /**
   * Charge les records personnels depuis le profil utilisateur.
   */
  static async loadRecords(): Promise<PersonalRecords> {
    try {
      return await UserProfileService.getPersonalRecords();
    } catch (error) {
      logger.error('[PersonalRecordService] Failed to load records:', error);
      return {};
    }
  }

  /**
   * Sauvegarde les records personnels dans le profil utilisateur.
   * Cette méthode sauvegarde définitivement les PRs dans le profil.
   */
  static async saveRecords(records: PersonalRecords): Promise<void> {
    try {
      await UserProfileService.updatePersonalRecords(records);
      } catch (error) {
      logger.error('[PersonalRecordService] Failed to save records:', error);
      throw error;
    }
  }

  /**
   * Vérifie si un poids représente un nouveau record de poids maximum.
   * Un Weight PR est détecté quand le poids est strictement supérieur au maxWeight enregistré.
   */
  static checkWeightPR(
    exerciseName: string,
    weight: number,
    records: PersonalRecords
  ): WeightPR | null {
    if (weight <= 0) return null;

    const exerciseRecord = records[exerciseName];
    
    // Nouveau record si on bat le record existant (strictement supérieur)
    if (exerciseRecord) {
      if (weight > exerciseRecord.maxWeight) {
        return {
          isNew: true,
          weight
        };
      }
    } else if (weight > 0) {
      // Premier record pour cet exercice
      return {
        isNew: true,
        weight
      };
    }
    
    return null;
  }

  /**
   * Vérifie si des répétitions représentent un nouveau record pour un poids donné.
   * Un Reps PR est détecté seulement s'il existe déjà un record pour ce poids 
   * ET que les nouvelles répétitions sont supérieures.
   */
  static checkRepsPR(
    exerciseName: string,
    weight: number,
    reps: number,
    records: PersonalRecords
  ): RepsPR | null {
    if (weight <= 0 || reps <= 0) return null;
    
    const exerciseRecord = records[exerciseName];
    if (!exerciseRecord) {
      // Premier record pour cet exercice - pas de Reps PR
      return null;
    }

    const weightKey = weight.toString();
    const previousRecord = exerciseRecord.repsPerWeight[weightKey];
    
    // Seulement si il y a un record précédent pour ce poids ET que les nouvelles reps sont supérieures
    if (previousRecord && reps > previousRecord.reps) {
      return {
        isNew: true,
        weight,
        reps,
        previousReps: previousRecord.reps
      };
    }
    
    return null;
  }

  /**
   * Vérifie les PRs potentiels pour un set donné sans mettre à jour les records.
   * Utilisé pour l'affichage en temps réel dans l'interface.
   */
  static checkPRs(
    exerciseName: string,
    weight: number,
    reps: number,
    records: PersonalRecords
  ): PRCheckResult {
    const weightPR = this.checkWeightPR(exerciseName, weight, records);
    const repsPR = this.checkRepsPR(exerciseName, weight, reps, records);
    
    return {
      weightPR,
      repsPR
    };
  }

  /**
   * Met à jour les records pour un exercice après une série complétée.
   * Cette méthode met à jour les records en mémoire mais ne les sauvegarde pas.
   * La sauvegarde doit être faite explicitement avec saveRecords().
   */
  static updateRecords(
    exerciseName: string,
    weight: number,
    reps: number,
    date: string,
    records: PersonalRecords
  ): PRUpdateResult {
    if (weight <= 0 || reps <= 0) {
      return { updatedRecords: records };
    }

    const newRecords = { ...records };
    const weightKey = weight.toString();
    
    // Récupérer ou initialiser l'exercice
    if (!newRecords[exerciseName]) {
      newRecords[exerciseName] = {
        exerciseName,
        maxWeight: 0,
        maxWeightDate: '',
        repsPerWeight: {}
      };
    }
    
    const exerciseRecord = newRecords[exerciseName];
    let weightPR: WeightPR | null = null;
    let repsPR: RepsPR | null = null;
    
    // Vérifier record de poids - uniquement si strictement supérieur
    if (weight > exerciseRecord.maxWeight) {
      exerciseRecord.maxWeight = weight;
      exerciseRecord.maxWeightDate = date;
      weightPR = { isNew: true, weight };
    }
    
    // Vérifier record de répétitions pour ce poids
    const previousReps = exerciseRecord.repsPerWeight[weightKey]?.reps || 0;
    const hasPreviousRecord = weightKey in exerciseRecord.repsPerWeight;
    
    // Mettre à jour le record de répétitions si c'est mieux que précédemment
    if (reps > previousReps) {
      exerciseRecord.repsPerWeight[weightKey] = {
        reps,
        date
      };
      
      // Retourner un PR de répétitions seulement s'il y avait déjà un record
      if (hasPreviousRecord) {
        repsPR = {
          isNew: true,
          weight,
          reps,
          previousReps
        };
      }
    } else if (!hasPreviousRecord) {
      // Premier enregistrement pour ce poids
      exerciseRecord.repsPerWeight[weightKey] = {
        reps,
        date
      };
      // Pas de repsPR retourné ici car c'est le premier enregistrement
    }
    
    return {
      updatedRecords: newRecords,
      weightPR,
      repsPR
    };
  }

  /**
   * Obtient tous les records pour un exercice spécifique.
   */
  static getRecordsForExercise(
    exerciseName: string,
    records: PersonalRecords
  ): PersonalRecord | null {
    return records[exerciseName] || null;
  }

  /**
   * Met à jour les records à partir d'un workout complété.
   * Cette méthode traite tous les sets complétés d'un workout et met à jour les PRs.
   * Elle ne sauvegarde PAS automatiquement - la sauvegarde doit être faite séparément.
   */
  static updateRecordsFromCompletedWorkout(
    completedWorkout: {
      date: string;
      exercises: Array<{
        name: string;
        sets: Array<{
          weight: number;
          reps: number;
          completed: boolean;
        }>;
      }>;
    },
    currentRecords: PersonalRecords
  ): { updatedRecords: PersonalRecords; hasUpdates: boolean } {
    let updatedRecords = { ...currentRecords };
    let hasUpdates = false;
    
    // Traiter chaque exercice du workout
    for (const exercise of completedWorkout.exercises) {
      // Traiter chaque set complété
      for (const set of exercise.sets) {
        if (set.completed && set.weight > 0 && set.reps > 0) {
          const result = this.updateRecords(
            exercise.name,
            set.weight,
            set.reps,
            completedWorkout.date,
            updatedRecords
          );
          
          if (result.weightPR || result.repsPR) {
            hasUpdates = true;
            updatedRecords = result.updatedRecords;
            
            if (result.weightPR) {
              }
            if (result.repsPR) {
              }
          }
        }
      }
    }
    
    return { updatedRecords, hasUpdates };
  }

  /**
   * Migre les records depuis l'historique des workouts.
   * Utile pour la migration depuis l'ancien système ou pour recalculer tous les PRs.
   */
  static async migrateFromWorkoutHistory(
    completedWorkouts: Array<{
      date: string;
      exercises: Array<{
        name: string;
        sets: Array<{
          weight: number;
          reps: number;
          completed: boolean;
        }>;
      }>;
    }>
  ): Promise<void> {
    try {
      const currentRecords = await this.loadRecords();
      let updatedRecords = { ...currentRecords };
      let hasUpdates = false;
      
      // Traiter tous les workouts complétés par ordre chronologique
      const sortedWorkouts = [...completedWorkouts].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      for (const workout of sortedWorkouts) {
        const result = this.updateRecordsFromCompletedWorkout(workout, updatedRecords);
        if (result.hasUpdates) {
          hasUpdates = true;
          updatedRecords = result.updatedRecords;
        }
      }
      
      if (hasUpdates) {
        await this.saveRecords(updatedRecords);
        } else {
        }
      
    } catch (error) {
      logger.error('[PersonalRecordService] Migration error:', error);
      throw error;
    }
  }

  /**
   * Supprime un record de répétitions spécifique pour un poids donné.
   */
  static async deleteRepRecord(
    exerciseName: string, 
    weight: string
  ): Promise<void> {
    try {
      const records = await this.loadRecords();
      const exerciseRecord = records[exerciseName];
      
      if (!exerciseRecord || !exerciseRecord.repsPerWeight) {
        throw new Error(`No records found for exercise: ${exerciseName}`);
      }

      if (!exerciseRecord.repsPerWeight[weight]) {
        throw new Error(`No record found for ${weight}kg in ${exerciseName}`);
      }

      // Supprimer le record spécifique
      delete exerciseRecord.repsPerWeight[weight];
      
      // Si c'était le record de poids max, recalculer
      if (parseFloat(weight) === exerciseRecord.maxWeight) {
        const remainingWeights = Object.keys(exerciseRecord.repsPerWeight).map(w => parseFloat(w));
        if (remainingWeights.length > 0) {
          const newMaxWeight = Math.max(...remainingWeights);
          exerciseRecord.maxWeight = newMaxWeight;
          exerciseRecord.maxWeightDate = exerciseRecord.repsPerWeight[newMaxWeight.toString()].date;
        } else {
          // Plus aucun record, supprimer l'exercice complètement
          delete records[exerciseName];
        }
      }

      await this.saveRecords(records);
      } catch (error) {
      logger.error('[PersonalRecordService] Failed to delete rep record:', error);
      throw error;
    }
  }

  /**
   * Supprime tous les records pour un exercice donné.
   */
  static async deleteAllRecordsForExercise(exerciseName: string): Promise<void> {
    try {
      const records = await this.loadRecords();
      
      if (!records[exerciseName]) {
        throw new Error(`No records found for exercise: ${exerciseName}`);
      }

      delete records[exerciseName];
      await this.saveRecords(records);
      } catch (error) {
      logger.error('[PersonalRecordService] Failed to delete all records:', error);
      throw error;
    }
  }
}

export default PersonalRecordService;