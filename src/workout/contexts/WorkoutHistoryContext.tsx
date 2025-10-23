import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Workout, CompletedWorkout, CompletedSet } from '../../types/workout';
import { useStreak } from './StreakContext';
import { RobustStorageService } from '../../services/storage';
import { PersonalRecordService } from '../../services/personalRecordService';
import { usePersonalRecords } from '../../hooks/usePersonalRecords';

interface ExerciseWithTracking {
  id: string;
  name: string;
  sets: Array<{
    weight: number;
    reps: number;
    completed: boolean;
  }>;
  personalRecord?: {
    maxWeight: number;
    maxReps: number;
  };
}

interface TrackingSet {
  weight: string;
  reps: string;
  completed: boolean;
  weightPlaceholder: string;
  repsPlaceholder: string;
}

interface PreviousWorkoutData {
  weightPlaceholder: string;
  repsPlaceholder: string;
  sets?: CompletedSet[];
  personalRecord?: {
    maxWeight: number;
    maxReps: number;
  };
  setCount?: number;
}

interface WorkoutHistoryContextType {
  completedWorkouts: CompletedWorkout[];
  isLoading: boolean;
  error: string | null;
  addCompletedWorkout: (workout: CompletedWorkout, originalWorkout?: Workout) => Promise<void>;
  updateCompletedWorkout: (workoutId: string, updates: Partial<CompletedWorkout>) => Promise<void>;
  getPreviousWorkoutData: (workoutId: string, exerciseName: string) => PreviousWorkoutData;
  getPersonalRecords: (exerciseName: string) => { maxWeight: number; maxReps: number };
  refreshWorkoutHistory: () => Promise<void>;
}

const WorkoutHistoryContext = createContext<WorkoutHistoryContextType | undefined>(undefined);

