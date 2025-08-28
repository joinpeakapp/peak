import { useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import { PersonalRecords, PRCheckResult, PRUpdateResult } from '../types/workout';
import { PersonalRecordService } from '../services/personalRecordService';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Identifiant unique pour cette instance (pour debug)
  const instanceId = useState(() => Math.random().toString(36).substring(2, 15))[0];

  // Fonction pour charger les records depuis le profil
  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      console.log(`[usePersonalRecords:${instanceId}] Loading records from profile...`);
      const data = await PersonalRecordService.loadRecords();
      console.log(`[usePersonalRecords:${instanceId}] Records loaded:`, Object.keys(data));
      setRecords(data);
      setError(null);
      return data;
    } catch (err) {
      console.error(`[usePersonalRecords:${instanceId}] Error loading records:`, err);
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
      console.log(`[usePersonalRecords:${instanceId}] Records updated globally, reloading...`);
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
        console.log(`[usePersonalRecords:${instanceId}] App became active, reloading records...`);
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
      console.log(`[usePersonalRecords:${instanceId}] Temporary update for ${exerciseName}: ${weight}kg x ${reps}`);
      
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
        console.log(`[usePersonalRecords:${instanceId}] Saving records to profile...`);
        
        await PersonalRecordService.saveRecords(recordsToSave);
        
        // Mettre à jour l'état local
        setRecords(recordsToSave);
        
        console.log(`[usePersonalRecords:${instanceId}] Records saved, notifying all listeners...`);
        // Notifier tous les autres hooks qu'il y a eu une mise à jour
        recordsEventManager.notify();
        
      } catch (error) {
        console.error(`[usePersonalRecords:${instanceId}] Failed to save records:`, error);
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
        console.log(`[usePersonalRecords:${instanceId}] Processing completed workout for PR updates...`);
        
        // Utiliser les records actuels comme base
        const result = PersonalRecordService.updateRecordsFromCompletedWorkout(
          completedWorkout,
          records
        );
        
        if (result.hasUpdates) {
          // Sauvegarder les nouveaux records dans le profil
          await saveRecords(result.updatedRecords);
          console.log(`[usePersonalRecords:${instanceId}] ✅ Records updated and saved from completed workout`);
        } else {
          console.log(`[usePersonalRecords:${instanceId}] No PR updates from completed workout`);
        }
        
        return result;
      } catch (error) {
        console.error(`[usePersonalRecords:${instanceId}] Error updating records from workout:`, error);
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
        console.log(`[usePersonalRecords:${instanceId}] Starting migration...`);
        await PersonalRecordService.migrateFromWorkoutHistory(completedWorkouts);
        
        // Recharger les records après migration
        await loadRecords();
        
        // Notifier les autres instances
        recordsEventManager.notify();
        
        console.log(`[usePersonalRecords:${instanceId}] Migration completed`);
      } catch (error) {
        console.error(`[usePersonalRecords:${instanceId}] Migration error:`, error);
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
    migrateFromWorkoutHistory
  };
};

export default usePersonalRecords;
