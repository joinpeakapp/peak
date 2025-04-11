import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Vibration } from 'react-native';
import { Exercise } from '../../types/workout';
import { useActiveWorkout } from './ActiveWorkoutContext';

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

// Temps de repos par défaut en secondes (3 minutes)
const DEFAULT_REST_TIME = 180;

// Provider du contexte
export const RestTimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { isTrackingWorkout } = useActiveWorkout();

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
  }, [isTimerActive, isPaused]);

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
    
    // Mettre à jour l'état pour activer le timer
    setIsTimerActive(true);
    setIsPaused(false);
    
    // Démarrer directement le timer
    startTimerInterval();
  };

  // Fonction pour mettre en pause le timer
  const pauseTimer = () => {
    if (isTimerActive && !isPaused) {
      setIsPaused(true);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // Fonction pour reprendre le timer
  const resumeTimer = () => {
    if (isTimerActive && isPaused) {
      setIsPaused(false);
      // Le timer sera redémarré par l'effet useEffect
    }
  };

  // Fonction pour réinitialiser le timer
  const resetTimer = (exercise: Exercise) => {
    // Définir le temps de repos (personnalisé ou par défaut)
    const restTime = exercise.restTimeSeconds || DEFAULT_REST_TIME;
    
    setTotalTime(restTime);
    setCurrentTime(restTime);
    
    // Mettre à jour l'état pour activer le timer
    setIsTimerActive(true);
    setIsPaused(false);
    
    // Démarrer directement le timer
    startTimerInterval();
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