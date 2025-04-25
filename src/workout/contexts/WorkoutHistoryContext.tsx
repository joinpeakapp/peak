import React, { createContext, useContext, ReactNode, useCallback, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CompletedWorkout, CompletedSet } from '../../types/workout';

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
  addCompletedWorkout: (workout: CompletedWorkout) => Promise<void>;
  getPreviousWorkoutData: (workoutId: string, exerciseName: string) => PreviousWorkoutData;
  getPersonalRecords: (exerciseName: string) => { maxWeight: number; maxReps: number };
}

const WorkoutHistoryContext = createContext<WorkoutHistoryContextType | undefined>(undefined);

export const WorkoutHistoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [completedWorkouts, setCompletedWorkouts] = useState<CompletedWorkout[]>([]);

  // Charger l'historique des entraînements depuis AsyncStorage
  useEffect(() => {
    const loadCompletedWorkouts = async () => {
      try {
        const storedWorkouts = await AsyncStorage.getItem('completedWorkouts');
        if (storedWorkouts) {
          setCompletedWorkouts(JSON.parse(storedWorkouts));
        }
      } catch (error) {
        console.error('[WorkoutHistory] Error loading completed workouts:', error);
      }
    };

    loadCompletedWorkouts();
  }, []);

  // Ajouter un nouvel entraînement terminé
  const addCompletedWorkout = async (workout: CompletedWorkout) => {
    try {
      const updatedWorkouts = [...completedWorkouts, workout];
      setCompletedWorkouts(updatedWorkouts);
      await AsyncStorage.setItem('completedWorkouts', JSON.stringify(updatedWorkouts));
    } catch (error) {
      console.error('[WorkoutHistory] Error adding completed workout:', error);
    }
  };

  // Récupérer les données de la dernière séance pour un exercice
  const getPreviousWorkoutData = useCallback((workoutId: string, exerciseName: string): PreviousWorkoutData => {
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
  }, [completedWorkouts]);

  // Récupérer les records personnels pour un exercice spécifique
  const getPersonalRecords = useCallback((exerciseName: string) => {
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
  }, [completedWorkouts]);

  return (
    <WorkoutHistoryContext.Provider
      value={{
        completedWorkouts,
        addCompletedWorkout,
        getPreviousWorkoutData,
        getPersonalRecords,
      }}
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