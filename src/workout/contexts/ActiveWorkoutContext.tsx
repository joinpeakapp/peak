import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Exercise } from '../../types/workout';
import { AppState, AppStateStatus } from 'react-native';

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
  pausedAt?: number; // Timestamp quand l'app a été mise en pause
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
  pauseWorkout: () => void; // Nouvelle fonction pour mettre en pause
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
  pauseWorkout: () => {}, // Ajout de la nouvelle fonction
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
  const appStateRef = useRef(AppState.currentState);

  // Chargement de la séance active depuis AsyncStorage au démarrage
  useEffect(() => {
    const loadActiveWorkout = async () => {
      try {
        const storedData = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedData) {
          const parsedData = JSON.parse(storedData) as ActiveWorkout;
          
          // Si le workout avait été mis en pause (app fermée), calculer le temps écoulé pendant l'absence
          if (parsedData.pausedAt && parsedData.isActive) {
            const now = Date.now();
            const pausedDuration = Math.floor((now - parsedData.pausedAt) / 1000);
            
            // Ne pas mettre à jour pausedAt ici pour conserver l'historique
            parsedData.elapsedTime += pausedDuration;
            parsedData.lastResumeTime = now;
            
            // Sauvegarder les changements
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(parsedData));
          }
          
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

  // Gérer les changements d'état de l'app (premier plan, arrière-plan)
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      console.log('[APP STATE] Change from', appStateRef.current, 'to', nextAppState);
      
      // Si l'app passe en arrière-plan
      if (
        appStateRef.current.match(/active/) && 
        (nextAppState === 'background' || nextAppState === 'inactive')
      ) {
        if (activeWorkout && activeWorkout.isActive) {
          await pauseWorkoutState();
        }
      }
      
      // Si l'app revient au premier plan
      if (
        (appStateRef.current === 'background' || appStateRef.current === 'inactive') && 
        nextAppState === 'active'
      ) {
        if (activeWorkout && activeWorkout.isActive) {
          await resumeWorkoutState();
        }
      }
      
      appStateRef.current = nextAppState;
    };
    
    // Écouter les changements d'état de l'app
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, [activeWorkout]);

  // Fonction pour mettre en pause l'état de workout quand l'app passe en arrière-plan
  const pauseWorkoutState = async () => {
    console.log('[WORKOUT] Pausing workout due to app state change');
    
    // Arrêter le timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Sauvegarder le timestamp de mise en pause
    if (activeWorkout) {
      const pausedWorkout = {
        ...activeWorkout,
        pausedAt: Date.now()
      };
      
      setActiveWorkout(pausedWorkout);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(pausedWorkout));
    }
  };
  
  // Fonction pour reprendre l'état de workout quand l'app revient au premier plan
  const resumeWorkoutState = async () => {
    console.log('[WORKOUT] Resuming workout due to app state change');
    
    if (activeWorkout && activeWorkout.pausedAt) {
      const now = Date.now();
      const pausedDuration = Math.floor((now - activeWorkout.pausedAt) / 1000);
      
      const updatedWorkout = {
        ...activeWorkout,
        elapsedTime: activeWorkout.elapsedTime + pausedDuration,
        lastResumeTime: now,
        pausedAt: undefined // Réinitialiser la pause
      };
      
      setActiveWorkout(updatedWorkout);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedWorkout));
      
      // Redémarrer le timer
      startGlobalTimer();
    }
  };

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

  // Reprendre une séance mise en pause (manuellement)
  const resumeWorkout = () => {
    if (!activeWorkout) return;

    setActiveWorkout(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        lastResumeTime: Date.now(),
        pausedAt: undefined,
        isActive: true
      };
    });
    setIsTrackingWorkout(true);
    
    // Démarrer le timer global
    startGlobalTimer();
  };
  
  // Mettre en pause une séance (manuellement)
  const pauseWorkout = () => {
    if (!activeWorkout) return;
    
    // Arrêter le timer
    stopGlobalTimer();
    
    setActiveWorkout(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        pausedAt: Date.now(),
        isActive: false
      };
    });
    setIsTrackingWorkout(false);
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
        pauseWorkout,
        isTrackingWorkout
      }}
    >
      {children}
    </ActiveWorkoutContext.Provider>
  );
}; 