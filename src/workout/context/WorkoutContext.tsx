import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Workout, Exercise } from '../types/workout';

interface WorkoutContextType {
  currentWorkout: Workout | null;
  startWorkout: (workout: Workout) => Promise<void>;
  endWorkout: () => Promise<void>;
  updateExerciseTracking: (exerciseId: string, tracking: {
    sets: Array<{
      reps: number;
      weight: number;
      completed: boolean;
    }>;
  }) => Promise<void>;
  elapsedTime: number;
  isWorkoutActive: boolean;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentWorkout, setCurrentWorkout] = useState<Workout | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

  // Charger l'état du workout au démarrage
  useEffect(() => {
    loadWorkoutState();
  }, []);

  // Gérer le timer
  useEffect(() => {
    if (isWorkoutActive) {
      const interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
      setTimerInterval(interval);
    } else if (timerInterval) {
      clearInterval(timerInterval);
    }

    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [isWorkoutActive]);

  const loadWorkoutState = async () => {
    try {
      const savedWorkout = await AsyncStorage.getItem('currentWorkout');
      const savedTime = await AsyncStorage.getItem('workoutElapsedTime');
      const savedIsActive = await AsyncStorage.getItem('workoutIsActive');

      if (savedWorkout && savedIsActive === 'true') {
        setCurrentWorkout(JSON.parse(savedWorkout));
        setElapsedTime(parseInt(savedTime || '0', 10));
        setIsWorkoutActive(true);
      }
    } catch (error) {
      console.error('Error loading workout state:', error);
    }
  };

  const saveWorkoutState = async () => {
    try {
      if (currentWorkout) {
        await AsyncStorage.setItem('currentWorkout', JSON.stringify(currentWorkout));
        await AsyncStorage.setItem('workoutElapsedTime', elapsedTime.toString());
        await AsyncStorage.setItem('workoutIsActive', isWorkoutActive.toString());
      }
    } catch (error) {
      console.error('Error saving workout state:', error);
    }
  };

  const startWorkout = async (workout: Workout) => {
    setCurrentWorkout(workout);
    setElapsedTime(0);
    setIsWorkoutActive(true);
    await saveWorkoutState();
  };

  const endWorkout = async () => {
    setCurrentWorkout(null);
    setElapsedTime(0);
    setIsWorkoutActive(false);
    await AsyncStorage.removeItem('currentWorkout');
    await AsyncStorage.removeItem('workoutElapsedTime');
    await AsyncStorage.removeItem('workoutIsActive');
  };

  const updateExerciseTracking = async (exerciseId: string, tracking: {
    sets: Array<{
      reps: number;
      weight: number;
      completed: boolean;
    }>;
  }) => {
    if (!currentWorkout) return;

    const updatedWorkout = {
      ...currentWorkout,
      exercises: currentWorkout.exercises.map(exercise => {
        if (exercise.id === exerciseId) {
          return {
            ...exercise,
            sets: tracking.sets.map(set => ({
              ...set,
              completed: set.completed
            }))
          };
        }
        return exercise;
      })
    };

    setCurrentWorkout(updatedWorkout);
    await saveWorkoutState();
  };

  return (
    <WorkoutContext.Provider
      value={{
        currentWorkout,
        startWorkout,
        endWorkout,
        updateExerciseTracking,
        elapsedTime,
        isWorkoutActive
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (context === undefined) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
}; 