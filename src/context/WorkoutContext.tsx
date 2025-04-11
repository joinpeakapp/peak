import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Workout, Exercise } from '../types/workout';

// Type de données pour le tracking des exercices
interface TrackingData {
  [exerciseId: string]: {
    completedSets: number;
    sets: Array<{
      completed: boolean;
      weight: string;
      reps: string;
    }>;
  };
}

// Interface enrichie du contexte
interface WorkoutContextType {
  // État de la séance en cours
  activeWorkout: Workout | null;
  isTrackingMode: boolean;
  elapsedTime: number;
  trackingData: TrackingData;
  
  // État général des workouts
  workouts: Workout[];
  loading: boolean;
  error: string | null;
  
  // Actions
  startWorkout: (workout: Workout) => void;
  resumeWorkout: () => void;
  finishWorkout: () => void;
  cancelWorkout: () => void;
  createWorkout: (workout: Partial<Workout>) => void;
  updateWorkout: (workout: Workout) => void;
  deleteWorkout: (workoutId: string) => void;
  
  // Tracking des exercices
  updateTrackingData: (exerciseId: string, data: TrackingData[string]) => void;
  updateSet: (exerciseId: string, setIndex: number, setData: Partial<TrackingData[string]['sets'][0]>) => void;
  
  // Historique des séances 
  completedWorkouts: Array<{
    workout: Workout;
    date: string;
    duration: number;
    trackingData: TrackingData;
  }>;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [isTrackingMode, setIsTrackingMode] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [trackingData, setTrackingData] = useState<TrackingData>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // État général des workouts
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [completedWorkouts, setCompletedWorkouts] = useState<Array<{
    workout: Workout;
    date: string;
    duration: number;
    trackingData: TrackingData;
  }>>([]);

  // Gestion du timer
  useEffect(() => {
    if (isTrackingMode) {
      // Démarrer le timer
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      // Arrêter le timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    // Nettoyer le timer lors du démontage
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTrackingMode]);

  // Démarrer une nouvelle séance
  const startWorkout = useCallback((workout: Workout) => {
    setActiveWorkout(workout);
    
    // Initialiser les données de tracking pour chaque exercice
    const initialTrackingData: TrackingData = {};
    
    workout.exercises.forEach(exercise => {
      initialTrackingData[exercise.id] = {
        completedSets: 0,
        sets: Array(exercise.sets || 1).fill(0).map(() => ({
          completed: false,
          weight: '',
          reps: '',
        }))
      };
    });
    
    setTrackingData(initialTrackingData);
    setIsTrackingMode(true);
    setElapsedTime(0);
  }, []);

  // Reprendre une séance en cours
  const resumeWorkout = useCallback(() => {
    setIsTrackingMode(true);
  }, []);

  // Terminer une séance
  const finishWorkout = useCallback(() => {
    if (activeWorkout) {
      // Sauvegarder la séance complétée
      const completedWorkout = {
        workout: activeWorkout,
        date: new Date().toISOString(),
        duration: elapsedTime,
        trackingData: trackingData
      };
      
      setCompletedWorkouts(prev => [...prev, completedWorkout]);
      
      // Réinitialiser l'état
      setIsTrackingMode(false);
      setElapsedTime(0);
      setTrackingData({});
      setActiveWorkout(null);
    }
  }, [activeWorkout, elapsedTime, trackingData]);

  // Annuler une séance
  const cancelWorkout = useCallback(() => {
    setIsTrackingMode(false);
    setElapsedTime(0);
    setTrackingData({});
    setActiveWorkout(null);
  }, []);

  // Mettre à jour les données de tracking pour un exercice spécifique
  const updateTrackingData = useCallback((exerciseId: string, data: TrackingData[string]) => {
    setTrackingData(prev => ({
      ...prev,
      [exerciseId]: data
    }));
  }, []);

  // Mettre à jour un set spécifique
  const updateSet = useCallback((exerciseId: string, setIndex: number, setData: Partial<TrackingData[string]['sets'][0]>) => {
    setTrackingData(prev => {
      const exercise = prev[exerciseId];
      if (!exercise) return prev;
      
      const newSets = [...exercise.sets];
      newSets[setIndex] = { ...newSets[setIndex], ...setData };
      
      // Calculer le nombre de sets complétés
      const completedSets = newSets.filter(set => set.completed).length;
      
      return {
        ...prev,
        [exerciseId]: {
          ...exercise,
          sets: newSets,
          completedSets
        }
      };
    });
  }, []);

  // Fonction pour créer un workout
  const createWorkout = useCallback((workoutData: Partial<Workout>) => {
    const newWorkout: Workout = {
      id: String(Date.now()),
      name: workoutData.name || 'New Workout',
      date: new Date().toISOString(),
      duration: workoutData.duration || 0,
      exercises: workoutData.exercises || [],
      frequency: workoutData.frequency || { type: 'weekly', value: 1 },
      streak: 0,
      nextDueDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...workoutData
    };
    
    setWorkouts(prev => [...prev, newWorkout]);
    return newWorkout;
  }, []);

  // Fonction pour mettre à jour un workout
  const updateWorkout = useCallback((updatedWorkout: Workout) => {
    setWorkouts(prev => prev.map(workout => 
      workout.id === updatedWorkout.id ? updatedWorkout : workout
    ));
  }, []);

  // Fonction pour supprimer un workout
  const deleteWorkout = useCallback((workoutId: string) => {
    setWorkouts(prev => prev.filter(workout => workout.id !== workoutId));
  }, []);

  return (
    <WorkoutContext.Provider
      value={{
        activeWorkout,
        isTrackingMode,
        elapsedTime,
        trackingData,
        workouts,
        loading,
        error,
        startWorkout,
        resumeWorkout,
        finishWorkout,
        cancelWorkout,
        createWorkout,
        updateWorkout,
        deleteWorkout,
        updateTrackingData,
        updateSet,
        completedWorkouts
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