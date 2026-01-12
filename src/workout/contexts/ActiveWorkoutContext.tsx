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
  weightPlaceholder?: string;
  repsPlaceholder?: string;
}

// Type pour le tracking par temps
export interface TrackingTime {
  completed: boolean;
  duration: number; // Durée en secondes
}

export interface TrackingData {
  [exerciseId: string]: {
    completedSets?: number; // Pour les exercices trackés par sets
    sets?: TrackingSet[]; // Pour les exercices trackés par sets
    completedTimes?: number; // Pour les exercices trackés par temps
    times?: TrackingTime[]; // Pour les exercices trackés par temps
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
  photoUri?: string; // URI de la photo prise après le workout
  isFrontCamera?: boolean; // Indique si la photo a été prise avec la caméra frontale
  originalRecords?: any; // Records originaux capturés au début de la séance
  exercisePRResults?: any; // PRs détectés pendant la séance (pour afficher +1, +2, etc.)
}

// Interface du contexte
interface ActiveWorkoutContextValue {
  activeWorkout: ActiveWorkout | null;
  startWorkout: (workoutId: string, workoutName: string, exercises: Exercise[], initialTrackingData?: TrackingData) => void;
  finishWorkout: (updateStreak?: boolean) => Promise<void>;
  forceCleanupSession: () => Promise<void>; // Nouvelle fonction de nettoyage d'urgence
  updateTrackingData: (exerciseId: string, sets: TrackingSet[], completedSets: number) => void;
  updateTrackingTimeData: (exerciseId: string, times: TrackingTime[], completedTimes: number) => void;
  updateElapsedTime: (newElapsedTime: number) => void;
  updatePhotoUri: (photoUri: string) => void; // Nouvelle fonction pour mettre à jour la photo
  updatePhotoInfo: (photoUri: string, isFrontCamera: boolean) => void; // Fonction pour mettre à jour photo et caméra
  updateExercise: (exerciseId: string, updatedExercise: Exercise) => void; // Nouvelle fonction pour mettre à jour un exercice
  setExercises: (exercises: Exercise[]) => void; // Nouvelle fonction pour remplacer la liste complète d'exercices
  updateSessionData: (originalRecords?: any, exercisePRResults?: any) => void; // Fonction pour mettre à jour les données de session
  resumeWorkout: () => void;
  pauseWorkout: () => void; // Nouvelle fonction pour mettre en pause
  isTrackingWorkout: boolean;
}

// Valeurs par défaut
const defaultContextValue: ActiveWorkoutContextValue = {
  activeWorkout: null,
  startWorkout: () => {},
  finishWorkout: async () => {},
  forceCleanupSession: async () => {}, // Ajout de la nouvelle fonction
  updateTrackingData: () => {},
  updateTrackingTimeData: () => {},
  updateElapsedTime: () => {},
  updatePhotoUri: () => {}, // Ajout de la nouvelle fonction
  updatePhotoInfo: () => {}, // Ajout de la nouvelle fonction
  updateExercise: () => {}, // Nouvelle fonction
  setExercises: () => {}, // Nouvelle fonction
  updateSessionData: () => {}, // Nouvelle fonction pour mettre à jour les données de session
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
        const result = await RobustStorageService.loadActiveSession();
        
        if (result.success && result.data?.activeWorkout) {
          const parsedData = result.data.activeWorkout as ActiveWorkout;
          
          // 🔧 CORRECTIF : Calculer le temps écoulé même si l'app a été fermée complètement
          const now = Date.now();
          let updatedElapsedTime = parsedData.elapsedTime;
          
          // Si la séance était active, calculer le temps écoulé depuis la dernière reprise ou le démarrage
          if (parsedData.isActive && parsedData.lastResumeTime) {
            const timeSinceLastResume = Math.floor((now - parsedData.lastResumeTime) / 1000);
            updatedElapsedTime = parsedData.elapsedTime + timeSinceLastResume;
          } else if (parsedData.pausedAt) {
            // Si la séance était en pause, le temps écoulé reste le même
            // Mais on doit quand même vérifier la validité
          } else if (parsedData.isActive) {
            // Si active mais pas de lastResumeTime, calculer depuis startTime
            const timeSinceStart = Math.floor((now - parsedData.startTime) / 1000);
            updatedElapsedTime = timeSinceStart;
          }
          
          // Vérifier si la séance est toujours valide (pas trop ancienne)
          const timeSinceLastUpdate = parsedData.lastResumeTime ? 
            now - parsedData.lastResumeTime : 
            now - parsedData.startTime;
          const maxInactiveTime = 24 * 60 * 60 * 1000; // 24 heures
          
          if (timeSinceLastUpdate < maxInactiveTime) {
            // Mettre à jour le temps écoulé avec le calcul corrigé
            const restoredData: ActiveWorkout = {
              ...parsedData,
              elapsedTime: updatedElapsedTime,
              lastResumeTime: parsedData.isActive ? now : parsedData.lastResumeTime
            };
            
            setActiveWorkout(restoredData);
            setIsTrackingWorkout(true);
            
            // Reprendre le timer global si la séance était active
            if (parsedData.isActive) {
              startGlobalTimer();
            }
            
            // Sauvegarder immédiatement avec le temps corrigé
            await RobustStorageService.saveActiveSession({
              activeWorkout: restoredData,
              originalRecords: result.data.originalRecords,
              exercisePRResults: result.data.exercisePRResults,
              lastUpdated: new Date().toISOString()
            });
          } else {
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
          originalRecords: activeWorkout.originalRecords,
          exercisePRResults: activeWorkout.exercisePRResults,
          lastUpdated: new Date().toISOString()
        });
      }
  };
  
  // Fonction pour reprendre l'état de workout quand l'app revient au premier plan
  const resumeWorkoutState = async () => {
    if (activeWorkout) {
      const now = Date.now();
      let updatedElapsedTime = activeWorkout.elapsedTime;
      
      // 🔧 CORRECTIF : Calculer le temps écoulé même si l'app a été fermée complètement
      if (activeWorkout.pausedAt) {
        // Si la séance était en pause, ajouter le temps de pause
        const pausedDuration = Math.floor((now - activeWorkout.pausedAt) / 1000);
        updatedElapsedTime = activeWorkout.elapsedTime + pausedDuration;
      } else if (activeWorkout.lastResumeTime) {
        // Si pas de pausedAt mais un lastResumeTime, calculer depuis la dernière reprise
        const timeSinceLastResume = Math.floor((now - activeWorkout.lastResumeTime) / 1000);
        updatedElapsedTime = activeWorkout.elapsedTime + timeSinceLastResume;
      } else {
        // Sinon, calculer depuis le début
        const timeSinceStart = Math.floor((now - activeWorkout.startTime) / 1000);
        updatedElapsedTime = timeSinceStart;
      }
      
      const updatedWorkout = {
        ...activeWorkout,
        elapsedTime: updatedElapsedTime,
        lastResumeTime: now,
        pausedAt: undefined // Réinitialiser la pause
      };
      
      setActiveWorkout(updatedWorkout);
      await RobustStorageService.saveActiveSession({ 
        activeWorkout: updatedWorkout,
        originalRecords: activeWorkout.originalRecords,
        exercisePRResults: activeWorkout.exercisePRResults,
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
          // 🔧 CORRECTIF : Inclure originalRecords et exercisePRResults dans la sauvegarde
          const sessionData = {
            activeWorkout,
            originalRecords: activeWorkout.originalRecords,
            exercisePRResults: activeWorkout.exercisePRResults,
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
  const startWorkout = (
    workoutId: string, 
    workoutName: string, 
    exercises: Exercise[], 
    initialTrackingData?: TrackingData
  ) => {
    // Utiliser les données de tracking fournies ou initialiser par défaut
    const trackingData = initialTrackingData || (() => {
      const defaultTrackingData: TrackingData = {};
      exercises.forEach(exercise => {
        if (exercise.tracking === 'trackedOnTime') {
          // Initialiser avec une durée vide pour les exercices trackés par temps
          defaultTrackingData[exercise.id] = {
            completedTimes: 0,
            times: [{
              completed: false,
              duration: 0
            }]
          };
        } else {
          // Initialiser avec des sets pour les exercices trackés par sets
          defaultTrackingData[exercise.id] = {
            completedSets: 0,
            sets: Array(exercise.sets || 1).fill(0).map(() => ({
              completed: false,
              weight: '',
              reps: '',
            }))
          };
        }
      });
      return defaultTrackingData;
    })();

    const newActiveWorkout: ActiveWorkout = {
      workoutId,
      workoutName,
      exercises,
      startTime: Date.now(),
      elapsedTime: 0,
      lastResumeTime: Date.now(),
      trackingData,
      isActive: true,
    };

    setActiveWorkout(newActiveWorkout);
    setIsTrackingWorkout(true);
    
    // Démarrer le timer global
    startGlobalTimer();
  };

  // Terminer une séance
  const finishWorkout = useCallback(async (updateStreak: boolean = false) => {
    if (!activeWorkout) {
      return;
    }

    try {
      // Arrêter le timer
      stopGlobalTimer();
      
      // Récupérer le workout original pour mettre à jour la streak
      // Uniquement si updateStreak est true (uniquement quand on clique sur "Log Workout")
      if (updateStreak) {
        const originalWorkout = workouts.find(w => w.id === activeWorkout.workoutId);
        if (originalWorkout) {
          await updateStreakOnCompletion(originalWorkout);
          } else {
          console.warn("[ActiveWorkout] Original workout not found for streak update");
        }
      }
      
      // Nettoyer la session active
      const clearResult = await RobustStorageService.clearActiveSession();
      if (!clearResult.success) {
        console.error("[ActiveWorkout] Failed to clear active session:", clearResult.error?.userMessage);
        // Continuer quand même le nettoyage local
      }
      
      // Réinitialiser l'état local
      setActiveWorkout(null);
      setIsTrackingWorkout(false);
      
      } catch (error) {
      console.error("[ActiveWorkout] Error finishing workout:", error);
      // En cas d'erreur, forcer le nettoyage local au minimum
      try {
        setActiveWorkout(null);
        setIsTrackingWorkout(false);
        // Local state reset after error
      } catch (localError) {
        console.error("[ActiveWorkout] Failed to reset local state:", localError);
      }
      throw error; // Re-throw pour que l'appelant puisse gérer l'erreur
    }
  }, [activeWorkout, workouts, updateStreakOnCompletion]);

  // Fonction de nettoyage d'urgence pour les sessions bloquées
  const forceCleanupSession = useCallback(async () => {
    try {
      // Arrêter le timer
      stopGlobalTimer();
      
      // Nettoyer le stockage
      await RobustStorageService.clearActiveSession();
      
      // Réinitialiser l'état local
      setActiveWorkout(null);
      setIsTrackingWorkout(false);
      
      } catch (error) {
      console.error("[ActiveWorkout] Error during force cleanup:", error);
      // Forcer le nettoyage local même en cas d'erreur
      setActiveWorkout(null);
      setIsTrackingWorkout(false);
    }
  }, []);

  // Mettre à jour les données de tracking pour un exercice (sets)
  const updateTrackingData = (exerciseId: string, sets: TrackingSet[], completedSets: number) => {
    if (!activeWorkout) return;

    setActiveWorkout(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        trackingData: {
          ...prev.trackingData,
          [exerciseId]: {
            ...prev.trackingData[exerciseId],
            completedSets,
            sets
          }
        }
      };
    });
  };

  // Mettre à jour les données de tracking pour un exercice (temps)
  const updateTrackingTimeData = (exerciseId: string, times: TrackingTime[], completedTimes: number) => {
    if (!activeWorkout) return;

    setActiveWorkout(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        trackingData: {
          ...prev.trackingData,
          [exerciseId]: {
            ...prev.trackingData[exerciseId],
            completedTimes,
            times
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

  // Mettre à jour l'URI de la photo
  const updatePhotoUri = (photoUri: string) => {
    if (!activeWorkout) return;

    setActiveWorkout(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        photoUri
      };
    });
  };

  // Mettre à jour l'URI de la photo et l'info de la caméra
  const updatePhotoInfo = (photoUri: string, isFrontCamera: boolean) => {
    if (!activeWorkout) return;

    setActiveWorkout(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        photoUri,
        isFrontCamera
      };
    });
  };

  // Mettre à jour un exercice dans l'activeWorkout
  const updateExercise = (exerciseId: string, updatedExercise: Exercise) => {
    if (!activeWorkout) return;

    setActiveWorkout(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        exercises: prev.exercises.map(ex => 
          ex.id === exerciseId ? updatedExercise : ex
        )
      };
    });
  };

  // Remplacer la liste complète d'exercices dans l'activeWorkout
  const setExercises = (exercises: Exercise[]) => {
    if (!activeWorkout) return;

    setActiveWorkout(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        exercises
      };
    });
  };

  // Mettre à jour les données de session (originalRecords et exercisePRResults)
  const updateSessionData = (originalRecords?: any, exercisePRResults?: any) => {
    if (!activeWorkout) return;

    setActiveWorkout(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        originalRecords: originalRecords !== undefined ? originalRecords : prev.originalRecords,
        exercisePRResults: exercisePRResults !== undefined ? exercisePRResults : prev.exercisePRResults
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
        forceCleanupSession,
        updateTrackingData,
        updateTrackingTimeData,
        updateElapsedTime,
        updatePhotoUri,
        updatePhotoInfo,
        updateExercise,
        setExercises,
        updateSessionData,
        resumeWorkout,
        pauseWorkout,
        isTrackingWorkout
      }}
    >
      {children}
    </ActiveWorkoutContext.Provider>
  );
};