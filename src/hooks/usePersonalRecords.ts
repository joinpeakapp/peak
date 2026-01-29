import { useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import { PersonalRecords, PRCheckResult, PRUpdateResult } from '../types/workout';
import { PersonalRecordService } from '../services/personalRecordService';
import logger from '../utils/logger';

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
 * Hook unifié pour gérer les Personal Records.
 * Fournit des méthodes pour charger, vérifier et mettre à jour les PRs.
 * Les records sont stockés dans le profil utilisateur et sauvegardés seulement 
 * quand un workout est validé et loggé.
 */
export const usePersonalRecords = () => {
  const [records, setRecords] = useState<PersonalRecords>({});
  const [loading, setLoading] = useState(false); // Commencer à false car préchargé
  const [error, setError] = useState<string | null>(null);
  
  // Identifiant unique pour cette instance (pour debug)
  const instanceId = useState(() => Math.random().toString(36).substring(2, 15))[0];

  // Fonction pour charger les records depuis le profil
  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const data = await PersonalRecordService.loadRecords();
      setRecords(data);
      setError(null);
      return data;
    } catch (err) {
      logger.error(`[usePersonalRecords:${instanceId}] Error loading records:`, err);
      setError('Erreur lors du chargement des records personnels');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [instanceId]);

  // Charger les records au montage du hook
  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // S'abonner aux événements de mise à jour des records
  useEffect(() => {
    const unsubscribe = recordsEventManager.subscribe(() => {
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
        loadRecords();
      }
    });

    return () => subscription?.remove();
  }, [loadRecords, instanceId]);

  /**
   * Vérifie si un poids représente un nouveau Weight PR.
   */
  const checkWeightPR = useCallback(
    (exerciseName: string, weight: number) => {
      return PersonalRecordService.checkWeightPR(exerciseName, weight, records);
    },
    [records]
  );

  /**
   * Vérifie si des répétitions représentent un nouveau Reps PR.
   */
  const checkRepsPR = useCallback(
    (exerciseName: string, weight: number, reps: number) => {
      return PersonalRecordService.checkRepsPR(exerciseName, weight, reps, records);
    },
    [records]
  );

  /**
   * Vérifie les PRs potentiels pour un set donné.
   */
  const checkPRs = useCallback(
    (exerciseName: string, weight: number, reps: number): PRCheckResult => {
      return PersonalRecordService.checkPRs(exerciseName, weight, reps, records);
    },
    [records]
  );

  /**
   * Met à jour temporairement les records en mémoire (sans sauvegarde).
   * Utilisé pour l'affichage en temps réel pendant un workout.
   * Les records ne sont PAS sauvegardés dans le profil.
   */
  const updateRecordsTemporary = useCallback(
    (exerciseName: string, weight: number, reps: number, date: string): PRUpdateResult => {
      const result = PersonalRecordService.updateRecords(
        exerciseName,
        weight,
        reps,
        date,
        records
      );

      // Met à jour l'état local seulement (pas de sauvegarde)
      setRecords(result.updatedRecords);

      return result;
    },
    [records, instanceId]
  );

  /**
   * Sauvegarde définitivement les records dans le profil utilisateur.
   * Cette méthode doit être appelée seulement quand un workout est validé et loggé.
   */
  const saveRecords = useCallback(
    async (recordsToSave: PersonalRecords): Promise<void> => {
      try {
        await PersonalRecordService.saveRecords(recordsToSave);
        
        // Mettre à jour l'état local
        setRecords(recordsToSave);
        
        // Notifier tous les autres hooks qu'il y a eu une mise à jour
        recordsEventManager.notify();
        
      } catch (error) {
        logger.error(`[usePersonalRecords:${instanceId}] Failed to save records:`, error);
        throw error;
      }
    },
    [instanceId]
  );

  /**
   * Met à jour et sauvegarde les records à partir d'un workout complété.
   * Cette méthode doit être appelée seulement quand un workout est validé et loggé.
   */
  const updateRecordsFromCompletedWorkout = useCallback(
    async (completedWorkout: {
      date: string;
      exercises: Array<{
        name: string;
        sets: Array<{
          weight: number;
          reps: number;
          completed: boolean;
        }>;
      }>;
    }): Promise<{ hasUpdates: boolean; updatedRecords: PersonalRecords }> => {
      try {
        // Utiliser les records actuels comme base
        const result = PersonalRecordService.updateRecordsFromCompletedWorkout(
          completedWorkout,
          records
        );
        
        if (result.hasUpdates) {
          // Sauvegarder les nouveaux records dans le profil
          await saveRecords(result.updatedRecords);
          } else {
          }
        
        return result;
      } catch (error) {
        logger.error(`[usePersonalRecords:${instanceId}] Error updating records from workout:`, error);
        throw error;
      }
    },
    [records, saveRecords, instanceId]
  );

  /**
   * Récupère tous les records pour un exercice spécifique.
   */
  const getRecordsForExercise = useCallback(
    (exerciseName: string) => {
      return PersonalRecordService.getRecordsForExercise(exerciseName, records);
    },
    [records]
  );

  /**
   * Migre les records depuis l'historique des workouts.
   */
  const migrateFromWorkoutHistory = useCallback(
    async (completedWorkouts: Array<any>): Promise<void> => {
      try {
        await PersonalRecordService.migrateFromWorkoutHistory(completedWorkouts);
        
        // Recharger les records après migration
        await loadRecords();
        
        // Notifier les autres instances
        recordsEventManager.notify();
        
        } catch (error) {
        logger.error(`[usePersonalRecords:${instanceId}] Migration error:`, error);
        throw error;
      }
    },
    [loadRecords, instanceId]
  );

  // Supprimer un record de répétitions spécifique
  const deleteRepRecord = useCallback(
    async (exerciseName: string, weight: string): Promise<void> => {
      try {
        await PersonalRecordService.deleteRepRecord(exerciseName, weight);
        
        // Recharger les records après suppression
        await loadRecords();
        
        // Notifier les autres instances
        recordsEventManager.notify();
        
        } catch (error) {
        logger.error(`[usePersonalRecords:${instanceId}] Error deleting rep record:`, error);
        throw error;
      }
    },
    [loadRecords, instanceId]
  );

  // Supprimer tous les records pour un exercice
  const deleteAllRecordsForExercise = useCallback(
    async (exerciseName: string): Promise<void> => {
      try {
        await PersonalRecordService.deleteAllRecordsForExercise(exerciseName);
        
        // Recharger les records après suppression
        await loadRecords();
        
        // Notifier les autres instances
        recordsEventManager.notify();
        
        } catch (error) {
        logger.error(`[usePersonalRecords:${instanceId}] Error deleting all records:`, error);
        throw error;
      }
    },
    [loadRecords, instanceId]
  );

  return {
    records,
    loading,
    error,
    loadRecords,
    checkWeightPR,
    checkRepsPR,
    checkPRs,
    updateRecordsTemporary,
    saveRecords,
    updateRecordsFromCompletedWorkout,
    getRecordsForExercise,
    migrateFromWorkoutHistory,
    deleteRepRecord,
    deleteAllRecordsForExercise
  };
};

export default usePersonalRecords;
