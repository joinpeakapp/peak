import { StorageService } from './storage';
import { EnhancedPersonalRecord, EnhancedPersonalRecords } from '../types/workout';

/**
 * Service de gestion des records personnels améliorés.
 * Permet de gérer à la fois les PR de poids et les PR de répétitions pour un poids spécifique.
 */
export const EnhancedPersonalRecordService = {
  /**
   * Charge les records personnels améliorés depuis le stockage.
   * @returns Une promesse qui se résout avec les records personnels
   */
  loadRecords: async (): Promise<EnhancedPersonalRecords> => {
    return StorageService.loadEnhancedPersonalRecords();
  },

  /**
   * Sauvegarde les records personnels améliorés dans le stockage.
   * @param records - Les records à sauvegarder
   */
  saveRecords: async (records: EnhancedPersonalRecords): Promise<void> => {
    await StorageService.saveEnhancedPersonalRecords(records);
  },

  /**
   * Vérifie si une série complétée représente un nouveau record de poids maximum.
   * @param exerciseName - Nom de l'exercice
   * @param weight - Poids utilisé
   * @param records - État actuel des records
   * @returns Objet indiquant si c'est un nouveau record et les détails
   */
  checkWeightPR: (
    exerciseName: string,
    weight: number,
    records: EnhancedPersonalRecords
  ): { isNew: boolean; weight: number } | null => {
    if (weight <= 0) return null;

    const exerciseRecord = records[exerciseName];
    
    // Nouveau record si on bat le record existant
    if (exerciseRecord) {
      if (weight > exerciseRecord.maxWeight) {
        return {
          isNew: true,
          weight
        };
      }
    } else if (weight > 0) {
      // Premier record pour cet exercice (si le poids est > 0)
      return {
        isNew: true,
        weight
      };
    }
    
    return null;
  },

  /**
   * Vérifie si une série complétée représente un nouveau record de répétitions pour un poids donné.
   * @param exerciseName - Nom de l'exercice
   * @param weight - Poids utilisé
   * @param reps - Répétitions effectuées
   * @param records - État actuel des records
   * @returns Objet indiquant si c'est un nouveau record et les détails
   */
  checkRepsPR: (
    exerciseName: string,
    weight: number,
    reps: number,
    records: EnhancedPersonalRecords
  ): { isNew: boolean; weight: number; reps: number; previousReps: number } | null => {
    if (weight <= 0 || reps <= 0) return null;
    
    const exerciseRecord = records[exerciseName];
    if (!exerciseRecord) {
      // Premier record pour cet exercice
      return {
        isNew: true,
        weight,
        reps,
        previousReps: 0
      };
    }

    const weightKey = weight.toString();
    const previousRecord = exerciseRecord.repsPerWeight[weightKey];
    
    // Si pas de record précédent pour ce poids, ou si on bat le record existant
    if (!previousRecord) {
      return {
        isNew: true,
        weight,
        reps,
        previousReps: 0
      };
    } else if (reps > previousRecord.reps) {
      return {
        isNew: true,
        weight,
        reps,
        previousReps: previousRecord.reps
      };
    }
    
    return null;
  },

  /**
   * Met à jour les records pour un exercice après une série complétée.
   * @param exerciseName - Nom de l'exercice 
   * @param weight - Poids utilisé
   * @param reps - Répétitions effectuées
   * @param date - Date de l'entraînement
   * @param records - État actuel des records
   * @returns Records mis à jour et informations sur les nouveaux records
   */
  updateRecords: (
    exerciseName: string,
    weight: number,
    reps: number,
    date: string,
    records: EnhancedPersonalRecords
  ): {
    updatedRecords: EnhancedPersonalRecords;
    weightPR?: { isNew: boolean; weight: number };
    repsPR?: { isNew: boolean; weight: number; reps: number; previousReps: number };
  } => {
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
    let weightPR;
    let repsPR;
    
    // Vérifier record de poids
    if (weight > exerciseRecord.maxWeight) {
      exerciseRecord.maxWeight = weight;
      exerciseRecord.maxWeightDate = date;
      weightPR = { isNew: true, weight };
    }
    
    // Vérifier record de répétitions pour ce poids
    const previousReps = exerciseRecord.repsPerWeight[weightKey]?.reps || 0;
    
    if (!exerciseRecord.repsPerWeight[weightKey] || reps > previousReps) {
      exerciseRecord.repsPerWeight[weightKey] = {
        reps,
        date
      };
      
      repsPR = {
        isNew: true,
        weight,
        reps,
        previousReps
      };
    }
    
    return {
      updatedRecords: newRecords,
      weightPR,
      repsPR
    };
  },

  /**
   * Obtient tous les records pour un exercice spécifique.
   * @param exerciseName - Nom de l'exercice
   * @param records - État actuel des records
   * @returns Record de l'exercice ou null si inexistant
   */
  getRecordsForExercise: (
    exerciseName: string,
    records: EnhancedPersonalRecords
  ): EnhancedPersonalRecord | null => {
    return records[exerciseName] || null;
  }
}; 