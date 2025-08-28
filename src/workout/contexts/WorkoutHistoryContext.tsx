import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Workout, CompletedWorkout, CompletedSet } from '../../types/workout';
import { useStreak } from './StreakContext';
import { RobustStorageService } from '../../services/storage';
import { PersonalRecordService } from '../../services/personalRecordService';

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { updateStreakOnCompletion } = useStreak();

  // Charger l'historique des entraînements depuis le nouveau service robuste
  useEffect(() => {
    const loadCompletedWorkouts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('[WorkoutHistory] Loading workout history from robust storage...');
        const result = await RobustStorageService.loadWorkoutHistory();
        
        if (result.success) {
          setCompletedWorkouts(result.data);
          console.log(`[WorkoutHistory] Loaded ${result.data.length} completed workouts`);
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
      } finally {
        setIsLoading(false);
      }
    };

    loadCompletedWorkouts();
  }, []);

  // Ajouter un nouvel entraînement terminé
  const addCompletedWorkout = async (workout: CompletedWorkout, originalWorkout?: Workout): Promise<void> => {
    try {
      console.log('[WorkoutHistory] Adding completed workout:', workout.name);
      
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
      
      console.log('[WorkoutHistory] Successfully added completed workout');
      
      // Sauvegarder les Personal Records
      await updatePersonalRecords(workout);
      
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
      console.log('[WorkoutHistory] Updating completed workout:', workoutId);
      
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
      
      console.log('[WorkoutHistory] Successfully updated completed workout');
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
        console.log(`[WorkoutHistory] Getting previous data for ${exerciseName} in workout ${workoutId}`);
        
        if (!completedWorkouts || completedWorkouts.length === 0) {
          console.log(`[WorkoutHistory] No completed workouts found`);
          return { weightPlaceholder: '', repsPlaceholder: '' };
        }

        // Rechercher le même type de workout par ID
        const similarWorkouts = completedWorkouts.filter(
          (workout) => workout.id === workoutId
        );

        if (similarWorkouts.length === 0) {
          console.log(`[WorkoutHistory] No previous workouts with ID ${workoutId} found`);
          return { weightPlaceholder: '', repsPlaceholder: '' };
        }

        // Prendre le dernier workout similaire (le plus récent)
        const lastWorkout = similarWorkouts[similarWorkouts.length - 1];
        
        // Trouver l'exercice correspondant
        const exercise = lastWorkout.exercises.find(
          (ex) => ex.name.toLowerCase() === exerciseName.toLowerCase()
        );

        if (!exercise || !exercise.sets || exercise.sets.length === 0) {
          console.log(`[WorkoutHistory] No previous data found for ${exerciseName}`);
          return { weightPlaceholder: '', repsPlaceholder: '' };
        }

        // Prendre les dernières valeurs complétées
        const completedSets = exercise.sets.filter((set) => set.completed);
        
        if (completedSets.length === 0) {
          console.log(`[WorkoutHistory] No completed sets found for ${exerciseName}`);
          return { 
            weightPlaceholder: '', 
            repsPlaceholder: '',
            sets: exercise.sets,
            setCount: exercise.sets.length
          };
        }

        // Prendre le dernier set complété (ou le dernier set tout court si aucun n'est complété)
        const lastSet = completedSets[completedSets.length - 1];

        const weightPlaceholder = lastSet.weight > 0 ? lastSet.weight.toString() : '';
        const repsPlaceholder = lastSet.reps > 0 ? lastSet.reps.toString() : '';

        // Récupérer également les records personnels pour cet exercice
        const personalRecord = getPersonalRecords(exerciseName);

        console.log(`[WorkoutHistory] Previous data for ${exerciseName}: ${weightPlaceholder}kg, ${repsPlaceholder} reps, ${exercise.sets.length} sets`);
        
        return { 
          weightPlaceholder, 
          repsPlaceholder,
          sets: exercise.sets,
          personalRecord,
          setCount: exercise.sets.length
        };
      } catch (error) {
        console.error(`[WorkoutHistory] Error getting previous workout data: ${error}`);
        return { weightPlaceholder: '', repsPlaceholder: '' };
      }
    };
  }, [completedWorkouts]);

  // Mettre à jour les Personal Records après sauvegarde d'un workout
  const updatePersonalRecords = useCallback(async (workout: CompletedWorkout) => {
    try {
      console.log('[WorkoutHistory] Updating Personal Records for workout:', workout.name);
      
      // Charger les records actuels
      const currentRecords = await PersonalRecordService.loadRecords();
      let updatedRecords = { ...currentRecords };
      let hasUpdates = false;
      
      // Traiter chaque exercice du workout
      for (const exercise of workout.exercises) {
        console.log(`[WorkoutHistory] Processing exercise: ${exercise.name}`);
        
        // Traiter chaque set complété
        for (const set of exercise.sets) {
          if (set.completed && set.weight > 0 && set.reps > 0) {
            console.log(`[WorkoutHistory] Processing set: ${set.weight}kg x ${set.reps} reps`);
            
            // Mettre à jour les records pour ce set
            const result = PersonalRecordService.updateRecords(
              exercise.name,
              set.weight,
              set.reps,
              workout.date,
              updatedRecords
            );
            
            if (result.weightPR || result.repsPR) {
              hasUpdates = true;
              updatedRecords = result.updatedRecords;
              
              if (result.weightPR) {
                console.log(`[WorkoutHistory] ✅ New weight PR for ${exercise.name}: ${result.weightPR.weight}kg`);
              }
              if (result.repsPR) {
                console.log(`[WorkoutHistory] ✅ New reps PR for ${exercise.name}: ${result.repsPR.reps} reps at ${result.repsPR.weight}kg`);
              }
            }
          }
        }
      }
      
      // Sauvegarder seulement si il y a des mises à jour
      if (hasUpdates) {
        console.log('[WorkoutHistory] Saving updated Personal Records');
        await PersonalRecordService.saveRecords(updatedRecords);
        console.log('[WorkoutHistory] ✅ Personal Records saved successfully');
      } else {
        console.log('[WorkoutHistory] No Personal Records updates needed');
      }
      
    } catch (error) {
      console.error('[WorkoutHistory] Error updating Personal Records:', error);
      // Ne pas faire échouer la sauvegarde du workout pour une erreur de PR
    }
  }, []);

  // Récupérer les records personnels pour un exercice spécifique
  const getPersonalRecords = useMemo(() => {
    return (exerciseName: string) => {
      try {
        console.log(`[WorkoutHistory] Getting personal records for ${exerciseName}`);
        
        if (!completedWorkouts || completedWorkouts.length === 0) {
          console.log(`[WorkoutHistory] No completed workouts found`);
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
                  console.log(`[WorkoutHistory] New weight PR found: ${maxWeight}kg for ${exerciseName}`);
                }
                
                // Mettre à jour le nombre max de répétitions si nécessaire
                if (set.reps > maxReps) {
                  maxReps = set.reps;
                  console.log(`[WorkoutHistory] New reps PR found: ${maxReps} reps for ${exerciseName}`);
                }
              }
            });
          }
        }

        if (!prsFound) {
          console.log(`[WorkoutHistory] No completed sets found for ${exerciseName}`);
          return { maxWeight: 0, maxReps: 0 };
        }

        console.log(`[WorkoutHistory] PR for ${exerciseName}: ${maxWeight}kg, ${maxReps} reps`);
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
        console.log(`[WorkoutHistory] Refreshed: ${result.data.length} completed workouts`);
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