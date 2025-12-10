import { useState, useCallback, useRef, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { TrackingTime } from '../contexts/ActiveWorkoutContext';

// État du chronomètre
type TimerState = 'stopped' | 'running' | 'paused';

// Interface pour le retour du hook
export interface UseTimeTrackingReturn {
  // États
  timerState: TimerState;
  elapsedTime: number; // Temps écoulé en secondes
  times: TrackingTime[]; // Liste des durées enregistrées
  manualInput: string; // Saisie manuelle au format MM:SS
  
  // Actions du chronomètre
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  
  // Actions pour les durées
  addTime: (duration: number) => void;
  removeTime: (index: number) => void;
  toggleTimeCompletion: (index: number) => void;
  updateManualInput: (value: string) => void;
  saveManualTime: () => boolean; // Retourne true si la saisie est valide
  
  // Getters
  getCompletedTimesCount: () => number;
  getTotalTimesCount: () => number;
  formatTime: (seconds: number) => string; // Format auto MM:SS ou HH:MM:SS
}

/**
 * Hook pour gérer le tracking par temps avec chronomètre
 * 
 * Responsabilités :
 * - Gestion du chronomètre (start, pause, resume, stop, reset)
 * - Gestion de plusieurs durées enregistrées
 * - Saisie manuelle avec validation MM:SS
 * - Format auto pour l'affichage (MM:SS jusqu'à 60 min, puis HH:MM:SS)
 * - Continuer à tourner même en arrière-plan
 */
export const useTimeTracking = (initialTimes?: TrackingTime[]): UseTimeTrackingReturn => {
  const [timerState, setTimerState] = useState<TimerState>('stopped');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [times, setTimes] = useState<TrackingTime[]>(initialTimes || []);
  const [manualInput, setManualInput] = useState('');
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const appStateRef = useRef(AppState.currentState);
  const timerStateRef = useRef<TimerState>('stopped'); // Ref pour accéder à l'état actuel
  
  // Synchroniser timerStateRef avec timerState
  useEffect(() => {
    timerStateRef.current = timerState;
  }, [timerState]);
  
  // Synchroniser les times avec initialTimes seulement au montage initial
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current && initialTimes && initialTimes.length > 0) {
      setTimes(initialTimes);
      isInitialMount.current = false;
    }
  }, []); // Seulement au montage
  
  // Nettoyer l'interval au démontage
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);
  
  // Gérer les changements d'état de l'app pour continuer le timer en arrière-plan
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      appStateRef.current = nextAppState;
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, []); // Pas de dépendances pour éviter les re-créations
  
  // Fonction pour formater le temps (format auto)
  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    // Si plus de 60 minutes (3600 secondes), afficher en HH:MM:SS
    if (seconds >= 3600) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    // Sinon, afficher en MM:SS
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);
  
  // Démarrer le chronomètre
  const startTimer = useCallback(() => {
    const currentState = timerStateRef.current;
    
    // Nettoyer l'interval existant avant d'en créer un nouveau
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (currentState === 'stopped') {
      // Nouveau départ
      startTimeRef.current = Date.now();
      pausedTimeRef.current = 0;
      setElapsedTime(0);
    } else if (currentState === 'paused') {
      // Reprendre après une pause
      const pausedDuration = pausedTimeRef.current;
      startTimeRef.current = Date.now() - pausedDuration * 1000;
    }
    
    setTimerState('running');
    
    // Démarrer l'interval - mettre à jour chaque seconde (1000ms)
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTimeRef.current) / 1000);
      setElapsedTime(elapsed);
    }, 1000);
  }, []); // Pas de dépendances pour éviter les re-créations
  
  // Mettre en pause le chronomètre
  const pauseTimer = useCallback(() => {
    const currentState = timerStateRef.current;
    if (currentState !== 'running') return;
    
    pausedTimeRef.current = elapsedTime;
    setTimerState('paused');
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [elapsedTime]);
  
  // Reprendre le chronomètre
  const resumeTimer = useCallback(() => {
    const currentState = timerStateRef.current;
    if (currentState !== 'paused') return;
    
    startTimer();
  }, [startTimer]);
  
  // Arrêter le chronomètre
  const stopTimer = useCallback(() => {
    // Sauvegarder le temps écoulé dans la liste des durées si > 0
    if (elapsedTime > 0) {
      const newTime: TrackingTime = {
        completed: true,
        duration: elapsedTime
      };
      
      setTimes(prev => [...prev, newTime]);
    }
    
    setTimerState('stopped');
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setElapsedTime(0);
    pausedTimeRef.current = 0;
    startTimeRef.current = 0;
  }, [elapsedTime]);
  
  // Réinitialiser le chronomètre
  const resetTimer = useCallback(() => {
    setTimerState('stopped');
    setElapsedTime(0);
    pausedTimeRef.current = 0;
    startTimeRef.current = 0;
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);
  
  // Ajouter une durée manuellement
  const addTime = useCallback((duration: number) => {
    const newTime: TrackingTime = {
      completed: true,
      duration
    };
    
    setTimes(prev => [...prev, newTime]);
  }, []);
  
  // Supprimer une durée
  const removeTime = useCallback((index: number) => {
    if (index >= 0 && index < times.length) {
      setTimes(prev => prev.filter((_, i) => i !== index));
    }
  }, [times.length]);
  
  // Basculer la complétion d'une durée
  const toggleTimeCompletion = useCallback((index: number) => {
    if (index >= 0 && index < times.length) {
      setTimes(prev => {
        const newTimes = [...prev];
        newTimes[index] = {
          ...newTimes[index],
          completed: !newTimes[index].completed
        };
        return newTimes;
      });
    }
  }, [times.length]);
  
  // Mettre à jour la saisie manuelle
  const updateManualInput = useCallback((value: string) => {
    // Valider le format MM:SS pendant la saisie
    // Permettre seulement les chiffres et les deux-points
    const cleaned = value.replace(/[^\d:]/g, '');
    
    // Limiter à 5 caractères (MM:SS)
    if (cleaned.length <= 5) {
      setManualInput(cleaned);
    }
  }, []);
  
  // Sauvegarder la durée saisie manuellement
  const saveManualTime = useCallback((): boolean => {
    if (!manualInput) return false;
    
    // Valider le format MM:SS
    const mmssPattern = /^(\d{1,2}):(\d{2})$/;
    const match = manualInput.match(mmssPattern);
    
    if (!match) return false;
    
    const minutes = parseInt(match[1], 10);
    const seconds = parseInt(match[2], 10);
    
    // Vérifier que les secondes sont < 60
    if (seconds >= 60) return false;
    
    // Convertir en secondes totales
    const totalSeconds = minutes * 60 + seconds;
    
    if (totalSeconds > 0) {
      addTime(totalSeconds);
      setManualInput('');
      return true;
    }
    
    return false;
  }, [manualInput, addTime]);
  
  // Obtenir le nombre de durées complétées
  const getCompletedTimesCount = useCallback(() => {
    return times.filter(time => time.completed).length;
  }, [times]);
  
  // Obtenir le nombre total de durées
  const getTotalTimesCount = useCallback(() => {
    return times.length;
  }, [times]);
  
  return {
    timerState,
    elapsedTime,
    times,
    manualInput,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetTimer,
    addTime,
    removeTime,
    toggleTimeCompletion,
    updateManualInput,
    saveManualTime,
    getCompletedTimesCount,
    getTotalTimesCount,
    formatTime
  };
};