export const WorkoutHistoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [completedWorkouts, setCompletedWorkouts] = useState<CompletedWorkout[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Commencer à false car préchargé
  const [error, setError] = useState<string | null>(null);
  const { updateStreakOnCompletion } = useStreak();
  const personalRecords = usePersonalRecords();

  // Charger l'historique des entraînements depuis le nouveau service robuste
  useEffect(() => {
    const loadCompletedWorkouts = async () => {
      try {
        // Ne pas afficher de loading car les données sont préchargées
        setError(null);
        
        const result = await RobustStorageService.loadWorkoutHistory();
        
        if (result.success) {
          setCompletedWorkouts(result.data);
          } else {
          console.warn('[WorkoutHistory] Failed to load workout history:', result.error?.userMessage);
          setError(result.error?.userMessage || 'Could not load workout history');
          // Les données par défaut (tableau vide) sont déjà définies par le service
          setCompletedWorkouts([]);
        }
      } catch (error) {
        console.error('[WorkoutHistory] Unexpected error loading completed workouts:', error);
        setError('An unexpected error occurred while loading your workout history');
        setCompletedWorkouts([]);
      }
    };

    loadCompletedWorkouts();
  }, []);

  // Ajouter un nouvel entraînement terminé
  const addCompletedWorkout = async (workout: CompletedWorkout, originalWorkout?: Workout): Promise<void> => {
    try {
      // Mettre à jour l'état local immédiatement pour une meilleure UX
      const updatedWorkouts = [...completedWorkouts, workout];
      setCompletedWorkouts(updatedWorkouts);
      
      // Sauvegarder avec le service robuste
      const result = await RobustStorageService.saveWorkoutHistory(updatedWorkouts);
      
      if (!result.success) {
        console.error('[WorkoutHistory] Failed to save workout:', result.error?.userMessage);
        // Revenir à l'état précédent en cas d'échec
        setCompletedWorkouts(completedWorkouts);
        setError(result.error?.userMessage || 'Could not save your workout');
        return;
      }
      
      // Mettre à jour la streak si l'originalWorkout est fourni
      if (originalWorkout) {
        await updateStreakOnCompletion(originalWorkout);
      }
      
      // Sauvegarder les Personal Records
      await updatePersonalRecords(workout);
      
      // Les stickers seront recalculés automatiquement lors du prochain chargement
      
      setError(null); // Effacer les erreurs précédentes
      
    } catch (error) {
      console.error('[WorkoutHistory] Unexpected error adding completed workout:', error);
      setError('An unexpected error occurred while saving your workout');
      // Revenir à l'état précédent
      setCompletedWorkouts(completedWorkouts);
    }
  };

  // Mettre à jour un entraînement terminé existant
  const updateCompletedWorkout = async (workoutId: string, updates: Partial<CompletedWorkout>): Promise<void> => {
    try {
      // Trouver l'index du workout à mettre à jour
      const workoutIndex = completedWorkouts.findIndex(w => w.id === workoutId);
      if (workoutIndex === -1) {
        console.error('[WorkoutHistory] Workout not found:', workoutId);
        setError('Workout not found');
        return;
      }
      
      // Mettre à jour l'état local immédiatement pour une meilleure UX
      const updatedWorkouts = [...completedWorkouts];
      updatedWorkouts[workoutIndex] = { ...updatedWorkouts[workoutIndex], ...updates };
      setCompletedWorkouts(updatedWorkouts);
      
      // Sauvegarder avec le service robuste
      const result = await RobustStorageService.saveWorkoutHistory(updatedWorkouts);
      
      if (!result.success) {
        console.error('[WorkoutHistory] Failed to update workout:', result.error?.userMessage);
        // Revenir à l'état précédent en cas d'échec
        setCompletedWorkouts(completedWorkouts);
        setError(result.error?.userMessage || 'Could not update your workout');
        return;
      }
      
      setError(null); // Effacer les erreurs précédentes
      
    } catch (error) {
      console.error('[WorkoutHistory] Unexpected error updating completed workout:', error);
      setError('An unexpected error occurred while updating your workout');
      // Revenir à l'état précédent
      setCompletedWorkouts(completedWorkouts);
    }
  };

  // Récupérer les données de la dernière séance pour un exercice
  const getPreviousWorkoutData = useMemo(() => {
    return (workoutId: string, exerciseName: string): PreviousWorkoutData => {
      try {
        if (!completedWorkouts || completedWorkouts.length === 0) {
          return { weightPlaceholder: '', repsPlaceholder: '' };
        }

        // Rechercher le même type de workout par workoutId (ID du template)
        const similarWorkouts = completedWorkouts.filter(
          (workout) => workout.workoutId === workoutId
        );

        if (similarWorkouts.length === 0) {
          console.log(`[WorkoutHistory] No previous workouts found for workoutId: ${workoutId}`);
          return { weightPlaceholder: '', repsPlaceholder: '' };
        }

        // Prendre le dernier workout similaire (le plus récent)
        const lastWorkout = similarWorkouts[similarWorkouts.length - 1];
        console.log(`[WorkoutHistory] Found previous workout for ${workoutId}:`, lastWorkout.id, lastWorkout.date);
        
        // Trouver l'exercice correspondant
        const exercise = lastWorkout.exercises.find(
          (ex) => ex.name.toLowerCase() === exerciseName.toLowerCase()
        );

        if (!exercise || !exercise.sets || exercise.sets.length === 0) {
          console.log(`[WorkoutHistory] No exercise or sets found for ${exerciseName}`);
          return { weightPlaceholder: '', repsPlaceholder: '' };
        }

        console.log(`[WorkoutHistory] Found exercise ${exerciseName} with ${exercise.sets.length} sets`);
        
        // Prendre les dernières valeurs complétées
        const completedSets = exercise.sets.filter((set) => set.completed);
        console.log(`[WorkoutHistory] ${completedSets.length} completed sets found for ${exerciseName}`);
        
        if (completedSets.length === 0) {
          return { 
            weightPlaceholder: '', 
            repsPlaceholder: '',
            sets: [],
            setCount: 0
          };
        }

        // Prendre le dernier set complété
        const lastSet = completedSets[completedSets.length - 1];

        const weightPlaceholder = lastSet.weight > 0 ? lastSet.weight.toString() : '';
        const repsPlaceholder = lastSet.reps > 0 ? lastSet.reps.toString() : '';

        // Récupérer également les records personnels pour cet exercice
        const personalRecord = getPersonalRecords(exerciseName);

        const result = { 
          weightPlaceholder, 
          repsPlaceholder,
          sets: completedSets,  // Utiliser seulement les sets complétés
          personalRecord,
          setCount: completedSets.length  // Compter seulement les sets complétés
        };
        
        console.log(`[WorkoutHistory] Returning placeholders for ${exerciseName}:`, {
          weightPlaceholder,
          repsPlaceholder,
          setCount: completedSets.length,
          sets: completedSets.map(s => `${s.weight}kg x ${s.reps}reps`)
        });
        
        return result;
      } catch (error) {
        console.error(`[WorkoutHistory] Error getting previous workout data: ${error}`);
        return { weightPlaceholder: '', repsPlaceholder: '' };
      }
    };
  }, [completedWorkouts]);

  // Mettre à jour les Personal Records après sauvegarde d'un workout
  const updatePersonalRecords = useCallback(async (workout: CompletedWorkout) => {
    try {
      // Utiliser le hook unifié pour mettre à jour les records
      await personalRecords.updateRecordsFromCompletedWorkout(workout);
      } catch (error) {
      console.error('[WorkoutHistory] Error updating Personal Records:', error);
      // Ne pas faire échouer la sauvegarde du workout pour une erreur de PR
    }
  }, [personalRecords]);

  // Récupérer les records personnels pour un exercice spécifique
  const getPersonalRecords = useMemo(() => {
    return (exerciseName: string) => {
      try {
        if (!completedWorkouts || completedWorkouts.length === 0) {
          return { maxWeight: 0, maxReps: 0 };
        }
        
        let maxWeight = 0;
        let maxReps = 0;
        let prsFound = false;

        // Parcourir tous les entraînements terminés
        for (const workout of completedWorkouts) {
          const exercise = workout.exercises.find(
            (ex) => ex.name.toLowerCase() === exerciseName.toLowerCase()
          );

          if (exercise && exercise.sets) {
            // Parcourir tous les sets complétés pour cet exercice
            exercise.sets.forEach((set: CompletedSet) => {
              if (set.completed) {
                prsFound = true;
                // Mettre à jour le poids max si nécessaire
                if (set.weight > maxWeight) {
                  maxWeight = set.weight;
                  }
                
                // Mettre à jour le nombre max de répétitions si nécessaire
                if (set.reps > maxReps) {
                  maxReps = set.reps;
                  }
              }
            });
          }
        }

        if (!prsFound) {
          return { maxWeight: 0, maxReps: 0 };
        }

        return { maxWeight, maxReps };
      } catch (error) {
        console.error(`[WorkoutHistory] Error getting personal records: ${error}`);
        return { maxWeight: 0, maxReps: 0 };
      }
    };
  }, [completedWorkouts]);

  // Force refresh function to manually reload data
  const refreshWorkoutHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await RobustStorageService.loadWorkoutHistory();
      
      if (result.success) {
        setCompletedWorkouts(result.data);
        }
    } catch (error) {
      console.error('[WorkoutHistory] Error refreshing workout history:', error);
    } finally {
      setIsLoading(false);
    }
  }, []); // Pas de dépendances car on utilise seulement setIsLoading et setCompletedWorkouts

  const value: WorkoutHistoryContextType = {
    completedWorkouts,
    isLoading,
    error,
    addCompletedWorkout,
    updateCompletedWorkout,
    getPreviousWorkoutData,
    getPersonalRecords,
    refreshWorkoutHistory,
  };

  return (
    <WorkoutHistoryContext.Provider
      value={value}
    >
      {children}
    </WorkoutHistoryContext.Provider>
  );
};

export const useWorkoutHistory = () => {
  const context = useContext(WorkoutHistoryContext);
  
  if (!context) {
    throw new Error('useWorkoutHistory must be used within a WorkoutHistoryProvider');
  }
  
  return context;
}; 