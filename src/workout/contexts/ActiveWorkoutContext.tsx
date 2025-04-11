import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Exercise } from '../../types/workout';

// Types pour la séance active
export interface TrackingSet {
  completed: boolean;
  weight: string;
  reps: string;
}

export interface TrackingData {
  [exerciseId: string]: {
    completedSets: number;
    sets: TrackingSet[];
  };
}

export interface ActiveWorkout {
  workoutId: string;
  workoutName: string;
  startTime: number;
  elapsedTime: number; // en secondes
  lastResumeTime?: number; // Timestamp pour calculer les périodes d'arrêt/reprise
  trackingData: TrackingData;
  isActive: boolean;
}

// Interface du contexte
interface ActiveWorkoutContextValue {
  activeWorkout: ActiveWorkout | null;
  startWorkout: (workoutId: string, workoutName: string, exercises: Exercise[]) => void;
  finishWorkout: () => Promise<void>;
  updateTrackingData: (exerciseId: string, sets: TrackingSet[], completedSets: number) => void;
  updateElapsedTime: (newElapsedTime: number) => void;
  resumeWorkout: () => void;
  isTrackingWorkout: boolean;
}

// Valeurs par défaut
const defaultContextValue: ActiveWorkoutContextValue = {
  activeWorkout: null,
  startWorkout: () => {},
  finishWorkout: async () => {},
  updateTrackingData: () => {},
  updateElapsedTime: () => {},
  resumeWorkout: () => {},
  isTrackingWorkout: false,
};

// Création du contexte
const ActiveWorkoutContext = createContext<ActiveWorkoutContextValue>(defaultContextValue);

// Hook personnalisé pour utiliser le contexte
export const useActiveWorkout = () => useContext(ActiveWorkoutContext);

// Clé pour AsyncStorage
const STORAGE_KEY = 'activeWorkoutData';

export const ActiveWorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(null);
  const [isTrackingWorkout, setIsTrackingWorkout] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Chargement de la séance active depuis AsyncStorage au démarrage
  useEffect(() => {
    const loadActiveWorkout = async () => {
      try {
        const storedData = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedData) {
          const parsedData = JSON.parse(storedData) as ActiveWorkout;
          setActiveWorkout(parsedData);
          setIsTrackingWorkout(parsedData.isActive);
          
          // Si la séance est active, on démarre immédiatement le timer
          if (parsedData.isActive) {
            startGlobalTimer();
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la séance active:', error);
      }
    };

    loadActiveWorkout();
    
    // Nettoyage du timer lors du démontage
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  // Fonction pour démarrer le timer global
  const startGlobalTimer = () => {
    console.log('[GLOBAL TIMER] Démarrage du timer global');
    
    // Nettoyage du timer existant si nécessaire
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Démarrage d'un nouveau timer
    timerRef.current = setInterval(() => {
      setActiveWorkout(prev => {
        if (!prev || !prev.isActive) return prev;
        
        return {
          ...prev,
          elapsedTime: prev.elapsedTime + 1
        };
      });
    }, 1000);
  };
  
  // Fonction pour arrêter le timer global
  const stopGlobalTimer = () => {
    console.log('[GLOBAL TIMER] Arrêt du timer global');
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Sauvegarde de la séance active dans AsyncStorage à chaque mise à jour
  useEffect(() => {
    const saveActiveWorkout = async () => {
      try {
        if (activeWorkout) {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(activeWorkout));
        } else {
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      } catch (error) {
        console.error('Erreur lors de la sauvegarde de la séance active:', error);
      }
    };

    saveActiveWorkout();
  }, [activeWorkout]);

  // Démarrer une nouvelle séance
  const startWorkout = (workoutId: string, workoutName: string, exercises: Exercise[]) => {
    // Initialiser les données de tracking pour chaque exercice
    const initialTrackingData: TrackingData = {};
    exercises.forEach(exercise => {
      initialTrackingData[exercise.id] = {
        completedSets: 0,
        sets: Array(exercise.sets || 1).fill(0).map(() => ({
          completed: false,
          weight: '',
          reps: '',
        }))
      };
    });

    const newActiveWorkout: ActiveWorkout = {
      workoutId,
      workoutName,
      startTime: Date.now(),
      elapsedTime: 0,
      lastResumeTime: Date.now(),
      trackingData: initialTrackingData,
      isActive: true,
    };

    setActiveWorkout(newActiveWorkout);
    setIsTrackingWorkout(true);
    
    // Démarrer le timer global
    startGlobalTimer();
  };

  // Terminer une séance
  const finishWorkout = async () => {
    try {
      if (activeWorkout) {
        // Arrêter le timer
        stopGlobalTimer();
        
        // Ici, on pourrait sauvegarder l'historique de la séance dans une autre partie de l'application
        // Pour le moment, on se contente de réinitialiser l'état
        setActiveWorkout(null);
        setIsTrackingWorkout(false);
        await AsyncStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error('Erreur lors de la finalisation de la séance:', error);
    }
  };

  // Mettre à jour les données de tracking pour un exercice
  const updateTrackingData = (exerciseId: string, sets: TrackingSet[], completedSets: number) => {
    if (!activeWorkout) return;

    setActiveWorkout(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        trackingData: {
          ...prev.trackingData,
          [exerciseId]: {
            completedSets,
            sets
          }
        }
      };
    });
  };

  // Mettre à jour le temps écoulé
  const updateElapsedTime = (newElapsedTime: number) => {
    if (!activeWorkout) return;

    setActiveWorkout(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        elapsedTime: newElapsedTime
      };
    });
  };

  // Reprendre une séance mise en pause
  const resumeWorkout = () => {
    if (!activeWorkout) return;

    setActiveWorkout(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        lastResumeTime: Date.now(),
        isActive: true
      };
    });
    setIsTrackingWorkout(true);
    
    // Démarrer le timer global
    startGlobalTimer();
  };

  return (
    <ActiveWorkoutContext.Provider
      value={{
        activeWorkout,
        startWorkout,
        finishWorkout,
        updateTrackingData,
        updateElapsedTime,
        resumeWorkout,
        isTrackingWorkout
      }}
    >
      {children}
    </ActiveWorkoutContext.Provider>
  );
}; 