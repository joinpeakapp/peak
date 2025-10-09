import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { StreakData, Workout } from '../../types/workout';
import { StreakService } from '../../services/streakService';

// Gestionnaire d'événements global pour synchroniser toutes les instances de StreakDisplay
class StreakEventManager {
  private listeners: Set<() => void> = new Set();
  private notificationTimeout: NodeJS.Timeout | null = null;

  subscribe(callback: () => void) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  // Notification debouncée pour éviter les spams
  notify() {
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
    
    // Notification immédiate
    this.listeners.forEach(callback => callback());
    
    // Notification de sécurité après un délai
    this.notificationTimeout = setTimeout(() => {
      this.listeners.forEach(callback => callback());
      this.notificationTimeout = null;
    }, 50);
  }
}

const streakEventManager = new StreakEventManager();

interface StreakContextType {
  getWorkoutStreak: (workoutId: string, workout?: Workout) => Promise<StreakData>;
  updateStreakOnCompletion: (workout: Workout) => Promise<StreakData>;
  getDaysUntilStreakLoss: (workoutId: string, workout: Workout) => Promise<number>;
  formatStreakText: (streakData: StreakData | null) => string;
  formatBestStreakText: (streakData: StreakData | null) => string;
  validateAllStreaks: (workouts: Workout[]) => Promise<void>;
  subscribeToStreakUpdates: (callback: () => void) => () => void;
}

const StreakContext = createContext<StreakContextType | undefined>(undefined);

export const StreakProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Récupérer les streaks pour un workout avec validation automatique
  const getWorkoutStreak = useCallback(async (workoutId: string, workout?: Workout): Promise<StreakData> => {
    try {
      return await StreakService.getWorkoutStreak(workoutId, workout);
    } catch (error) {
      console.error('[StreakContext] Error getting workout streak:', error);
      // Retourner une streak vide en cas d'erreur
      return {
        workoutId,
        current: 0,
        longest: 0,
        lastCompletedDate: undefined,
        streakHistory: []
      };
    }
  }, []);

  // Mettre à jour la streak après la complétion d'un workout
  const updateStreakOnCompletion = useCallback(async (workout: Workout): Promise<StreakData> => {
    try {
      const result = await StreakService.updateStreakOnCompletion(workout);
      
      // Notifier tous les composants StreakDisplay de la mise à jour
      streakEventManager.notify();
      
      return result;
    } catch (error) {
      console.error('[StreakContext] Error updating streak:', error);
      // Retourner une streak vide en cas d'erreur
      return {
        workoutId: workout.id,
        current: 0,
        longest: 0,
        lastCompletedDate: undefined,
        streakHistory: []
      };
    }
  }, []);

  // Calculer le nombre de jours restants avant de perdre la streak
  const getDaysUntilStreakLoss = useCallback(async (workoutId: string, workout: Workout): Promise<number> => {
    try {
      const streakData = await getWorkoutStreak(workoutId, workout);
      if (!streakData || !streakData.lastCompletedDate) {
        return 0;
      }
      return StreakService.getDaysUntilStreakLoss(streakData.lastCompletedDate, workout.frequency);
    } catch (error) {
      console.error('[StreakContext] Error calculating days until streak loss:', error);
      return 0;
    }
  }, [getWorkoutStreak]);

  // Valider toutes les streaks pour un ensemble de workouts
  const validateAllStreaks = useCallback(async (workouts: Workout[]): Promise<void> => {
    try {
      await StreakService.validateAndCleanAllStreaks(workouts);
    } catch (error) {
      console.error('[StreakContext] Error validating all streaks:', error);
    }
  }, []);

  // Formater le texte pour l'affichage de la streak
  const formatStreakText = useCallback((streakData: StreakData | null): string => {
    return StreakService.formatStreakText(streakData);
  }, []);

  // Formater le texte pour l'affichage de la meilleure streak
  const formatBestStreakText = useCallback((streakData: StreakData | null): string => {
    return StreakService.formatBestStreakText(streakData);
  }, []);

  // S'abonner aux mises à jour de streaks
  const subscribeToStreakUpdates = useCallback((callback: () => void) => {
    return streakEventManager.subscribe(callback);
  }, []);

  return (
    <StreakContext.Provider value={{
      getWorkoutStreak,
      updateStreakOnCompletion,
      getDaysUntilStreakLoss,
      formatStreakText,
      formatBestStreakText,
      validateAllStreaks,
      subscribeToStreakUpdates
    }}>
      {children}
    </StreakContext.Provider>
  );
};

export const useStreak = () => {
  const context = useContext(StreakContext);
  
  if (!context) {
    throw new Error('useStreak must be used within a StreakProvider');
  }
  
  return context;
}; 