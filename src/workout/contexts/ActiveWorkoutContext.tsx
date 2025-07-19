import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Exercise } from '../../types/workout';
import { AppState, AppStateStatus } from 'react-native';
import { useStreak } from './StreakContext';
import { useWorkout } from '../../hooks/useWorkout';
import { RobustStorageService } from '../../services/storage';

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
  exercises: Exercise[];
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
  finishWorkout: (updateStreak?: boolean) => Promise<void>;
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
  const { getWorkoutStreak, updateStreakOnCompletion } = useStreak();
  const { workouts } = useWorkout();

  // Chargement de la séance active depuis le service robuste au démarrage
  useEffect(() => {
    const loadActiveWorkout = async () => {
      try {
        console.log('[ActiveWorkout] Loading active session from robust storage...');
        const result = await RobustStorageService.loadActiveSession();
        
        if (result.success && result.data?.activeWorkout) {
          const parsedData = result.data.activeWorkout as ActiveWorkout;
          
          // Vérifier si la séance est toujours valide (pas trop ancienne)
          const timeSinceLastUpdate = parsedData.lastResumeTime ? 
            Date.now() - parsedData.lastResumeTime : 
            Date.now() - parsedData.startTime;
          const maxInactiveTime = 24 * 60 * 60 * 1000; // 24 heures
          
          if (timeSinceLastUpdate < maxInactiveTime) {
            console.log('[ActiveWorkout] Restoring active workout session');
            setActiveWorkout(parsedData);
            setIsTrackingWorkout(true);
            
            // Reprendre le timer global si la séance était active
            if (parsedData.isActive) {
              startGlobalTimer();
            }
          } else {
            console.log('[ActiveWorkout] Active workout session expired, clearing...');
            await RobustStorageService.clearActiveSession();
          }
        }
      } catch (error) {
        console.error('[ActiveWorkout] Error loading active workout:', error);
      }
    };

    loadActiveWorkout();
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
      await RobustStorageService.saveActiveSession({ 
        activeWorkout: pausedWorkout,
        lastUpdated: new Date().toISOString()
      });
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
      await RobustStorageService.saveActiveSession({ 
        activeWorkout: updatedWorkout,
        lastUpdated: new Date().toISOString()
      });
      
      // Redémarrer le timer
      startGlobalTimer();
    }
  };

  // Fonction pour démarrer le timer global
  const startGlobalTimer = () => {
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
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Sauvegarde de la séance active avec le service robuste à chaque mise à jour
  useEffect(() => {
    const saveActiveWorkout = async () => {
      try {
        if (activeWorkout) {
          const sessionData = {
            activeWorkout,
            lastUpdated: new Date().toISOString()
          };
          
          const result = await RobustStorageService.saveActiveSession(sessionData);
          if (!result.success) {
            console.error('[ActiveWorkout] Failed to save active session:', result.error?.userMessage);
          }
        } else {
          await RobustStorageService.clearActiveSession();
        }
      } catch (error) {
        console.error('[ActiveWorkout] Error saving active workout:', error);
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
      exercises,
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
  const finishWorkout = useCallback(async (updateStreak: boolean = false) => {
    console.log("[ActiveWorkout] Finishing workout");
    if (!activeWorkout) return;

    try {
        // Arrêter le timer
        stopGlobalTimer();
        
        // Ici, on pourrait sauvegarder l'historique de la séance dans une autre partie de l'application
        // Pour le moment, on se contente de réinitialiser l'état
        setActiveWorkout(null);
        setIsTrackingWorkout(false);
        await RobustStorageService.clearActiveSession();

      // Récupérer le workout original pour mettre à jour la streak
      // Uniquement si updateStreak est true (uniquement quand on clique sur "Log Workout")
      if (updateStreak) {
        const originalWorkout = workouts.find(w => w.id === activeWorkout.workoutId);
        if (originalWorkout) {
          await updateStreakOnCompletion(originalWorkout);
        }
      }
    } catch (error) {
      console.error("[ActiveWorkout] Error finishing workout:", error);
    }
  }, [activeWorkout, workouts, updateStreakOnCompletion]);

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