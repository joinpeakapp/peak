import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Vibration, AppState, AppStateStatus } from 'react-native';
import { Exercise } from '../../types/workout';
import { useActiveWorkout } from './ActiveWorkoutContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Interface pour le contexte du timer de repos
interface RestTimerContextValue {
  isTimerActive: boolean;
  isPaused: boolean;
  currentTime: number;
  totalTime: number;
  startRestTimer: (exercise: Exercise) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: (exercise: Exercise) => void;
  stopTimer: () => void;
}

// Structure pour le stockage des données de timer
interface RestTimerData {
  isActive: boolean;
  isPaused: boolean;
  currentTime: number;
  totalTime: number;
  exerciseId?: string;
  startedAt: number;
  pausedAt?: number;
}

// Valeur par défaut du contexte
const defaultContextValue: RestTimerContextValue = {
  isTimerActive: false,
  isPaused: false,
  currentTime: 0,
  totalTime: 0,
  startRestTimer: () => {},
  pauseTimer: () => {},
  resumeTimer: () => {},
  resetTimer: () => {},
  stopTimer: () => {}
};

// Création du contexte
const RestTimerContext = createContext<RestTimerContextValue>(defaultContextValue);

// Hook personnalisé pour utiliser le contexte
export const useRestTimer = () => useContext(RestTimerContext);

// Clé pour AsyncStorage
const REST_TIMER_STORAGE_KEY = 'restTimerData';

// Temps de repos par défaut en secondes (3 minutes)
const DEFAULT_REST_TIME = 180;

