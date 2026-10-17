import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Exercise } from '../../types/workout';
import { AppState, AppStateStatus } from 'react-native';
import { useStreak } from './StreakContext';
import { useWorkout } from '../../hooks/useWorkout';
import { RobustStorageService } from '../../services/storage';
import NotificationService from '../../services/notificationService';
import logger from '../../utils/logger';

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
  elapsedTime: number; // en secondes, instantané : lire via computeElapsedSeconds / useWorkoutElapsedSeconds
  lastResumeTime?: number; // Timestamp pour calculer les périodes d'arrêt/reprise
  pausedAt?: number; // Timestamp de la mise en pause manuelle (isActive = false)
  pausedDuration?: number; // Total des pauses manuelles terminées, en ms
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

// Temps écoulé dérivé de l'horloge : l'arrière-plan et un kill de l'app sont comptés une seule fois
export const computeElapsedSeconds = (workout: ActiveWorkout, now: number = Date.now()): number => {
  const end = workout.isActive ? now : workout.pausedAt ?? now;
  return Math.max(0, Math.floor((end - workout.startTime - (workout.pausedDuration ?? 0)) / 1000));
};

export const ActiveWorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(null);
  const [isTrackingWorkout, setIsTrackingWorkout] = useState(false);
  const inactivityCheckRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityTimeRef = useRef<number>(Date.now());
  const appStateRef = useRef(AppState.currentState);
  const { getWorkoutStreak, updateStreakOnCompletion } = useStreak();
  const { workouts } = useWorkout();

  // Chargement de la séance active depuis le service robuste au démarrage
  useEffect(() => {
    const loadActiveWorkout = async () => {
      try {
        const result = await RobustStorageService.loadActiveSession();
        
        if (result.success && result.data?.activeWorkout) {
          const storedWorkout = result.data.activeWorkout as ActiveWorkout;
          // Les anciennes versions posaient pausedAt en arrière-plan alors que isActive restait true :
          // ce n'était pas une vraie pause.
          const parsedData: ActiveWorkout = {
            ...storedWorkout,
            pausedAt: storedWorkout.isActive ? undefined : storedWorkout.pausedAt,
          };
          const now = Date.now();
          const maxSessionAge = 24 * 60 * 60 * 1000; // 24 heures

          if (now - parsedData.startTime < maxSessionAge) {
            // Recalculer le temps écoulé depuis l'horloge et restaurer les PR data
            const restoredData: ActiveWorkout = {
              ...parsedData,
              elapsedTime: computeElapsedSeconds(parsedData, now),
              originalRecords: result.data.originalRecords,
              exercisePRResults: result.data.exercisePRResults
            };
            
            setActiveWorkout(restoredData);
            setIsTrackingWorkout(true);
            
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
        logger.error('[ActiveWorkout] Error loading active workout:', error);
      }
    };

    loadActiveWorkout();
  }, []);

  // Fonction pour réinitialiser le compteur d'activité
  const resetActivityTimer = useCallback(async () => {
    lastActivityTimeRef.current = Date.now();
    
    // Annuler toute notification d'inactivité planifiée
    if (activeWorkout) {
      await NotificationService.cancelInactiveWorkoutReminder(activeWorkout.workoutId);
      logger.log('[ActiveWorkout] Activity detected, cancelled inactive workout reminder');
    }
  }, [activeWorkout]);

  // Gérer les changements d'état de l'app (premier plan, arrière-plan)
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      // Si l'app revient au premier plan
      if (appStateRef.current !== 'active' && nextAppState === 'active') {
        if (activeWorkout && activeWorkout.isActive) {
          // Réinitialiser le compteur d'activité quand l'utilisateur revient
          await resetActivityTimer();
        }
      }
      
      appStateRef.current = nextAppState;
    };
    
    // Écouter les changements d'état de l'app
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, [activeWorkout, resetActivityTimer]);

  // Fonction pour arrêter le timer de vérification d'inactivité
  const stopInactivityCheck = () => {
    if (inactivityCheckRef.current) {
      clearInterval(inactivityCheckRef.current);
      inactivityCheckRef.current = null;
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
            logger.error('[ActiveWorkout] Failed to save active session:', result.error?.userMessage);
          }
        } else {
          await RobustStorageService.clearActiveSession();
        }
      } catch (error) {
        logger.error('[ActiveWorkout] Error saving active workout:', error);
      }
    };

    saveActiveWorkout();
  }, [activeWorkout]);

  // Vérification périodique de l'inactivité et planification des notifications
  // (relancée seulement au démarrage, à la pause et à la reprise : la fonction n'utilise que ces champs)
  useEffect(() => {
    // Ne vérifier que si un workout est actif
    if (!activeWorkout || !activeWorkout.isActive) {
      // Nettoyer le timer si pas de workout actif
      stopInactivityCheck();
      return;
    }

    // Vérifier toutes les 5 minutes si on doit planifier une notification
    const checkInactivity = async () => {
      try {
        await NotificationService.scheduleInactiveWorkoutReminder(
          activeWorkout,
          lastActivityTimeRef.current
        );
      } catch (error) {
        logger.error('[ActiveWorkout] Error checking inactivity:', error);
      }
    };

    // Vérifier immédiatement
    checkInactivity();

    // Puis vérifier toutes les 5 minutes
    inactivityCheckRef.current = setInterval(checkInactivity, 5 * 60 * 1000);

    return () => {
      stopInactivityCheck();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkout?.workoutId, activeWorkout?.isActive]);

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
    
    // Réinitialiser le compteur d'activité
    lastActivityTimeRef.current = Date.now();
  };

  // Terminer une séance
  const finishWorkout = useCallback(async (updateStreak: boolean = false) => {
    if (!activeWorkout) {
      return;
    }

    try {
      // Arrêter la vérification d'inactivité
      stopInactivityCheck();
      
      // Annuler toute notification d'inactivité planifiée
      await NotificationService.cancelInactiveWorkoutReminder(activeWorkout.workoutId);
      
      // Récupérer le workout original pour mettre à jour la streak
      // Uniquement si updateStreak est true (uniquement quand on clique sur "Log Workout")
      if (updateStreak) {
        const originalWorkout = workouts.find(w => w.id === activeWorkout.workoutId);
        if (originalWorkout) {
          await updateStreakOnCompletion(originalWorkout);
          } else {
          logger.warn("[ActiveWorkout] Original workout not found for streak update");
        }
      }
      
      // Nettoyer la session active
      const clearResult = await RobustStorageService.clearActiveSession();
      if (!clearResult.success) {
        logger.error("[ActiveWorkout] Failed to clear active session:", clearResult.error?.userMessage);
        // Continuer quand même le nettoyage local
      }
      
      // Réinitialiser l'état local
      setActiveWorkout(null);
      setIsTrackingWorkout(false);
      
      } catch (error) {
      logger.error("[ActiveWorkout] Error finishing workout:", error);
      // En cas d'erreur, forcer le nettoyage local au minimum
      try {
        setActiveWorkout(null);
        setIsTrackingWorkout(false);
        // Local state reset after error
      } catch (localError) {
        logger.error("[ActiveWorkout] Failed to reset local state:", localError);
      }
      throw error; // Re-throw pour que l'appelant puisse gérer l'erreur
    }
  }, [activeWorkout, workouts, updateStreakOnCompletion]);

  // Fonction de nettoyage d'urgence pour les sessions bloquées
  const forceCleanupSession = useCallback(async () => {
    try {
      // Arrêter la vérification d'inactivité
      stopInactivityCheck();
      
      // Annuler toutes les notifications d'inactivité
      await NotificationService.cancelAllInactiveWorkoutReminders();
      
      // Nettoyer le stockage
      await RobustStorageService.clearActiveSession();
      
      // Réinitialiser l'état local
      setActiveWorkout(null);
      setIsTrackingWorkout(false);
      
      } catch (error) {
      logger.error("[ActiveWorkout] Error during force cleanup:", error);
      // Forcer le nettoyage local même en cas d'erreur
      setActiveWorkout(null);
      setIsTrackingWorkout(false);
    }
  }, []);

  // Mettre à jour les données de tracking pour un exercice (sets)
  const updateTrackingData = (exerciseId: string, sets: TrackingSet[], completedSets: number) => {
    if (!activeWorkout) return;

    // Réinitialiser le compteur d'activité
    resetActivityTimer();

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

    // Réinitialiser le compteur d'activité
    resetActivityTimer();

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
      
      // Décaler startTime pour que l'horloge redonne newElapsedTime
      const reference = prev.isActive ? Date.now() : prev.pausedAt ?? Date.now();
      return {
        ...prev,
        startTime: reference - newElapsedTime * 1000 - (prev.pausedDuration ?? 0),
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
      
      const now = Date.now();
      return {
        ...prev,
        lastResumeTime: now,
        pausedDuration: (prev.pausedDuration ?? 0) + (prev.pausedAt ? now - prev.pausedAt : 0),
        pausedAt: undefined,
        isActive: true
      };
    });
    setIsTrackingWorkout(true);
  };
  
  // Mettre en pause une séance (manuellement)
  const pauseWorkout = () => {
    if (!activeWorkout) return;
    
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
// Temps écoulé qui se met à jour chaque seconde, en ne redessinant que le composant appelant
export const useWorkoutElapsedSeconds = (): number => {
  const { activeWorkout } = useActiveWorkout();
  const [, setTick] = useState(0);
  const isRunning = activeWorkout?.isActive ?? false;

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => setTick(tick => tick + 1), 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  return activeWorkout ? computeElapsedSeconds(activeWorkout) : 0;
};
