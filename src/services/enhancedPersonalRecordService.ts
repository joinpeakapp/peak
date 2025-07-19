import { RobustStorageService } from './storage';
import { EnhancedPersonalRecord, EnhancedPersonalRecords } from '../types/workout';

/**
 * Service de gestion des records personnels améliorés.
 * Permet de gérer à la fois les PR de poids et les PR de répétitions pour un poids spécifique.
 */
export const EnhancedPersonalRecordService = {
  /**
   * Charge les records personnels améliorés depuis le stockage robuste.
   * @returns Une promesse qui se résout avec les records personnels
   */
  loadRecords: async (): Promise<EnhancedPersonalRecords> => {
    try {
      const result = await RobustStorageService.loadPersonalRecords();
      
      if (result.success && result.data?.enhanced) {
        return result.data.enhanced;
      }
      
      // Fallback vers un objet vide si pas de données ou erreur
      console.warn('[EnhancedPersonalRecordService] No enhanced records found, returning empty object');
      return {};
    } catch (error) {
      console.error('[EnhancedPersonalRecordService] Failed to load records:', error);
      return {};
    }
  },

  /**
   * Sauvegarde les records personnels améliorés dans le stockage robuste.
   * @param records - Les records à sauvegarder
   */
  saveRecords: async (records: EnhancedPersonalRecords): Promise<void> => {
    try {
      console.log('[EnhancedPersonalRecordService] Attempting to save records:', Object.keys(records));
      
      // Charger les données existantes pour préserver les records legacy
      const currentData = await RobustStorageService.loadPersonalRecords();
      console.log('[EnhancedPersonalRecordService] Current data loaded:', currentData.success, currentData.data);
      
      // S'assurer que nous avons une structure de données valide
      const existingData = currentData.success && currentData.data ? currentData.data : {
        legacy: {},
        enhanced: {},
        migratedAt: new Date().toISOString()
      };
      
      const mergedData = {
        ...existingData,
        enhanced: records,
        lastUpdated: new Date().toISOString()
      };
      
      console.log('[EnhancedPersonalRecordService] Merged data to save:', {
        hasLegacy: Object.keys(mergedData.legacy || {}).length > 0,
        hasEnhanced: Object.keys(mergedData.enhanced || {}).length > 0,
        enhancedKeys: Object.keys(records)
      });
      
      const result = await RobustStorageService.savePersonalRecords(mergedData);
      
      if (!result.success) {
        console.error('[EnhancedPersonalRecordService] Failed to save records:', result.error?.userMessage);
        throw new Error(result.error?.userMessage || 'Failed to save personal records');
      }
      
      console.log('[EnhancedPersonalRecordService] Successfully saved enhanced records');
      
      // Vérification immédiate pour s'assurer que les données sont bien sauvegardées
      const verificationData = await RobustStorageService.loadPersonalRecords();
      if (verificationData.success && verificationData.data?.enhanced) {
        console.log('[EnhancedPersonalRecordService] Verification: saved data confirmed:', Object.keys(verificationData.data.enhanced));
      } else {
        console.error('[EnhancedPersonalRecordService] Verification failed: data not found after save');
      }
      
    } catch (error) {
      console.error('[EnhancedPersonalRecordService] Save error:', error);
      throw error;
    }
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
    
    // Nouveau record si on bat le record existant (strictement supérieur)
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
      // Pas de sticker "+X" car c'est la première utilisation de ce poids
      return null;
    }

    const weightKey = weight.toString();
    const previousRecord = exerciseRecord.repsPerWeight[weightKey];
    
    // Si pas de record précédent pour ce poids, pas de sticker "+X"
    if (!previousRecord) {
      return null;
    } else if (reps > previousRecord.reps) {
      // On détecte un PR de répétitions uniquement si:
      // 1. Il y a un record précédent pour ce poids
      // 2. Les nouvelles répétitions sont supérieures au record précédent
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