// Provider du contexte
export const RestTimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [currentExerciseId, setCurrentExerciseId] = useState<string | undefined>(undefined);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const { isTrackingWorkout } = useActiveWorkout();

  // Chargement de l'état du timer au démarrage
  useEffect(() => {
    const loadTimerState = async () => {
      try {
        const storedData = await AsyncStorage.getItem(REST_TIMER_STORAGE_KEY);
        if (storedData) {
          const parsedData = JSON.parse(storedData) as RestTimerData;
          
          // Vérifier si le timer est toujours actif
          if (parsedData.isActive) {
            const now = Date.now();
            
            // Si le timer était en pause, utiliser le temps sauvegardé
            if (parsedData.isPaused && parsedData.pausedAt) {
              setIsTimerActive(true);
              setIsPaused(true);
              setCurrentTime(parsedData.currentTime);
              setTotalTime(parsedData.totalTime);
              setCurrentExerciseId(parsedData.exerciseId);
            } 
            // Sinon, calculer le temps écoulé depuis le départ
            else if (!parsedData.isPaused) {
              const elapsedSeconds = Math.floor((now - parsedData.startedAt) / 1000);
              const remainingTime = Math.max(0, parsedData.totalTime - elapsedSeconds);
              
              if (remainingTime > 0) {
                setIsTimerActive(true);
                setIsPaused(false);
                setCurrentTime(remainingTime);
                setTotalTime(parsedData.totalTime);
                setCurrentExerciseId(parsedData.exerciseId);
                
                // Démarrer le timer avec le temps restant
                startTimerInterval();
              } else {
                // Si le temps est écoulé, ne pas activer le timer
                await AsyncStorage.removeItem(REST_TIMER_STORAGE_KEY);
              }
            }
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'état du timer:', error);
      }
    };
    
    loadTimerState();
  }, []);

  // Gérer les changements d'état de l'app (premier plan, arrière-plan)
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      // Si l'app passe en arrière-plan
      if (
        appStateRef.current.match(/active/) && 
        (nextAppState === 'background' || nextAppState === 'inactive')
      ) {
        await handleAppInBackground();
      }
      
      // Si l'app revient au premier plan
      if (
        (appStateRef.current === 'background' || appStateRef.current === 'inactive') && 
        nextAppState === 'active'
      ) {
        await handleAppInForeground();
      }
      
      appStateRef.current = nextAppState;
    };
    
    // Écouter les changements d'état de l'app
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, [isTimerActive, isPaused, currentTime, totalTime]);

  // Gérer la mise en arrière-plan de l'app
  const handleAppInBackground = async () => {
    // Si le timer est actif, sauvegarder son état
    if (isTimerActive) {
      // Arrêter le timer côté interface
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Sauvegarder l'état du timer
      const timerData: RestTimerData = {
        isActive: isTimerActive,
        isPaused: isPaused,
        currentTime: currentTime,
        totalTime: totalTime,
        exerciseId: currentExerciseId,
        startedAt: Date.now() - ((totalTime - currentTime) * 1000),
        pausedAt: isPaused ? Date.now() : undefined
      };
      
      await AsyncStorage.setItem(REST_TIMER_STORAGE_KEY, JSON.stringify(timerData));
    }
  };
  
  // Gérer le retour au premier plan de l'app
  const handleAppInForeground = async () => {
    try {
      const storedData = await AsyncStorage.getItem(REST_TIMER_STORAGE_KEY);
      if (storedData && isTimerActive) {
        const parsedData = JSON.parse(storedData) as RestTimerData;
        
        if (parsedData.isActive) {
          const now = Date.now();
          
          // Si le timer était en pause, garder le même temps
          if (isPaused) {
            // Pas besoin de faire autre chose, le timer est déjà en pause
          } 
          // Sinon, recalculer le temps écoulé
          else {
            const startTime = parsedData.startedAt;
            const elapsedSeconds = Math.floor((now - startTime) / 1000);
            const remainingTime = Math.max(0, parsedData.totalTime - elapsedSeconds);
            
            if (remainingTime > 0) {
              setCurrentTime(remainingTime);
              startTimerInterval();
            } else {
              // Si le temps est écoulé, arrêter le timer
              setIsTimerActive(false);
              setCurrentTime(0);
              await AsyncStorage.removeItem(REST_TIMER_STORAGE_KEY);
              // Vibrer pour indiquer que le temps est écoulé
              Vibration.vibrate(500);
            }
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la restauration de l\'état du timer:', error);
    }
  };

  // Fonction pour démarrer le timer
  const startTimerInterval = () => {
    // Nettoyer le timer existant si nécessaire
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Démarrer le timer
    timerRef.current = setInterval(() => {
      setCurrentTime(prevTime => {
        if (prevTime <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          
          // Effacer les données du timer dans le stockage
          AsyncStorage.removeItem(REST_TIMER_STORAGE_KEY)
            .catch(error => console.error('Erreur lors de la suppression des données du timer:', error));
          
          setIsTimerActive(false);
          Vibration.vibrate(500);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  };

  // Gérer le timer
  useEffect(() => {
    // Nettoyer le timer lors du démontage
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  // Gérer les changements d'état du timer (pause/reprise)
  useEffect(() => {
    // Gérer la reprise du timer
    if (isTimerActive && !isPaused && !timerRef.current) {
      startTimerInterval();
    }
    
    // Gérer la mise en pause du timer
    if (isPaused && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Sauvegarder l'état actuel du timer
    const saveTimerState = async () => {
      if (isTimerActive) {
        const timerData: RestTimerData = {
          isActive: isTimerActive,
          isPaused: isPaused,
          currentTime: currentTime,
          totalTime: totalTime,
          exerciseId: currentExerciseId,
          startedAt: Date.now() - ((totalTime - currentTime) * 1000),
          pausedAt: isPaused ? Date.now() : undefined
        };
        
        await AsyncStorage.setItem(REST_TIMER_STORAGE_KEY, JSON.stringify(timerData));
      } else {
        await AsyncStorage.removeItem(REST_TIMER_STORAGE_KEY);
      }
    };
    
    saveTimerState();
  }, [isTimerActive, isPaused, currentTime]);

  // Arrêter le timer si aucune séance n'est active
  useEffect(() => {
    if (!isTrackingWorkout && isTimerActive) {
      stopTimer();
    }
  }, [isTrackingWorkout]);

  // Fonction pour démarrer le timer de repos
  const startRestTimer = (exercise: Exercise) => {
    // Définir le temps de repos (personnalisé ou par défaut)
    const restTime = exercise.restTimeSeconds || DEFAULT_REST_TIME;
    
    setTotalTime(restTime);
    setCurrentTime(restTime);
    setCurrentExerciseId(exercise.id);
    
    // Mettre à jour l'état pour activer le timer
    setIsTimerActive(true);
    setIsPaused(false);
    
    // Démarrer directement le timer
    startTimerInterval();
    
    // Sauvegarder l'état initial du timer
    const saveInitialState = async () => {
      const timerData: RestTimerData = {
        isActive: true,
        isPaused: false,
        currentTime: restTime,
        totalTime: restTime,
        exerciseId: exercise.id,
        startedAt: Date.now()
      };
      
      await AsyncStorage.setItem(REST_TIMER_STORAGE_KEY, JSON.stringify(timerData));
    };
    
    saveInitialState();
  };

  // Fonction pour mettre en pause le timer
  const pauseTimer = () => {
    if (isTimerActive && !isPaused) {
      setIsPaused(true);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Sauvegarder l'état de pause
      const savePausedState = async () => {
        const timerData: RestTimerData = {
          isActive: isTimerActive,
          isPaused: true,
          currentTime: currentTime,
          totalTime: totalTime,
          exerciseId: currentExerciseId,
          startedAt: Date.now() - ((totalTime - currentTime) * 1000),
          pausedAt: Date.now()
        };
        
        await AsyncStorage.setItem(REST_TIMER_STORAGE_KEY, JSON.stringify(timerData));
      };
      
      savePausedState();
    }
  };

  // Fonction pour reprendre le timer
  const resumeTimer = () => {
    if (isTimerActive && isPaused) {
      setIsPaused(false);
      
      // Sauvegarder l'état de reprise
      const saveResumeState = async () => {
        const timerData: RestTimerData = {
          isActive: isTimerActive,
          isPaused: false,
          currentTime: currentTime,
          totalTime: totalTime,
          exerciseId: currentExerciseId,
          startedAt: Date.now() - ((totalTime - currentTime) * 1000)
        };
        
        await AsyncStorage.setItem(REST_TIMER_STORAGE_KEY, JSON.stringify(timerData));
      };
      
      saveResumeState();
      
      // Le timer sera redémarré par l'effet useEffect
    }
  };

  // Fonction pour réinitialiser le timer
  const resetTimer = (exercise: Exercise) => {
    // Définir le temps de repos (personnalisé ou par défaut)
    const restTime = exercise.restTimeSeconds || DEFAULT_REST_TIME;
    
    setTotalTime(restTime);
    setCurrentTime(restTime);
    setCurrentExerciseId(exercise.id);
    
    // Mettre à jour l'état pour activer le timer
    setIsTimerActive(true);
    setIsPaused(false);
    
    // Démarrer directement le timer
    startTimerInterval();
    
    // Sauvegarder l'état réinitialisé
    const saveResetState = async () => {
      const timerData: RestTimerData = {
        isActive: true,
        isPaused: false,
        currentTime: restTime,
        totalTime: restTime,
        exerciseId: exercise.id,
        startedAt: Date.now()
      };
      
      await AsyncStorage.setItem(REST_TIMER_STORAGE_KEY, JSON.stringify(timerData));
    };
    
    saveResetState();
  };

  // Fonction pour arrêter le timer
  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setIsTimerActive(false);
    setIsPaused(false);
    setCurrentTime(0);
    setCurrentExerciseId(undefined);
    
    // Supprimer les données du timer
    AsyncStorage.removeItem(REST_TIMER_STORAGE_KEY)
      .catch(error => console.error('Erreur lors de la suppression des données du timer:', error));
  };

  return (
    <RestTimerContext.Provider
      value={{
        isTimerActive,
        isPaused,
        currentTime,
        totalTime,
        startRestTimer,
        pauseTimer,
        resumeTimer,
        resetTimer,
        stopTimer
      }}
    >
      {children}
    </RestTimerContext.Provider>
  );
}; 