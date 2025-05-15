import { useState, useEffect, useCallback } from 'react';
import { EnhancedPersonalRecords } from '../types/workout';
import { EnhancedPersonalRecordService } from '../services/enhancedPersonalRecordService';

/**
 * Hook personnalisé pour gérer les records personnels améliorés.
 * Fournit des méthodes pour charger, vérifier et mettre à jour les deux types de PR.
 */
export const useEnhancedPersonalRecords = () => {
  const [records, setRecords] = useState<EnhancedPersonalRecords>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les records au montage du composant
  useEffect(() => {
    const loadRecords = async () => {
      setLoading(true);
      try {
        const data = await EnhancedPersonalRecordService.loadRecords();
        setRecords(data);
        setError(null);
      } catch (err) {
        setError('Erreur lors du chargement des records personnels');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadRecords();
  }, []);

  /**
   * Vérifie si une série termine représente un nouveau record de poids.
   * @param exerciseName - Nom de l'exercice
   * @param weight - Poids utilisé
   */
  const checkWeightPR = useCallback(
    (exerciseName: string, weight: number) => {
      return EnhancedPersonalRecordService.checkWeightPR(exerciseName, weight, records);
    },
    [records]
  );

  /**
   * Vérifie si une série terminée représente un nouveau record de répétitions pour un poids donné.
   * @param exerciseName - Nom de l'exercice  
   * @param weight - Poids utilisé
   * @param reps - Répétitions effectuées
   */
  const checkRepsPR = useCallback(
    (exerciseName: string, weight: number, reps: number) => {
      return EnhancedPersonalRecordService.checkRepsPR(exerciseName, weight, reps, records);
    },
    [records]
  );

  /**
   * Met à jour les records pour un exercice après complétion d'une série.
   * @param exerciseName - Nom de l'exercice
   * @param weight - Poids utilisé
   * @param reps - Répétitions effectuées
   * @param date - Date de l'entraînement (format ISO)
   */
  const updateRecords = useCallback(
    async (exerciseName: string, weight: number, reps: number, date: string) => {
      const result = EnhancedPersonalRecordService.updateRecords(
        exerciseName,
        weight,
        reps,
        date,
        records
      );

      setRecords(result.updatedRecords);
      await EnhancedPersonalRecordService.saveRecords(result.updatedRecords);

      return {
        weightPR: result.weightPR,
        repsPR: result.repsPR
      };
    },
    [records]
  );

  /**
   * Vérifie et met à jour temporairement les records pour un exercice (sans les sauvegarder).
   * À utiliser lorsqu'on veut afficher les PR dans l'UI mais attendre avant de les enregistrer.
   * @param exerciseName - Nom de l'exercice
   * @param weight - Poids utilisé
   * @param reps - Répétitions effectuées
   * @param date - Date de l'entraînement (format ISO)
   */
  const checkUpdateRecords = useCallback(
    (exerciseName: string, weight: number, reps: number, date: string) => {
      const result = EnhancedPersonalRecordService.updateRecords(
        exerciseName,
        weight,
        reps,
        date,
        records
      );

      // Met à jour l'état local des records sans les sauvegarder dans le stockage
      setRecords(result.updatedRecords);

      return {
        weightPR: result.weightPR,
        repsPR: result.repsPR
      };
    },
    [records]
  );

  /**
   * Récupère tous les records pour un exercice spécifique.
   * @param exerciseName - Nom de l'exercice
   */
  const getRecordsForExercise = useCallback(
    (exerciseName: string) => {
      return EnhancedPersonalRecordService.getRecordsForExercise(exerciseName, records);
    },
    [records]
  );

  return {
    records,
    loading,
    error,
    checkWeightPR,
    checkRepsPR,
    updateRecords,
    checkUpdateRecords,
    getRecordsForExercise
  };
}; 