import { useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import { EnhancedPersonalRecords } from '../types/workout';
import { EnhancedPersonalRecordService } from '../services/enhancedPersonalRecordService';

// Gestionnaire d'événements global pour synchroniser toutes les instances
class RecordsEventManager {
  private listeners: Set<() => void> = new Set();

  subscribe(callback: () => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    this.listeners.forEach(callback => callback());
  }
}

const recordsEventManager = new RecordsEventManager();

/**
 * Hook personnalisé pour gérer les records personnels améliorés.
 * Fournit des méthodes pour charger, vérifier et mettre à jour les deux types de PR.
 */
export const useEnhancedPersonalRecords = () => {
  const [records, setRecords] = useState<EnhancedPersonalRecords>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Identifiant unique pour cette instance
  const instanceId = useState(() => Math.random().toString(36).substring(2, 15))[0];

  // Fonction pour charger les records
  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      console.log(`[useEnhancedPersonalRecords:${instanceId}] Loading records from storage...`);
      const data = await EnhancedPersonalRecordService.loadRecords();
      console.log(`[useEnhancedPersonalRecords:${instanceId}] Records loaded:`, Object.keys(data));
      setRecords(data);
      setError(null);
      return data;
    } catch (err) {
      console.error(`[useEnhancedPersonalRecords:${instanceId}] Error loading records:`, err);
      setError('Erreur lors du chargement des records personnels');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [instanceId]);

  // Charger les records au montage du composant
  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // S'abonner aux événements de mise à jour des records
  useEffect(() => {
    const unsubscribe = recordsEventManager.subscribe(() => {
      console.log(`[useEnhancedPersonalRecords:${instanceId}] Records updated globally, reloading...`);
      loadRecords();
    });

    return () => {
      unsubscribe();
    };
  }, [loadRecords, instanceId]);

  // Recharger les records lorsque l'application revient au premier plan
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        console.log(`[useEnhancedPersonalRecords:${instanceId}] App became active, reloading records...`);
        loadRecords();
      }
    });

    return () => subscription?.remove();
  }, [loadRecords, instanceId]);

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
      console.log(`[useEnhancedPersonalRecords:${instanceId}] Updating records for ${exerciseName}: ${weight}kg x ${reps}`);
      
      const result = EnhancedPersonalRecordService.updateRecords(
        exerciseName,
        weight,
        reps,
        date,
        records
      );

      setRecords(result.updatedRecords);
      await EnhancedPersonalRecordService.saveRecords(result.updatedRecords);
      
      console.log(`[useEnhancedPersonalRecords:${instanceId}] Records saved, notifying all listeners...`);
      // Notifier immédiatement tous les autres hooks qu'il y a eu une mise à jour
      recordsEventManager.notify();
      
      // Et aussi après un petit délai pour s'assurer que tous les composants sont prêts
      setTimeout(() => {
        console.log(`[useEnhancedPersonalRecords:${instanceId}] Secondary notification...`);
        recordsEventManager.notify();
      }, 100);

      return {
        weightPR: result.weightPR,
        repsPR: result.repsPR
      };
    },
    [records, instanceId]
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
    loadRecords,
    checkWeightPR,
    checkRepsPR,
    updateRecords,
    checkUpdateRecords,
    getRecordsForExercise
  };
}; 