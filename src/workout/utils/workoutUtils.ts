import { Exercise } from '../../types/workout';
import { TrackingSet } from '../contexts/ActiveWorkoutContext';
import { RobustStorageService } from '../../services/storage';
import { StreakService } from '../../services/streakService';

/**
 * Fonction pour obtenir le texte de progression pour un exercice
 */
export const getExerciseProgressText = (
  exercise: Exercise,
  isTrackingWorkout: boolean,
  activeWorkout?: any
): string => {
  if (!isTrackingWorkout) {
    // Logique améliorée pour déterminer le type de tracking
    if (exercise.tracking === 'trackedOnSets') {
      return 'Tracked on sets';
    } else if (exercise.tracking === 'trackedOnTime') {
      return 'Tracked on time';
    } else {
      // Fallback basé sur les propriétés de l'exercice
      if (exercise.sets > 0 && (exercise.reps > 0 || exercise.weight)) {
        return 'Tracked on sets';
      } else if (exercise.duration && exercise.duration > 0) {
        return 'Tracked on time';
      } else {
        return 'Tracked on sets'; // Défaut pour les exercices avec sets/reps
      }
    }
  }
  const trackingData = activeWorkout?.trackingData[exercise.id];
  const completedSets = trackingData?.completedSets || 0;
  const totalSets = trackingData?.sets.length || exercise.sets; // Utiliser le nombre actuel de sets
  return `${completedSets} of ${totalSets} sets completed`;
};

/**
 * Calcule le pourcentage de complétion d'un exercice
 */
export const getExerciseProgress = (
  exercise: Exercise,
  activeWorkout?: any
): number => {
  const trackingData = activeWorkout?.trackingData[exercise.id];
  const completedSets = trackingData?.completedSets || 0;
  const totalSets = trackingData?.sets.length || exercise.sets; // Utiliser le nombre actuel de sets
  return completedSets / totalSets;
};

/**
 * Helper pour obtenir les données de complétion d'un exercice
 */
export const getExerciseCompletionData = (
  exercise: Exercise,
  activeWorkout?: any
) => {
  const trackingData = activeWorkout?.trackingData[exercise.id];
  const completedSets = trackingData?.completedSets || 0;
  const totalSets = trackingData?.sets.length || exercise.sets;
  const isCompleted = completedSets === totalSets && totalSets > 0; // Simplifié : juste basé sur les sets
  const progressPercentage = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;
  
  // Debug check for exercise consistency
  if (__DEV__ && exercise.name === "Push-ups") {
    console.log(`Exercise ${exercise.name}: ${completedSets}/${totalSets} sets completed`);
  }
  
  return {
    completedSets,
    totalSets,
    isCompleted,
    progressPercentage
  };
};

/**
 * Fonction pour obtenir l'icône en fonction du type d'exercice
 */
export const getExerciseIcon = (exercise: Exercise): string => {
  if (exercise.tracking === "trackedOnTime" || exercise.duration) {
    return "time-outline"; // Exercice basé sur le temps
  } else if (exercise.tracking === "trackedOnSets" || exercise.sets > 1) {
    return "repeat-outline"; // Exercice basé sur des séries
  } else {
    return "sync-outline"; // Circuit
  }
};

/**
 * Fonction pour obtenir le texte de tracking en fonction du type d'exercice
 */
export const getTrackingText = (exercise: Exercise): string => {
  if (exercise.tracking === "trackedOnTime") {
    return "Tracked on time";
  } else if (exercise.tracking === "trackedOnSets") {
    return "Tracked on sets";
  } else {
    // Fallback basé sur les propriétés de l'exercice
    if (exercise.sets > 0 && (exercise.reps > 0 || exercise.weight)) {
      return "Tracked on sets";
    } else if (exercise.duration && exercise.duration > 0) {
      return "Tracked on time";
    } else {
      return "Tracked on sets"; // Défaut pour les exercices avec sets/reps
    }
  }
};

/**
 * Fonction pour formater le temps du timer (mm:ss)
 */
export const formatElapsedTime = (elapsedTime: number): string => {
  const minutes = Math.floor(elapsedTime / 60);
  const seconds = elapsedTime % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Fonction pour calculer si un record personnel a été atteint
 */
export const calculatePersonalRecord = (
  exercise: Exercise,
  sets: TrackingSet[],
  originalRecords: Record<string, { maxWeight: number; maxReps: number }>
) => {
  if (!exercise || !sets || sets.length === 0) return undefined;
  
  let maxWeight = 0;
  let maxReps = 0;
  
  // Chercher le poids max et les reps max parmi tous les sets complétés
  sets.forEach(set => {
    if (set.completed) {
      const weight = parseInt(set.weight) || 0;
      const reps = parseInt(set.reps) || 0;
      
      if (weight > maxWeight) {
        maxWeight = weight;
        maxReps = reps;
      } else if (weight === maxWeight && reps > maxReps) {
        maxReps = reps;
      }
    }
  });
  
  // Si aucun set complété ou aucun poids, pas de PR
  if (maxWeight <= 0) return undefined;
  
  // Utiliser les mêmes données que pendant la séance (originalRecords)
  const originalRecord = originalRecords[exercise.name];
  
  // Si pas de record original, c'est le premier workout pour cet exercice
  if (!originalRecord) {
    // Premier exercice fait = toujours un PR
    return { maxWeight, maxReps };
  }
  
  // Comparer avec les records originaux (début de séance)
  const isNewRecord = maxWeight > originalRecord.maxWeight;
  
  // Retourner le PR seulement si c'est vraiment un nouveau record
  return isNewRecord ? { maxWeight, maxReps } : undefined;
};

/**
 * Fonction pour calculer les données historiques des stickers
 */
export const calculateStickerHistoricalData = async (
  workoutId: string,
  workoutName: string
) => {
  try {
    // Charger l'historique des workouts
    const historyResult = await RobustStorageService.loadWorkoutHistory();
    if (!historyResult.success) {
      console.warn('[WorkoutDetailModal] Failed to load workout history');
      return { starCount: 1, streakCount: 1, completionCount: 1 };
    }

    const workoutHistory = historyResult.data;
    
    // 1. Calculer starCount : nombre de fois que ce workout spécifique a été complété
    const starCount = workoutHistory.filter(w => 
      w.workoutId === workoutId || w.name === workoutName
    ).length + 1; // +1 pour inclure la séance actuelle
    
    // 2. Calculer streakCount : streak APRÈS completion du workout
    const currentStreakData = await StreakService.getWorkoutStreak(workoutId);
    const currentStreak = currentStreakData?.current || 0;
    // La streak après completion sera current + 1 (car on vient de compléter une séance)
    const streakCount = currentStreak + 1;
    
    // 3. Calculer completionCount : nombre total de séances complétées
    const completionCount = workoutHistory.length + 1; // +1 pour inclure la séance actuelle
    
    return {
      starCount,
      streakCount,
      completionCount
    };
  } catch (error) {
    console.error('[WorkoutDetailModal] Error calculating sticker historical data:', error);
    // Valeurs par défaut en cas d'erreur
    return {
      starCount: 1,
      streakCount: 1,
      completionCount: 1
    };
  }
};

